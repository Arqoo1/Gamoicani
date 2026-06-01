export const LEVEL_POINTS = {
  easy: 1,
  hard: 3,
  medium: 2
};

export function getWordlePoints(attempts) {
  if (!Number.isFinite(attempts) || attempts < 1 || attempts > 6) {
    return 0;
  }

  if (attempts <= 2) {
    return 3;
  }

  if (attempts <= 4) {
    return 2;
  }

  return 1;
}

export function getLevelPoints(level) {
  return LEVEL_POINTS[level] ?? 0;
}

export function calculatePoints({ attempts, gameId, level, won }) {
  if (!won) {
    return 0;
  }

  if (gameId === "wordle") {
    return getWordlePoints(Number(attempts));
  }

  if (gameId === "andazebi") {
    return getLevelPoints(level);
  }

  return getLevelPoints(level) || getWordlePoints(Number(attempts)) || 1;
}
