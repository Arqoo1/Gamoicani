import { AuthUser } from "@/entities/user/types";
import { GameSummary } from "@/entities/game/types";
import { ScorePayload, ScoreResult } from "@/entities/score/types";
import { requestJson } from "@/shared/api/client";
import { enqueueScore } from "@/shared/storage/scoreOutbox";

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

export class ScoreSyncError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "ScoreSyncError";
    if (options?.cause !== undefined) {
      (this as unknown as { cause: unknown }).cause = options.cause;
    }
  }
}

export async function submitScoreToServer(payload: ScorePayload): Promise<ScoreResult> {
  const response = await requestJson<ScoreResult>("/scores", {
    body: JSON.stringify(payload),
    method: "POST",
  });

  return response.data;
}

export async function submitScore(payload: ScorePayload): Promise<ScoreResult | null> {
  try {
    return await submitScoreToServer(payload);
  } catch (err) {
    await enqueueScore(payload);
    throw new ScoreSyncError(
      err instanceof Error ? err.message : "Score sync failed",
      { cause: err }
    );
  }
}

export async function repairStats(completions: RepairCompletion[]) {
  try {
    const response = await requestJson<RepairResult>("/scores/repair", {
      body: JSON.stringify({ completions }),
      method: "POST",
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
