import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { createImageBilling, cents } from './image-billing.mjs';

const money = amount => ({ amount, currency: 'usd', decimals: 2, display_decimals: 2 });
test('money parser rejects ambiguous or foreign currency amounts', () => {
  assert.equal(cents(money('5.00')), 500);
  assert.throws(() => cents(money('5.001')), /invalid_money/);
  assert.throws(() => cents({ ...money('5.00'), currency: 'eur' }), /invalid_money/);
});
test('only signed notifications and server-retrieved matching payments can credit an order', async () => {
  const key = 'ws_test_signing_secret_not_real';
  const orderId = randomUUID(); let applied = 0; let lastApplied;
  const order = { id: orderId, user_id: 'user_buyer', credits: 10, price_cents: 500, checkout_id: 'ch_test', plan_id: 'plan_pack' };
  let payment = { id: 'pay_test', account_id: 'biz_test', status: 'paid', substatus: 'succeeded', user: { id: 'user_buyer' },
    checkout_configuration_id: 'ch_test', plan_id: 'plan_pack', currency: 'usd', subtotal: money('5.00'), total: money('5.00'),
    tax_amount: money('0.00'), refunded_amount: money('0.00'), tax_refunded_amount: money('0.00'),
    metadata: { titans_image_order: orderId } };
  const ledger = { order: async id => id === orderId ? order : null, applyPayment: async item => { applied++; lastApplied = item; return item; } };
  const billing = createImageBilling({ ledger, apiKey: 'test-only', webhookSecret: key, companyId: 'biz_test', fetchFn: async () => Response.json(payment) });
  const raw = JSON.stringify({ type: 'payment.succeeded', data: { id: 'pay_test' } });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const headers = { 'webhook-id': 'test_event', 'webhook-timestamp': timestamp,
    'webhook-signature': 'v1,' + createHmac('sha256', key).update(`test_event.${timestamp}.${raw}`).digest('base64') };
  await assert.rejects(billing.webhook(raw, { ...headers, 'webhook-signature': 'v1,invalid' }), /invalid_signature/);
  assert.equal(applied, 0);
  await billing.webhook(raw, headers); assert.equal(applied, 1);
  payment = { ...payment, user: { id: 'user_other' } };
  await assert.rejects(billing.webhook(raw, headers), /payment_mismatch/);
  assert.equal(applied, 1);
  payment = { ...payment, user: { id: 'user_buyer' }, tax_amount: money('0.50'), tax_behavior: 'inclusive' };
  await billing.webhook(raw, headers);
  assert.equal(applied, 2);
  payment = { ...payment, tax_behavior: 'exclusive', total: money('5.50') };
  await billing.webhook(raw, headers);
  assert.equal(applied, 3);
  payment = { ...payment, refunded_amount: money('2.75'), tax_refunded_amount: money('0.25'), substatus: 'partially_refunded' };
  for (const type of ['refund.created', 'refund.updated', 'dispute.updated']) {
    const refundRaw = JSON.stringify({ type, data: { id: 'rf_test', payment: { id: 'pay_test' } } });
    const refundHeaders = { ...headers, 'webhook-signature': 'v1,' + createHmac('sha256', key).update(`test_event.${timestamp}.${refundRaw}`).digest('base64') };
    await billing.webhook(refundRaw, refundHeaders);
    assert.equal(lastApplied.refundedCents, 250);
  }
  payment = { ...payment, tax_behavior: 'inclusive', total: money('5.00'), refunded_amount: money('2.50'), tax_refunded_amount: money('0.25') };
  await billing.webhook(raw, headers);
  assert.equal(lastApplied.refundedCents, 250);
});
test('credit checkout stays disabled before the explicit economics and test-mode gates', async () => {
  const billing = createImageBilling({ ledger: {}, apiKey: 'test-only', companyId: 'biz_test' });
  await assert.rejects(billing.checkout('user_buyer', { packId: 'photos_10', id: randomUUID() }), /credit_sales_paused/);
});
