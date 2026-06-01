import bcrypt from "bcryptjs";

import { asyncHandler } from "../middleware/asyncHandler.js";
import { User } from "../models/User.js";
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

  if (Object.keys(updates).length === 0) {
    res.json({ data: { user: serializeUser(req.user) } });
    return;
  }

  if (updates.username && updates.username !== req.user.username) {
    const existingUser = await User.findOne({ username: updates.username }).lean();

    if (existingUser) {
      throw createHttpError(409, "Username is already taken");
    }
  }

  Object.assign(req.user, updates);
  await req.user.save();

  res.json({ data: authResponse(req.user) });
});
