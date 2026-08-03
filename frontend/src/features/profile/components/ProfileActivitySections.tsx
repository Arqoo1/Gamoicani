import { Text, View } from "react-native";
import { AchievementsCard } from "@/features/profile/ui/AchievementsCard";
import { ChangePasswordCard } from "@/features/profile/ui/ChangePasswordCard";
import { AppColors } from "@/application/providers/theme";
import { AuthUser, GameStat } from "@/entities/user/types";
import { createStyles } from "@/features/profile/screens/ProfileScreen.styles";

type DailyQuest = {
  completed: boolean;
  id: string;
  progress: number;
  target: number;
  title: string;
  type: string;
};

type GameEntry = { emoji: string; gameId: string; label: string; stat: GameStat };

export function ProfileActivitySections({
  colors,
  styles,
  user,
  dailyQuestsData,
  bonusClaimed,
  changePassword,
  gameEntries,
}: {
  colors: AppColors;
  styles: ReturnType<typeof createStyles>;
  user: AuthUser;
  dailyQuestsData: DailyQuest[];
  bonusClaimed: boolean;
  changePassword: (input: { currentPassword: string; newPassword: string }) => Promise<void>;
  gameEntries: GameEntry[];
  guessDistribution: number[];
  maxDist: number;
}) {
  return (
    <>
      <AchievementsCard user={user} styles={styles} colors={colors} />
      <View style={styles.card}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.cardTitle}>📅 დღიური ქუესტები</Text>
          {bonusClaimed ? <Text style={{ color: colors.correct, fontWeight: "800", marginRight: 16 }}>✓ მიღებულია</Text> : <Text style={{ color: colors.correct, fontWeight: "800", marginRight: 16 }}>+3 ქულა</Text>}
        </View>
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          {dailyQuestsData.length === 0 && <Text style={{ color: colors.secondaryText, textAlign: "center", marginTop: 8 }}>ქუესტები არ მოიძებნება</Text>}
          {dailyQuestsData.map((q, idx: number) => (
            <View key={idx} style={styles.questRow}>
              <View style={styles.questInfo}>
                <Text style={[styles.questTitle, q.completed && { color: colors.correct }]}>{q.title}</Text>
                <Text style={styles.questProgressText}>{q.progress} / {q.target}</Text>
              </View>
              <View style={styles.questProgressBarBg}>
                <View style={[styles.questProgressBar, { width: `${(q.progress / q.target) * 100}%`, backgroundColor: q.completed ? colors.correct : colors.accent }]} />
              </View>
            </View>
          ))}
        </View>
      </View>
      {gameEntries.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎮 თამაშის ჩანაწერები</Text>
          {gameEntries.map(({ emoji, gameId, label, stat }, index: number) => {
            const gWinPct = stat.plays > 0 ? Math.round((stat.wins / stat.plays) * 100) : 0;
            return (
              <View key={gameId}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.gameRow}>
                  <View style={styles.gameHeader}>
                    <Text style={styles.gameEmoji}>{emoji}</Text>
                    <Text style={styles.gameLabel}>{label}</Text>
                    <View style={[styles.gamePointsBadge, { backgroundColor: colors.accentMuted }]}>
                      <Text style={[styles.gamePointsText, { color: colors.accent }]}>{stat.points} ქულა</Text>
                    </View>
                  </View>
                  <View style={styles.gameStats}>
                    <View style={styles.gameStatItem}><Text style={styles.gameStatNum}>{stat.plays}</Text><Text style={styles.gameStatLbl}>თამაში</Text></View>
                    <View style={styles.gameStatItem}><Text style={styles.gameStatNum}>{stat.wins}</Text><Text style={styles.gameStatLbl}>მოგება</Text></View>
                    <View style={styles.gameStatItem}><Text style={styles.gameStatNum}>{gWinPct}%</Text><Text style={styles.gameStatLbl}>%</Text></View>
                    <View style={styles.gameStatItem}><Text style={styles.gameStatNum}>{stat.currentStreak}</Text><Text style={styles.gameStatLbl}>სერია</Text></View>
                    <View style={styles.gameStatItem}><Text style={[styles.gameStatNum, { color: colors.accent }]}>{stat.maxStreak}</Text><Text style={styles.gameStatLbl}>რეკორდი</Text></View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
      <ChangePasswordCard styles={styles} colors={colors} changePassword={changePassword} />
    </>
  );
}
