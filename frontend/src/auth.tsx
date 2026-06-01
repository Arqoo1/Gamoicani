import { useRouter } from "expo-router";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  AuthUser,
  clearAuthToken,
  fetchMe,
  getAuthToken,
  loginAccount,
  registerAccount,
  updateMyProfile
} from "./api";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  error: string | null;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  register: (input: {
    displayName: string;
    email: string;
    password: string;
    username: string;
  }) => Promise<void>;
  refreshUser: () => Promise<void>;
  status: AuthStatus;
  updateProfile: (input: { displayName?: string; username?: string }) => Promise<void>;
  user: AuthUser | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    const token = await getAuthToken();

    if (!token) {
      setUser(null);
      setStatus("unauthenticated");
      return;
    }

    try {
      const nextUser = await fetchMe();
      setUser(nextUser);
      setStatus("authenticated");
      setError(null);
    } catch {
      await clearAuthToken();
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (input: { email: string; password: string }) => {
    setError(null);
    const response = await loginAccount(input);
    setUser(response.user);
    setStatus("authenticated");
  }, []);

  const register = useCallback(
    async (input: { displayName: string; email: string; password: string; username: string }) => {
      setError(null);
      const response = await registerAccount(input);
      setUser(response.user);
      setStatus("authenticated");
    },
    []
  );

  const updateProfile = useCallback(async (input: { displayName?: string; username?: string }) => {
    setError(null);
    const response = await updateMyProfile(input);
    setUser(response.user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    await clearAuthToken();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      error,
      login,
      logout,
      refreshUser,
      register,
      status,
      updateProfile,
      user
    }),
    [error, login, logout, refreshUser, register, status, updateProfile, user]
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
