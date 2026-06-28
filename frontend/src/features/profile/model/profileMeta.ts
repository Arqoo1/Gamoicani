import { API_BASE_URL } from "@/shared/api/client";

export const COVER_GRADIENTS = [
  ["#0f4c35", "#2f9e5d"],
  ["#1a1a2e", "#48c978"],
  ["#0d1b2a", "#2176ae"],
  ["#2d0037", "#9b5de5"],
  ["#3d0000", "#e63946"],
  ["#1b2838", "#f77f00"],
  ["#101820", "#fee715"],
  ["#1c1c1c", "#aab8c4"]
];

export const AVATAR_COLORS = [
  "#2f9e5d", "#48c978", "#2176ae", "#9b5de5",
  "#e63946", "#f77f00", "#dfb34a", "#66727f"
];

export const GAME_META: Record<string, { label: string; emoji: string }> = {
  wordle:   { label: "Wordle",   emoji: "🟩" },
  andazebi: { label: "Andazebi", emoji: "🎯" },
  trivia:   { label: "Trivia",   emoji: "🧠" }
};

export const ACHIEVEMENTS_META: Record<string, { label: string; emoji: string }> = {
  "first-win": { label: "პირველი გამარჯვება", emoji: "🏆" },
  "wordle-1": { label: "პირველივე ცდა", emoji: "🎯" },
  "wordle-2": { label: "ორი ცდა", emoji: "⚡" },
  "wordle-3": { label: "სამი ცდა", emoji: "🧠" },
  "streak-7": { label: "7 დღის სტრიქი", emoji: "🔥" },
  "perfect-week": { label: "იდეალური კვირა", emoji: "⭐" },
  "all-games": { label: "ყველა თამაში", emoji: "🎮" }
};

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

export function getRankInfo(points: number) {
  if (points >= 5000) return { label: "Gold", color: "#FFD700", icon: "🏆", next: null };
  if (points >= 1000) return { label: "Silver", color: "#C0C0C0", icon: "🥈", next: 5000 };
  return { label: "Bronze", color: "#cd7f32", icon: "🥉", next: 1000 };
}

export function getMediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  return API_BASE_URL.replace("/api", "") + path;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("ka-GE", { year: "numeric", month: "long" });
}
