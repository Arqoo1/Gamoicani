import { AuthUser } from "@/entities/user/types";

export type ScorePayload = {
  attempts?: number;
  clientEventId?: string;
  completionMethod?: "solved" | "lost" | "revealed" | "skipped";
  gameId: string;
  guesses?: string[];
  itemId?: string;
  level?: "easy" | "medium" | "hard";
  metadata?: Record<string, unknown>;
  mode?: "daily" | "practice";
  puzzleKey?: string;
  streakKey?: string;
  won: boolean;
};

export type ScoreResult = {
  duplicate: boolean;
  event: {
    completionMethod: string;
    gameId: string;
    mode: string;
    points: number;
    puzzleKey: string | null;
    streakKey: string | null;
    won: boolean;
  };
  user: AuthUser;
};

export type LeaderboardEntry = {
  displayName: string;
  gameId?: string;
  metric?: string;
  points?: number;
  rank: number;
  streak?: number;
  totalPoints?: number;
  username: string;
  wins?: number;
};

export type MyLeaderboardRanks = {
  andazebi: {
    points: number;
    pointsRank: number | null;
    streak: number;
    streakRank: number | null;
  };
  global: {
    rank: number | null;
    totalPoints: number;
  };
  wordle: {
    points: number;
    pointsRank: number | null;
    streak: number;
    streakRank: number | null;
  };
  trivia: {
    points: number;
    pointsRank: number | null;
    streak: number;
    streakRank: number | null;
  };
};
