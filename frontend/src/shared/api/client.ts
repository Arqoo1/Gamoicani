import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

export type ApiEnvelope<T> = {
  data: T;
};

const TOKEN_STORAGE_KEY = "auth:token:v1";
const defaultApiUrl = Platform.OS === "android" ? "http://10.0.2.2:4000/api" : "http://localhost:4000/api";

export const API_BASE_URL = process?.env?.EXPO_PUBLIC_API_URL ?? defaultApiUrl;

export async function getAuthToken() {
  return AsyncStorage.getItem(TOKEN_STORAGE_KEY);
}

export async function setAuthToken(token: string) {
  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export async function clearAuthToken() {
  await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function requestJson<T>(path: string, init?: RequestInit & { auth?: boolean }) {
  const token = init?.auth === false ? null : await getAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    }
  });

  const payload = (await response.json().catch(() => ({}))) as Partial<ApiEnvelope<T>> & {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `API request failed with ${response.status}`);
  }

  return payload as ApiEnvelope<T>;
}
