import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ContentPack } from "../models/ContentPack.js";
import { Game } from "../models/Game.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../..");

function assertNoMojibake(value, sourcePath) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);

  if (serialized.includes("áƒ")) {
    throw new Error(`Possible Georgian encoding issue detected in ${sourcePath}`);
  }
}

async function readJson(filePath) {
  const value = await fs.readFile(filePath, "utf8");
  const payload = JSON.parse(value);

  assertNoMojibake(payload, filePath);

  return payload;
}

function resolveContentPath(dataDir, contentPath) {
  if (!contentPath) {
    return null;
  }

  const normalizedPath = contentPath.replaceAll("\\", "/").replace(/^data\//, "");

  return path.join(dataDir, normalizedPath);
}

export async function seedContent({
  dataDir = path.join(projectRoot, "frontend", "data"),
  logger = console
} = {}) {
  const resolvedDataDir = path.resolve(dataDir);
  const games = await readJson(path.join(resolvedDataDir, "games.json"));

  for (const game of games) {
    await Game.updateOne(
      { gameId: game.id },
      {
        $set: {
          contentPath: game.content ?? null,
          gameId: game.id,
          href: game.href ?? null,
          status: game.status ?? "soon",
          subtitle: game.subtitle ?? "",
          title: game.title
        }
      },
      { upsert: true }
    );

    const contentPath = resolveContentPath(resolvedDataDir, game.content);

    if (!contentPath) {
      continue;
    }

    try {
      const payload = await readJson(contentPath);

      await ContentPack.updateOne(
        { gameId: game.id },
        {
          $set: {
            gameId: game.id,
            payload,
            sourcePath: game.content
          }
        },
        { upsert: true }
      );
    } catch (error) {
      logger.warn(`Skipped content for ${game.id}: ${error.message}`);
    }
  }

  return {
    count: games.length,
    dataDir: resolvedDataDir
  };
}
