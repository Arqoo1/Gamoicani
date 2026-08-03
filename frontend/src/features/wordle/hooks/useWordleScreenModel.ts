import { useCallback, useMemo, useRef, useState } from "react";
import { Animated, Platform } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";

import { useAuth } from "@/application/providers/auth";
import { useWordleGame } from "@/features/wordle/hooks/useWordleGame";
import {
  LetterScore,
  getDailyPuzzleNumber,
  mergeLetterScores,
  scoreGuess,
  splitWord,
  WORDLE_EPOCH,
} from "@/features/wordle/model/wordle";
import { useWordleContent } from "@/features/wordle/hooks/useWordleContent";
import { useWordleLayout } from "@/features/wordle/hooks/useWordleLayout";

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;
const USE_NATIVE_ANIMATION_DRIVER = Platform.OS !== "web";

export function useWordleScreenModel(
  gameMode: "daily" | "practice" | "tutorial" | null,
  width: number,
  height: number
) {
  const { updateUser, user } = useAuth();
  const [isResultModalVisible, setIsResultModalVisible] = useState(false);
  const dailyPuzzleNumber = getDailyPuzzleNumber(WORDLE_EPOCH);
  const shake = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef<ConfettiCannon>(null);
  const { isOffline, wordData } = useWordleContent();

  const isDailyDone = useMemo(() => {
    const stat = user?.gameStats?.wordle;
    return stat?.lastCompletedKey === String(dailyPuzzleNumber);
  }, [dailyPuzzleNumber, user?.gameStats]);

  const shakeCurrentRow = useCallback(() => {
    shake.stopAnimation();
    shake.setValue(0);
    Animated.sequence(
      [1, 2, 3, 4, 5, 6].map((toValue) =>
        Animated.timing(shake, { duration: 38, toValue, useNativeDriver: USE_NATIVE_ANIMATION_DRIVER })
      )
    ).start();
  }, [shake]);

  const onResultModal = useCallback(() => {
    setIsResultModalVisible(true);
  }, []);

  const game = useWordleGame(gameMode, wordData, user, updateUser, onResultModal, shakeCurrentRow, () =>
    confettiRef.current?.start()
  );

  const layout = useWordleLayout(width, height);

  const shakeTranslateX = shake.interpolate({
    inputRange: [0, 1, 2, 3, 4, 5, 6],
    outputRange: [0, -10, 10, -8, 8, -4, 0],
  });

  const letterScores = useMemo(() => {
    return game.guesses.reduce<Record<string, LetterScore>>((scores, guess) => {
      const guessScores = scoreGuess(guess, game.answer);
      splitWord(guess).forEach((letter, index) => {
        scores[letter] = mergeLetterScores(scores[letter], guessScores[index]);
      });
      return scores;
    }, {});
  }, [game.answer, game.guesses]);

  return {
    answer: game.answer,
    boardWidth: layout.boardWidth,
    confettiRef,
    currentLetters: game.currentLetters,
    dailyPuzzleNumber,
    gameStatus: game.gameStatus,
    handleKeyPress: game.handleKeyPress,
    isDailyDone,
    isOffline,
    isResultModalVisible,
    isShifted: game.isShifted,
    letterScores,
    message: game.message,
    puzzleNumber: game.puzzleNumber,
    resetBoard: game.resetBoard,
    setIsResultModalVisible,
    setMessage: game.setMessage,
    shakeTranslateX,
    startRandomPuzzle: game.startRandomPuzzle,
    tileFontSize: layout.tileFontSize,
    tileGap: layout.tileGap,
    tileSize: layout.tileSize,
    wordLength: layout.wordLength,
    maxGuesses: layout.maxGuesses,
    toast: game.toast,
    guesses: game.guesses,
  };
}
