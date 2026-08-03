import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { resolveApiBaseUrl } from "@/shared/config/env";

export type ApiEnvelope<T> = {
  data: T;
};

type ApiErrorBody = {
  error?: {
    message?: string;
  };
};

const TOKEN_STORAGE_KEY = "auth-token-v1";
const LEGACY_TOKEN_STORAGE_KEY = "auth-token";
const TOKEN_MIGRATED_KEY = "auth-token-migrated-v1";
export const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;

export const API_BASE_URL = resolveApiBaseUrl();

export function getApiOrigin() {
  return API_BASE_URL.replace(/\/api\/?$/, "");
}

function readWebTokenStorage(): Storage | null {
  try {
    return sessionStorage ?? localStorage ?? null;
  } catch {
    return null;
  }
}

export function hasTokenExpired(token: string | null | undefined): boolean {
  if (!token) return true;

  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) return false;

    const normalized = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = typeof atob === "function" ? atob(padded) : "";
    const json = decoded ? decodeURIComponent(escape(decoded)) : "";
    const payload = JSON.parse(json) as { exp?: number };

    if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) {
      return false;
    }

    return Date.now() >= payload.exp * 1000;
  } catch {
    return false;
  }
}

export function isAuthFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /401|unauthorized|authentication required|token expired|invalid token|expired session/i.test(
    message
  );
}

export async function getAuthToken() {
  if (Platform.OS === "web") {
    try {
      const storage = readWebTokenStorage();
      return storage?.getItem(TOKEN_STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  }

  const secureToken = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
  if (secureToken) return secureToken;

  const migrated = await AsyncStorage.getItem(TOKEN_MIGRATED_KEY);
  if (migrated) return null;

  const legacyToken = await AsyncStorage.getItem(LEGACY_TOKEN_STORAGE_KEY);
  if (!legacyToken) {
    await AsyncStorage.setItem(TOKEN_MIGRATED_KEY, "true");
    return null;
  }

  await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, legacyToken);
  await AsyncStorage.multiRemove([LEGACY_TOKEN_STORAGE_KEY, TOKEN_MIGRATED_KEY]);
  return legacyToken;
}

export async function setAuthToken(token: string) {
  if (Platform.OS === "web") {
    try {
      const storage = readWebTokenStorage();
      if (storage) {
        storage.setItem(TOKEN_STORAGE_KEY, token);
      }
    } catch {}
    return;
  }

  await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
}

export async function clearAuthToken() {
  if (Platform.OS === "web") {
    try {
      const storage = readWebTokenStorage();
      if (storage) {
        storage.removeItem(TOKEN_STORAGE_KEY);
      }
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {}
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
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
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function requestJson<T>(
  path: string,
  init?: RequestInit & { auth?: boolean; timeoutMs?: number }
) {
  const { auth, timeoutMs, headers, ...fetchInit } = init ?? {};
  const token = auth === false ? null : await getAuthToken();
  const response = await fetchWithTimeout(
    `${API_BASE_URL}${path}`,
    {
      ...fetchInit,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers ?? {}),
      },
    },
    timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS
  );

  const rawBody = await response.text();
  if (!rawBody) {
    throw new Error(`Empty API response from ${path}`);
  }

  let payload: Partial<ApiEnvelope<T>> & ApiErrorBody;

  try {
    payload = JSON.parse(rawBody) as Partial<ApiEnvelope<T>> & ApiErrorBody;
  } catch {
    throw new Error(`Invalid JSON response from ${path}`);
  }

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `API request failed with ${response.status}`);
  }

  if (typeof payload.data === "undefined") {
    throw new Error(`API response missing data payload from ${path}`);
  }

  return payload as ApiEnvelope<T>;
}

export function getExpoExtra() {
  return Constants.expoConfig?.extra as Record<string, unknown> | undefined;
}
