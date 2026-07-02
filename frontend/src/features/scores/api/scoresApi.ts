import { AuthUser } from "@/entities/user/types";
import { GameSummary } from "@/entities/game/types";
import { ScorePayload, ScoreResult } from "@/entities/score/types";
import { requestJson } from "@/shared/api/client";

export type RepairCompletion = {
  attempts: number;
  completedAt: string;
  guesses: string[];
  puzzleKey: string;
  won: boolean;
};

export type RepairResult = {
  created: number;
  replayedEvents: number;
  user: AuthUser;
};

export async function submitScore(payload: ScorePayload) {
  try {
    const response = await requestJson<ScoreResult>("/scores", {
      body: JSON.stringify(payload),
      method: "POST"
    });

    return response.data;
  } catch (err) {
    console.warn("[submitScore] failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function repairStats(completions: RepairCompletion[]) {
  try {
    const response = await requestJson<RepairResult>("/scores/repair", {
      body: JSON.stringify({ completions }),
      method: "POST"
    });

    return response.data;
  } catch (err) {
    console.warn("[repairStats] failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function fetchMyGameSummary(gameId: string) {
  const response = await requestJson<GameSummary>(`/scores/me/${gameId}`);

  return response.data;
}
