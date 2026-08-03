import { Platform } from "react-native";
import { AuthUser } from "@/entities/user/types";
import { submitScore } from "@/features/scores/api/scoresApi";

export type Level = "easy" | "medium" | "hard";

export type ProverbItem = {
  answer: string;
  fullText: string;
  hint: string;
  hints?: string[];
  id: string;
  level: Level;
  missingWords: string[];
  prompt: string;
};

export type ProverbsJson = {
  gameId: string;
  items: ProverbItem[];
  title: string;
  version: number;
};

export type ResultState = "idle" | "wrong" | "correct";
export type GameMode = "daily" | "practice" | "tutorial" | null;
export type CompletionMethod = "solved" | "revealed" | "skipped";
export type WordStatus = "correct" | "wrong";
export type CompletedItem = {
  attempts: number;
  id: string;
  level: Level;
  method: CompletionMethod;
};
export type DailyProgress = {
  completedItems?: CompletedItem[];
  completedIds: string[];
  currentIndex: number;
  dateKey: string;
  finishedAt?: string;
};
export type AndazebiStats = {
  completedDates: string[];
  currentStreak: number;
  lastCompletedKey: string | null;
  maxStreak: number;
};
export const DAILY_LIMIT = 5;
export const DEFAULT_FEEDBACK = "შეავსე გამოტოვებული სიტყვები";
export const PROGRESS_STORAGE_KEY = "andazebi:daily-progress:v3";
export const STATS_STORAGE_KEY = "andazebi:stats:v2";
export const USE_NATIVE_ANIMATION_DRIVER = Platform.OS !== "web";

export const levelCopy: Record<Level, { label: string; words: string }> = {
  easy: {
    label: "მარტივი",
    words: "1 სიტყვა",
  },
  medium: {
    label: "საშუალო",
    words: "2 სიტყვა",
  },
  hard: {
    label: "რთული",
    words: "3 სიტყვა",
  },
};

export const levelEmoji: Record<Level, string> = {
  easy: "🟩",
  medium: "🟨",
  hard: "🟥",
};

export function createEmptyStats(): AndazebiStats {
  return {
    completedDates: [],
    currentStreak: 0,
    lastCompletedKey: null,
    maxStreak: 0,
  };
}

export function normalizeAnswer(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("ka-GE");
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getPreviousDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);

  return getLocalDateKey(date);
}

export function getDailyNumber(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const epoch = new Date(2026, 0, 1);
  const date = new Date(year, month - 1, day);
  const epochDay = new Date(epoch.getFullYear(), epoch.getMonth(), epoch.getDate()).getTime();
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  return Math.max(1, Math.floor((dateDay - epochDay) / (24 * 60 * 60 * 1000)) + 1);
}

function getSeed(value: string) {
  return Array.from(value).reduce((seed, letter) => {
    return (seed * 31 + letter.charCodeAt(0)) >>> 0;
  }, 2166136261);
}

function createSeededRandom(seed: number) {
  let state = seed || 1;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function getDailyItems(sourceItems: ProverbItem[], dateKey: string) {
  const random = createSeededRandom(getSeed(dateKey));
  const shuffledItems = [...sourceItems];

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const item = shuffledItems[index];
    shuffledItems[index] = shuffledItems[swapIndex];
    shuffledItems[swapIndex] = item;
  }

  return shuffledItems.slice(0, Math.min(DAILY_LIMIT, shuffledItems.length));
}

export function getRandomPracticeItem(sourceItems: ProverbItem[], excludeId?: string) {
  if (sourceItems.length <= 1) {
    return sourceItems[0] ?? null;
  }

  let nextItem = sourceItems[Math.floor(Math.random() * sourceItems.length)] ?? sourceItems[0];

  if (nextItem?.id === excludeId) {
    nextItem = sourceItems[(sourceItems.findIndex((item) => item.id === excludeId) + 1) % sourceItems.length];
  }

  return nextItem ?? null;
}

export function getHintText(item: ProverbItem, hintLevel: number) {
  if (hintLevel <= 0) {
    return "";
  }

  const hints = item.hints?.length ? item.hints : [item.hint];

  if (hintLevel === 1) {
    return hints[0] ?? item.hint;
  }

  return `სიტყვები იწყება: ${item.missingWords.map((word) => Array.from(word)[0]).join(", ")}`;
}

export function getHintButtonText(hintLevel: number) {
  if (hintLevel === 0) {
    return "მინიშნება";
  }

  if (hintLevel === 1) {
    return "მეტი მინიშნება";
  }

  return "მინიშნების დამალვა";
}

export async function reportProverbCompletion(
  item: ProverbItem,
  dateKey: string,
  attempts: number,
  method: CompletionMethod,
  onScoreResult?: (freshUser: AuthUser) => void
) {
  try {
    const result = await submitScore({
      attempts,
      completionMethod: method,
      gameId: "andazebi",
      itemId: item.id,
      level: item.level,
      metadata: {
        itemId: item.id,
      },
      mode: "daily",
      puzzleKey: `${dateKey}:${item.id}`,
      streakKey: dateKey,
      won: method === "solved",
    });

    if (result.user && onScoreResult) {
      onScoreResult(result.user);
    }
  } catch (err) {
    console.warn(
      "[reportProverbCompletion] failed to submit score:",
      err instanceof Error ? err.message : err
    );
  }
}
