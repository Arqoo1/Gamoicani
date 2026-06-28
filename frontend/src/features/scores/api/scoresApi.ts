import { GameSummary } from "@/entities/game/types";
import { ScorePayload, ScoreResult } from "@/entities/score/types";
import { requestJson } from "@/shared/api/client";

export async function submitScore(payload: ScorePayload) {
  try {
    const response = await requestJson<ScoreResult>("/scores", {
      body: JSON.stringify(payload),
      method: "POST"
    });

    return response.data;
  } catch {
    return null;
  }
}

export async function fetchMyGameSummary(gameId: string) {
  const response = await requestJson<GameSummary>(`/scores/me/${gameId}`);

  return response.data;
}
