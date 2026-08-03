import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScorePayload } from "@/entities/score/types";
import { submitScoreToServer } from "@/features/scores/api/scoresApi";

const OUTBOX_KEY = "scores:outbox:v1";
const OUTBOX_SYNC_LOCK_KEY = "scores:outbox:sync-lock:v1";
const OUTBOX_SYNC_LOCK_TTL_MS = 30_000;
const OUTBOX_SYNC_MAX_ATTEMPTS = 3;
const OUTBOX_SYNC_RETRY_DELAY_MS = 250;
const OUTBOX_SYNC_CONCURRENCY = 3;

export type QueuedScore = ScorePayload & {
  clientEventId: string;
  queuedAt: string;
};

export type ScoreFlushResult = {
  failed: number;
  pending: number;
  synced: number;
};

function createClientEventId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function loadOutbox(): Promise<QueuedScore[]> {
  const raw = await AsyncStorage.getItem(OUTBOX_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as QueuedScore[]) : [];
  } catch {
    return [];
  }
}

async function saveOutbox(items: QueuedScore[]) {
  await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
}

async function loadSyncLock() {
  const raw = await AsyncStorage.getItem(OUTBOX_SYNC_LOCK_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { lockedAt?: string };
    return typeof parsed.lockedAt === "string" ? parsed.lockedAt : null;
  } catch {
    return null;
  }
}

async function acquireSyncLock() {
  const lockedAt = await loadSyncLock();
  if (lockedAt) {
    const lockedAtMs = Date.parse(lockedAt);
    if (Number.isFinite(lockedAtMs) && Date.now() - lockedAtMs < OUTBOX_SYNC_LOCK_TTL_MS) {
      return false;
    }
  }

  await AsyncStorage.setItem(OUTBOX_SYNC_LOCK_KEY, JSON.stringify({ lockedAt: new Date().toISOString() }));
  return true;
}

async function releaseSyncLock() {
  await AsyncStorage.removeItem(OUTBOX_SYNC_LOCK_KEY);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function flushScoreItem(item: QueuedScore) {
  let attempt = 0;

  while (attempt < OUTBOX_SYNC_MAX_ATTEMPTS) {
    try {
      await submitScoreToServer(item);
      return true;
    } catch {
      attempt += 1;
      if (attempt < OUTBOX_SYNC_MAX_ATTEMPTS) {
        await wait(OUTBOX_SYNC_RETRY_DELAY_MS * attempt);
      }
    }
  }

  return false;
}

export async function enqueueScore(payload: ScorePayload): Promise<void> {
  const items = await loadOutbox();
  const entry: QueuedScore = {
    ...payload,
    clientEventId: payload.clientEventId ?? createClientEventId(),
    queuedAt: new Date().toISOString(),
  };
  items.push(entry);
  await saveOutbox(items);
}

export async function getPendingScoreCount(): Promise<number> {
  const items = await loadOutbox();
  return items.length;
}

export async function flushScoreOutbox(): Promise<ScoreFlushResult> {
  const acquired = await acquireSyncLock();
  if (!acquired) {
    const pending = await getPendingScoreCount();
    return { synced: 0, failed: 0, pending };
  }

  try {
    const items = await loadOutbox();
    if (items.length === 0) {
      return { synced: 0, failed: 0, pending: 0 };
    }

    const remaining: QueuedScore[] = [];
    let synced = 0;

    for (let i = 0; i < items.length; i += OUTBOX_SYNC_CONCURRENCY) {
      const batch = items.slice(i, i + OUTBOX_SYNC_CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map(async (item) => ({
          item,
          ok: await flushScoreItem(item),
        }))
      );

      for (const result of batchResults) {
        if (result.ok) synced += 1;
        else remaining.push(result.item);
      }
    }

    await saveOutbox(remaining);

    return {
      synced,
      failed: remaining.length,
      pending: remaining.length,
    };
  } finally {
    await releaseSyncLock();
  }
}
