import { useEffect } from "react";
import { useRouter } from "expo-router";

import { useAuth } from "@/application/providers/auth";
import { useAuthRedirects } from "@/application/providers/useAuthRedirects";
import { useNotificationRouting } from "@/application/providers/useNotificationRouting";

export function AppNavigationCoordinator() {
  const { status } = useAuth();
  const router = useRouter();
  const { notificationTarget, clearNotificationTarget } = useNotificationRouting(status === "authenticated");

  useAuthRedirects();

  useEffect(() => {
    if (!notificationTarget) return;
    router.replace(notificationTarget as never);
    clearNotificationTarget();
  }, [clearNotificationTarget, notificationTarget, router]);

  return null;
}
