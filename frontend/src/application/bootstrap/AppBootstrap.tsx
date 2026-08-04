import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { ActivityIndicator, AppState, AppStateStatus, View } from "react-native";

import * as Notifications from "expo-notifications";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { useAuth } from "@/application/providers/auth";
import { useAppTheme } from "@/application/providers/theme";
import { useEnsureSocket } from "@/application/providers/socket";
import { savePushTokenAPI } from "@/features/auth/api/authApi";
import {
  registerForPushNotificationsAsync,
  scheduleInactivityReminder,
} from "@/shared/services/notifications";

function AppLoadingState() {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ alignItems: "center", backgroundColor: colors.background, flex: 1, justifyContent: "center" }}
    >
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

export function AppBootstrap() {
  const { colors, isDark } = useAppTheme();
  const { status, refreshUser: refreshAuthUser } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEnsureSocket();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: "952002684410-m0b2n1efru099m99gf768gr199b05tfq.apps.googleusercontent.com",
    });
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;

    void registerForPushNotificationsAsync().then((token) => {
      if (token) void savePushTokenAPI(token);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const screen = response.notification.request.content.data?.screen as string | undefined;
      if (screen) {
        router.replace(
          screen as
            | "/"
            | "/login"
            | "/shop"
            | "/feed"
            | "/profile"
            | "/stats"
            | "/lobby"
            | "/settings"
            | "/leaderboard"
            | "/multiplayer"
        );
      }
    });

    return () => {
      responseSub.remove();
    };
  }, [router, status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    scheduleInactivityReminder();

    const foregroundSub = AppState.addEventListener("change", (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === "active") {
        scheduleInactivityReminder();
        if (status === "authenticated") void refreshAuthUser();
      }
      appState.current = nextState;
    });

    return () => {
      foregroundSub.remove();
    };
  }, [refreshAuthUser, status]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" && pathname !== "/login") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated" && pathname === "/login") {
      router.replace("/");
    }
  }, [pathname, router, status]);

  if (status === "loading" || (status === "unauthenticated" && pathname !== "/login")) {
    return <AppLoadingState />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}
