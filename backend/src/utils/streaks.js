function parseDateKey(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));

  if (!match) {
    return null;
  }

  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

export function isConsecutiveProgress(gameId, previousKey, nextKey) {
  if (!previousKey || !nextKey) {
    return false;
  }

  if (gameId === "wordle") {
    return Number(nextKey) === Number(previousKey) + 1;
  }

  const previousDate = parseDateKey(previousKey);
  const nextDate = parseDateKey(nextKey);

  if (!previousDate || !nextDate) {
    return false;
  }

  const dayInMs = 24 * 60 * 60 * 1000;

  return nextDate.getTime() - previousDate.getTime() === dayInMs;
}
