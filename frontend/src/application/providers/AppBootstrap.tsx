import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { useAuth } from "@/application/providers/auth";
import { AppNavigationCoordinator } from "@/application/providers/AppNavigationCoordinator";
import { useGoogleSigninBootstrap } from "@/application/providers/useGoogleSigninBootstrap";
import { useAppTheme } from "@/application/providers/theme";
import { useInactivityReminder } from "@/application/providers/useInactivityReminder";
import { usePushNotificationsBootstrap } from "@/application/providers/usePushNotificationsBootstrap";

export function AppBootstrap() {
  const { colors, isDark } = useAppTheme();
  const { status } = useAuth();

  useGoogleSigninBootstrap();
  usePushNotificationsBootstrap();
  useInactivityReminder();

  if (status === "loading" || status === "unauthenticated") {
    return (
      <View style={{ alignItems: "center", backgroundColor: colors.background, flex: 1, justifyContent: "center" }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <>
      <AppNavigationCoordinator />
      <Stack screenOptions={{ contentStyle: { backgroundColor: colors.background }, headerShown: false }} />
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}
