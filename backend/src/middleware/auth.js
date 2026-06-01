import { User } from "../models/User.js";
import { verifyAuthToken } from "../utils/tokens.js";
import { createHttpError } from "../utils/validators.js";

function getBearerToken(req) {
  const header = req.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

export async function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      throw createHttpError(401, "Authentication required");
    }

    const payload = verifyAuthToken(token);
    const user = await User.findById(payload.sub);

    if (!user) {
      throw createHttpError(401, "Authentication required");
    }

    req.user = user;
    next();
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 401;
      error.message = "Authentication required";
    }

    next(error);
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    next(createHttpError(403, "Admin access required"));
    return;
  }

  next();
}
