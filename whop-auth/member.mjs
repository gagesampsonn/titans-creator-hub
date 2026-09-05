import { createHmac } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import { join } from "node:path";

const OFFER_MS = 10 * 60 * 1000;

// One durable record per member: refreshing, signing out, and restarting the
// service must not reset a time-limited offer. File names contain no user IDs.
export function createMemberService(config, { checkAccess, now = Date.now }) {
  function recordPath(userId) {
    const key = createHmac("sha256", config.whopSessionSecret).update(userId).digest("hex");
    return join(config.memberStateDir, `${key}.json`);
  }

  function readRecord(userId) {
    try {
      const record = JSON.parse(readFileSync(recordPath(userId), "utf8"));
      if (!Number.isSafeInteger(record.startedAt)) throw new Error("invalid_offer_record");
      return record;
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
  }

  function saveRecord(userId, record) {
    mkdirSync(config.memberStateDir, { recursive: true, mode: 0o700 });
    const path = recordPath(userId);
    writeFileSync(`${path}.tmp`, JSON.stringify(record), { mode: 0o600 });
    renameSync(`${path}.tmp`, path);
  }

  async function getAccess(userId) {
    const [aiPurchased, exclusive, weekly] = await Promise.all([
      checkAccess(userId, config.aiProductId),
      checkAccess(userId, config.exclusiveProductId),
      config.weeklyProductId ? checkAccess(userId, config.weeklyProductId) : false,
    ]);
    return { ai: aiPurchased || exclusive, aiPurchased, exclusive, weekly };
  }

  function getOffer(userId, access, start) {
    if (!config.upgradeEnabled || !access.aiPurchased || access.exclusive) return null;
    // This synchronous read/create is atomic within the single auth process.
    let record = readRecord(userId);
    if (!record && start) {
      record = { startedAt: now() };
      saveRecord(userId, record);
    }
    if (!record || record.startedAt + OFFER_MS <= now()) return null;
    return { expiresAt: record.startedAt + OFFER_MS, initialPrice: 10, renewalPrice: 50, billingDays: 30 };
  }

  async function getMember(userId, { start = false } = {}) {
    const access = await getAccess(userId);
    return { access, offer: getOffer(userId, access, start), serverTime: now() };
  }

  return { getMember, readRecord, saveRecord };
}
