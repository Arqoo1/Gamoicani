import type { AppSocket } from "@/application/providers/socket";
import { playBuzz, playChime, playPop } from "@/shared/services/sound";
import { triggerInvalidHaptic, triggerSelectionHaptic } from "@/shared/services/haptics";
import { BACKSPACE_KEY, SHIFTED_GEORGIAN_KEYS } from "@/shared/constants/georgianKeyboard";

type Params = {
  activeInputIndex: number;
  andazebiAnswers: string[];
  currentGuess: string;
  gameOver: boolean;
  gameType: "wordle" | "andazebi" | string;
  isShifted: boolean;
  missingWordsCount: number;
  roomId: string;
  socket: AppSocket | null;
  waitingForOpponent: boolean;
  wordLength: number;
};

export function useMultiplayerActions(
  params: Params,
  deps: {
    setActiveInputIndex: (index: number) => void;
    setAndazebiAnswers: (updater: (prev: string[]) => string[]) => void;
    setCurrentGuess: (updater: (prev: string) => string) => void;
    setGameOverState?: never;
    setGuesses: (updater: (prev: string[]) => string[]) => void;
    setIsShifted: (updater: (prev: boolean) => boolean) => void;
    setLeaveModalOpen: (value: boolean) => void;
    resetAndazebiAnswers: () => void;
  }
) {
  const submitGuess = () => {
    if (params.gameOver || params.waitingForOpponent) return;

    if (params.gameType === "wordle") {
      if (Array.from(params.currentGuess).length !== params.wordLength) {
        triggerInvalidHaptic();
        playBuzz();
        return;
      }
      playChime();
      params.socket?.emit("submit-guess", { roomId: params.roomId, guess: params.currentGuess.trim() });
      deps.setGuesses((prev) => [...prev, params.currentGuess.trim()]);
      deps.setCurrentGuess(() => "");
    } else {
      if (params.andazebiAnswers.some((ans) => ans.trim().length === 0)) {
        triggerInvalidHaptic();
        playBuzz();
        return;
      }
      playChime();
      const combinedGuess = params.andazebiAnswers.join(" ");
      params.socket?.emit("submit-guess", { roomId: params.roomId, guess: combinedGuess });
      deps.setGuesses((prev) => [...prev, combinedGuess]);
      deps.resetAndazebiAnswers();
    }

    deps.setIsShifted(() => false);
  };

  const handleKey = (key: string) => {
    if (params.gameOver) return;

    if (key === BACKSPACE_KEY) {
      triggerSelectionHaptic();
      if (params.gameType === "wordle") {
        deps.setCurrentGuess((prev) => Array.from(prev).slice(0, -1).join(""));
      } else {
        deps.setAndazebiAnswers((prev) => {
          const next = [...prev];
          next[params.activeInputIndex] = Array.from(next[params.activeInputIndex]).slice(0, -1).join("");
          return next;
        });
      }
    } else if (key === "ENTER") {
      triggerSelectionHaptic();
      submitGuess();
    } else if (key === "SHIFT") {
      triggerSelectionHaptic();
      deps.setIsShifted((prev) => !prev);
    } else {
      triggerSelectionHaptic();
      playPop();
      const actualKey = params.isShifted ? (SHIFTED_GEORGIAN_KEYS[key] ?? key) : key;
      if (params.gameType === "wordle") {
        if (Array.from(params.currentGuess).length >= params.wordLength) return;
        deps.setCurrentGuess((prev) => prev + actualKey);
      } else {
        deps.setAndazebiAnswers((prev) => {
          const next = [...prev];
          next[params.activeInputIndex] = next[params.activeInputIndex] + actualKey;
          return next;
        });
      }
      deps.setIsShifted(() => false);
    }
  };

  const handleBackPress = () => {
    deps.setLeaveModalOpen(true);
  };

  const confirmLeave = () => {
    params.socket?.emit("forfeit");
  };

  return { confirmLeave, handleBackPress, handleKey, submitGuess };
}
