import { useEffect } from "react";

import type { AppSocket } from "@/application/providers/socket";
import type { GameOverPayload, GuessResultPayload, OpponentGuessPayload, ServerToClientEvents } from "@/shared/api/socket.types";
import type { GuessResultEntry, TileStatus } from "@/features/multiplayer/hooks/multiplayerGameTypes";

type Params = {
  gameType: "wordle" | "andazebi" | string;
  socket: AppSocket | null;
  startTimer: () => void;
  stopTimer: () => void;
  userId: string | undefined;
  wordLength: number;
};

type Handlers = {
  appendAndazebiTimeout: () => void;
  appendWordleTimeout: () => void;
  onGameOver: (data: GameOverPayload) => void;
  onGuessResult: (entry: GuessResultEntry) => void;
  onOpponentGuess: (entry: GuessResultEntry) => void;
  onReceiveEmote: (emote: string) => void;
  setActivePlayerId: (id: string | null) => void;
};

function getTiles(data: unknown): TileStatus[] {
  if (Array.isArray(data)) return data as TileStatus[];
  const record = data as Record<string, unknown>;
  return Array.isArray(record?.tiles) ? (record.tiles as TileStatus[]) : [];
}

export function useMultiplayerSocketEvents(params: Params, handlers: Handlers) {
  useEffect(() => {
    if (!params.socket) return;

    const onGuessResult: ServerToClientEvents["guess-result"] = (data) => {
      handlers.onGuessResult(params.gameType === "wordle" ? getTiles(data) : data.isCorrect ? "correct" : "wrong");
    };

    const onOpponentGuess: ServerToClientEvents["opponent-guess"] = (data) => {
      handlers.onOpponentGuess(params.gameType === "wordle" ? getTiles(data) : data.isCorrect ? "correct" : "wrong");
    };

    const onGameOver: ServerToClientEvents["game-over"] = (data) => {
      handlers.onGameOver(data);
    };

    const onTurnTimeout: ServerToClientEvents["turn-timeout"] = () => {
      params.stopTimer();
      if (params.gameType === "wordle") handlers.appendWordleTimeout();
      else handlers.appendAndazebiTimeout();
    };

    const onReceiveEmote: ServerToClientEvents["receive-emote"] = (data) => {
      handlers.onReceiveEmote(data.emote);
    };

    const onGameStart: ServerToClientEvents["game-start"] = (data) => {
      handlers.setActivePlayerId(data.activePlayerId ?? null);
      if (params.userId && data.activePlayerId === params.userId) params.startTimer();
      else params.stopTimer();
    };

    const onTurnChanged: ServerToClientEvents["turn-changed"] = (data) => {
      handlers.setActivePlayerId(data.activePlayerId);
      if (params.userId && data.activePlayerId === params.userId) params.startTimer();
      else params.stopTimer();
    };

    params.socket.on("game-start", onGameStart);
    params.socket.on("turn-changed", onTurnChanged);
    params.socket.on("guess-result", onGuessResult);
    params.socket.on("turn-timeout", onTurnTimeout);
    params.socket.on("opponent-guess", onOpponentGuess);
    params.socket.on("game-over", onGameOver);
    params.socket.on("receive-emote", onReceiveEmote);

    return () => {
      params.socket?.off("guess-result", onGuessResult);
      params.socket?.off("opponent-guess", onOpponentGuess);
      params.socket?.off("game-over", onGameOver);
      params.socket?.off("receive-emote", onReceiveEmote);
      params.socket?.off("turn-timeout", onTurnTimeout);
      params.socket?.off("game-start", onGameStart);
      params.socket?.off("turn-changed", onTurnChanged);
      params.stopTimer();
    };
  }, [handlers, params]);
}
