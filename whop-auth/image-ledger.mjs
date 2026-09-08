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
    async list(userId) {
      requireValue(validUser(userId), 'invalid_user');
      return (await pool.query(`SELECT * FROM titans_images.jobs WHERE user_id=$1 AND
        (created_at > now()-interval '30 days' OR ${active}) ORDER BY created_at DESC LIMIT 30`, [userId])).rows;
    },
    async settings() {
      return (await pool.query('SELECT * FROM titans_images.settings WHERE id=true')).rows[0];
    },
    async packs() {
      return (await pool.query('SELECT id,price_cents AS "priceCents",credits FROM titans_images.packs WHERE enabled=true ORDER BY price_cents')).rows;
    },
    async order(id) {
      requireValue(validId(id), 'invalid_order');
      return (await pool.query('SELECT * FROM titans_images.orders WHERE id=$1', [id])).rows[0] ?? null;
    },
    async createOrder(userId, id, packId) {
      requireValue(validUser(userId) && validId(id) && /^photos_[0-9]+$/.test(packId), 'invalid_order');
      return transaction(async client => {
        const settings = (await client.query('SELECT sales_enabled FROM titans_images.settings WHERE id=true')).rows[0];
        requireValue(settings?.sales_enabled === true, 'credit_sales_paused');
        const existing = (await client.query('SELECT * FROM titans_images.orders WHERE id=$1', [id])).rows[0];
        if (existing) {
          requireValue(existing.user_id === userId && existing.pack_id === packId, 'order_conflict');
          return { ...existing, created: false };
        }
        const pack = (await client.query('SELECT * FROM titans_images.packs WHERE id=$1 AND enabled=true', [packId])).rows[0];
        requireValue(Boolean(pack), 'invalid_pack');
        const count = (await client.query(`SELECT count(*)::integer AS total FROM titans_images.orders
          WHERE user_id=$1 AND created_at > now()-interval '1 hour'`, [userId])).rows[0].total;
        requireValue(count < 10, 'rate_limit');
        const { rows } = await client.query(`INSERT INTO titans_images.orders(id,user_id,pack_id,price_cents,credits)
          VALUES($1,$2,$3,$4,$5) RETURNING *`, [id, userId, packId, pack.price_cents, pack.credits]);
        return { ...rows[0], created: true };
      });
    },
    async completeOrder(id, checkoutId, planId, url) {
      requireValue(validId(id) && /^ch_[A-Za-z0-9]+$/.test(checkoutId) && /^plan_[A-Za-z0-9]+$/.test(planId), 'invalid_order');
      return transaction(async client => {
        const { rowCount } = await client.query(`UPDATE titans_images.orders SET checkout_id=$2,plan_id=$3,checkout_url=$4
          WHERE id=$1 AND checkout_id IS NULL`, [id, checkoutId, planId, url]);
        requireValue(rowCount === 1, 'order_conflict');
      });
    },
    async adjust({ id, userId, delta, reason }) {
      requireValue(validId(id) && validUser(userId) && Number.isSafeInteger(delta) && Math.abs(delta) <= 10000 &&
        typeof reason === 'string' && reason.trim().length >= 5 && reason.length <= 200, 'invalid_adjustment');
      return transaction(async client => {
        const previous = (await client.query('SELECT * FROM titans_images.transactions WHERE id=$1', [`admin:${id}`])).rows[0];
        if (previous) {
          requireValue(previous.user_id === userId && previous.delta === delta && previous.reason === reason, 'adjustment_conflict');
          return false;
        }
        return entry(client, `admin:${id}`, userId, delta, reason);
      });
    },
    async configure(input) {
      requireValue(input && typeof input === 'object' && Object.keys(input).every(k => ['generationEnabled','salesEnabled','dayMicros','monthMicros'].includes(k)), 'invalid_settings');
      return transaction(async client => {
        const current = (await client.query('SELECT * FROM titans_images.settings WHERE id=true')).rows[0];
        const generation = input.generationEnabled ?? current.generation_enabled;
        const sales = input.salesEnabled ?? current.sales_enabled;
        const day = input.dayMicros ?? current.day_micros, month = input.monthMicros ?? current.month_micros;
        requireValue(typeof generation === 'boolean' && typeof sales === 'boolean' && Number.isSafeInteger(day) &&
          Number.isSafeInteger(month) && day >= 0 && month >= day && month <= 1000000000, 'invalid_settings');
        await client.query('UPDATE titans_images.settings SET generation_enabled=$1,sales_enabled=$2,day_micros=$3,month_micros=$4 WHERE id=true', [generation, sales, day, month]);
        await client.query('INSERT INTO titans_images.admin_audit(action,details) VALUES($1,$2)', ['configure', input]);
      });
    },
    async configurePack({ id, priceCents, credits, enabled }) {
      requireValue(/^photos_[0-9]+$/.test(id) && Number.isSafeInteger(priceCents) && priceCents >= 100 && priceCents <= 100000 &&
        Number.isSafeInteger(credits) && credits >= 1 && credits <= 10000 && typeof enabled === 'boolean', 'invalid_pack');
      return transaction(async client => {
        const { rowCount } = await client.query('UPDATE titans_images.packs SET price_cents=$2,credits=$3,enabled=$4 WHERE id=$1', [id, priceCents, credits, enabled]);
        requireValue(rowCount === 1, 'invalid_pack');
        await client.query('INSERT INTO titans_images.admin_audit(action,details) VALUES($1,$2)', ['configure_pack', { id, priceCents, credits, enabled }]);
      });
    },
    async overview() {
      const summary = (await pool.query(`SELECT count(*)::integer AS attempts,
        count(*) FILTER (WHERE state='succeeded')::integer AS saved,
        count(*) FILTER (WHERE state='unknown')::integer AS uncertain,
        coalesce(sum(cost_micros) FILTER (WHERE usage IS NOT NULL),0)::bigint AS usage_calculated_micros,
        coalesce(sum(coalesce(cost_micros,budget_micros)) FILTER (WHERE usage IS NULL),0)::bigint AS unverified_budget_micros
        FROM titans_images.jobs`)).rows[0];
      return { summary, settings: await api.settings(), packs: await api.packs(),
        recentJobs: (await pool.query('SELECT id,user_id,state,usage,cost_micros,created_at FROM titans_images.jobs ORDER BY created_at DESC LIMIT 50')).rows,
        accounts: (await pool.query('SELECT user_id,balance FROM titans_images.accounts ORDER BY created_at DESC LIMIT 50')).rows };
    },
    async resolveFailure({ id, evidence, confirmedNoImage, costMicros }) {
      requireValue(validId(id) && typeof evidence === 'string' && evidence.trim().length >= 10 && evidence.length <= 1000, 'invalid_resolution');
      requireValue(confirmedNoImage === true, 'confirmation_required');
      requireValue(Number.isSafeInteger(costMicros) && costMicros >= 0 && costMicros <= 10000000, 'invalid_cost');
      return transaction(async client => {
        const job = (await client.query('SELECT state,updated_at FROM titans_images.jobs WHERE id=$1', [id])).rows[0];
        requireValue(job && ['running','unknown'].includes(job.state), 'outcome_conflict');
        requireValue(Date.now() - new Date(job.updated_at).getTime() >= 10 * 60000, 'recovery_too_early');
        await client.query("UPDATE titans_images.jobs SET state='failed',cost_micros=$2,updated_at=now() WHERE id=$1", [id, costMicros]);
        await client.query('INSERT INTO titans_images.admin_audit(action,details) VALUES($1,$2)', ['confirmed_failed_request', { id, evidence, costMicros }]);
      });
    },
    async expiredImages() {
      return (await pool.query(`SELECT id FROM titans_images.jobs WHERE images_expired=false
        AND state IN ('succeeded','failed') AND created_at < now()-interval '30 days' LIMIT 500`)).rows;
    },
    async markImagesExpired(id) {
      requireValue(validId(id), 'invalid_image_id');
      await pool.query(`UPDATE titans_images.jobs SET images_expired=true WHERE id=$1
        AND state IN ('succeeded','failed') AND created_at < now()-interval '30 days'`, [id]);
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
        const attempts = (await client.query(`SELECT count(*)::integer AS total FROM titans_images.jobs
          WHERE user_id=$1 AND created_at > now()-interval '1 minute'`, [userId])).rows[0].total;
        requireValue(attempts < 4, 'rate_limit');
        const spent = (await client.query(`SELECT
          coalesce(sum(coalesce(cost_micros,budget_micros)) FILTER (WHERE created_at >= now()-interval '24 hours' OR ${active}),0)::bigint AS day,
          coalesce(sum(coalesce(cost_micros,budget_micros)) FILTER (WHERE created_at >= now()-interval '30 days' OR ${active}),0)::bigint AS month
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
    async finish(id, state, { costMicros = null, usage = null, expectedState, expectedUpdatedAt } = {}) {
      requireValue(validId(id) && ['running', 'unknown', 'succeeded', 'failed'].includes(state), 'invalid_outcome');
      requireValue(costMicros === null || (Number.isSafeInteger(costMicros) && costMicros >= 0), 'invalid_cost');
      requireValue(state !== 'succeeded' || costMicros !== null, 'cost_required');
      return transaction(async client => {
        const job = (await client.query('SELECT * FROM titans_images.jobs WHERE id=$1', [id])).rows[0];
        requireValue(Boolean(job), 'job_missing');
        // Recovery acts on a snapshot. Never release a credit if dispatch advanced
        // since that snapshot was read (compare under the same accounting lock).
        if (expectedState !== undefined && (job.state !== expectedState ||
          (expectedUpdatedAt !== undefined && new Date(job.updated_at).getTime() !== new Date(expectedUpdatedAt).getTime()))) return job;
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
