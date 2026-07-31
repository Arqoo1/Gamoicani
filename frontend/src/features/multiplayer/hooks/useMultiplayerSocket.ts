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

export function useMultiplayerSocket(gameType: string, roomId: string) {
  const { socket } = useSocket();

  const [guessResults, setGuessResults] = useState<any[]>([]);
  const [opponentProgress, setOpponentProgress] = useState<any[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [results, setResults] = useState<Record<string, unknown> | null>(null);

  const [oppEmote, setOppEmote] = useState<string | null>(null);
  const oppY = useRef(new Animated.Value(0)).current;
  const oppOp = useRef(new Animated.Value(0)).current;

  const [myEmote, setMyEmote] = useState<string | null>(null);
  const myY = useRef(new Animated.Value(0)).current;
  const myOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!socket) return;

    const onGuessResult = (data: any) => {
      if (gameType === "wordle") {
        setGuessResults((prev) => [...prev, getTiles(data)]);
      } else {
        setGuessResults((prev) => [...prev, data.isCorrect ? "correct" : "wrong"]);
      }
    };

    const onOpponentGuess = (data: any) => {
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

    socket.on("guess-result", onGuessResult);
    socket.on("opponent-guess", onOpponentGuess);
    socket.on("game-over", onGameOver);
    socket.on("receive-emote", onReceiveEmote);

    return () => {
      socket.off("guess-result", onGuessResult);
      socket.off("opponent-guess", onOpponentGuess);
      socket.off("game-over", onGameOver);
      socket.off("receive-emote", onReceiveEmote);
    };
  }, [socket, gameType, oppY, oppOp]);

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
