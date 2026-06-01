import crypto from "node:crypto";

import { applyScoreEventToUser } from "../hooks/scoreEvents.js";
import { ScoreEvent } from "../models/ScoreEvent.js";
import { validateScorePayload } from "./scoreValidationService.js";

function createEventKey({ clientEventId, gameId, mode, puzzleKey, userId }) {
  if (mode === "daily" && puzzleKey) {
    return `${userId}:${gameId}:${mode}:${puzzleKey}`;
  }

  if (clientEventId) {
    return `${userId}:${clientEventId}`;
  }

  return `${userId}:${gameId}:${mode}:${puzzleKey ?? crypto.randomUUID()}`;
}

export async function recordScore(user, payload) {
  const score = await validateScorePayload(payload);
  const eventKey = createEventKey({
    clientEventId: payload.clientEventId,
    gameId: score.gameId,
    mode: score.mode,
    puzzleKey: score.puzzleKey,
    userId: user._id
  });

  try {
    const scoreEvent = await ScoreEvent.create({
      affectsStreak: score.affectsStreak,
      attempts: score.attempts,
      completionMethod: score.completionMethod,
      eventKey,
      gameId: score.gameId,
      level: score.level,
      metadata: {
        ...(payload.metadata ?? {}),
        ...score.metadata
      },
      mode: score.mode,
      points: score.points,
      puzzleKey: score.puzzleKey,
      streakKey: score.streakKey,
      user: user._id,
      won: score.won
    });

    applyScoreEventToUser(user, scoreEvent);
    await user.save();

    return { duplicate: false, points: score.points, scoreEvent, user };
  } catch (error) {
    if (error?.code !== 11000) {
      throw error;
    }

    const existingEvent = await ScoreEvent.findOne({ eventKey });
    return { duplicate: true, points: existingEvent?.points ?? score.points, scoreEvent: existingEvent, user };
  }
}
