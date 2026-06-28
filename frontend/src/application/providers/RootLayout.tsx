import "react-native-gesture-handler";

import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { ActivityIndicator, AppState, AppStateStatus, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import * as Notifications from "expo-notifications";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { AuthProvider, useAuth } from "@/application/providers/auth";
import { SettingsProvider } from "@/application/providers/settings";
import { SocketProvider } from "@/application/providers/socket";
import { ThemeProvider, useAppTheme } from "@/application/providers/theme";
import { savePushTokenAPI } from "@/features/auth/api/authApi";
import { registerForPushNotificationsAsync, scheduleInactivityReminder } from "@/shared/services/notifications";
GoogleSignin.configure({
  webClientId: "952002684410-m0b2n1efru099m99gf768gr199b05tfq.apps.googleusercontent.com",
});

function ThemedStack() {
  const { colors, isDark } = useAppTheme();
  const { status, refreshUser } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (status !== "authenticated") return;

    registerForPushNotificationsAsync().then((token) => {
      if (token) savePushTokenAPI(token);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const screen = response.notification.request.content.data?.screen as string | undefined;
      if (screen) router.replace(screen as any);
    });

    return () => {
      responseSub.remove();
    };
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    scheduleInactivityReminder();

    const foregroundSub = AppState.addEventListener("change", (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        scheduleInactivityReminder();
        if (status === "authenticated") refreshUser();
      }
      appState.current = nextState;
    });

    return () => foregroundSub.remove();
  }, [status, refreshUser]);

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
    return (
      <View style={{ alignItems: "center", backgroundColor: colors.background, flex: 1, justifyContent: "center" }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background }
        }}
      />
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SettingsProvider>
          <AuthProvider>
            <SocketProvider>
              <ThemedStack />
            </SocketProvider>
          </AuthProvider>
        </SettingsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
