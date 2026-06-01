import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
  {
    contentPath: {
      default: null,
      trim: true,
      type: String
    },
    gameId: {
      index: true,
      required: true,
      trim: true,
      type: String,
      unique: true
    },
    href: {
      default: null,
      trim: true,
      type: String
    },
    status: {
      default: "soon",
      enum: ["ready", "soon"],
      type: String
    },
    subtitle: {
      default: "",
      trim: true,
      type: String
    },
    title: {
      required: true,
      trim: true,
      type: String
    }
  },
  { timestamps: true }
);

export const Game = mongoose.model("Game", gameSchema);
