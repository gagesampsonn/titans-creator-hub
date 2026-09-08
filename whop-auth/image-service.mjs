import { prepareImageRequest, generatePhoto, IMAGE_UUID } from './image-provider.mjs';

export const CREDIT_PACKS = Object.freeze([
  { id: 'photos_10', priceCents: 500, credits: 10 },
  { id: 'photos_25', priceCents: 1000, credits: 25 },
  { id: 'photos_40', priceCents: 1500, credits: 40 },
  { id: 'photos_60', priceCents: 2000, credits: 60 },
  { id: 'photos_80', priceCents: 2500, credits: 80 },
  { id: 'photos_100', priceCents: 3000, credits: 100, bestValue: true }
]);
const publicJob = job => ({ id: job.id, kind: job.kind, sourceId: job.source_id ?? null,
  state: job.state, createdAt: job.created_at, imageUrl: job.state === 'succeeded' ? `/image-api/images/${job.id}` : null });

export function createImageService({ ledger, storage, apiKey, salesApproved = false, provider = generatePhoto }) {
  const pending = new Set();
  const preparing = new Set();
  async function reconcile(job) {
    if (!['reserved', 'running', 'unknown'].includes(job.state)) return job;
    // Do not interfere with a process which may still be awaiting the provider.
    if (Date.now() - new Date(job.updated_at).getTime() < 10 * 60 * 1000) return job;
    try {
      const receipt = await storage.receipt(job.id);
      return await ledger.finish(job.id, 'succeeded', receipt);
    } catch {
      // Repeated status polls must not restart the support recovery clock.
      if (job.state === 'unknown') return job;
      // Reserved means dispatch was never claimed; a running job is uncertain.
      return ledger.finish(job.id, job.state === 'reserved' ? 'failed' : 'unknown', {
        expectedState: job.state, expectedUpdatedAt: job.updated_at
      });
    }
  }
  return {
    async state(userId) {
      await ledger.ensureAllowance(userId, true); // Called only after live Whop eligibility.
      const jobs = [];
      for (const job of await ledger.list(userId)) jobs.push(publicJob(await reconcile(job)));
      const settings = await ledger.settings();
      const account = await ledger.account(userId);
      const packs = await ledger.packs();
      const best = [...packs].sort((a,b) => a.priceCents/a.credits-b.priceCents/b.credits || b.credits-a.credits)[0]?.id;
      return { credits: Math.max(0, account.available), reserved: account.balance - account.available,
        generationEnabled: settings.generation_enabled && Boolean(apiKey), salesEnabled: settings.sales_enabled && salesApproved,
        packs: packs.map(pack => ({ ...pack, bestValue: pack.id === best })), jobs, retentionDays: 30 };
    },
    async start(userId, input) {
      if (!apiKey) throw Error('generation_not_configured');
      if (input?.consent !== 'images-v1') throw Error('consent_required');
      if (preparing.has(userId) || preparing.size >= 2) throw Error('request_in_progress');
      preparing.add(userId);
      try {
        let originalBytes;
        if (input.kind === 'selfie') {
          if (!IMAGE_UUID.test(input.sourceId)) throw Error('invalid_source');
          const original = await ledger.job(userId, input.sourceId);
          if (!original || original.kind !== 'original' || original.state !== 'succeeded') throw Error('source_unavailable');
          originalBytes = await storage.image(original.id);
        }
        const request = await prepareImageRequest(input, { originalBytes });
        await storage.ensureCapacity?.();
        await ledger.ensureAllowance(userId, true);
        const reserved = await ledger.reserve({ ...request, userId });
        if (!reserved.created) return publicJob(reserved.job);
        const work = (async () => {
          try {
            // This is the unique durable dispatch claim. No provider call precedes it.
            await ledger.finish(request.id, 'running');
            const result = await provider(request, { apiKey });
            if (result.state === 'succeeded') await storage.save(request.id, result);
            await ledger.finish(request.id, result.state, result);
          } catch {
            try { await ledger.finish(request.id, 'unknown'); } catch { /* DB intent remains reserved/running; reconciliation is required. */ }
          }
        })();
        pending.add(work);
        work.finally(() => pending.delete(work));
        return publicJob(reserved.job);
      } finally { preparing.delete(userId); }
    },
    async image(userId, id) {
      const job = await ledger.job(userId, id);
      if (!job || job.state !== 'succeeded' || job.images_expired || Date.now() - new Date(job.created_at).getTime() >= 30 * 86400000) throw Error('image_not_found');
      return storage.image(id);
    },
    drain: () => Promise.all([...pending]),
    async pruneExpired() {
      for (const job of await ledger.expiredImages()) {
        await storage.removeExpired(job.id);
        await ledger.markImagesExpired(job.id);
      }
    }
  };
}
