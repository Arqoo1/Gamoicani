import { useRouter } from "expo-router";
import { useMemo } from "react";
import { StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/application/providers/theme";
import { HomeHeader } from "@/features/home/components/HomeHeader";
import { GameList } from "@/features/home/components/GameList";
import { GameGuideModal } from "@/features/home/components/GameGuideModal";
import { homeRoutes, useHomeGames } from "@/features/home/hooks/useHomeScreen";
import { createStyles } from "@/features/home/screens/HomeScreen.styles";

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { gameCards, guideVisible, setGuideVisible, user } = useHomeGames();

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safe}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <View style={styles.container}>
        <HomeHeader
          colors={colors}
          onOpenGuide={() => setGuideVisible(true)}
          onOpenLeaderboard={() => router.push(homeRoutes.leaderboard)}
          onOpenLobby={() => router.push(homeRoutes.lobby)}
          onOpenProfile={() => router.push(homeRoutes.profile)}
          onOpenSettings={() => router.push(homeRoutes.settings)}
          profileLabel={user?.username.slice(0, 2).toUpperCase() ?? "?"}
          styles={styles}
        />

        <GameList
          gameList={gameCards}
          onPressGame={(href) => {
            if (href) router.push(href);
          }}
          styles={styles}
        />
      </View>

      <GameGuideModal styles={styles} visible={guideVisible} onClose={() => setGuideVisible(false)} />
    </SafeAreaView>
  );
}
