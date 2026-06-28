import { AuthUser } from "@/entities/user/types";
import { requestJson, setAuthToken } from "@/shared/api/client";

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export async function registerAccount(input: {
  displayName: string;
  email: string;
  password: string;
  username: string;
}) {
  const response = await requestJson<AuthResponse>("/auth/register", {
    auth: false,
    body: JSON.stringify(input),
    method: "POST"
  });

  await setAuthToken(response.data.token);

  return response.data;
}

export async function loginAccount(input: { email: string; password: string }) {
  const response = await requestJson<AuthResponse>("/auth/login", {
    auth: false,
    body: JSON.stringify(input),
    method: "POST"
  });

  await setAuthToken(response.data.token);

  return response.data;
}

export async function loginWithGoogleAPI(idToken: string) {
  const response = await requestJson<AuthResponse>("/auth/google", {
    auth: false,
    body: JSON.stringify({ idToken }),
    method: "POST"
  });

  await setAuthToken(response.data.token);

  return response.data;
}

export async function fetchMe() {
  const response = await requestJson<{ user: AuthUser }>("/me");

  return response.data.user;
}

export async function updateMyProfile(input: {
  avatarColor?: string;
  bio?: string;
  coverGradient?: number;
  coverPhotoUrl?: string | null;
  displayName?: string;
  profilePhotoUrl?: string | null;
  username?: string;
}) {
  const response = await requestJson<AuthResponse>("/auth/me", {
    body: JSON.stringify(input),
    method: "PATCH"
  });

  await setAuthToken(response.data.token);

  return response.data;
}

export async function changePassword(input: { currentPassword: string; newPassword: string }) {
  const response = await requestJson<{ message: string }>("/auth/change-password", {
    body: JSON.stringify(input),
    method: "POST"
  });

  return response.data;
}

export async function savePushTokenAPI(token: string): Promise<void> {
  try {
    await requestJson<{ message: string }>("/auth/push-token", {
      body: JSON.stringify({ token }),
      method: "POST"
    });
  } catch (err) {
    console.warn("[API] Failed to save push token to backend:", err);
  }
}
