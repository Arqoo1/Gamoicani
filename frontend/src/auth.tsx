import { useRouter } from "expo-router";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  AuthUser,
  changePassword as apiChangePassword,
  clearAuthToken,
  fetchMe,
  getAuthToken,
  loginAccount,
  registerAccount,
  updateMyProfile,
  uploadCoverPhoto as apiUploadCoverPhoto,
  uploadProfilePhoto as apiUploadProfilePhoto
} from "./api";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  changePassword: (input: { currentPassword: string; newPassword: string }) => Promise<void>;
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
  /** Instantly update the in-memory user from a fresh server response (e.g. after submitting a score). */
  updateUser: (nextUser: AuthUser) => void;
  status: AuthStatus;
  updateProfile: (input: {
    avatarColor?: string;
    bio?: string;
    coverGradient?: number;
    coverPhotoUrl?: string | null;
    displayName?: string;
    profilePhotoUrl?: string | null;
    username?: string;
  }) => Promise<void>;
  uploadCoverPhoto: (uri: string) => Promise<void>;
  uploadProfilePhoto: (uri: string) => Promise<void>;
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

  const updateProfile = useCallback(async (input: {
    avatarColor?: string;
    bio?: string;
    coverGradient?: number;
    coverPhotoUrl?: string | null;
    displayName?: string;
    profilePhotoUrl?: string | null;
    username?: string;
  }) => {
    setError(null);
    const response = await updateMyProfile(input);
    setUser(response.user);
    setStatus("authenticated");
  }, []);

  const changePassword = useCallback(
    async (input: { currentPassword: string; newPassword: string }) => {
      setError(null);
      await apiChangePassword(input);
    },
    []
  );

  const uploadProfilePhoto = useCallback(async (uri: string) => {
    setError(null);
    const response = await apiUploadProfilePhoto(uri);
    setUser(response.user);
    setStatus("authenticated");
  }, []);

  const uploadCoverPhoto = useCallback(async (uri: string) => {
    setError(null);
    const response = await apiUploadCoverPhoto(uri);
    setUser(response.user);
    setStatus("authenticated");
  }, []);

  const updateUser = useCallback((nextUser: AuthUser) => {
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    await clearAuthToken();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      changePassword,
      error,
      login,
      logout,
      refreshUser,
      register,
      status,
      updateProfile,
      updateUser,
      uploadCoverPhoto,
      uploadProfilePhoto,
      user
    }),
    [
      changePassword,
      error,
      login,
      logout,
      refreshUser,
      register,
      status,
      updateProfile,
      updateUser,
      uploadCoverPhoto,
      uploadProfilePhoto,
      user
    ]
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
