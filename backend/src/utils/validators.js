export function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export function normalizeUsername(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 40);
}

export function normalizeEmail(value) {
  return String(value ?? "").trim().toLocaleLowerCase();
}

export function assertEmail(value) {
  const email = normalizeEmail(value);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createHttpError(400, "Valid email is required");
  }

  return email;
}

export function assertPassword(value) {
  const password = String(value ?? "");

  if (password.length < 8) {
    throw createHttpError(400, "Password must be at least 8 characters");
  }

  return password;
}

export function assertDisplayName(value) {
  const displayName = String(value ?? "").trim();

  if (displayName.length < 2 || displayName.length > 60) {
    throw createHttpError(400, "Display name must be 2-60 characters");
  }

  return displayName;
}

export function assertUsername(value) {
  const username = normalizeUsername(value);

  if (username.length < 2) {
    throw createHttpError(400, "Username must be at least 2 characters");
  }

  return username;
}

export function sanitizeGameId(gameId) {
  const value = String(gameId ?? "").trim();

  if (!/^[a-z0-9_-]+$/i.test(value)) {
    throw createHttpError(400, "Invalid gameId");
  }

  return value;
}

export function parseLimit(value, fallback = 10) {
  const limit = Number(value ?? fallback);

  if (!Number.isFinite(limit)) {
    return fallback;
  }

  return Math.min(50, Math.max(1, Math.floor(limit)));
}
