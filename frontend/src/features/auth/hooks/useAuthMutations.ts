import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/application/providers/auth";
import { AuthUser } from "@/entities/user/types";
import {
  changePassword as apiChangePassword,
  loginAccount,
  loginWithGoogleAPI,
  registerAccount,
  updateMyProfile,
} from "@/features/auth/api/authApi";
import { queryKeys } from "@/shared/api/queryKeys";

function applyAuthUser(queryClient: ReturnType<typeof useQueryClient>, user: AuthUser) {
  queryClient.setQueryData(queryKeys.auth.me(), user);
}

export function useLogin() {
  const { setSessionUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginAccount,
    onSuccess: (response) => {
      setSessionUser(response.user);
      applyAuthUser(queryClient, response.user);
    },
  });
}

export function useRegister() {
  const { setSessionUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerAccount,
    onSuccess: (response) => {
      setSessionUser(response.user);
      applyAuthUser(queryClient, response.user);
    },
  });
}

export function useGoogleLogin() {
  const { setSessionUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (idToken: string) => loginWithGoogleAPI(idToken),
    onSuccess: (response) => {
      setSessionUser(response.user);
      applyAuthUser(queryClient, response.user);
    },
  });
}

export function useUpdateProfile() {
  const { setSessionUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (response) => {
      setSessionUser(response.user);
      applyAuthUser(queryClient, response.user);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: apiChangePassword,
  });
}
