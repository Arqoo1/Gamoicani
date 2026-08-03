import Constants from "expo-constants";
import { Platform } from "react-native";

declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;
declare const __DEV__: boolean | undefined;

const extra = Constants.expoConfig?.extra as
  | { apiUrl?: string; googleWebClientId?: string }
  | undefined;

function getDevApiUrl() {
  return Platform.OS === "android" ? "http://10.0.2.2:4000/api" : "http://localhost:4000/api";
}

export function getGoogleWebClientId(): string | undefined {
  const fromExtra = extra?.googleWebClientId?.trim();
  const fromEnv = process?.env?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  return fromExtra || fromEnv || undefined;
}

export function resolveApiBaseUrl(): string {
  const env = process?.env ?? {};
  const configuredUrl = extra?.apiUrl?.trim() || env.EXPO_PUBLIC_API_URL?.trim();
  const isDev = typeof __DEV__ === "boolean" ? __DEV__ : env.NODE_ENV !== "production";

  if (!configuredUrl) {
    if (isDev) {
      return getDevApiUrl().replace(/\/$/, "");
    }
    throw new Error(
      "EXPO_PUBLIC_API_URL is required in production builds. Set it in .env or EAS secrets."
    );
  }

  const apiUrl = configuredUrl;

  if (!isDev && apiUrl.startsWith("http://")) {
    console.warn("Production API URL should use HTTPS.");
  }

  return apiUrl.replace(/\/$/, "");
}
