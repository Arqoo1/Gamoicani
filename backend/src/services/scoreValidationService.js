import { getContentPayload } from "./contentPackCache.js";
import { calculatePoints } from "../utils/points.js";
import { createHttpError } from "../utils/validators.js";

const WORDLE_WORD_LENGTH = 5;
const WORDLE_MAX_GUESSES = 6;
export const WORDLE_EPOCH = new Date(Date.UTC(2026, 0, 1));
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const WORDLE_SUBMISSION_GRACE_MS = 60 * 60 * 1000;

function splitWord(word) {
  return Array.from(String(word ?? "").trim());
}

function normalizeAnswer(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase("ka-GE");
}

function assertInteger(value, message, { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);

  if (!Number.isInteger(number) || number < min || number > max) {
    throw createHttpError(400, message);
  }

  return number;
}

function assertDateKey(value) {
  const dateKey = String(value ?? "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw createHttpError(400, "Valid streakKey date is required");
  }

  return dateKey;
}

export function getWordlePuzzleNumber(date = new Date()) {
  const epochDay = Date.UTC(
    WORDLE_EPOCH.getUTCFullYear(),
    WORDLE_EPOCH.getUTCMonth(),
    WORDLE_EPOCH.getUTCDate()
  );
  const currentDay = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

  return Math.max(1, Math.floor((currentDay - epochDay) / DAY_IN_MS) + 1);
}

function getWordleData(payload) {
  const answers = (payload.answers ?? [])
    .map((word) => String(word).trim())
    .filter((word) => splitWord(word).length === WORDLE_WORD_LENGTH);
  const validWords = new Set(
    [...(payload.answers ?? []), ...(payload.validWords ?? [])]
      .map((word) => String(word).trim())
      .filter((word) => splitWord(word).length === WORDLE_WORD_LENGTH)
  );

  if (answers.length === 0 || validWords.size === 0) {
    throw createHttpError(503, "Wordle content is empty");
  }

  return { answers, validWords };
}

async function validateWordleScore(payload, now = new Date()) {
  const mode = payload.mode === "practice" ? "practice" : "daily";

  if (mode !== "daily") {
    throw createHttpError(400, "Only daily Wordle scores are accepted");
  }

  const puzzleNumber = getWordlePuzzleNumber(now);
  const puzzleKey = String(payload.puzzleKey ?? puzzleNumber);
  const submittedPuzzleNumber = assertInteger(puzzleKey, "Wordle puzzleKey must be a valid puzzle number", {
    min: 1
  });

  const previousPuzzleNumber = getWordlePuzzleNumber(new Date(now.getTime() - WORDLE_SUBMISSION_GRACE_MS));
  const acceptedPuzzleNumbers = new Set([puzzleNumber, previousPuzzleNumber]);

  if (!acceptedPuzzleNumbers.has(submittedPuzzleNumber)) {
    throw createHttpError(400, "Only today's Wordle puzzle can be scored");
  }

  const attempts = assertInteger(payload.attempts, "Wordle attempts must be 1-6", {
    min: 1,
    max: WORDLE_MAX_GUESSES
  });
  const guesses = Array.isArray(payload.guesses)
    ? payload.guesses.map((guess) => String(guess).trim())
    : [];

  if (guesses.length !== attempts) {
    throw createHttpError(400, "Wordle guesses must match attempts");
  }

  const { answers, validWords } = getWordleData(await getContentPayload("wordle"));
  const answer = answers[(submittedPuzzleNumber - 1) % answers.length];

  guesses.forEach((guess) => {
    if (!validWords.has(guess)) {
      throw createHttpError(400, "Wordle guess is not in the valid word list");
    }
  });

  const winningIndex = guesses.findIndex((guess) => guess === answer);
  const won = Boolean(payload.won);

  if (won && winningIndex !== guesses.length - 1) {
    throw createHttpError(400, "Winning Wordle score must end with today's answer");
  }

  if (!won && (attempts !== WORDLE_MAX_GUESSES || winningIndex !== -1)) {
    throw createHttpError(400, "Lost Wordle score must use all guesses without solving");
  }

  return {
    affectsStreak: true,
    attempts,
    completionMethod: won ? "solved" : "lost",
    gameId: "wordle",
    level: null,
    metadata: {
      guesses
    },
    mode,
    points: calculatePoints({ attempts, gameId: "wordle", won }),
    puzzleKey,
    streakKey: null,
    won
  };
}

function getAndazebiItemId(payload) {
  if (payload.itemId) {
    return String(payload.itemId);
  }

  if (payload.metadata?.itemId) {
    return String(payload.metadata.itemId);
  }

  const puzzleKey = String(payload.puzzleKey ?? "");
  const separatorIndex = puzzleKey.indexOf(":");

  return separatorIndex === -1 ? "" : puzzleKey.slice(separatorIndex + 1);
}

