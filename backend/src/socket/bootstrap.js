import jwt from "jsonwebtoken";

import { config } from "../config/env.js";
import { User } from "../models/User.js";
import { getRedisClient } from "../services/redisClient.js";

export async function configureSocketAdapter(io) {
  const pubClient = await getRedisClient();

  if (!pubClient) {
    return;
  }

  const { createAdapter } = await import("@socket.io/redis-adapter");
  const subClient = pubClient.duplicate();
  await subClient.connect();
  io.adapter(createAdapter(pubClient, subClient));
  console.log("[Socket] Redis adapter enabled");
}

export function registerSocketAuth(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const payload = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(payload.sub);
      if (!user) return next(new Error("Authentication required"));
      socket.user = user;
      next();
    } catch {
      next(new Error("Authentication required"));
    }
  });
}
