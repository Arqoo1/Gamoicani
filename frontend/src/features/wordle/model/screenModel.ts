import { Platform } from "react-native";

import { playLoss, playWin } from "@/shared/services/sound";
import { triggerSuccessHaptic, triggerWarningHaptic } from "@/shared/services/haptics";
import { GameStatus, LetterScore } from "@/features/wordle/model/wordle";

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;
export const DEFAULT_MESSAGE = "დღის სიტყვა";
export const USE_NATIVE_ANIMATION_DRIVER = Platform.OS !== "web";

export type WordsJson = {
  answers: string[];
  meta?: {
    language: string;
    source?: {
      license: string;
      name: string;
      url: string;
    };
    wordLength: number;
  };
  validWords: string[];
};

export function getStatusMessage(status: GameStatus, answer: string, guessesCount: number) {
  if (status === "won") {
    return `მოიგე ${guessesCount}/6`;
  }

  if (status === "lost") {
    return `სიტყვა იყო ${answer}`;
  }

  return DEFAULT_MESSAGE;
}

export function scoreToEmoji(score: LetterScore) {
  if (score === "correct") {
    return "🟩";
  }

  if (score === "present") {
    return "🟨";
  }

  return "⬛";
}

export function triggerCompletionHaptic(won: boolean) {
  if (won) {
    playWin();
    triggerSuccessHaptic();
  } else {
    playLoss();
    triggerWarningHaptic();
  }
}
