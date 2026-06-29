import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { OAuth2Client } from "google-auth-library";

import { config } from "../config/env.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { User } from "../models/User.js";
import { ensureDailyQuests } from "../services/questService.js";
import { signAuthToken } from "../utils/tokens.js";
import { serializeUser } from "../utils/userPresenter.js";
import {
  assertDisplayName,
  assertEmail,
  assertAvatarColor,
  assertBio,
  assertCoverGradient,
  assertPassword,
  assertUsername,
  createHttpError,
  normalizeEmail,
  normalizeUsername
} from "../utils/validators.js";

const googleClient = new OAuth2Client(config.googleClientId || undefined);

async function getAuthResponse(user) {
  const initialDateKey = user.dailyQuests?.dateKey;
  ensureDailyQuests(user);
  if (user.dailyQuests?.dateKey !== initialDateKey) {
    await user.save();
  }
  return {
    token: signAuthToken(user),
    user: serializeUser(user)
  };
}

function isDuplicateKeyError(error) {
  return error?.code === 11000;
}

function getDuplicateFields(error) {
  return Object.keys(error?.keyPattern ?? error?.keyValue ?? {});
}

function createUsernameCandidate(baseUsername, attempt) {
  if (attempt === 0) {
    return baseUsername;
  }

  const suffix = String(randomInt(1000, 10000));
  const prefix = baseUsername.slice(0, Math.max(2, 40 - suffix.length - 1));

  return `${prefix}-${suffix}`;
}

async function createGoogleUser({ displayName, email }) {
  const normalizedBase = normalizeUsername(email.split("@")[0]);
  const baseUsername = normalizedBase.length >= 2 ? normalizedBase : "user";

  for (let attempt = 0; attempt < 6; attempt++) {
    const username = createUsernameCandidate(baseUsername, attempt);

    try {
      return await User.create({
        displayName,
        email,
        username
      });
    } catch (error) {
      if (!isDuplicateKeyError(error)) {
        throw error;
      }

      const duplicateFields = getDuplicateFields(error);

      if (duplicateFields.includes("email")) {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
          return existingUser;
        }
      }

      if (!duplicateFields.includes("username")) {
        throw error;
      }
    }
  }

  throw createHttpError(409, "Could not generate a unique username");
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
  let user;

  try {
    user = await User.create({
      displayName,
      email,
      passwordHash,
      username
    });
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    const duplicateFields = getDuplicateFields(error);

    if (duplicateFields.includes("email")) {
      throw createHttpError(409, "Email is already registered");
    }

    if (duplicateFields.includes("username")) {
      throw createHttpError(409, "Username is already taken");
    }

    throw error;
  }

  res.status(201).json({ data: await getAuthResponse(user) });
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

  res.json({ data: await getAuthResponse(user) });
});

export const loginWithGoogle = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) throw createHttpError(400, "idToken is required");
  if (!config.googleClientId) {
    throw createHttpError(503, "Google sign-in is not configured");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: config.googleClientId,
  });
  
  const payload = ticket.getPayload();
  const email = normalizeEmail(payload.email);
  const displayName = payload.name ? String(payload.name).slice(0, 50) : "User";

  let user = await User.findOne({ email });
  if (!user) {
    user = await createGoogleUser({ displayName, email });
  }

  res.json({ data: await getAuthResponse(user) });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = req.user;
  const initialDateKey = user.dailyQuests?.dateKey;
  
  ensureDailyQuests(user);
  
  if (user.dailyQuests?.dateKey !== initialDateKey) {
    await user.save();
  }

  res.json({ data: { user: serializeUser(user) } });
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
    updates.bio = assertBio(req.body.bio);
  }

  if (req.body.avatarColor !== undefined) {
    updates.avatarColor = assertAvatarColor(req.body.avatarColor);
  }

  if (req.body.coverGradient !== undefined) {
    updates.coverGradient = assertCoverGradient(req.body.coverGradient);
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

  if (updates.avatarColor !== undefined) {
    req.user.avatarColor = updates.avatarColor;
    req.user.markModified('avatarColor');
  }

  if (updates.coverGradient !== undefined) {
    req.user.coverGradient = updates.coverGradient;
    req.user.markModified('coverGradient');
  }

  try {
    await req.user.save();
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    if (getDuplicateFields(error).includes("username")) {
      throw createHttpError(409, "Username is already taken");
    }

    throw error;
  }

  res.json({ data: await getAuthResponse(req.user) });
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

export const savePushToken = asyncHandler(async (req, res) => {
  const token = String(req.body.token ?? "").trim();

  if (!token || !token.startsWith("ExponentPushToken[")) {
    throw createHttpError(400, "Invalid Expo push token");
  }

  if (!req.user.expoPushTokens.includes(token)) {
    req.user.expoPushTokens.push(token);
  }

  req.user.lastSeenAt = new Date();
  await req.user.save();

  res.json({ data: { message: "Push token saved" } });
});
