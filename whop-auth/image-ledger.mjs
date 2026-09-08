import pg from 'pg';

const active = "state IN ('reserved','running','unknown')";
const validUser = value => typeof value === 'string' && /^user_[A-Za-z0-9]+$/.test(value);
const validId = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
function requireValue(ok, code) { if (!ok) throw new Error(code); }

export function createImageLedger({ connectionString } = {}) {
  requireValue(typeof connectionString === 'string' && connectionString.length > 0, 'database_required');
  const pool = new pg.Pool({ connectionString, max: 5, connectionTimeoutMillis: 4000,
    statement_timeout: 10000, application_name: 'titans-images' });
  pool.on('error', () => { /* Never emit connection strings or provider errors. Requests fail closed. */ });
  async function transaction(fn) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Serializes short accounting operations, not remote calls or file processing.
      // Enforces global budgets across all application processes.
      await client.query('SELECT pg_advisory_xact_lock(746482019)');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  async function entry(client, id, userId, delta, reason) {
    const inserted = await client.query(`INSERT INTO titans_images.transactions(id,user_id,delta,reason)
      VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING id`, [id, userId, delta, reason]);
    if (inserted.rowCount) await client.query('UPDATE titans_images.accounts SET balance=balance+$2 WHERE user_id=$1', [userId, delta]);
    return inserted.rowCount === 1;
  }
  const api = {
    async ensureAllowance(userId, eligible) {
      requireValue(validUser(userId), 'invalid_user');
      requireValue(eligible === true, 'access_required');
      return transaction(async client => {
        await client.query('INSERT INTO titans_images.accounts(user_id) VALUES($1) ON CONFLICT DO NOTHING', [userId]);
        return entry(client, `lifetime:${userId}`, userId, 15, 'initial_eligibility');
      });
    },
    async account(userId) {
      requireValue(validUser(userId), 'invalid_user');
      const { rows } = await pool.query(`SELECT balance, balance-(SELECT count(*)::integer FROM titans_images.jobs
        WHERE user_id=$1 AND ${active}) AS available FROM titans_images.accounts WHERE user_id=$1`, [userId]);
      return rows[0] ?? null;
    },
    async job(userId, id) {
      requireValue(validUser(userId) && validId(id), 'invalid_request');
      const { rows } = await pool.query('SELECT * FROM titans_images.jobs WHERE user_id=$1 AND id=$2', [userId, id]);
      return rows[0] ?? null;
    },
    async reserve({ id, userId, hash, kind, sourceId = null }) {
      requireValue(validId(id) && validUser(userId) && /^[a-f0-9]{64}$/.test(hash) &&
        ['original', 'selfie'].includes(kind) && (sourceId === null || validId(sourceId)), 'invalid_request');
      return transaction(async client => {
        const previous = (await client.query('SELECT * FROM titans_images.jobs WHERE id=$1', [id])).rows[0];
        if (previous) {
          requireValue(previous.user_id === userId && previous.request_hash === hash, 'request_conflict');
          return { created: false, job: previous };
        }
        const settings = (await client.query('SELECT * FROM titans_images.settings WHERE id=true')).rows[0];
        requireValue(settings?.generation_enabled === true, 'generation_paused');
        const running = (await client.query(`SELECT user_id FROM titans_images.jobs WHERE ${active}`)).rows;
        requireValue(!running.some(x => x.user_id === userId), 'request_in_progress');
        requireValue(running.length < 2, 'capacity_limit');
        const spent = (await client.query(`SELECT
          coalesce(sum(coalesce(cost_micros,budget_micros)) FILTER (WHERE created_at >= date_trunc('day',now())),0)::bigint AS day,
          coalesce(sum(coalesce(cost_micros,budget_micros)) FILTER (WHERE created_at >= date_trunc('month',now())),0)::bigint AS month
          FROM titans_images.jobs`)).rows[0];
        requireValue(Number(spent.day) + 250000 <= settings.day_micros && Number(spent.month) + 250000 <= settings.month_micros, 'spend_limit');
        const account = (await client.query('SELECT balance FROM titans_images.accounts WHERE user_id=$1', [userId])).rows[0];
        requireValue(account?.balance > 0, 'credits_exhausted');
        if (kind === 'selfie') {
          const source = (await client.query('SELECT id FROM titans_images.jobs WHERE id=$1 AND user_id=$2 AND kind=$3 AND state=$4',
            [sourceId, userId, 'original', 'succeeded'])).rows[0];
          requireValue(Boolean(source), 'source_unavailable');
        }
        const { rows } = await client.query(`INSERT INTO titans_images.jobs(id,user_id,request_hash,kind,source_id,state)
          VALUES ($1,$2,$3,$4,$5,'reserved') RETURNING *`, [id, userId, hash, kind, sourceId]);
        return { created: true, job: rows[0] };
      });
    },
    async finish(id, state, { costMicros = null, usage = null } = {}) {
      requireValue(validId(id) && ['running', 'unknown', 'succeeded', 'failed'].includes(state), 'invalid_outcome');
      requireValue(costMicros === null || (Number.isSafeInteger(costMicros) && costMicros >= 0), 'invalid_cost');
      requireValue(state !== 'succeeded' || costMicros !== null, 'cost_required');
      return transaction(async client => {
        const job = (await client.query('SELECT * FROM titans_images.jobs WHERE id=$1', [id])).rows[0];
        requireValue(Boolean(job), 'job_missing');
        if (['succeeded', 'failed'].includes(job.state)) {
          requireValue(state === job.state, 'outcome_conflict');
          return job;
        }
        requireValue(state !== 'running' || job.state === 'reserved', 'outcome_conflict');
        if (state === 'succeeded') await entry(client, `generation:${id}`, job.user_id, -1, 'saved_image');
        return (await client.query(`UPDATE titans_images.jobs SET state=$2,cost_micros=$3,usage=$4,updated_at=now()
          WHERE id=$1 RETURNING *`, [id, state, costMicros, usage])).rows[0];
      });
    },
    async applyPayment({ id, userId, credits, priceCents, refundedCents = 0 }) {
      requireValue(typeof id === 'string' && /^pay_[A-Za-z0-9_-]{1,100}$/.test(id) && validUser(userId), 'invalid_payment');
      requireValue(Number.isSafeInteger(credits) && credits > 0 && credits <= 10000 &&
        Number.isSafeInteger(priceCents) && priceCents > 0 &&
        Number.isSafeInteger(refundedCents) && refundedCents >= 0 && refundedCents <= priceCents, 'invalid_payment');
      return transaction(async client => {
        await client.query('INSERT INTO titans_images.accounts(user_id) VALUES($1) ON CONFLICT DO NOTHING', [userId]);
        let existing = (await client.query('SELECT * FROM titans_images.payments WHERE id=$1', [id])).rows[0];
        if (existing) requireValue(existing.user_id === userId && existing.credits === credits &&
          existing.price_cents === priceCents, 'payment_conflict');
        else {
          existing = (await client.query(`INSERT INTO titans_images.payments(id,user_id,credits,price_cents)
            VALUES ($1,$2,$3,$4) RETURNING *`, [id, userId, credits, priceCents])).rows[0];
          await entry(client, `purchase:${id}`, userId, credits, 'verified_payment');
        }
        const revoked = Math.max(existing.revoked, Math.ceil(credits * refundedCents / priceCents));
        if (revoked > existing.revoked) {
          await entry(client, `reversal:${id}:${revoked}`, userId, existing.revoked - revoked, 'payment_reversal');
          await client.query('UPDATE titans_images.payments SET revoked=$2 WHERE id=$1', [id, revoked]);
        }
        return { revoked };
      });
    },
    close: () => pool.end(),
  };
  return api;
}
