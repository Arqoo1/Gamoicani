import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { BookIcon, LeaderboardIcon } from "@/features/home/ui/HomeIcons";
import { AppColors } from "@/application/providers/theme";
import { createStyles } from "@/features/home/screens/HomeScreen.styles";

export function HomeHeader({
  colors,
  onOpenGuide,
  onOpenLeaderboard,
  onOpenLobby,
  onOpenProfile,
  onOpenSettings,
  profileLabel,
  styles,
}: {
  colors: AppColors;
  onOpenGuide: () => void;
  onOpenLeaderboard: () => void;
  onOpenLobby: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  profileLabel: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        <Text style={styles.kicker}>ქართული თამაშები</Text>
        <Text style={styles.title}>გამოიცანი</Text>
      </View>
      <View style={styles.toolRow}>
        <Pressable
          style={({ pressed }) => [styles.toolButton, pressed && styles.cardPressed]}
          onPress={onOpenSettings}
        >
          <Feather name="settings" size={18} color={colors.primaryText} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.toolButton, pressed && styles.cardPressed]}
          onPress={onOpenGuide}
        >
          <BookIcon color={colors.primaryText} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.toolButton, pressed && styles.cardPressed]}
          onPress={onOpenLeaderboard}
        >
          <LeaderboardIcon color={colors.primaryText} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.toolButton, pressed && styles.cardPressed]}
          onPress={onOpenLobby}
        >
          <Feather name="users" size={18} color={colors.primaryText} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.profileButton, pressed && styles.cardPressed]}
          onPress={onOpenProfile}
        >
          <Text style={styles.profileButtonText}>{profileLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}
