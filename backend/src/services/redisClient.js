import { config } from "../config/env.js";

let redisClientPromise = null;

export async function getRedisClient() {
  if (!config.redisUrl) {
    return null;
  }

  if (!redisClientPromise) {
    redisClientPromise = (async () => {
      const { createClient } = await import("redis");
      const client = createClient({ url: config.redisUrl });

      client.on("error", (error) => {
        console.error("[Redis] Client error:", error);
      });

      await client.connect();
      return client;
    })();
  }

  return redisClientPromise;
}

export async function acquireRedisLock(key, ttlMs) {
  const client = await getRedisClient();

  if (!client) {
    return { acquired: true, token: null };
  }

  const token = `${process.pid}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  const result = await client.set(key, token, {
    NX: true,
    PX: ttlMs
  });

  return { acquired: result === "OK", token };
}

export async function releaseRedisLock(key, token) {
  const client = await getRedisClient();

  if (!client || !token) {
    return;
  }

  await client.eval(
    "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
    {
      keys: [key],
      arguments: [token]
    }
  );
}