function getTriviaLevel(item) {
  return ["easy", "medium", "hard"].includes(item.difficulty) ? item.difficulty : "easy";
}

function getTriviaAnswers(payload) {
  const answers = payload.metadata?.answers;

  if (!Array.isArray(answers) || answers.length === 0) {
    throw createHttpError(400, "Trivia answers are required");
  }

  return answers.map((answer) => ({
    choice: normalizeAnswer(answer?.choice),
    itemId: String(answer?.itemId ?? "").trim()
  }));
}

async function validateTriviaScore(payload) {
  const mode = payload.mode === "practice" ? "practice" : "daily";

  if (mode !== "daily") {
    throw createHttpError(400, "Only daily Trivia scores are accepted");
  }

  const dateKey = assertDateKey(payload.streakKey ?? payload.puzzleKey);
  const submittedAnswers = getTriviaAnswers(payload);
  const content = await getContentPayload("trivia");
  const itemMap = new Map((content.items ?? []).map((item) => [item.id, item]));
  const seenItemIds = new Set();
  let correctCount = 0;
  let points = 0;

  const checkedAnswers = submittedAnswers.map((answer) => {
    if (!answer.itemId || seenItemIds.has(answer.itemId)) {
      throw createHttpError(400, "Trivia answers must have unique itemIds");
    }

    seenItemIds.add(answer.itemId);
    const item = itemMap.get(answer.itemId);

    if (!item) {
      throw createHttpError(400, "Trivia item does not exist");
    }

    const level = getTriviaLevel(item);
    const correct = answer.choice === normalizeAnswer(item.answer);

    if (correct) {
      correctCount += 1;
      points += calculatePoints({ gameId: "trivia", level, won: true });
    }

    return {
      correct,
      itemId: item.id,
      level,
      selected: answer.choice
    };
  });

  const attempts = assertInteger(payload.attempts ?? submittedAnswers.length, "Trivia attempts must match answers", {
    min: submittedAnswers.length,
    max: submittedAnswers.length
  });
  const won = correctCount >= Math.ceil(submittedAnswers.length * 0.6);

  return {
    affectsStreak: true,
    attempts,
    completionMethod: won ? "solved" : "lost",
    gameId: "trivia",
    level: null,
    metadata: {
      answers: checkedAnswers,
      correctCount,
      totalQuestions: submittedAnswers.length
    },
    mode,
    points,
    puzzleKey: dateKey,
    streakKey: dateKey,
    won
  };
}

async function validateAndazebiScore(payload) {
  const mode = payload.mode === "practice" ? "practice" : "daily";

  if (mode !== "daily") {
    throw createHttpError(400, "Only daily Andazebi scores are accepted");
  }

  const dateKey = assertDateKey(payload.streakKey);
  const itemId = getAndazebiItemId(payload);

  if (!itemId) {
    throw createHttpError(400, "Andazebi itemId is required");
  }

  const content = await getContentPayload("andazebi");
  const item = (content.items ?? []).find((candidate) => candidate.id === itemId);

  if (!item) {
    throw createHttpError(400, "Andazebi item does not exist");
  }

  if (payload.level && payload.level !== item.level) {
    throw createHttpError(400, "Andazebi level does not match item");
  }

  const completionMethod = ["solved", "revealed", "skipped"].includes(payload.completionMethod)
    ? payload.completionMethod
    : payload.won
      ? "solved"
      : "skipped";
  const won = completionMethod === "solved";
  const attempts = assertInteger(payload.attempts ?? 0, "Andazebi attempts must be 0 or more", {
    min: 0
  });
  const puzzleKey = `${dateKey}:${item.id}`;

  return {
    affectsStreak: won,
    attempts,
    completionMethod,
    gameId: "andazebi",
    level: item.level,
    metadata: {
      itemId: item.id,
      missingWordsCount: item.missingWords?.length ?? 0
    },
    mode,
    points: calculatePoints({ attempts, gameId: "andazebi", level: item.level, won }),
    puzzleKey,
    streakKey: dateKey,
    won
  };
}

export async function validateScorePayload(payload, options = {}) {
  const gameId = String(payload.gameId ?? "").trim();

  if (gameId === "wordle") {
    return validateWordleScore(payload, options.now);
  }

  if (gameId === "andazebi") {
    return validateAndazebiScore(payload);
  }

  if (gameId === "trivia") {
    return validateTriviaScore(payload);
  }

  throw createHttpError(400, "Unsupported gameId");
}
