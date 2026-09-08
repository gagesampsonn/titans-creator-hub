import { unwrapWebhook } from '@whop/sdk/helpers';
import { IMAGE_UUID } from './image-provider.mjs';

export function cents(money) {
  if (!money || money.currency !== 'usd' || typeof money.amount !== 'string' || !/^\d{1,8}(?:\.\d{1,2})?$/.test(money.amount)) throw Error('invalid_money');
  const [whole, fraction = ''] = money.amount.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}
export function createImageBilling({ ledger, apiKey, webhookSecret, companyId, salesApproved = false, sandbox = false, fetchFn = fetch }) {
  const base = sandbox ? 'https://sandbox-api.whop.com/api/v1' : 'https://api.whop.com/api/v1';
  async function request(path, options = {}) {
    const response = await fetchFn(base + path, { ...options, redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Api-Version-Date': '2026-09-02-2', ...options.headers } });
    if (!response.ok) { await response.body?.cancel(); throw Error('whop_unavailable'); }
    const chunks = []; let size = 0;
    for await (const chunk of response.body) { size += chunk.length; if (size > 1024 * 1024) throw Error('whop_unavailable'); chunks.push(chunk); }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }
  return {
    async checkout(userId, input) {
      if (!salesApproved || !webhookSecret) throw Error('credit_sales_paused');
      if (!IMAGE_UUID.test(input?.id) || typeof input?.packId !== 'string') throw Error('invalid_request');
      const order = await ledger.createOrder(userId, input.id, input.packId);
      if (order.checkout_url) return { checkoutUrl: order.checkout_url, checkoutId: order.checkout_id };
      if (!order.created) throw Error('checkout_pending_review');
      // Intent is durable before Whop is called. An unknown result is not replayed.
      const result = await request('/checkout_configurations', { method: 'POST', headers: { 'Idempotency-Key': input.id },
        body: JSON.stringify({ account_id: companyId, mode: 'payment',
          plan: { account_id: companyId, title: `Titans: ${order.credits} photo credits`, plan_type: 'one_time',
            initial_price: order.price_cents / 100, currency: 'usd', visibility: 'hidden', release_method: 'buy_now',
            description: `${order.credits} additional image credits. One-time purchase; does not renew.` },
          metadata: { titans_image_order: input.id }, redirect_url: 'https://titansagency.co/prompt/#titans-image-flow'
        }) });
      const target = new URL(result.purchase_url);
      if (!/^ch_[A-Za-z0-9]+$/.test(result.id) || !/^plan_[A-Za-z0-9]+$/.test(result.plan?.id) ||
        target.protocol !== 'https:' || target.hostname !== (sandbox ? 'sandbox.whop.com' : 'whop.com') || target.username || target.password) throw Error('invalid_checkout');
      await ledger.completeOrder(input.id, result.id, result.plan.id, target.href);
      return { checkoutUrl: target.href, checkoutId: result.id };
    },
    async webhook(raw, headers) {
      let event;
      try { event = unwrapWebhook(raw, { headers, key: webhookSecret }); } catch { throw Error('invalid_signature'); }
      const type = event?.type;
      let paymentId;
      if (['payment.succeeded', 'payment.failed', 'payment.canceled'].includes(type)) paymentId = event.data?.id;
      else if (['refund.created', 'refund.updated', 'dispute.created', 'dispute.updated'].includes(type)) {
        // The pinned event envelope retains nested legacy refund/dispute payment
        // references; the newer Refund resource uses payment_id. Reject conflicts.
        paymentId = event.data?.payment?.id ?? event.data?.payment_id;
        if (event.data?.payment?.id && event.data?.payment_id && event.data.payment.id !== event.data.payment_id) throw Error('invalid_payment');
      }
      else return { ignored: true };
      if (!/^pay_[A-Za-z0-9]+$/.test(paymentId ?? '')) throw Error('invalid_payment');
      // Never fulfill from the event alone or from checkout-return query parameters.
      const payment = await request(`/payments/${paymentId}`);
      const orderId = payment.metadata?.titans_image_order;
      if (!IMAGE_UUID.test(orderId ?? '')) return { ignored: true };
      const order = await ledger.order(orderId);
      if (!order || payment.id !== paymentId || payment.account_id !== companyId || payment.user?.id !== order.user_id ||
        payment.checkout_configuration_id !== order.checkout_id || payment.plan_id !== order.plan_id || payment.currency !== 'usd') throw Error('payment_mismatch');
      if (payment.status !== 'paid') return { ignored: true };
      const tax = payment.tax_amount === null ? 0 : cents(payment.tax_amount);
      const inclusive = payment.tax_behavior === 'inclusive';
      if (tax > 0 && !['inclusive','exclusive'].includes(payment.tax_behavior)) throw Error('payment_mismatch');
      if (cents(payment.subtotal) !== order.price_cents || cents(payment.total) - (inclusive ? 0 : tax) !== order.price_cents) throw Error('payment_mismatch');
      const refunded = payment.refunded_amount === null ? 0 : cents(payment.refunded_amount);
      const taxRefunded = cents(payment.tax_refunded_amount);
      const reversed = ['refunded', 'auto_refunded', 'dispute_lost', 'resolution_lost'].includes(payment.substatus);
      return ledger.applyPayment({ id: paymentId, userId: order.user_id, credits: order.credits, priceCents: order.price_cents,
        refundedCents: reversed ? order.price_cents : Math.max(0, Math.min(order.price_cents, refunded - (inclusive ? 0 : taxRefunded))) });
    }
  };
}
