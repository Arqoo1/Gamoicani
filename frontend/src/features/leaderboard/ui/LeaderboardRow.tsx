import { Text, View } from "react-native";

import { LeaderboardEntry } from "@/entities/score/types";

type BoardMode = "global" | "wordle" | "andazebi" | "friends";

type LeaderboardRowProps = {
  entry: LeaderboardEntry;
  mode: BoardMode;
  styles: Record<string, any>;
};

export function LeaderboardRow({ entry, mode, styles }: LeaderboardRowProps) {
  const score = mode === "global" || mode === "friends" ? entry.totalPoints ?? 0 : entry.streak ?? 0;
  const label = mode === "global" || mode === "friends" ? "ქულა" : "სერია";
  const pointsForRank = entry.totalPoints ?? (score > 10 ? 2000 : 500);
  let rankIcon = "🥉";
  let rankColor = "#cd7f32";
  if (pointsForRank >= 5000) {
    rankIcon = "🏆";
    rankColor = "#FFD700";
  } else if (pointsForRank >= 1000) {
    rankIcon = "🥈";
    rankColor = "#C0C0C0";
  }

  return (
    <View style={styles.row}>
      <Text style={styles.rank}>{entry.rank}</Text>
      <View style={styles.playerCopy}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={styles.playerName}>{entry.displayName}</Text>
          {mode === "global" && (
            <View style={{ paddingHorizontal: 4, paddingVertical: 1, borderRadius: 8, borderWidth: 1, borderColor: rankColor }}>
              <Text style={{ fontSize: 10 }}>{rankIcon}</Text>
            </View>
          )}
        </View>
        <Text style={styles.username}>@{entry.username}</Text>
      </View>
      <View style={styles.scoreBox}>
        <Text style={styles.score}>{score}</Text>
        <Text style={styles.scoreLabel}>{label}</Text>
      </View>
    </View>
  );
}
