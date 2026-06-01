import mongoose from "mongoose";

const gameStatSchema = new mongoose.Schema(
  {
    currentStreak: { type: Number, default: 0, min: 0 },
    lastCompletedKey: { type: String, default: null },
    lastPlayedAt: { type: Date, default: null },
    maxStreak: { type: Number, default: 0, min: 0 },
    plays: { type: Number, default: 0, min: 0 },
    points: { type: Number, default: 0, min: 0 },
    wins: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    displayName: {
      maxlength: 60,
      required: true,
      trim: true,
      type: String
    },
    email: {
      index: true,
      lowercase: true,
      maxlength: 254,
      sparse: true,
      trim: true,
      type: String,
      unique: true
    },
    gameStats: {
      default: () => ({}),
      of: gameStatSchema,
      type: Map
    },
    passwordHash: {
      select: false,
      type: String
    },
    role: {
      default: "user",
      enum: ["user", "admin"],
      type: String
    },
    totalPoints: {
      default: 0,
      min: 0,
      type: Number
    },
    username: {
      index: true,
      lowercase: true,
      maxlength: 40,
      minlength: 2,
      required: true,
      trim: true,
      type: String,
      unique: true
    }
  },
  {
    minimize: false,
    timestamps: true
  }
);

export const User = mongoose.model("User", userSchema);
