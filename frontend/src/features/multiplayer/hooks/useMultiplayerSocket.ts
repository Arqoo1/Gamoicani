import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import { useSocket } from "@/application/providers/socket";

function triggerFloat(animY: Animated.Value, animOp: Animated.Value, onDone: () => void) {
  animY.setValue(0);
  animOp.setValue(1);
  Animated.parallel([
    Animated.timing(animY, { toValue: -60, duration: 1700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    Animated.timing(animOp, { toValue: 0, duration: 1700, delay: 700, useNativeDriver: true }),
  ]).start(onDone);
}

function getTiles(data: unknown): string[] {
  if (Array.isArray(data)) return data as string[];
  const d = data as Record<string, unknown>;
  return Array.isArray(d?.tiles) ? (d.tiles as string[]) : [];
}

type GuessResultPayload = {
  isCorrect?: boolean;
  tiles?: string[];
};

export interface MultiplayerSocketCallbacks {
  onActivePlayerChanged?: (activePlayerId: string | null) => void;
  onTurnTimeout?: (wordLength: number) => void;
}

export function useMultiplayerSocket(
  gameType: string,
  roomId: string,
  wordLength: number,
  callbacks: MultiplayerSocketCallbacks = {}
) {
  const { socket } = useSocket();

  const [guessResults,     setGuessResults]     = useState<Array<string[] | "correct" | "wrong">>([]);
  const [opponentProgress, setOpponentProgress] = useState<Array<string[] | "correct" | "wrong">>([]);
  const [gameOver,         setGameOver]         = useState(false);
  const [results,          setResults]          = useState<Record<string, unknown> | null>(null);

  const [oppEmote, setOppEmote] = useState<string | null>(null);
  const oppY  = useRef(new Animated.Value(0)).current;
  const oppOp = useRef(new Animated.Value(0)).current;

  const [myEmote, setMyEmote] = useState<string | null>(null);
  const myY  = useRef(new Animated.Value(0)).current;
  const myOp = useRef(new Animated.Value(0)).current;

  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    if (!socket) return;

    const onGuessResult = (data: GuessResultPayload) => {
      if (gameType === "wordle") {
        setGuessResults((prev) => [...prev, getTiles(data)]);
      } else {
        setGuessResults((prev) => [...prev, data.isCorrect ? "correct" : "wrong"]);
      }
    };

    const onOpponentGuess = (data: GuessResultPayload) => {
      if (gameType === "wordle") {
        setOpponentProgress((prev) => [...prev, getTiles(data)]);
      } else {
        setOpponentProgress((prev) => [...prev, data.isCorrect ? "correct" : "wrong"]);
      }
    };

    const onGameOver = (data: Record<string, unknown>) => {
      setGameOver(true);
      setResults(data);
    };

    const onReceiveEmote = (data: { playerId: string; emote: string }) => {
      setOppEmote(data.emote);
      triggerFloat(oppY, oppOp, () => setOppEmote(null));
    };

    const onGameStart = (data: { activePlayerId?: string }) => {
      const id = data.activePlayerId ?? null;
      callbacksRef.current.onActivePlayerChanged?.(id);
    };

    const onTurnChanged = (data: { activePlayerId: string }) => {
      callbacksRef.current.onActivePlayerChanged?.(data.activePlayerId);
    };

    const onTurnTimeout = () => {
      callbacksRef.current.onTurnTimeout?.(wordLength);
      if (gameType === "wordle") {
        setGuessResults((prev) => [...prev, Array(wordLength).fill("absent")]);
      } else {
        setGuessResults((prev) => [...prev, "wrong"]);
      }
    };

    socket.on("guess-result",   onGuessResult);
    socket.on("opponent-guess", onOpponentGuess);
    socket.on("game-over",      onGameOver);
    socket.on("receive-emote",  onReceiveEmote);
    socket.on("game-start",     onGameStart);
    socket.on("turn-changed",   onTurnChanged);
    socket.on("turn-timeout",   onTurnTimeout);

    return () => {
      socket.off("guess-result",   onGuessResult);
      socket.off("opponent-guess", onOpponentGuess);
      socket.off("game-over",      onGameOver);
      socket.off("receive-emote",  onReceiveEmote);
      socket.off("game-start",     onGameStart);
      socket.off("turn-changed",   onTurnChanged);
      socket.off("turn-timeout",   onTurnTimeout);
    };
  }, [socket, gameType, wordLength, oppY, oppOp]);

  const sendEmote = useCallback(
    (emote: string) => {
      if (!socket) return;
      socket.emit("send-emote", { emoteId: emote, roomId });
      setMyEmote(emote);
      triggerFloat(myY, myOp, () => setMyEmote(null));
    },
    [socket, roomId, myY, myOp]
  );

  const submitGuess = useCallback(
    (guess: string) => {
      if (!socket) return;
      socket.emit("submit-guess", { guess, roomId });
    },
    [socket, roomId]
  );

  const forfeitMatch = useCallback(() => {
    if (socket) socket.emit("forfeit");
  }, [socket]);

  return {
    forfeitMatch,
    gameOver,
    guessResults,
    myEmote,
    myOp,
    myY,
    oppEmote,
    oppOp,
    oppY,
    opponentProgress,
    results,
    sendEmote,
    submitGuess,
  };
}
