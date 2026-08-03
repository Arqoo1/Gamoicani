import { useMemo, useState } from "react";
import { useRouter } from "expo-router";

import { useSocket } from "@/application/providers/socket";
import { useAuth } from "@/application/providers/auth";
import { useGeorgianWebKeyboard } from "@/shared/hooks/useGeorgianWebKeyboard";
import { useMultiplayerRouteParams } from "@/features/multiplayer/hooks/useMultiplayerRouteParams";
import { useMultiplayerTurnState } from "@/features/multiplayer/hooks/useMultiplayerTurnState";
import { useMultiplayerWordState } from "@/features/multiplayer/hooks/useMultiplayerWordState";
import { useMultiplayerEmotes } from "@/features/multiplayer/hooks/useMultiplayerEmotes";
import { useMultiplayerActions } from "@/features/multiplayer/hooks/useMultiplayerActions";
import { useMultiplayerSocketEvents } from "@/features/multiplayer/hooks/useMultiplayerSocketEvents";

export type { GuessResultEntry, TileStatus } from "@/features/multiplayer/hooks/multiplayerGameTypes";

export function useMultiplayerGameLogic() {
  const router = useRouter();
  const { activePlayerId: initialActivePlayer, gameType, puzzle, roomId } = useMultiplayerRouteParams();
  const wordLength = Math.max(1, Math.min(12, Number((puzzle as { wordLength?: number })?.wordLength) || 5));
  const missingWordsCount = Math.max(
    1,
    Number((puzzle as { missingWordsCount?: number })?.missingWordsCount) || 1
  );
  const { socket, opponentProfile } = useSocket();
  const { user } = useAuth();

  const wordState = useMultiplayerWordState({ missingWordsCount, wordLength });
  const turnState = useMultiplayerTurnState({ initialActivePlayerId: initialActivePlayer });
  const emotes = useMultiplayerEmotes(roomId, socket);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [results, setResults] = useState<Record<string, unknown> | null>(null);
  const [isShifted, setIsShifted] = useState(false);

  useMultiplayerSocketEvents(
    {
      gameType,
      socket,
      startTimer: turnState.startTimer,
      stopTimer: turnState.stopTimer,
      userId: user?.id,
      wordLength,
    },
    {
      appendAndazebiTimeout: wordState.appendAndazebiTimeout,
      appendWordleTimeout: wordState.appendWordleTimeout,
      onGameOver: (data) => {
        setGameOver(true);
        setResults(data);
      },
      onGuessResult: (entry) => wordState.setGuessResults((prev) => [...prev, entry]),
      onOpponentGuess: (entry) => wordState.setOpponentProgress((prev) => [...prev, entry]),
      onReceiveEmote: emotes.receiveEmote,
      setActivePlayerId: turnState.setActivePlayerId,
    }
  );

  const baseActions = useMultiplayerActions(
    {
      activeInputIndex: wordState.activeInputIndex,
      andazebiAnswers: wordState.andazebiAnswers,
      currentGuess: wordState.currentGuess,
      gameOver,
      gameType,
      isShifted,
      missingWordsCount,
      roomId,
      socket,
      waitingForOpponent: turnState.waitingForOpponent,
      wordLength,
    },
    {
      resetAndazebiAnswers: wordState.resetAndazebiAnswers,
      setActiveInputIndex: wordState.setActiveInputIndex,
      setAndazebiAnswers: wordState.setAndazebiAnswers,
      setCurrentGuess: wordState.setCurrentGuess,
      setGuesses: wordState.setGuesses,
      setIsShifted,
      setLeaveModalOpen,
    }
  );

  const handleBackPress = () => {
    if (gameOver) router.replace("/lobby");
    else setLeaveModalOpen(true);
  };

  const confirmLeave = () => {
    socket?.emit("forfeit");
    router.replace("/lobby");
  };

  useGeorgianWebKeyboard({
    disabled: gameOver || turnState.waitingForOpponent,
    onKeyPress: baseActions.handleKey,
  });

  const didWin = results?.result === "won";
  const didDraw = results?.result === "draw";
  const gameTitle = useMemo(
    () => (gameType === "wordle" ? "სიტყვობანა" : gameType === "andazebi" ? "ანდაზები" : "მატჩი"),
    [gameType]
  );

  return {
    activeInputIndex: wordState.activeInputIndex,
    andazebiAnswers: wordState.andazebiAnswers,
    confirmLeave,
    currentGuess: wordState.currentGuess,
    didDraw,
    didWin,
    emotePickerOpen: emotes.emotePickerOpen,
    gameOver,
    gameTitle,
    gameType,
    guessResults: wordState.guessResults,
    guesses: wordState.guesses,
    handleBackPress,
    handleKey: baseActions.handleKey,
    isShifted,
    leaveModalOpen,
    myEmote: emotes.myEmote,
    myOp: emotes.myOp,
    myY: emotes.myY,
    oppEmote: emotes.oppEmote,
    oppOp: emotes.oppOp,
    oppY: emotes.oppY,
    opponentProfile,
    opponentProgress: wordState.opponentProgress,
    puzzle,
    results,
    router,
    sendEmote: emotes.sendEmote,
    setActiveInputIndex: wordState.setActiveInputIndex,
    setEmotePickerOpen: emotes.setEmotePickerOpen,
    setLeaveModalOpen,
    submitGuess: baseActions.submitGuess,
    timeLeft: turnState.timeLeft,
    waitingForOpponent: turnState.waitingForOpponent,
    wordLength,
    ANDAZEBI_ATTEMPTS: 5,
  };
}
