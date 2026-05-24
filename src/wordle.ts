export type LetterScore = "correct" | "present" | "absent";
export type GameStatus = "playing" | "won" | "lost";

export const WORDLE_EPOCH = new Date(Date.UTC(2026, 0, 1));

const scoreRank: Record<LetterScore, number> = {
  absent: 0,
  present: 1,
  correct: 2
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function splitWord(word: string) {
  return Array.from(word.trim());
}

export function isFilledWord(word: string, length: number) {
  return splitWord(word).length === length;
}

export function scoreGuess(guess: string, answer: string): LetterScore[] {
  const guessLetters = splitWord(guess);
  const answerLetters = splitWord(answer);
  const scores: LetterScore[] = Array.from({ length: guessLetters.length }, () => "absent");
  const remaining = new Map<string, number>();

  answerLetters.forEach((letter, index) => {
    if (guessLetters[index] === letter) {
      scores[index] = "correct";
      return;
    }

    remaining.set(letter, (remaining.get(letter) ?? 0) + 1);
  });

  guessLetters.forEach((letter, index) => {
    if (scores[index] === "correct") {
      return;
    }

    const count = remaining.get(letter) ?? 0;
    if (count > 0) {
      scores[index] = "present";
      remaining.set(letter, count - 1);
    }
  });

  return scores;
}

export function mergeLetterScores(
  current: LetterScore | undefined,
  next: LetterScore | undefined
) {
  if (!next) {
    return current ?? "absent";
  }

  if (!current) {
    return next;
  }

  return scoreRank[next] > scoreRank[current] ? next : current;
}

export function getDailyPuzzleNumber(epoch: Date, date = new Date()) {
  const epochDay = Date.UTC(epoch.getUTCFullYear(), epoch.getUTCMonth(), epoch.getUTCDate());
  const currentDay = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

  return Math.max(1, Math.floor((currentDay - epochDay) / DAY_IN_MS) + 1);
}
