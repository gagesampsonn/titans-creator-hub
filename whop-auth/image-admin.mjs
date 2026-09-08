// SSH-only controls. No public admin endpoint or browser-visible credentials.
import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { IMAGE_UUID } from './image-provider.mjs';
import { parseEnv } from 'node:util';
import { createImageLedger } from './image-ledger.mjs';

if (process.getuid?.() !== 0) {
  process.stderr.write('Use the authorized server administrator account.\n');
  process.exitCode = 1;
} else {
  let ledger;
  try {
    const env = parseEnv(await readFile('/opt/titans-whop-auth/whop-auth.env', 'utf8'));
    ledger = createImageLedger({ connectionString: env.TITANS_IMAGE_DATABASE_URL });
    const action = process.argv[2];
    let input;
    if (['adjust','configure','pack','resolve-failure'].includes(action)) {
      const chunks = []; let size = 0;
      for await (const chunk of process.stdin) { size += chunk.length; if (size > 2048) throw Error('input_limit'); chunks.push(chunk); }
      input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    }
    if (action === 'overview') process.stdout.write(JSON.stringify(await ledger.overview(), null, 2) + '\n');
    else if (action === 'adjust') await ledger.adjust(input);
    else if (action === 'configure') await ledger.configure(input);
    else if (action === 'pack') await ledger.configurePack(input);
    else if (action === 'resolve-failure') {
      if (!IMAGE_UUID.test(input?.id)) throw Error('invalid_id');
      try {
        await access(join(env.WHOP_MEMBER_STATE_DIR || '/var/lib/titans-whop-auth', 'images', `${input.id}.png`));
        throw Error('saved_image_requires_recovery');
      } catch (error) { if (error.code !== 'ENOENT') throw error; }
      await ledger.resolveFailure(input);
    }
    else throw Error('unknown_action');
    if (action !== 'overview') process.stdout.write('Image administration change recorded.\n');
  } catch { process.stderr.write('Image administration failed; no credentials or provider details emitted.\n'); process.exitCode = 1; }
  finally { await ledger?.close(); }
}
