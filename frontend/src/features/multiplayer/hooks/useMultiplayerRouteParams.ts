import { useMemo } from "react";
import { useLocalSearchParams } from "expo-router";

import { MultiplayerPuzzle } from "@/shared/api/socket.types";

type RouteParam = string | string[] | undefined;
export type RouteMultiplayerPuzzle = MultiplayerPuzzle & {
  gameType?: string;
  hint?: string | null;
  missingWordsCount?: number;
  prompt?: string | null;
  validWords?: string[];
  wordLength?: number;
};

function firstParam(value: RouteParam) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePuzzleParam(value: RouteParam): RouteMultiplayerPuzzle | null {
  const raw = firstParam(value);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RouteMultiplayerPuzzle;
  } catch {
    return null;
  }
}

export function useMultiplayerRouteParams() {
  const params = useLocalSearchParams<{
    activePlayerId?: RouteParam;
    gameType?: RouteParam;
    puzzle?: RouteParam;
    roomId?: RouteParam;
  }>();

  const puzzle = useMemo(() => parsePuzzleParam(params.puzzle), [params.puzzle]);

  return {
    activePlayerId: firstParam(params.activePlayerId) || null,
    gameType: firstParam(params.gameType) ?? "wordle",
    puzzle,
    roomId: firstParam(params.roomId) ?? "",
  };
}
