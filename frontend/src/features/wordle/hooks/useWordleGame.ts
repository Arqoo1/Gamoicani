import { useCallback, useEffect, useReducer, useRef } from "react";
import { triggerInvalidHaptic, triggerSelectionHaptic } from "@/shared/services/haptics";
import { loadWordleProgress, recordWordleCompletion, saveWordleProgress, getProgressKey } from "@/features/wordle/model/storage";
import { GameStatus, getDailyPuzzleNumber, isFilledWord, splitWord, WORDLE_EPOCH } from "@/features/wordle/model/wordle";
import { DEFAULT_MESSAGE, getStatusMessage, MAX_GUESSES, triggerCompletionHaptic, WORD_LENGTH, WordsJson } from "@/features/wordle/model/screenModel";
import { BACKSPACE_KEY, ENTER_KEY, GEORGIAN_LETTERS, SHIFT_KEY, QWERTY_TO_GEORGIAN, SHIFTED_QWERTY_TO_GEORGIAN } from "@/shared/constants/georgianKeyboard";
import { Platform } from "react-native";
import { AuthUser } from "@/entities/user/types";

type GameMode = "daily" | "practice" | "tutorial" | null;

type GameState = {
  answerOffset: number;
  currentLetters: string[];
  gameStatus: GameStatus;
  guesses: string[];
  isHydrated: boolean;
  isShifted: boolean;
  message: string;
  toast: string | null;
  recordedCompletionKey: string | null;
};

type GameAction =
  | { type: "HYDRATE"; payload: { guesses: string[]; currentLetters: string[]; gameStatus: GameStatus; message: string } }
  | { type: "SET_HYDRATED_FALSE" }
  | { type: "TYPE_LETTER"; payload: string }
  | { type: "BACKSPACE" }
  | { type: "TOGGLE_SHIFT" }
  | { type: "SET_SHIFT"; payload: boolean }
  | { type: "SUBMIT_GUESS_SUCCESS"; payload: { guess: string; isWin: boolean; isLoss: boolean; answer: string; tutorialMessage?: string } }
  | { type: "SET_MESSAGE"; payload: string }
  | { type: "SHOW_TOAST"; payload: string }
  | { type: "HIDE_TOAST" }
  | { type: "RESET_BOARD"; payload: { nextOffset: number } }
  | { type: "SET_RECORDED_KEY"; payload: string | null };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, ...action.payload, isHydrated: true };
    case "SET_HYDRATED_FALSE":
      return { ...state, isHydrated: false, recordedCompletionKey: null };
    case "TYPE_LETTER":
      if (state.gameStatus !== "playing" || state.currentLetters.length >= WORD_LENGTH) return state;
      return { ...state, currentLetters: [...state.currentLetters, action.payload], isShifted: false };
    case "BACKSPACE":
      if (state.gameStatus !== "playing") return state;
      return { ...state, currentLetters: state.currentLetters.slice(0, -1) };
    case "TOGGLE_SHIFT":
      return { ...state, isShifted: !state.isShifted };
    case "SET_SHIFT":
      return { ...state, isShifted: action.payload };
    case "SUBMIT_GUESS_SUCCESS": {
      const nextGuesses = [...state.guesses, action.payload.guess];
      let status = state.gameStatus;
      let msg = DEFAULT_MESSAGE;
      if (action.payload.isWin) {
        status = "won";
        msg = `მოიგე ${nextGuesses.length}/6`;
      } else if (action.payload.isLoss) {
        status = "lost";
        msg = `სიტყვა იყო ${action.payload.answer}`;
      } else if (action.payload.tutorialMessage) {
        msg = action.payload.tutorialMessage;
      }
      return {
        ...state,
        guesses: nextGuesses,
        currentLetters: [],
        gameStatus: status,
        message: msg,
        toast: action.payload.isWin || action.payload.isLoss ? msg : state.toast,
      };
    }
    case "SET_MESSAGE":
      return { ...state, message: action.payload };
    case "SHOW_TOAST":
      return { ...state, toast: action.payload, message: action.payload };
    case "HIDE_TOAST":
      return { ...state, toast: null };
    case "RESET_BOARD":
      return {
        ...state,
        answerOffset: action.payload.nextOffset,
        guesses: [],
        currentLetters: [],
        gameStatus: "playing",
        message: DEFAULT_MESSAGE,
        isShifted: false,
        recordedCompletionKey: null,
      };
    case "SET_RECORDED_KEY":
      return { ...state, recordedCompletionKey: action.payload };
    default:
      return state;
  }
}

