import { UserAchievement } from "@/entities/user/types";

export type GameItem = {
  contentPath?: string | null;
  gameId?: string;
  href?: string | null;
  id?: string;
  status: "ready" | "soon";
  subtitle: string;
  title: string;
};

export type GameSummary = {
  achievements: UserAchievement[];
  completedPuzzles: Record<
    string,
    {
      completedAt: string;
      guesses: number;
      won: boolean;
    }
  >;
  currentStreak: number;
  dailyResults: Record<
    string,
    {
      completedAt: string;
      correctCount: number;
      points: number;
      totalQuestions: number;
      won: boolean;
    }
  >;
  gameId: string;
  guessDistribution: number[];
  lastCompletedKey: string | null;
  maxStreak: number;
  played: number;
  points: number;
  wins: number;
};
