import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { AuthUser } from "@/entities/user/types";
import { fetchMe } from "@/features/auth/api/authApi";
import { runAuthBootstrap } from "@/features/auth/services/authBootstrap";
import { queryKeys } from "@/shared/api/queryKeys";
import { clearAuthToken, getAuthToken } from "@/shared/api/client";
import { crashReporter } from "@/shared/services/crashReporter";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setSessionUser: (user: AuthUser | null) => void;
  status: AuthStatus;
  updateUser: (nextUser: AuthUser) => void;
  user: AuthUser | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [tokenExists, setTokenExists] = useState<boolean | null>(null);

  useEffect(() => {
    getAuthToken().then((t) => setTokenExists(Boolean(t)));
  }, []);

  const { data: user, isLoading, refetch } = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      const token = await getAuthToken();
      if (!token) return null;
      try {
        const nextUser = await fetchMe();
        runAuthBootstrap(nextUser, (repaired) => {
          queryClient.setQueryData(queryKeys.auth.me(), repaired);
        }).catch(() => {});
        return nextUser;
      } catch (err) {
        await clearAuthToken();
        throw err;
      }
    },
    enabled: tokenExists === true,
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => {
    crashReporter.setUser(user ? { id: user.id, email: user.email, username: user.username } : null);
  }, [user]);

  const status: AuthStatus = tokenExists === null || (tokenExists && isLoading)
    ? "loading"
    : user
    ? "authenticated"
    : "unauthenticated";

  const setSessionUser = useCallback((nextUser: AuthUser | null) => {
    queryClient.setQueryData(queryKeys.auth.me(), nextUser);
    setTokenExists(Boolean(nextUser));
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    const t = await getAuthToken();
    setTokenExists(Boolean(t));
    if (t) {
      await refetch();
    }
  }, [refetch]);

  const updateUser = useCallback((nextUser: AuthUser) => {
    queryClient.setQueryData(queryKeys.auth.me(), nextUser);
  }, [queryClient]);

  const logout = useCallback(async () => {
    await clearAuthToken();
    queryClient.setQueryData(queryKeys.auth.me(), null);
    setTokenExists(false);
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      logout,
      refreshUser,
      setSessionUser,
      status,
      updateUser,
      user: user ?? null,
    }),
    [logout, refreshUser, setSessionUser, status, updateUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}

export function useLogoutAndGoLogin() {
  const router = useRouter();
  const { logout } = useAuth();

  return useCallback(async () => {
    await logout();
    router.replace("/login");
  }, [logout, router]);
}
