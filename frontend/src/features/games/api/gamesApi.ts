import { GameItem } from "@/entities/game/types";
import { requestJson } from "@/shared/api/client";

export async function fetchGames() {
  const response = await requestJson<GameItem[]>("/games", { auth: false });

  return response.data;
}

export async function fetchGameContent<T>(gameId: string) {
  const response = await requestJson<T>(`/games/${gameId}/content`, { auth: false });

  return response.data;
}
