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

export const SHOP_ITEMS_META: Record<string, { category: string; emoji?: string; color?: string; colors?: string[] }> = {
  "avatar-fire":   { category: "avatar",  emoji: "🔥" },
  "avatar-crown":  { category: "avatar",  emoji: "👑" },
  "avatar-gem":    { category: "avatar",  emoji: "💎" },
  "avatar-star":   { category: "avatar",  emoji: "⭐" },
  "avatar-bolt":   { category: "avatar",  emoji: "⚡" },
  "avatar-brain":  { category: "avatar",  emoji: "🧠" },
  "avatar-trophy": { category: "avatar",  emoji: "🏆" },
  "avatar-rocket": { category: "avatar",  emoji: "🚀" },
  "tag-gold":      { category: "nameTag", color: "#FFD700" },
  "tag-purple":    { category: "nameTag", color: "#9b5de5" },
  "tag-red":       { category: "nameTag", color: "#e63946" },
  "tag-blue":      { category: "nameTag", color: "#2176ae" },
  "tag-orange":    { category: "nameTag", color: "#f77f00" },
  "tag-teal":      { category: "nameTag", color: "#2ec4b6" },
  "banner-aurora": { category: "banner",  colors: ["#0f0c29", "#302b63", "#24243e"] },
  "banner-sunset": { category: "banner",  colors: ["#f77f00", "#e63946", "#9b5de5"] },
  "banner-ocean":  { category: "banner",  colors: ["#0077b6", "#00b4d8", "#90e0ef"] },
  "banner-forest": { category: "banner",  colors: ["#1b4332", "#2d6a4f", "#74c69d"] },
  "banner-fire":   { category: "banner",  colors: ["#6a040f", "#d00000", "#ffba08"] },
  "banner-galaxy": { category: "banner",  colors: ["#03045e", "#7209b7", "#f72585"] },
  "banner-neon":   { category: "banner",  colors: ["#0d0d0d", "#39ff14", "#00f5ff"] },
  "banner-candy":  { category: "banner",  colors: ["#ff6b9d", "#c44dff", "#45e3ff"] },
  "banner-gold":   { category: "banner",  colors: ["#1a0a00", "#b8860b", "#ffd700"] },
  "banner-ice":    { category: "banner",  colors: ["#e8f4f8", "#a8dadc", "#457b9d"] },
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
  if (points >= 500) return { label: "Diamond", color: "#00bfff", icon: "💎", next: null };
  if (points >= 100) return { label: "Gold", color: "#FFD700", icon: "🏆", next: 500 };
  if (points >= 50) return { label: "Silver", color: "#C0C0C0", icon: "🥈", next: 100 };
  return { label: "Bronze", color: "#cd7f32", icon: "🥉", next: 50 };
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
