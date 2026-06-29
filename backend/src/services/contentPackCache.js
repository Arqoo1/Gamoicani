import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ContentPack } from "../models/ContentPack.js";
import { createHttpError } from "../utils/validators.js";

const DEFAULT_TTL_MS = 10 * 60 * 1000;
const cache = new Map();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../..");
const defaultDataDir = path.join(projectRoot, "frontend", "data");

function clonePayload(payload) {
  return typeof structuredClone === "function"
    ? structuredClone(payload)
    : JSON.parse(JSON.stringify(payload));
}

function resolveContentPath(dataDir, contentPath) {
  if (!contentPath) {
    return null;
  }

  const normalizedPath = contentPath.replaceAll("\\", "/").replace(/^data\//, "");

  return path.join(dataDir, normalizedPath);
}

export async function getLocalContentPayload(gameId, { dataDir = defaultDataDir } = {}) {
  const games = JSON.parse(await fs.readFile(path.join(dataDir, "games.json"), "utf8"));
  const game = Array.isArray(games) ? games.find((item) => item.id === gameId) : null;
  const contentPath = resolveContentPath(dataDir, game?.content);

  if (!contentPath) {
    return null;
  }

  return JSON.parse(await fs.readFile(contentPath, "utf8"));
}

export async function getContentPayload(gameId, { ttlMs = DEFAULT_TTL_MS } = {}) {
  const now = Date.now();
  const cached = cache.get(gameId);

  if (cached && cached.expiresAt > now) {
    return clonePayload(cached.payload);
  }

  const contentPack = await ContentPack.findOne({ gameId }).lean();
  let payload = contentPack?.payload ?? null;

  if (!payload) {
    payload = await getLocalContentPayload(gameId).catch(() => null);
  }

  if (!payload) {
    throw createHttpError(503, `Content is not seeded for ${gameId}`);
  }

  cache.set(gameId, {
    expiresAt: now + ttlMs,
    payload: clonePayload(payload)
  });

  return clonePayload(payload);
}

export function clearContentPayloadCache(gameId) {
  if (gameId) {
    cache.delete(gameId);
    return;
  }

  cache.clear();
}
