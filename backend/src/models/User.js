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

const achievementSchema = new mongoose.Schema(
  {
    earnedAt: { default: Date.now, type: Date },
    id: { required: true, trim: true, type: String }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    achievements: {
      default: () => [],
      type: [achievementSchema]
    },
    avatarColor: {
      default: "#2f9e5d",
      trim: true,
      type: String
    },
    bio: {
      default: "",
      maxlength: 200,
      trim: true,
      type: String
    },
    coverPhotoUrl: {
      default: null,
      type: String
    },
    profilePhotoUrl: {
      default: null,
      type: String
    },
    coverGradient: {
      default: 0,
      max: 7,
      min: 0,
      type: Number
    },
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
    friends: {
      default: () => [],
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
    },
    friendRequests: {
      default: () => [],
      type: [
        {
          _id: false,
          createdAt: { type: Date, default: Date.now },
          from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
        }
      ]
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
