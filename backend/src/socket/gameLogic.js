import {
  MAX_ANDAZEBI_GUESS_LENGTH,
  MAX_RAW_GUESS_LENGTH
} from "./constants.js";
import { getContentPayload } from "../services/contentPackCache.js";

export function scoreWordleGuess(guess, answer) {
  const result = Array(answer.length).fill("absent");
  const answerChars = [...answer];
  const guessChars = [...guess];

  for (let i = 0; i < guessChars.length; i++) {
    if (guessChars[i] === answerChars[i]) {
      result[i] = "correct";
      answerChars[i] = null;
      guessChars[i] = null;
    }
  }

  for (let i = 0; i < guessChars.length; i++) {
    if (guessChars[i] === null) continue;
    const idx = answerChars.indexOf(guessChars[i]);
    if (idx !== -1) {
      result[i] = "present";
      answerChars[idx] = null;
    }
  }

  return result;
}

export function normalizeGuessInput(guess, room) {
  if (!guess || typeof guess !== "string") return { error: "Invalid guess" };
  if (guess.length > MAX_RAW_GUESS_LENGTH) return { error: "Guess is too long" };

  const normalizedGuess = guess.trim().toLocaleLowerCase("ka-GE");
  if (!normalizedGuess) return { error: "Invalid guess" };

  if (room.actualType === "wordle") {
    const expectedLength = Array.from(String(room.answer ?? "")).length;
    if (Array.from(normalizedGuess).length !== expectedLength) {
      return { error: `Guess must be ${expectedLength} letters` };
    }
  } else if (normalizedGuess.length > MAX_ANDAZEBI_GUESS_LENGTH) {
    return { error: "Guess is too long" };
  }

  return { normalizedGuess };
}

export async function pickPuzzle(gameType, roundIndex = 0) {
  let actualType = gameType;
  if (gameType === "mix") {
    actualType = roundIndex % 2 === 0 ? "wordle" : "andazebi";
  }

  const payload = await getContentPayload(actualType).catch(() => null);
  if (!payload) return null;

  if (actualType === "wordle") {
    const answers = payload.answers ?? payload.words ?? [];
    if (answers.length === 0) return null;

    const answer = answers[Math.floor(Math.random() * answers.length)];
    const combinedValidWords = [...answers, ...(payload.validWords ?? payload.valid ?? [])];

    return {
      actualType: "wordle",
      answer,
      puzzle: { gameType: "wordle", validWords: combinedValidWords, wordLength: answer.length }
    };
  }

  const items = payload.items ?? payload.proverbs ?? [];
  if (items.length === 0) return null;

  const item = items[Math.floor(Math.random() * items.length)];
  const answer = item.answer ?? item.text ?? item;

  return {
    actualType: "andazebi",
    answer: typeof answer === "string" ? answer : String(answer),
    puzzle: {
      gameType: "andazebi",
      hint: item.hint ?? item.category ?? null,
      prompt: item.prompt ?? item.display ?? item.masked ?? null,
      missingWordsCount: Array.isArray(item.missingWords) ? item.missingWords.length : typeof answer === "string" ? answer.split(" ").length : 1,
      wordLength: typeof answer === "string" ? answer.length : undefined
    }
  };
}
