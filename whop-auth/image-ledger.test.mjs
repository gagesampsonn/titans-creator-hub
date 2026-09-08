import test from 'node:test';
import assert from 'node:assert/strict';
import { createImageLedger } from './image-ledger.mjs';

test('image ledger refuses to start without an explicit private database', () => {
  assert.throws(() => createImageLedger({}), /database_required/);
});
