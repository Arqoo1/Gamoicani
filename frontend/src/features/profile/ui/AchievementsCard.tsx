import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ACHIEVEMENTS_META } from "@/features/profile/model/profileMeta";
import { AuthUser } from "@/entities/user/types";
import { AppColors } from "@/application/providers/theme";
import { createStyles } from "@/features/profile/screens/ProfileScreen.styles";

type AchievementsCardProps = {
  user: AuthUser;
  styles: ReturnType<typeof createStyles>;
  colors: AppColors;
};

export const AchievementsCard = memo(function AchievementsCard({
  user,
  styles,
  colors,
}: AchievementsCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>🏆 მიღწევები</Text>
      <View style={styles.achievementsGrid}>
        {Object.entries(ACHIEVEMENTS_META).map(([id, meta]) => {
          const achievement = user.achievements?.find((a) => a.id === id);
          const isLocked = !achievement;
          return (
            <View key={id} style={[styles.achievementBadge, isLocked && styles.achievementBadgeLocked]}>
              <Text style={[styles.achievementEmoji, isLocked && styles.achievementEmojiLocked]}>
                {meta.emoji}
              </Text>
              <Text style={styles.achievementLabel}>{meta.label}</Text>
              {isLocked && (
                <Feather name="lock" size={12} color={colors.secondaryText} style={{ marginTop: 4 }} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
});
