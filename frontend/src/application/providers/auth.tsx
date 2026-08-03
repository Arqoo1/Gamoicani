import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { AuthUser } from "@/entities/user/types";
import { fetchMe, changePassword as apiChangePassword } from "@/features/auth/api/authApi";
import { runAuthBootstrap } from "@/features/auth/services/authBootstrap";
import {
  loginAccount,
  loginWithGoogleAPI,
  registerAccount,
  updateMyProfile,
} from "@/features/auth/api/authApi";
import {
  uploadCoverPhoto as apiUploadCoverPhoto,
  uploadProfilePhoto as apiUploadProfilePhoto,
} from "@/features/profile/api/profileApi";
import { clearAuthToken, getAuthToken, hasTokenExpired, isAuthFailure } from "@/shared/api/client";
import { crashReporter } from "@/shared/services/crashReporter";
import { queryKeys } from "@/shared/api/queryKeys";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  login: (input: { email: string; password: string }) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  register: (input: {
    displayName: string;
    email: string;
    password: string;
    username: string;
  }) => Promise<void>;
  setSessionUser: (user: AuthUser | null) => void;
  status: AuthStatus;
  updateUser: (nextUser: AuthUser) => void;
  updateProfile: (input: {
    avatarColor?: string;
    bio?: string;
    coverGradient?: number;
    coverPhotoUrl?: string | null;
    displayName?: string;
    profilePhotoUrl?: string | null;
    username?: string;
  }) => Promise<void>;
  changePassword: (input: { currentPassword: string; newPassword: string }) => Promise<void>;
  uploadProfilePhoto: (uri: string) => Promise<void>;
  uploadCoverPhoto: (uri: string) => Promise<void>;
  user: AuthUser | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [tokenExists, setTokenExists] = useState<boolean | null>(null);

  useEffect(() => {
    getAuthToken().then((t) => setTokenExists(Boolean(t)));
  }, []);

  const {
    data: user,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      const token = await getAuthToken();
      if (!token || hasTokenExpired(token)) return null;
      try {
        const nextUser = await fetchMe();
        runAuthBootstrap(nextUser, (repaired) => {
          queryClient.setQueryData(queryKeys.auth.me(), repaired);
        }).catch(() => {});
        return nextUser;
      } catch (err) {
        if (isAuthFailure(err)) {
          await clearAuthToken();
        }
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

  const refreshUser = useCallback(async () => {
    const t = await getAuthToken();
    setTokenExists(Boolean(t));
    if (t) {
      await refetch();
    }
  }, [refetch]);

  const setSessionUser = useCallback(
    (nextUser: AuthUser | null) => {
      queryClient.setQueryData(queryKeys.auth.me(), nextUser);
      setTokenExists(Boolean(nextUser));
    },
    [queryClient]
  );

  const updateUser = useCallback(
    (nextUser: AuthUser) => {
      queryClient.setQueryData(queryKeys.auth.me(), nextUser);
    },
    [queryClient]
  );

  const logout = useCallback(async () => {
    await clearAuthToken();
    queryClient.setQueryData(queryKeys.auth.me(), null);
    setTokenExists(false);
  }, [queryClient]);

  const login = useCallback(
    async (input: { email: string; password: string }) => {
      const response = await loginAccount(input);
      setSessionUser(response.user);
    },
    [setSessionUser]
  );

  const loginWithGoogle = useCallback(
    async (idToken: string) => {
      const response = await loginWithGoogleAPI(idToken);
      setSessionUser(response.user);
    },
    [setSessionUser]
  );

  const register = useCallback(
    async (input: { displayName: string; email: string; password: string; username: string }) => {
      const response = await registerAccount(input);
      setSessionUser(response.user);
    },
    [setSessionUser]
  );

  const updateProfile = useCallback(
    async (input: {
      avatarColor?: string;
      bio?: string;
      coverGradient?: number;
      coverPhotoUrl?: string | null;
      displayName?: string;
      profilePhotoUrl?: string | null;
      username?: string;
    }) => {
      const response = await updateMyProfile(input);
      setSessionUser(response.user);
    },
    [setSessionUser]
  );

  const changePassword = useCallback(async (input: { currentPassword: string; newPassword: string }) => {
    await apiChangePassword(input);
  }, []);

  const uploadProfilePhoto = useCallback(
    async (uri: string) => {
      const response = await apiUploadProfilePhoto(uri);
      setSessionUser(response.user);
    },
    [setSessionUser]
  );

  const uploadCoverPhoto = useCallback(
    async (uri: string) => {
      const response = await apiUploadCoverPhoto(uri);
      setSessionUser(response.user);
    },
    [setSessionUser]
  );

  const status: AuthStatus =
    tokenExists === null || (tokenExists && isLoading)
      ? "loading"
      : user
        ? "authenticated"
        : "unauthenticated";

  const value = useMemo<AuthContextValue>(
    () => ({
      login,
      loginWithGoogle,
      logout,
      refreshUser,
      register,
      setSessionUser,
      status,
      updateProfile,
      updateUser,
      changePassword,
      uploadCoverPhoto,
      uploadProfilePhoto,
      user: user ?? null,
    }),
    [
      changePassword,
      login,
      loginWithGoogle,
      logout,
      refreshUser,
      register,
      setSessionUser,
      status,
      updateProfile,
      updateUser,
      uploadCoverPhoto,
      uploadProfilePhoto,
      user,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
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
