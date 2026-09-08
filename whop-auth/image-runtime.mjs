import { join } from 'node:path';
import { createImageLedger } from './image-ledger.mjs';
import { createImageStorage } from './image-storage.mjs';
import { createImageService } from './image-service.mjs';
import { createImageBilling } from './image-billing.mjs';

export async function openImageRuntime(env, config) {
  if (env.TITANS_IMAGES_ENABLED !== 'true') return {};
  if (!env.TITANS_IMAGE_DATABASE_URL || !env.OPENAI_API_KEY) throw Error('image_configuration_missing');
  const ledger = createImageLedger({ connectionString: env.TITANS_IMAGE_DATABASE_URL });
  try {
    await ledger.settings(); // Never auto-migrate a live database from the web process.
    const storage = createImageStorage(join(config.memberStateDir, 'images'));
    const salesApproved = env.TITANS_IMAGE_SALES_APPROVED === 'true' && Boolean(env.TITANS_IMAGE_WEBHOOK_SECRET);
    const imageService = createImageService({ ledger, storage, apiKey: env.OPENAI_API_KEY, salesApproved });
    const imageBilling = createImageBilling({ ledger, apiKey: config.whopApiKey,
      webhookSecret: env.TITANS_IMAGE_WEBHOOK_SECRET, companyId: config.whopCompanyId, salesApproved });
    const cleanup = setInterval(() => imageService.pruneExpired().catch(() => {}), 3600000);
    cleanup.unref();
    return { imageService, imageBilling, close: async () => { clearInterval(cleanup); await imageService.drain(); await ledger.close(); } };
  } catch (error) { await ledger.close(); throw error; }
}
