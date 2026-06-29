import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;
declare const __DEV__: boolean | undefined;

export type ApiEnvelope<T> = {
  data: T;
};

const TOKEN_STORAGE_KEY = "auth:token:v1";
export const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;

function getDefaultApiUrl() {
  return Platform.OS === "android" ? "http://10.0.2.2:4000/api" : "http://localhost:4000/api";
}

function resolveApiBaseUrl() {
  const env = process?.env ?? {};
  const configuredUrl = env.EXPO_PUBLIC_API_URL?.trim();
  const isDev = typeof __DEV__ === "boolean" ? __DEV__ : env.NODE_ENV !== "production";
  const apiUrl = configuredUrl || getDefaultApiUrl();

  if (!isDev && (!configuredUrl || apiUrl.startsWith("http://"))) {
    throw new Error("EXPO_PUBLIC_API_URL must be set to an HTTPS URL for production builds");
  }

  return apiUrl.replace(/\/$/, "");
}

export const API_BASE_URL = resolveApiBaseUrl();

export async function getAuthToken() {
  return AsyncStorage.getItem(TOKEN_STORAGE_KEY);
}

export async function setAuthToken(token: string) {
  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export async function clearAuthToken() {
  await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  if (init.signal) {
    if (init.signal.aborted) {
      controller.abort();
    } else {
      init.signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function requestJson<T>(path: string, init?: RequestInit & { auth?: boolean; timeoutMs?: number }) {
  const { auth, timeoutMs, headers, ...fetchInit } = init ?? {};
  const token = auth === false ? null : await getAuthToken();
  const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
    ...fetchInit,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {})
    }
  }, timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS);

  const payload = (await response.json().catch(() => ({}))) as Partial<ApiEnvelope<T>> & {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `API request failed with ${response.status}`);
  }

  return payload as ApiEnvelope<T>;
}
