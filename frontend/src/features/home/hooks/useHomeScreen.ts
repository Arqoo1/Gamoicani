import { Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/application/providers/auth";
import { GameStat } from "@/entities/user/types";
import { GameItem as ApiGameItem } from "@/entities/game/types";
import { fetchGames } from "@/features/games/api/gamesApi";
import { getDailyPuzzleNumber, WORDLE_EPOCH } from "@/features/wordle/model/wordle";

export type GameItem = {
  href?: Href;
  id: string;
  status: "ready" | "soon";
  subtitle: string;
  title: string;
};

export const homeRoutes = {
  leaderboard: "/leaderboard" as const,
  lobby: "/lobby" as const,
  profile: "/profile" as const,
  settings: "/settings" as const,
} as const;

export const fallbackGameList: GameItem[] = [
  { id: "wordle", title: "სიტყვობანა", subtitle: "ქართული სიტყვა", href: "/wordle" as Href, status: "ready" },
  {
    id: "andazebi",
    title: "ანდაზები",
    subtitle: "ქართული ანდაზები გამოტოვებული სიტყვებით",
    href: "/andazebi" as Href,
    status: "ready",
  },
  {
    id: "geography",
    title: "გეოგრაფია",
    subtitle: "ქალაქები, რეგიონები, ღირსშესანიშნაობები",
    status: "soon",
  },
  {
    id: "people",
    title: "ცნობილი ქართველები",
    subtitle: "მწერლები, სპორტსმენები, ისტორიული ფიგურები",
    status: "soon",
  },
  { id: "quotes", title: "ციტატები", subtitle: "ფილმები, სიმღერები, ფრაზები", status: "soon" },
  { id: "trivia", title: "ვიქტორინა", subtitle: "დღის მოკლე ქართული კითხვა", status: "soon" },
];

function getLocalDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isDoneToday(gameId: string, gameStats: Record<string, GameStat> | undefined): boolean {
  if (!gameStats) return false;
  const stat = gameStats[gameId];
  if (gameId === "wordle") {
    if (!stat?.lastCompletedKey) return false;
    return stat.lastCompletedKey === String(getDailyPuzzleNumber(WORDLE_EPOCH));
  }
  if (gameId === "andazebi" || gameId === "trivia") {
    const today = getLocalDateKey();
    return stat?.lastCompletedKey === today;
  }
  return false;
}

export function useHomeGames() {
  const { user } = useAuth();
  const [guideVisible, setGuideVisible] = useState(false);

  const { data: gameList = fallbackGameList } = useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const nextGames: ApiGameItem[] = await fetchGames();
      if (!nextGames || nextGames.length === 0) return fallbackGameList;
      return nextGames.map((game) => ({
        href: (game.href ?? undefined) as Href | undefined,
        id: game.id ?? game.gameId ?? game.title,
        status: game.status,
        subtitle: game.subtitle,
        title: game.title,
      }));
    },
    placeholderData: fallbackGameList,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const gameCards = useMemo(
    () =>
      gameList.map((game) => ({
        ...game,
        ready: game.status === "ready",
        done: isDoneToday(game.id, user?.gameStats),
      })),
    [gameList, user?.gameStats]
  );

  const isGameDone = useMemo(
    () => (gameId: string) => isDoneToday(gameId, user?.gameStats),
    [user?.gameStats]
  );

  return {
    gameCards,
    guideVisible,
    isGameDone,
    setGuideVisible,
    user,
  };
}

export const useHomeScreen = useHomeGames;
