import bcrypt from "bcryptjs";

import { asyncHandler } from "../middleware/asyncHandler.js";
import { User } from "../models/User.js";
import { ensureDailyQuests } from "../services/questService.js";
import { signAuthToken } from "../utils/tokens.js";
import { serializeUser } from "../utils/userPresenter.js";
import {
  assertDisplayName,
  assertEmail,
  assertPassword,
  assertUsername,
  createHttpError,
  normalizeEmail
} from "../utils/validators.js";

function authResponse(user) {
  return {
    token: signAuthToken(user),
    user: serializeUser(user)
  };
}

export const register = asyncHandler(async (req, res) => {
  const email = assertEmail(req.body.email);
  const password = assertPassword(req.body.password);
  const username = assertUsername(req.body.username);
  const displayName = assertDisplayName(req.body.displayName ?? username);

  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  }).lean();

  if (existingUser?.email === email) {
    throw createHttpError(409, "Email is already registered");
  }

  if (existingUser?.username === username) {
    throw createHttpError(409, "Username is already taken");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    displayName,
    email,
    passwordHash,
    username
  });

  res.status(201).json({ data: authResponse(user) });
});

export const login = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password ?? "");
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user?.passwordHash) {
    throw createHttpError(401, "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw createHttpError(401, "Invalid email or password");
  }

  res.json({ data: authResponse(user) });
});

export const getMe = asyncHandler(async (req, res) => {
  const originalDateKey = req.user.dailyQuests?.dateKey;
  ensureDailyQuests(req.user);
  
  if (req.user.dailyQuests.dateKey !== originalDateKey) {
    await req.user.save();
  }

  res.json({ data: { user: serializeUser(req.user) } });
});

export const updateMe = asyncHandler(async (req, res) => {
  const updates = {};

  if (req.body.displayName !== undefined) {
    updates.displayName = assertDisplayName(req.body.displayName);
  }

  if (req.body.username !== undefined) {
    updates.username = assertUsername(req.body.username);
  }

  if (req.body.bio !== undefined) {
    const bio = String(req.body.bio ?? "").trim().slice(0, 200);
    updates.bio = bio;
  }

  if (req.body.avatarColor !== undefined) {
    const color = String(req.body.avatarColor ?? "").trim();
    if (/^#[0-9a-fA-F]{6}$/.test(color)) {
      req.user.avatarColor = color;
      req.user.markModified('avatarColor');
      updates.avatarColor = color;
    }
  }

  if (req.body.coverGradient !== undefined) {
    const gradient = Number(req.body.coverGradient);
    if (Number.isFinite(gradient) && gradient >= 0 && gradient <= 7) {
      req.user.coverGradient = Math.floor(gradient);
      req.user.markModified('coverGradient');
      updates.coverGradient = Math.floor(gradient);
    }
  }

  if (req.body.profilePhotoUrl === null || req.body.profilePhotoUrl === "") {
    req.user.profilePhotoUrl = null;
    req.user.markModified('profilePhotoUrl');
    updates.profilePhotoUrl = null;
  }

  if (req.body.coverPhotoUrl === null || req.body.coverPhotoUrl === "") {
    req.user.coverPhotoUrl = null;
    req.user.markModified('coverPhotoUrl');
    updates.coverPhotoUrl = null;
  }

  if (Object.keys(updates).length === 0) {
    res.json({ data: { user: serializeUser(req.user) } });
    return;
  }

  if (updates.username && updates.username !== req.user.username) {
    const existingUser = await User.findOne({ username: updates.username }).lean();

    if (existingUser) {
      throw createHttpError(409, "Username is already taken");
    }
    req.user.username = updates.username;
    req.user.markModified('username');
  }

  if (updates.displayName) {
    req.user.displayName = updates.displayName;
    req.user.markModified('displayName');
  }
  
  if (updates.bio !== undefined) {
    req.user.bio = updates.bio;
    req.user.markModified('bio');
  }

  await req.user.save();

  res.json({ data: authResponse(req.user) });
});

export const changePassword = asyncHandler(async (req, res) => {
  const currentPassword = String(req.body.currentPassword ?? "");
  const newPassword = assertPassword(req.body.newPassword);

  const userWithHash = await User.findById(req.user._id).select("+passwordHash");

  if (!userWithHash?.passwordHash) {
    throw createHttpError(400, "No password set for this account");
  }

  const passwordMatches = await bcrypt.compare(currentPassword, userWithHash.passwordHash);

  if (!passwordMatches) {
    throw createHttpError(401, "Current password is incorrect");
  }

  userWithHash.passwordHash = await bcrypt.hash(newPassword, 12);
  await userWithHash.save();

  res.json({ data: { message: "Password changed successfully" } });
});
