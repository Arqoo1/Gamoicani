import AsyncStorage from "@react-native-async-storage/async-storage";

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
  guesses: number
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

  return nextStats;
}
