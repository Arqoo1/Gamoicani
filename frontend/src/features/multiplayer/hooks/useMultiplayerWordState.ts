import { useState } from "react";

import type { GuessResultEntry } from "@/features/multiplayer/hooks/multiplayerGameTypes";

type Params = {
  missingWordsCount: number;
  wordLength: number;
};

export function useMultiplayerWordState({ missingWordsCount, wordLength }: Params) {
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [guessResults, setGuessResults] = useState<GuessResultEntry[]>([]);
  const [opponentProgress, setOpponentProgress] = useState<GuessResultEntry[]>([]);
  const [andazebiAnswers, setAndazebiAnswers] = useState<string[]>(() => Array(missingWordsCount).fill(""));
  const [activeInputIndex, setActiveInputIndex] = useState(0);

  const resetAndazebiAnswers = () => {
    setAndazebiAnswers(Array(missingWordsCount).fill(""));
    setActiveInputIndex(0);
  };

  const appendWordleTimeout = () => {
    setGuesses((prev) => [...prev, ""]);
    setGuessResults((prev) => [...prev, Array(wordLength).fill("absent") as GuessResultEntry]);
  };

  const appendAndazebiTimeout = () => {
    setGuesses((prev) => [...prev, ""]);
    setGuessResults((prev) => [...prev, "wrong"]);
  };

  return {
    activeInputIndex,
    andazebiAnswers,
    appendAndazebiTimeout,
    appendWordleTimeout,
    currentGuess,
    guessResults,
    guesses,
    opponentProgress,
    resetAndazebiAnswers,
    setActiveInputIndex,
    setAndazebiAnswers,
    setCurrentGuess,
    setGuessResults,
    setGuesses,
    setOpponentProgress,
  };
}
