import { isConsecutiveProgress } from "../utils/streaks.js";
import { evaluateQuests, ensureDailyQuests } from "../services/questService.js";

function emptyGameStat() {
  return {
    currentStreak: 0,
    lastCompletedKey: null,
    lastPlayedAt: null,
    maxStreak: 0,
    plays: 0,
    points: 0,
    wins: 0
  };
}

function plainGameStat(value) {
  const source = value?.toObject?.() ?? value ?? {};

  return {
    currentStreak: source.currentStreak ?? 0,
    lastCompletedKey: source.lastCompletedKey ?? null,
    lastPlayedAt: source.lastPlayedAt ?? null,
    maxStreak: source.maxStreak ?? 0,
    plays: source.plays ?? 0,
    points: source.points ?? 0,
    wins: source.wins ?? 0
  };
}

const achievementDefinitions = {
  "all-games": {
    title: "ყველა თამაში",
    description: "ითამაშე ყველა ხელმისაწვდომი თამაში."
  },
  "first-win": {
    title: "პირველი მოგება",
    description: "პირველად მოიგე რომელიმე თამაში."
  },
  "perfect-week": {
    title: "იდეალური კვირა",
    description: "დააგროვე 7-დღიანი მოგებების სერია."
  },
  "streak-7": {
    title: "7-დღიანი სერია",
    description: "გააგრძელე სერია 7 დღემდე."
  },
  "wordle-1": {
    title: "ერთი ცდა",
    description: "სიტყვობანა მოიგე პირველივე ცდაზე."
  },
  "wordle-2": {
    title: "ორი ცდა",
    description: "სიტყვობანა მოიგე ორ ცდაში."
  },
  "wordle-3": {
    title: "სამი ცდა",
    description: "სიტყვობანა მოიგე სამ ცდაში."
  }
};

export function getAchievementDefinitions() {
  return achievementDefinitions;
}

function ensureAchievement(user, id, earnedAt = new Date()) {
  if (!achievementDefinitions[id]) {
    return false;
  }

  const achievements = user.achievements ?? [];
  if (achievements.some((achievement) => achievement.id === id)) {
    return false;
  }

  achievements.push({ earnedAt, id });
  user.achievements = achievements;

  return true;
}

function getUserGameStat(user, gameId) {
  return plainGameStat(user.gameStats.get(gameId) ?? emptyGameStat());
}

function awardAchievements(user, scoreEvent) {
  if (!scoreEvent.won) {
    return;
  }

  ensureAchievement(user, "first-win", scoreEvent.occurredAt);

  if (scoreEvent.gameId === "wordle" && [1, 2, 3].includes(scoreEvent.attempts)) {
    ensureAchievement(user, `wordle-${scoreEvent.attempts}`, scoreEvent.occurredAt);
  }

  const currentStat = getUserGameStat(user, scoreEvent.gameId);
  if (currentStat.currentStreak >= 7) {
    ensureAchievement(user, "streak-7", scoreEvent.occurredAt);
    ensureAchievement(user, "perfect-week", scoreEvent.occurredAt);
  }

  const readyGameIds = ["wordle", "andazebi", "trivia"];
  if (readyGameIds.every((gameId) => getUserGameStat(user, gameId).plays > 0)) {
    ensureAchievement(user, "all-games", scoreEvent.occurredAt);
  }
}

export function applyScoreEventToUser(user, scoreEvent) {
  const currentStat = plainGameStat(user.gameStats.get(scoreEvent.gameId) ?? emptyGameStat());
  const nextStat = {
    ...currentStat,
    lastPlayedAt: scoreEvent.occurredAt,
    plays: currentStat.plays + 1,
    points: currentStat.points + scoreEvent.points,
    wins: currentStat.wins + (scoreEvent.won ? 1 : 0)
  };

  if (!scoreEvent.affectsStreak) {
    user.totalPoints += scoreEvent.points;
    user.gameStats.set(scoreEvent.gameId, nextStat);

    return user;
  }

  const progressKey = scoreEvent.streakKey ?? scoreEvent.puzzleKey;

  if (scoreEvent.won) {
    const continuesStreak = isConsecutiveProgress(
      scoreEvent.gameId,
      currentStat.lastCompletedKey,
      progressKey
    );
    nextStat.currentStreak = continuesStreak ? currentStat.currentStreak + 1 : 1;
    nextStat.lastCompletedKey = progressKey ?? currentStat.lastCompletedKey;
    nextStat.maxStreak = Math.max(currentStat.maxStreak, nextStat.currentStreak);
  } else {
    nextStat.currentStreak = 0;
    nextStat.lastCompletedKey = progressKey ?? currentStat.lastCompletedKey;
  }

  user.totalPoints += scoreEvent.points;
  user.gameStats.set(scoreEvent.gameId, nextStat);
  
  awardAchievements(user, scoreEvent);
  ensureDailyQuests(user, scoreEvent.occurredAt);
  evaluateQuests(user, scoreEvent);

  return user;
}
