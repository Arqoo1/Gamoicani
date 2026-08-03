import { Text, View } from "react-native";
import { AppColors } from "@/application/providers/theme";
import { createStyles } from "@/features/profile/screens/ProfileScreen.styles";

type Props = {
  bonusClaimed: boolean;
  colors: AppColors;
  dailyQuestsData: Array<{ title: string; progress: number; target: number; completed: boolean }>;
  styles: ReturnType<typeof createStyles>;
};

export function ProfileQuestsSection({ colors, styles, dailyQuestsData, bonusClaimed }: Props) {
  return (
    <View style={styles.card}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={styles.cardTitle}>დღიური ქუესთები</Text>
        <Text style={{ color: colors.correct, fontWeight: "800", marginRight: 16 }}>{bonusClaimed ? "✓ მიღებული" : "+3 ქულა"}</Text>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        {dailyQuestsData.length === 0 ? (
          <Text style={{ color: colors.secondaryText, textAlign: "center", marginTop: 8 }}>ქუესთები არ მოიძებნა</Text>
        ) : (
          dailyQuestsData.map((q, idx) => (
            <View key={idx} style={styles.questRow}>
              <View style={styles.questInfo}>
                <Text style={[styles.questTitle, q.completed && { color: colors.correct }]}>{q.title}</Text>
                <Text style={styles.questProgressText}>{q.progress} / {q.target}</Text>
              </View>
              <View style={styles.questProgressBarBg}>
                <View style={[styles.questProgressBar, { width: `${(q.progress / q.target) * 100}%`, backgroundColor: q.completed ? colors.correct : colors.accent }]} />
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
