import { View, Text } from "react-native";
import { createStyles } from "@/features/profile/screens/ProfileScreen.styles";

export function ProfileStatsBar({
  styles,
  totalPlays,
  winPct,
  bestStreak,
  points,
}: {
  styles: ReturnType<typeof createStyles>;
  totalPlays: number;
  winPct: number;
  bestStreak: number;
  points: number;
}) {
  return (
    <View style={styles.statsBar}>
      <View style={styles.statBarItem}>
        <Text style={styles.statBarNum}>{totalPlays}</Text>
        <Text style={styles.statBarLbl}>თამაში</Text>
      </View>
      <View style={styles.statBarDivider} />
      <View style={styles.statBarItem}>
        <Text style={styles.statBarNum}>{winPct}%</Text>
        <Text style={styles.statBarLbl}>მოგება</Text>
      </View>
      <View style={styles.statBarDivider} />
      <View style={styles.statBarItem}>
        <Text style={styles.statBarNum}>{bestStreak}</Text>
        <Text style={styles.statBarLbl}>რეკორდი</Text>
      </View>
      <View style={styles.statBarDivider} />
      <View style={styles.statBarItem}>
        <Text style={styles.statBarNum}>{points}</Text>
        <Text style={styles.statBarLbl}>ქულა</Text>
      </View>
    </View>
  );
}
