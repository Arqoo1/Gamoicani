import AsyncStorage from "@react-native-async-storage/async-storage";

import { AuthUser } from "@/entities/user/types";
import { submitScore } from "@/features/scores/api/scoresApi";

const QUEUE_KEY = "practiceXp:queue:v1";

type PracticeSession = {
  id: string;
  gameId: string;
  won: boolean;
  attempts: number;
  timestamp: number;
};

function generateId() {
  return `pxp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}


export async function recordPracticeSession(
  gameId: string,
  won: boolean,
  attempts: number
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: PracticeSession[] = raw ? JSON.parse(raw) : [];
    queue.push({ id: generateId(), gameId, won, attempts, timestamp: Date.now() });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}


export async function syncPracticeXp(onScoreResult?: (freshUser: AuthUser) => void): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return 0;
    const queue: PracticeSession[] = JSON.parse(raw);
    if (queue.length === 0) return 0;

    let synced = 0;
    let lastFreshUser: AuthUser | undefined;
    const remaining: PracticeSession[] = [];

    for (const session of queue) {
      try {
        const result = await submitScore({
          gameId: session.gameId,
          won: session.won,
          attempts: session.attempts,
          mode: "practice",
          clientEventId: session.id,
          completionMethod: session.won ? "solved" : "lost",
        });
        if (result?.user) {
          lastFreshUser = result.user;
        }
        synced++;
      } catch {
        remaining.push(session);
      }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));

    // Update the auth context once with the latest user state after all syncs
    if (lastFreshUser && onScoreResult) {
      onScoreResult(lastFreshUser);
    }

    return synced;
  } catch {
    return 0;
  }
}


export async function getPendingCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return 0;
    const queue: PracticeSession[] = JSON.parse(raw);
    return queue.length;
  } catch {
    return 0;
  }
}


export async function clearPracticeQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY).catch(() => {});
}
