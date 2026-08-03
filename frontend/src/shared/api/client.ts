import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

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
export const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;

export const API_BASE_URL = resolveApiBaseUrl();

export function getApiOrigin() {
  return API_BASE_URL.replace(/\/api\/?$/, "");
}

export async function getAuthToken() {
  return SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
}

export async function setAuthToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
}

export async function clearAuthToken() {
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

export async function requestJson<T>(path: string, init?: RequestInit & { auth?: boolean; timeoutMs?: number }) {
  const { auth, timeoutMs, headers, ...fetchInit } = init ?? {};
  const token = auth === false ? null : await getAuthToken();
  const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
    ...fetchInit,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
  }, timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS);

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
