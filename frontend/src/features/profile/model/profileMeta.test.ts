import { describe, expect, it } from "vitest";

import { getProfileStatsSummary, normalizeGuessDistribution } from "@/features/profile/model/profileMeta";
import { API_BASE_URL } from "@/shared/api/client";
import { getMediaUrl } from "./profileMeta";

describe("getMediaUrl", () => {
  it("keeps absolute media URLs unchanged", () => {
    expect(getMediaUrl("https://cdn.example.com/a.jpg")).toBe("https://cdn.example.com/a.jpg");
  });

  it("builds upload URLs from API origin", () => {
    const origin = API_BASE_URL.replace(/\/api\/?$/, "");

    expect(getMediaUrl("/uploads/a.jpg")).toBe(`${origin}/uploads/a.jpg`);
    expect(getMediaUrl("uploads/a.jpg")).toBe(`${origin}/uploads/a.jpg`);
  });
});

describe("normalizeGuessDistribution", () => {
  it("returns six safe numeric buckets", () => {
    expect(normalizeGuessDistribution([1, "2", -5, 3.7])).toEqual([1, 2, 0, 3, 0, 0]);
  });
});

describe("getProfileStatsSummary", () => {
  it("summarizes profile game stats", () => {
    const summary = getProfileStatsSummary({
      gameStats: {
        wordle: {
          currentStreak: 2,
          lastCompletedKey: "1",
          lastPlayedAt: null,
          maxStreak: 4,
          plays: 10,
          points: 12,
          wins: 6,
        },
        andazebi: {
          currentStreak: 1,
          lastCompletedKey: null,
          lastPlayedAt: null,
          maxStreak: 3,
          plays: 5,
          points: 9,
          wins: 4,
        },
      },
    });

    expect(summary.totalPlays).toBe(15);
    expect(summary.totalWins).toBe(10);
    expect(summary.bestStreak).toBe(4);
    expect(summary.winPct).toBe(67);
  });
});
