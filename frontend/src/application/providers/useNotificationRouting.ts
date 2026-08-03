import { useEffect, useState } from "react";

import * as Notifications from "expo-notifications";

import { resolveAllowedRoute } from "@/application/providers/appNavigation";

export function useNotificationRouting(enabled: boolean) {
  const [notificationTarget, setNotificationTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const targetScreen = response.notification.request.content.data?.screen as string | undefined;
      if (!targetScreen) return;

      const targetRoute = resolveAllowedRoute(targetScreen);
      if (targetRoute) setNotificationTarget(targetRoute);
    });

    return () => sub.remove();
  }, [enabled]);

  return {
    clearNotificationTarget: () => setNotificationTarget(null),
    notificationTarget,
  };
}
