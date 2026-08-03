import { useEffect } from "react";

import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";

import { useAuth } from "@/application/providers/auth";
import { savePushTokenAPI } from "@/features/auth/api/authApi";
import { registerForPushNotificationsAsync } from "@/shared/services/notifications";
import { resolveAllowedRoute } from "@/application/providers/appNavigation";

export function usePushNotificationsBootstrap() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") return;

    let mounted = true;

    registerForPushNotificationsAsync().then((token) => {
      if (mounted && token) savePushTokenAPI(token);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const targetScreen = response.notification.request.content.data?.screen as string | undefined;
      if (!targetScreen) return;
      const targetRoute = resolveAllowedRoute(targetScreen);
      if (targetRoute) router.replace(targetRoute as never);
    });

    return () => {
      mounted = false;
      responseSub.remove();
    };
  }, [router, status]);
}
