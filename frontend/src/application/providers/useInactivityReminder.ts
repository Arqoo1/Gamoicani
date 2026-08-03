import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

import { useAuth } from "@/application/providers/auth";
import { scheduleInactivityReminder } from "@/shared/services/notifications";

export function useInactivityReminder() {
  const { status, refreshUser } = useAuth();
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (status !== "authenticated") return;

    scheduleInactivityReminder();

    const foregroundSub = AppState.addEventListener("change", (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === "active") {
        scheduleInactivityReminder();
        refreshUser();
      }
      appState.current = nextState;
    });

    return () => foregroundSub.remove();
  }, [refreshUser, status]);
}
