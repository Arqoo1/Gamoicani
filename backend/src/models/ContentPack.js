import mongoose from "mongoose";

const contentPackSchema = new mongoose.Schema(
  {
    gameId: {
      index: true,
      required: true,
      trim: true,
      type: String,
      unique: true
    },
    payload: {
      required: true,
      type: mongoose.Schema.Types.Mixed
    },
    sourcePath: {
      default: null,
      trim: true,
      type: String
    }
  },
  { timestamps: true }
);

export const ContentPack = mongoose.model("ContentPack", contentPackSchema);
