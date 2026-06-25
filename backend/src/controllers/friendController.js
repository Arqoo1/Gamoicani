import mongoose from "mongoose";

import { asyncHandler } from "../middleware/asyncHandler.js";
import { User } from "../models/User.js";
import { createHttpError } from "../utils/validators.js";

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  const { userId } = req.body;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw createHttpError(400, "Valid userId is required");
  }

  if (String(req.user._id) === String(userId)) {
    throw createHttpError(400, "Cannot send friend request to yourself");
  }

  const targetUser = await User.findById(userId);

  if (!targetUser) {
    throw createHttpError(404, "User not found");
  }

  const alreadyFriends = req.user.friends.some(
    (fId) => String(fId) === String(userId)
  );

  if (alreadyFriends) {
    throw createHttpError(400, "Already friends with this user");
  }

  const duplicateRequest = targetUser.friendRequests.some(
    (r) => String(r.from) === String(req.user._id)
  );

  if (duplicateRequest) {
    throw createHttpError(400, "Friend request already sent");
  }

  targetUser.friendRequests.push({ from: req.user._id });
  await targetUser.save();

  res.json({ data: { message: "Friend request sent" } });
});

export const acceptFriendRequest = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw createHttpError(400, "Valid userId is required");
  }

  const requestExists = req.user.friendRequests.some(
    (r) => String(r.from) === String(userId)
  );

  if (!requestExists) {
    throw createHttpError(404, "Friend request not found");
  }

  const fromUser = await User.findById(userId);

  if (!fromUser) {
    throw createHttpError(404, "User not found");
  }

  req.user.friendRequests = req.user.friendRequests.filter(
    (r) => String(r.from) !== String(userId)
  );

  if (!req.user.friends.some((fId) => String(fId) === String(userId))) {
    req.user.friends.push(userId);
  }

  if (!fromUser.friends.some((fId) => String(fId) === String(req.user._id))) {
    fromUser.friends.push(req.user._id);
  }

  await Promise.all([req.user.save(), fromUser.save()]);

  res.json({ data: { message: "Friend request accepted" } });
});

export const rejectFriendRequest = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw createHttpError(400, "Valid userId is required");
  }

  const requestExists = req.user.friendRequests.some(
    (r) => String(r.from) === String(userId)
  );

  if (!requestExists) {
    throw createHttpError(404, "Friend request not found");
  }

  req.user.friendRequests = req.user.friendRequests.filter(
    (r) => String(r.from) !== String(userId)
  );

  await req.user.save();

  res.json({ data: { message: "Friend request rejected" } });
});

export const removeFriend = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw createHttpError(400, "Valid userId is required");
  }

  const isFriend = req.user.friends.some(
    (fId) => String(fId) === String(userId)
  );

  if (!isFriend) {
    throw createHttpError(404, "User is not in your friends list");
  }

  req.user.friends = req.user.friends.filter(
    (fId) => String(fId) !== String(userId)
  );

  await req.user.save();

  await User.findByIdAndUpdate(userId, {
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
    data: (user.friendRequests ?? []).map((r) => ({
      createdAt: r.createdAt,
      user: {
        avatarColor: r.from.avatarColor,
        displayName: r.from.displayName,
        id: String(r.from._id),
        username: r.from.username
      }
    }))
  });
});
