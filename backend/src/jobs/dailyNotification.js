import cron from "node-cron";
import { Expo } from "expo-server-sdk";
import { User } from "../models/User.js";

const expo = new Expo();

async function sendPushMessages(messages) {
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error("[PushJob] Error sending chunk:", error);
    }
  }

  return tickets;
}

async function cleanInvalidTokens(tickets, tokenUserMap) {
  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    if (ticket.status === "error") {
      if (
        ticket.details?.error === "DeviceNotRegistered" ||
        ticket.details?.error === "InvalidCredentials"
      ) {
        const { userId, token } = tokenUserMap[i];
        try {
          await User.findByIdAndUpdate(userId, {
            $pull: { expoPushTokens: token }
          });
        } catch (err) {
          console.error("[PushJob] Failed to remove invalid token:", err);
        }
      }
    }
  }
}

export function startDailyResetJob() {
  cron.schedule("0 20 * * *", async () => {
    try {
      const users = await User.find({
        expoPushTokens: { $exists: true, $not: { $size: 0 } }
      }).select("expoPushTokens").lean();

      const messages = [];
      const tokenUserMap = [];

      for (const user of users) {
        for (const token of user.expoPushTokens) {
          if (!Expo.isExpoPushToken(token)) continue;

          messages.push({
            to: token,
            sound: "default",
            title: "🎮 ახალი დღე დაიწყო!",
            body: "სიტყვობანა, ანდაზები და ქვესტები განახლდა. შემოდი და ითამაშე!",
            data: { screen: "/" }
          });

          tokenUserMap.push({ userId: user._id.toString(), token });
        }
      }

      if (messages.length === 0) return;

      const tickets = await sendPushMessages(messages);
      await cleanInvalidTokens(tickets, tokenUserMap);
    } catch (error) {
      console.error("[PushJob] Failed to run daily reset job:", error);
    }
  }, {
    timezone: "Asia/Tbilisi"
  });
}
