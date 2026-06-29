import { ContentPack } from "../models/ContentPack.js";
import { createHttpError } from "../utils/validators.js";

const DEFAULT_TTL_MS = 10 * 60 * 1000;
const cache = new Map();

function clonePayload(payload) {
  return typeof structuredClone === "function"
    ? structuredClone(payload)
    : JSON.parse(JSON.stringify(payload));
}

export async function getContentPayload(gameId, { ttlMs = DEFAULT_TTL_MS } = {}) {
  const now = Date.now();
  const cached = cache.get(gameId);

  if (cached && cached.expiresAt > now) {
    return clonePayload(cached.payload);
  }

  const contentPack = await ContentPack.findOne({ gameId }).lean();

  if (!contentPack?.payload) {
    throw createHttpError(503, `Content is not seeded for ${gameId}`);
  }

  cache.set(gameId, {
    expiresAt: now + ttlMs,
    payload: clonePayload(contentPack.payload)
  });

  return clonePayload(contentPack.payload);
}

export function clearContentPayloadCache(gameId) {
  if (gameId) {
    cache.delete(gameId);
    return;
  }

  cache.clear();
}
