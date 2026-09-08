import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createImageLedger } from './image-ledger.mjs';
import pg from 'pg';
import { readFile } from 'node:fs/promises';

// This integration suite is intentionally explicit, never silently skipped.
// The launcher provisions an isolated PostgreSQL test database, not live accounts.
test('image ledger: lifetime allowance, races, failures, refunds and spend caps', async () => {
  assert.ok(process.env.TITANS_IMAGE_TEST_DATABASE_URL, 'A dedicated test database is required');
  const setup = new pg.Pool({ connectionString: process.env.TITANS_IMAGE_TEST_DATABASE_URL });
  assert.match((await setup.query('SELECT current_database() AS name')).rows[0].name, /^titans_images_test_[a-f0-9]{16}$/);
  await setup.query(await readFile(new URL('./image-schema.sql', import.meta.url), 'utf8'));
  await setup.query('UPDATE titans_images.settings SET generation_enabled=true');
  const ledger = createImageLedger({ connectionString: process.env.TITANS_IMAGE_TEST_DATABASE_URL });
  try {
    const user = `user_${randomUUID().replaceAll('-', '')}`;
    await assert.rejects(ledger.ensureAllowance(user, false), /access_required/);
    await Promise.all(Array.from({ length: 15 }, () => ledger.ensureAllowance(user, true)));
    assert.equal((await ledger.account(user)).balance, 15);
    const id = randomUUID();
    const request = { id, userId: user, hash: 'a'.repeat(64), kind: 'original' };
    const duplicates = await Promise.all(Array.from({ length: 8 }, () => ledger.reserve(request)));
    assert.equal(duplicates.filter(x => x.created).length, 1);
    assert.equal((await ledger.account(user)).available, 14);
    await assert.rejects(ledger.reserve({ ...request, hash: 'b'.repeat(64) }), /request_conflict/);
    await assert.rejects(ledger.reserve({ ...request, id: randomUUID() }), /request_in_progress/);
    await ledger.finish(id, 'unknown');
    assert.equal((await ledger.account(user)).available, 14);
    await ledger.finish(id, 'succeeded', { costMicros: 178108, usage: { textTokens: 236, imageTokens: 1536, outputTokens: 5488 } });
    await ledger.finish(id, 'succeeded', { costMicros: 178108 });
    assert.equal((await ledger.account(user)).balance, 14);
    await ledger.ensureAllowance(user, true);
    assert.equal((await ledger.account(user)).balance, 14);
    const failed = randomUUID();
    await ledger.reserve({ ...request, id: failed });
    await ledger.finish(failed, 'failed');
    assert.equal((await ledger.account(user)).available, 14);
    assert.equal(await ledger.job('user_somebodyelse', id), null);
    const payment = { id: `pay_${randomUUID()}`, userId: user, credits: 10, priceCents: 500, refundedCents: 0 };
    await Promise.all([ledger.applyPayment(payment), ledger.applyPayment(payment)]);
    assert.equal((await ledger.account(user)).balance, 24);
    await ledger.applyPayment({ ...payment, refundedCents: 250 });
    await ledger.applyPayment({ ...payment, refundedCents: 250 });
    assert.equal((await ledger.account(user)).balance, 19);
    await ledger.applyPayment({ ...payment, refundedCents: 500 });
    await ledger.applyPayment(payment); // Delayed success cannot restore reversed credits.
    assert.equal((await ledger.account(user)).balance, 14);
    await assert.rejects(ledger.applyPayment({ ...payment, userId: 'user_other' }), /payment_conflict/);
    await setup.query('UPDATE titans_images.settings SET day_micros=1');
    await assert.rejects(ledger.reserve({ ...request, id: randomUUID() }), /spend_limit/);
  } finally { await ledger.close(); await setup.end(); }
});
