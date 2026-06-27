import AsyncStorage from "@react-native-async-storage/async-storage";

import { AuthUser, submitScore } from "./api";
import { GameStatus } from "./wordle";

export type WordleProgress = {
  answer: string;
  currentLetters: string[];
  gameStatus: GameStatus;
  guesses: string[];
  puzzleNumber: number;
  savedAt: string;
};

export type CompletedPuzzle = {
  completedAt: string;
  guesses: number;
  won: boolean;
};

export type WordleStats = {
  completedPuzzles: Record<string, CompletedPuzzle>;
  currentStreak: number;
  guessDistribution: number[];
  lastCompletedPuzzleNumber: number | null;
  maxStreak: number;
  played: number;
  wins: number;
};

const STATS_KEY = "wordle:stats:v1";
const CONTENT_CACHE_PREFIX = "wordle:content-cache:v1:";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; 

type ContentCacheEntry<T> = {
  cachedAt: string;
  data: T;
};


export async function cacheGameContent<T>(gameId: string, data: T): Promise<void> {
  const entry: ContentCacheEntry<T> = { cachedAt: new Date().toISOString(), data };
  await AsyncStorage.setItem(CONTENT_CACHE_PREFIX + gameId, JSON.stringify(entry));
}


export async function getCachedGameContent<T>(gameId: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CONTENT_CACHE_PREFIX + gameId);
    if (!raw) return null;
    const entry = JSON.parse(raw) as ContentCacheEntry<T>;
    const age = Date.now() - new Date(entry.cachedAt).getTime();
    if (age > CACHE_TTL_MS) return null;
    return entry.data;
  } catch {
    return null;
  }
}

export function getProgressKey(puzzleNumber: number, answer: string) {
  return `wordle:progress:v1:${puzzleNumber}:${answer}`;
}

export function createEmptyStats(): WordleStats {
  return {
    completedPuzzles: {},
    currentStreak: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0],
    lastCompletedPuzzleNumber: null,
    maxStreak: 0,
    played: 0,
    wins: 0
  };
}

export async function loadWordleProgress(key: string) {
  const value = await AsyncStorage.getItem(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as WordleProgress;
  } catch {
    return null;
  }
}

export async function saveWordleProgress(key: string, progress: WordleProgress) {
  await AsyncStorage.setItem(key, JSON.stringify(progress));
}

export async function loadWordleStats() {
  const value = await AsyncStorage.getItem(STATS_KEY);

  if (!value) {
    return createEmptyStats();
  }

  try {
    return { ...createEmptyStats(), ...(JSON.parse(value) as WordleStats) };
  } catch {
    return createEmptyStats();
  }
}

export async function recordWordleCompletion(
  puzzleNumber: number,
  won: boolean,
  guesses: number,
  submittedGuesses: string[] = [],
  onScoreResult?: (freshUser: AuthUser) => void
) {
  const stats = await loadWordleStats();
  const puzzleKey = String(puzzleNumber);

  if (stats.completedPuzzles[puzzleKey]) {
    return stats;
  }

  const continuesStreak = stats.lastCompletedPuzzleNumber === puzzleNumber - 1;
  const currentStreak = won ? (continuesStreak ? stats.currentStreak + 1 : 1) : 0;
  const guessDistribution = [...stats.guessDistribution];

  if (won && guesses >= 1 && guesses <= 6) {
    guessDistribution[guesses - 1] += 1;
  }

  const nextStats: WordleStats = {
    completedPuzzles: {
      ...stats.completedPuzzles,
      [puzzleKey]: {
        completedAt: new Date().toISOString(),
        guesses,
        won
      }
    },
    currentStreak,
    guessDistribution,
    lastCompletedPuzzleNumber: puzzleNumber,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
    played: stats.played + 1,
    wins: stats.wins + (won ? 1 : 0)
  };

  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(nextStats));

  // Submit score and immediately propagate the fresh user back to the caller
  submitScore({
    attempts: guesses,
    gameId: "wordle",
    guesses: submittedGuesses,
    completionMethod: won ? "solved" : "lost",
    mode: "daily",
    puzzleKey,
    won
  })
    .then((result) => {
      if (result?.user && onScoreResult) {
        onScoreResult(result.user);
      }
    })
    .catch(() => {});

  return nextStats;
}
