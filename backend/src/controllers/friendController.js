import mongoose from "mongoose";

import { asyncHandler } from "../middleware/asyncHandler.js";
import { User } from "../models/User.js";
import { createHttpError } from "../utils/validators.js";

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertObjectId(value) {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    throw createHttpError(400, "Valid userId is required");
  }

  return new mongoose.Types.ObjectId(value);
}

export const searchUsers = asyncHandler(async (req, res) => {
  const q = String(req.query.q ?? "").trim();

  if (!q || q.length < 1) {
    return res.json({ data: [] });
  }

  const users = await User.find({
    _id: { $ne: req.user._id },
    username: { $regex: escapeRegex(q), $options: "i" }
  })
    .limit(20)
    .lean();

  res.json({
    data: users.map((u) => ({
      avatarColor: u.avatarColor,
      displayName: u.displayName,
      id: String(u._id),
      username: u.username
    }))
  });
});

export const sendFriendRequest = asyncHandler(async (req, res) => {
  const userId = assertObjectId(req.body.userId);

  if (String(req.user._id) === String(userId)) {
    throw createHttpError(400, "Cannot send friend request to yourself");
  }

  const requesterIsAlreadyFriend = await User.exists({
    _id: req.user._id,
    friends: userId
  });

  if (requesterIsAlreadyFriend) {
    throw createHttpError(400, "Already friends with this user");
  }

  const targetUser = await User.findOneAndUpdate(
    {
      _id: userId,
      friends: { $ne: req.user._id },
      "friendRequests.from": { $ne: req.user._id }
    },
    {
      $push: { friendRequests: { from: req.user._id } }
    },
    { returnDocument: "after" }
  );

  if (targetUser) {
    res.json({ data: { message: "Friend request sent" } });
    return;
  }

  const targetExists = await User.exists({ _id: userId });

  if (!targetExists) {
    throw createHttpError(404, "User not found");
  }

  const targetIsAlreadyFriend = await User.exists({
    _id: userId,
    friends: req.user._id
  });

  if (targetIsAlreadyFriend) {
    throw createHttpError(400, "Already friends with this user");
  }

  throw createHttpError(400, "Friend request already sent");
});

export const acceptFriendRequest = asyncHandler(async (req, res) => {
  const userId = assertObjectId(req.body.userId);

  const fromUserExists = await User.exists({ _id: userId });

  if (!fromUserExists) {
    throw createHttpError(404, "User not found");
  }

  const currentUserUpdate = await User.updateOne(
    {
      _id: req.user._id,
      "friendRequests.from": userId
    },
    {
      $addToSet: { friends: userId },
      $pull: { friendRequests: { from: userId } }
    }
  );

  if (currentUserUpdate.matchedCount === 0) {
    throw createHttpError(404, "Friend request not found");
  }

  await User.updateOne(
    { _id: userId },
    { $addToSet: { friends: req.user._id } }
  );

  res.json({ data: { message: "Friend request accepted" } });
});

export const rejectFriendRequest = asyncHandler(async (req, res) => {
  const userId = assertObjectId(req.body.userId);

  const result = await User.updateOne(
    {
      _id: req.user._id,
      "friendRequests.from": userId
    },
    {
      $pull: { friendRequests: { from: userId } }
    }
  );

  if (result.matchedCount === 0) {
    throw createHttpError(404, "Friend request not found");
  }

  res.json({ data: { message: "Friend request rejected" } });
});

export const removeFriend = asyncHandler(async (req, res) => {
  const userId = assertObjectId(req.params.userId);

  const result = await User.updateOne(
    {
      _id: req.user._id,
      friends: userId
    },
    {
      $pull: { friends: userId }
    }
  );

  if (result.matchedCount === 0) {
    throw createHttpError(404, "User is not in your friends list");
  }

  await User.updateOne({ _id: userId }, {
    $pull: { friends: req.user._id }
  });

  res.json({ data: { message: "Friend removed" } });
});

export const listFriends = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("friends", "username displayName avatarColor totalPoints")
    .lean();

  res.json({
    data: (user.friends ?? []).map((f) => ({
      avatarColor: f.avatarColor,
      displayName: f.displayName,
      id: String(f._id),
      totalPoints: f.totalPoints ?? 0,
      username: f.username
    }))
  });
});

export const listFriendRequests = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("friendRequests.from", "username displayName avatarColor")
    .lean();

  res.json({
    data: (user.friendRequests ?? [])
      .filter((r) => r.from)
      .map((r) => {
        const from = {
          avatarColor: r.from.avatarColor,
          displayName: r.from.displayName,
          id: String(r.from._id),
          username: r.from.username
        };

        return {
          createdAt: r.createdAt,
          from,
          user: from
        };
      })
  });
});
