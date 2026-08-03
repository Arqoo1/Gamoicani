import { useRouter } from "expo-router";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { AuthUser } from "@/entities/user/types";
import {
  changePassword as apiChangePassword,
  fetchMe,
  loginAccount,
  loginWithGoogleAPI,
  registerAccount,
  updateMyProfile
} from "@/features/auth/api/authApi";
import { runAuthBootstrap } from "@/features/auth/services/authBootstrap";
import {
  uploadCoverPhoto as apiUploadCoverPhoto,
  uploadProfilePhoto as apiUploadProfilePhoto
} from "@/features/profile/api/profileApi";
import { clearAuthToken, getAuthToken, hasTokenExpired, isAuthFailure } from "@/shared/api/client";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  changePassword: (input: { currentPassword: string; newPassword: string }) => Promise<void>;
  error: string | null;
  login: (input: { email: string; password: string }) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (input: {
    displayName: string;
    email: string;
    password: string;
    username: string;
  }) => Promise<void>;
  refreshUser: () => Promise<void>;
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

  const resetAuthState = useCallback(async (message: string | null = null) => {
    await clearAuthToken();
    setUser(null);
    setStatus("unauthenticated");
    setError(message);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = await getAuthToken();

    if (!token || hasTokenExpired(token)) {
      await resetAuthState("Your session has expired. Please sign in again.");
      return;
    }

    try {
      const nextUser = await fetchMe();
      setUser(nextUser);
      setStatus("authenticated");
      setError(null);
      runAuthBootstrap(nextUser, (repaired) => setUser(repaired)).catch(() => {});
    } catch (caughtError) {
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        console.warn("[Auth] Failed to refresh user:", caughtError);
      }

      if (isAuthFailure(caughtError)) {
        await resetAuthState("Your session has expired. Please sign in again.");
        return;
      }

      await resetAuthState("We could not refresh your session. Please sign in again.");
    }
  }, [resetAuthState]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (input: { email: string; password: string }) => {
    setError(null);
    try {
      const response = await loginAccount(input);
      setUser(response.user);
      setStatus("authenticated");
      setError(null);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to log in.";
      setError(message);
      throw caughtError;
    }
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    setError(null);
    try {
      const response = await loginWithGoogleAPI(idToken);
      setUser(response.user);
      setStatus("authenticated");
      setError(null);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Google sign-in failed.";
      setError(message);
      throw caughtError;
    }
  }, []);

  const register = useCallback(
    async (input: { displayName: string; email: string; password: string; username: string }) => {
      setError(null);
      try {
        const response = await registerAccount(input);
        setUser(response.user);
        setStatus("authenticated");
        setError(null);
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : "Unable to create account.";
        setError(message);
        throw caughtError;
      }
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
    try {
      const response = await updateMyProfile(input);
      setUser(response.user);
      setStatus("authenticated");
      setError(null);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to update profile.";
      setError(message);
      throw caughtError;
    }
  }, []);

  const changePassword = useCallback(
    async (input: { currentPassword: string; newPassword: string }) => {
      setError(null);
      try {
        await apiChangePassword(input);
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : "Unable to change password.";
        setError(message);
        throw caughtError;
      }
    },
    []
  );

  const uploadProfilePhoto = useCallback(async (uri: string) => {
    setError(null);
    try {
      const response = await apiUploadProfilePhoto(uri);
      setUser(response.user);
      setStatus("authenticated");
      setError(null);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to upload profile photo.";
      setError(message);
      throw caughtError;
    }
  }, []);

  const uploadCoverPhoto = useCallback(async (uri: string) => {
    setError(null);
    try {
      const response = await apiUploadCoverPhoto(uri);
      setUser(response.user);
      setStatus("authenticated");
      setError(null);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to upload cover photo.";
      setError(message);
      throw caughtError;
    }
  }, []);

  const updateUser = useCallback((nextUser: AuthUser) => {
    setUser(nextUser);
    setStatus("authenticated");
    setError(null);
  }, []);

  const logout = useCallback(async () => {
    await clearAuthToken();
    setUser(null);
    setStatus("unauthenticated");
    setError(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      changePassword,
      error,
      login,
      loginWithGoogle,
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
      loginWithGoogle,
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
