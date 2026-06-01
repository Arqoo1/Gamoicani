import mongoose from "mongoose";

const scoreEventSchema = new mongoose.Schema(
  {
    attempts: { min: 0, type: Number },
    affectsStreak: {
      default: true,
      type: Boolean
    },
    completionMethod: {
      default: "solved",
      enum: ["solved", "lost", "revealed", "skipped"],
      type: String
    },
    eventKey: {
      index: true,
      required: true,
      type: String,
      unique: true
    },
    gameId: {
      index: true,
      required: true,
      trim: true,
      type: String
    },
    level: {
      enum: ["easy", "medium", "hard", null],
      default: null,
      type: String
    },
    metadata: {
      default: () => ({}),
      type: mongoose.Schema.Types.Mixed
    },
    mode: {
      default: "daily",
      enum: ["daily", "practice"],
      type: String
    },
    occurredAt: {
      default: Date.now,
      type: Date
    },
    points: {
      default: 0,
      min: 0,
      type: Number
    },
    puzzleKey: {
      default: null,
      trim: true,
      type: String
    },
    streakKey: {
      default: null,
      trim: true,
      type: String
    },
    user: {
      index: true,
      ref: "User",
      required: true,
      type: mongoose.Schema.Types.ObjectId
    },
    won: {
      default: false,
      type: Boolean
    }
  },
  { timestamps: true }
);

scoreEventSchema.index({ user: 1, gameId: 1, mode: 1, puzzleKey: 1 });

export const ScoreEvent = mongoose.model("ScoreEvent", scoreEventSchema);
