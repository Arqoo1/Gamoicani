import { useMemo } from "react";
import { useLocalSearchParams } from "expo-router";

import { MultiplayerPuzzle } from "@/shared/api/socket.types";
import { useMultiplayerSession } from "@/features/multiplayer/model/multiplayerSession";

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

  let sessionPuzzle: MultiplayerPuzzle | null = null;
  let sessionActivePlayerId: string | null = null;
  let sessionGameType: string | null = null;
  let sessionRoomId: string | null = null;

  try {
    const sessionCtx = useMultiplayerSession();
    if (sessionCtx.session) {
      sessionPuzzle = sessionCtx.session.puzzle;
      sessionActivePlayerId = sessionCtx.session.activePlayerId;
      sessionGameType = sessionCtx.session.gameType;
      sessionRoomId = sessionCtx.session.roomId;
    }
  } catch {
    // Fallback if rendered outside provider
  }

  const puzzleParam = useMemo(() => parsePuzzleParam(params.puzzle), [params.puzzle]);
  const puzzle = sessionPuzzle ?? puzzleParam;

  return {
    activePlayerId: sessionActivePlayerId ?? firstParam(params.activePlayerId) ?? null,
    gameType: sessionGameType ?? firstParam(params.gameType) ?? "wordle",
    puzzle,
    roomId: sessionRoomId ?? firstParam(params.roomId) ?? "",
  };
}