const initialState: GameState = {
  answerOffset: 0,
  currentLetters: [],
  gameStatus: "playing",
  guesses: [],
  isHydrated: false,
  isShifted: false,
  message: DEFAULT_MESSAGE,
  toast: null,
  recordedCompletionKey: null,
};

export function useWordleGame(
  gameMode: GameMode,
  wordData: WordsJson,
  user: AuthUser | null,
  updateUser: (u: AuthUser) => void,
  onResultModal: () => void,
  shakeCurrentRow: () => void,
  confettiStart: () => void
) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dailyPuzzleNumber = getDailyPuzzleNumber(WORDLE_EPOCH);

  const answers = wordData.answers.filter((w) => splitWord(w).length === WORD_LENGTH);
  const validWords = new Set([...wordData.answers, ...wordData.validWords].map((w) => w.trim()).filter((w) => splitWord(w).length === WORD_LENGTH));
  
  const dailyAnswerIndex = answers.length > 0 ? (dailyPuzzleNumber - 1) % answers.length : 0;
  const answer = gameMode === "tutorial" ? "სახლი" : (answers[(dailyAnswerIndex + state.answerOffset) % answers.length] ?? "სახლი");
  const puzzleNumber = dailyPuzzleNumber + state.answerOffset;
  const progressKey = getProgressKey(puzzleNumber, answer);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    dispatch({ type: "SHOW_TOAST", payload: msg });
    toastTimer.current = setTimeout(() => dispatch({ type: "HIDE_TOAST" }), 1600);
  }, []);

  const showInvalidGuess = useCallback((msg: string) => {
    triggerInvalidHaptic();
    showToast(msg);
    shakeCurrentRow();
  }, [shakeCurrentRow, showToast]);

  const resetBoard = useCallback((nextOffset: number) => {
    dispatch({ type: "RESET_BOARD", payload: { nextOffset } });
  }, []);

  const startRandomPuzzle = useCallback(() => {
    if (answers.length <= 1) return resetBoard(0);
    const currentAnswerIndex = (dailyAnswerIndex + state.answerOffset) % answers.length;
    let randomAnswerIndex = Math.floor(Math.random() * answers.length);
    if (randomAnswerIndex === currentAnswerIndex) {
      randomAnswerIndex = (randomAnswerIndex + 1) % answers.length;
    }
    resetBoard(randomAnswerIndex - dailyAnswerIndex);
  }, [answers.length, dailyAnswerIndex, state.answerOffset, resetBoard]);

  useEffect(() => {
    let active = true;
    dispatch({ type: "SET_HYDRATED_FALSE" });

    loadWordleProgress(progressKey).then((progress) => {
      if (!active) return;
      if (progress?.answer === answer) {
        dispatch({
          type: "HYDRATE",
          payload: {
            guesses: progress.guesses,
            currentLetters: progress.gameStatus === "playing" ? progress.currentLetters : [],
            gameStatus: progress.gameStatus,
            message: getStatusMessage(progress.gameStatus, answer, progress.guesses.length)
          }
        });
      } else {
        dispatch({
          type: "HYDRATE",
          payload: {
            guesses: [],
            currentLetters: [],
            gameStatus: "playing",
            message: gameMode === "tutorial" ? "აკრიფეთ 'ხეობა'" : DEFAULT_MESSAGE
          }
        });
      }
    }).catch(() => {
      if (active) dispatch({ type: "HYDRATE", payload: { guesses: [], currentLetters: [], gameStatus: "playing", message: DEFAULT_MESSAGE } });
    });

    return () => { active = false; };
  }, [answer, progressKey, gameMode]);

  useEffect(() => {
    if (!state.isHydrated || gameMode === "practice" || gameMode === "tutorial") return;
    saveWordleProgress(progressKey, {
      answer,
      currentLetters: state.currentLetters,
      gameStatus: state.gameStatus,
      guesses: state.guesses,
      puzzleNumber,
      savedAt: new Date().toISOString()
    }).catch(() => {});
  }, [answer, state.currentLetters, gameMode, state.gameStatus, state.guesses, state.isHydrated, progressKey, puzzleNumber]);

  useEffect(() => {
    if (!state.isHydrated || state.gameStatus === "playing" || gameMode === "practice" || gameMode === "tutorial") return;
    const completionKey = `${puzzleNumber}:${answer}:${state.gameStatus}:${state.guesses.length}`;
    if (state.recordedCompletionKey === completionKey) return;
    
    dispatch({ type: "SET_RECORDED_KEY", payload: completionKey });
    recordWordleCompletion(puzzleNumber, state.gameStatus === "won", state.guesses.length, state.guesses, updateUser).catch(() => {
      dispatch({ type: "SET_RECORDED_KEY", payload: null });
    });
  }, [answer, gameMode, state.gameStatus, state.guesses, state.isHydrated, puzzleNumber, state.recordedCompletionKey, updateUser]);

  const submitGuess = useCallback(() => {
    if (state.gameStatus !== "playing") return;
    const guess = state.currentLetters.join("");

    if (!isFilledWord(guess, WORD_LENGTH)) {
      showInvalidGuess("სიტყვა მოკლეა");
      return;
    }

    if (gameMode === "tutorial") {
      if (state.guesses.length === 0 && guess !== "ხეობა") return showInvalidGuess("გთხოვთ აკრიფოთ 'ხეობა'");
      if (state.guesses.length === 1 && guess !== "ხალხი") return showInvalidGuess("გთხოვთ აკრიფოთ 'ხალხი'");
      if (state.guesses.length === 2 && guess !== "სახლი") return showInvalidGuess("გთხოვთ აკრიფოთ 'სახლი'");
    } else {
      if (!validWords.has(guess)) return showInvalidGuess("სიტყვა სიაში არ არის");
    }

    const nextGuesses = [...state.guesses, guess];
    const isWin = guess === answer;
    const isLoss = !isWin && nextGuesses.length === MAX_GUESSES;
    let tutorialMessage;

    if (gameMode === "tutorial" && !isWin && !isLoss) {
      if (nextGuesses.length === 1) tutorialMessage = "მწვანე 'ხ' სწორია! ახლა სცადეთ 'ხალხი'";
      else if (nextGuesses.length === 2) tutorialMessage = "ყვითელი 'ლ' სხვაგანაა. სცადეთ 'სახლი'";
    }

    dispatch({ type: "SUBMIT_GUESS_SUCCESS", payload: { guess, isWin, isLoss, answer, tutorialMessage } });

    if (isWin || isLoss) {
      triggerCompletionHaptic(isWin);
      if (isWin) confettiStart();
      onResultModal();
    }
  }, [state.gameStatus, state.currentLetters, state.guesses, gameMode, validWords, answer, showInvalidGuess, confettiStart, onResultModal]);

  const handleKeyPress = useCallback((key: string) => {
    if (key === ENTER_KEY) {
      triggerSelectionHaptic();
      submitGuess();
      return;
    }
    if (key === SHIFT_KEY) {
      triggerSelectionHaptic();
      dispatch({ type: "TOGGLE_SHIFT" });
      return;
    }
    if (state.gameStatus !== "playing") return;
    if (key === BACKSPACE_KEY) {
      triggerSelectionHaptic();
      dispatch({ type: "BACKSPACE" });
      return;
    }
    if (!GEORGIAN_LETTERS.has(key)) return;
    triggerSelectionHaptic();
    dispatch({ type: "TYPE_LETTER", payload: key });
  }, [state.gameStatus, submitGuess]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") { event.preventDefault(); handleKeyPress(ENTER_KEY); return; }
      if (event.key === "Backspace") { event.preventDefault(); handleKeyPress(BACKSPACE_KEY); return; }
      const typedLetter = Array.from(event.key)[0];
      const qwertyLetter = event.key.length === 1
          ? (event.shiftKey ? SHIFTED_QWERTY_TO_GEORGIAN[event.key.toUpperCase()] : undefined) ?? QWERTY_TO_GEORGIAN[event.key.toLowerCase()]
          : undefined;
      const letter = qwertyLetter ?? typedLetter;
      if (letter && GEORGIAN_LETTERS.has(letter)) {
        event.preventDefault();
        handleKeyPress(letter);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleKeyPress]);

  return {
    ...state,
    answer,
    puzzleNumber,
    dailyPuzzleNumber,
    handleKeyPress,
    startRandomPuzzle,
    resetBoard,
    setMessage: (msg: string) => dispatch({ type: "SET_MESSAGE", payload: msg }),
  };
}
