import { Text, View } from "react-native";
import { AppColors } from "@/application/providers/theme";
import { createStyles } from "@/features/profile/screens/ProfileScreen.styles";

type Props = {
  bestStreak: number;
  colors: AppColors;
  gameEntries: Array<{ emoji: string; gameId: string; label: string; stat: { plays: number; wins: number; points: number; currentStreak: number; maxStreak: number } }>;
  guessDistribution: number[];
  maxDist: number;
  styles: ReturnType<typeof createStyles>;
  totalPlays: number;
  totalPoints: number;
  winPct: number;
};

export function ProfileStatsSection({ colors, styles, bestStreak, totalPlays, winPct, totalPoints, gameEntries, guessDistribution, maxDist }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>სტატისტიკა</Text>
      <View style={styles.statsBar}>
        <View style={styles.statBarItem}><Text style={styles.statBarNum}>{totalPlays}</Text><Text style={styles.statBarLbl}>თამაში</Text></View>
        <View style={styles.statBarDivider} />
        <View style={styles.statBarItem}><Text style={styles.statBarNum}>{winPct}%</Text><Text style={styles.statBarLbl}>მოგება</Text></View>
        <View style={styles.statBarDivider} />
        <View style={styles.statBarItem}><Text style={styles.statBarNum}>{bestStreak}</Text><Text style={styles.statBarLbl}>რეკორდი</Text></View>
        <View style={styles.statBarDivider} />
        <View style={styles.statBarItem}><Text style={styles.statBarNum}>{totalPoints}</Text><Text style={styles.statBarLbl}>ქულა</Text></View>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <Text style={styles.sectionSubtitle}>სიტყვოს გამოიცნობის განაწილება</Text>
        <View style={styles.distribution}>
          {guessDistribution.map((count, index) => {
            const widthPercent = `${Math.max(8, (count / maxDist) * 100)}%` as `${number}%`;
            return (
              <View key={index} style={styles.distributionRow}>
                <Text style={styles.guessNumber}>{index + 1}</Text>
                <View style={styles.barTrack}><View style={[styles.bar, { width: widthPercent, backgroundColor: colors.accent }]}><Text style={styles.barText}>{count}</Text></View></View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
