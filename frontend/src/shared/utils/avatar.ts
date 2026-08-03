const AVATAR_COLORS = ["#2f9e5d", "#48c978", "#2176ae", "#9b5de5", "#e63946", "#f77f00", "#dfb34a"];

export function getUserColor(username: string): string {
  let hash = 0;
  for (const ch of username) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}
