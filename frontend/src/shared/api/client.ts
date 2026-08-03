import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
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

const LEGACY_TOKEN_STORAGE_KEY = "auth:token:v1";
const TOKEN_STORAGE_KEY = "auth-token-v1";
const TOKEN_MIGRATED_KEY = "auth-token-secure-migrated-v1";
export const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;
const PRODUCTION_API_URL = "https://gamoicani-ub68.onrender.com/api";

function getDefaultApiUrl() {
  return Platform.OS === "android" ? "http://10.0.2.2:4000/api" : "http://localhost:4000/api";
}

function resolveApiBaseUrl() {
  const env = process?.env ?? {};
  const configuredUrl = env.EXPO_PUBLIC_API_URL?.trim();
  const isDev = typeof __DEV__ === "boolean" ? __DEV__ : env.NODE_ENV !== "production";
  const apiUrl = configuredUrl || (isDev ? getDefaultApiUrl() : PRODUCTION_API_URL);

  if (!isDev && apiUrl.startsWith("http://")) {
    console.warn("Production API URL should use HTTPS. Falling back to the hosted API URL.");
    return PRODUCTION_API_URL;
  }

  return apiUrl.replace(/\/$/, "");
}

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
  return /401|unauthorized|authentication required|token expired|invalid token|expired session/i.test(message);
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
  await AsyncStorage.multiRemove([LEGACY_TOKEN_STORAGE_KEY, TOKEN_MIGRATED_KEY]);
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
  await AsyncStorage.multiRemove([LEGACY_TOKEN_STORAGE_KEY, TOKEN_MIGRATED_KEY]);
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
