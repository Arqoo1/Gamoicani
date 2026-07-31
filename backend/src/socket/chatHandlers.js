import { getRedisClient } from "../services/redisClient.js";
import { generateId } from "./roomUtils.js";

const CHAT_REDIS_KEY = "global-chat:messages";
const CHAT_MAX_MESSAGES = 100;
const CHAT_TTL_SECONDS = 86400;

async function saveChatMessage(message) {
  try {
    const client = await getRedisClient();
    if (!client) return;
    const serialized = JSON.stringify(message);
    await client.rPush(CHAT_REDIS_KEY, serialized);
    await client.lTrim(CHAT_REDIS_KEY, -CHAT_MAX_MESSAGES, -1);
    const ttl = await client.ttl(CHAT_REDIS_KEY);
    if (ttl < 0) {
      await client.expire(CHAT_REDIS_KEY, CHAT_TTL_SECONDS);
    }
  } catch (err) {
    console.error("[Chat] Failed to save message to Redis:", err);
  }
}

async function loadChatHistory() {
  try {
    const client = await getRedisClient();
    if (!client) return [];
    const raw = await client.lRange(CHAT_REDIS_KEY, 0, -1);
    return raw
      .map((s) => { try { return JSON.parse(s); } catch { return null; } })
      .filter(Boolean);
  } catch (err) {
    console.error("[Chat] Failed to load history from Redis:", err);
    return [];
  }
}

export function registerChatHandlers(io, socket) {
  socket.join("global-chat");
  socket.lastChatAt = 0;

  socket.on("request-chat-history", async () => {
    const history = await loadChatHistory();
    if (history.length > 0) {
      socket.emit("chat-history", { messages: history });
    }
  });

  socket.on("chat-send", async ({ text }) => {
    if (!text || typeof text !== "string") return;
    const msg = text.trim().slice(0, 200);
    if (!msg) return;

    const now = Date.now();
    if (now - socket.lastChatAt < 2000) {
      socket.emit("error-message", { message: "Too many messages. Please wait." });
      return;
    }
    socket.lastChatAt = now;

    const chatMessage = {
      displayName: socket.user.displayName,
      id: generateId(),
      text: msg,
      timestamp: now,
      userId: socket.user._id.toString(),
      username: socket.user.username
    };

    await saveChatMessage(chatMessage);
    io.to("global-chat").emit("chat-message", chatMessage);
  });
}
