import cron from "node-cron";
import { Expo } from "expo-server-sdk";

import { config } from "../config/env.js";
import { User } from "../models/User.js";
import { acquireRedisLock, releaseRedisLock } from "../services/redisClient.js";

const expo = new Expo();
const LOCK_KEY = "jobs:daily-reset-notifications";
const LOCK_TTL_MS = 30 * 60 * 1000;
const TOKEN_BATCH_SIZE = 500;
let localJobRunning = false;

export async function sendPushMessages(messageContexts) {
  const chunks = expo.chunkPushNotifications(messageContexts.map((context) => context.message));
  const ticketsWithTokens = [];
  let offset = 0;

  for (const chunk of chunks) {
    const contextChunk = messageContexts.slice(offset, offset + chunk.length);
    offset += chunk.length;

    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      ticketChunk.forEach((ticket, index) => {
        const context = contextChunk[index];

        if (context) {
          ticketsWithTokens.push({
            ticket,
            token: context.token,
            userId: context.userId
          });
        }
      });
    } catch (error) {
      console.error("[PushJob] Error sending chunk:", error);
    }
  }

  return ticketsWithTokens;
}

export async function cleanInvalidTokens(ticketsWithTokens) {
  const removals = new Map();

  for (const { ticket, userId, token } of ticketsWithTokens) {
    if (
      ticket.status === "error" &&
      ["DeviceNotRegistered", "InvalidCredentials"].includes(ticket.details?.error)
    ) {
      removals.set(`${userId}:${token}`, { userId, token });
    }
  }

  if (removals.size === 0) {
    return;
  }

  try {
    await User.bulkWrite(
      [...removals.values()].map(({ userId, token }) => ({
        updateOne: {
          filter: { _id: userId },
          update: { $pull: { expoPushTokens: token } }
        }
      })),
      { ordered: false }
    );
  } catch (error) {
    console.error("[PushJob] Failed to remove invalid tokens:", error);
  }
}

function createMessageContext(user, token) {
  return {
    userId: user._id.toString(),
    token,
    message: {
      to: token,
      sound: "default",
      title: "🎮 ახალი დღე დაიწყო!",
      body: "სიტყვობანა, ანდაზები და ქვესტები განახლდა. შემოდი და ითამაშე!",
      data: { screen: "/" }
    }
  };
}

async function processNotificationBatch(messageContexts) {
  if (messageContexts.length === 0) {
    return;
  }

  const ticketsWithTokens = await sendPushMessages(messageContexts);
  await cleanInvalidTokens(ticketsWithTokens);
}

export async function runDailyResetNotifications() {
  if (localJobRunning) {
    return;
  }

  localJobRunning = true;
  const lock = await acquireRedisLock(LOCK_KEY, LOCK_TTL_MS);

  if (!lock.acquired) {
    localJobRunning = false;
    return;
  }

  try {
    const cursor = User.find({
      expoPushTokens: { $exists: true, $not: { $size: 0 } }
    }).select("expoPushTokens").lean().cursor();

    let batch = [];

    for await (const user of cursor) {
      for (const token of user.expoPushTokens ?? []) {
        if (!Expo.isExpoPushToken(token)) continue;

        batch.push(createMessageContext(user, token));

        if (batch.length >= TOKEN_BATCH_SIZE) {
          await processNotificationBatch(batch);
          batch = [];
        }
      }
    }

    await processNotificationBatch(batch);
  } finally {
    await releaseRedisLock(LOCK_KEY, lock.token);
    localJobRunning = false;
  }
}

export function startDailyResetJob() {
  if (!config.enableJobs) {
    return null;
  }

  return cron.schedule(
    "0 20 * * *",
    async () => {
      try {
        await runDailyResetNotifications();
      } catch (error) {
        console.error("[PushJob] Failed to run daily reset job:", error);
      }
    },
    {
      timezone: "Asia/Tbilisi"
    }
  );
}
