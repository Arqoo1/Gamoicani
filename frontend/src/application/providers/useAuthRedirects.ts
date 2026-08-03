import { useEffect } from "react";
import { usePathname, useRouter } from "expo-router";

import { useAuth } from "@/application/providers/auth";

export function useAuthRedirects() {
  const { status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

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

  return { pathname, status };
}
