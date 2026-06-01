import jwt from "jsonwebtoken";

import { config } from "../config/env.js";

export function signAuthToken(user) {
  return jwt.sign(
    {
      role: user.role,
      sub: String(user._id),
      username: user.username
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

export function verifyAuthToken(token) {
  return jwt.verify(token, config.jwtSecret);
}
