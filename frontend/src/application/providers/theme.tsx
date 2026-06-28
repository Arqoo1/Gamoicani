import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

export type ThemeMode = "light" | "dark" | "system";

export type AppColors = {
  absent: string;
  accent: string;
  accentMuted: string;
  background: string;
  border: string;
  button: string;
  buttonStrong: string;
  card: string;
  correct: string;
  disabled: string;
  key: string;
  keyActive: string;
  overlay: string;
  present: string;
  primaryText: string;
  secondaryText: string;
  shadow: string;
  tile: string;
  tileBorder: string;
  tileFilled: string;
};

type ThemeContextValue = {
  colors: AppColors;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const THEME_KEY = "app:theme-mode:v1";

const lightColors: AppColors = {
  absent: "#66727f",
  accent: "#2f9e5d",
  accentMuted: "#eef4f2",
  background: "#f4f7fb",
  border: "#dce3e8",
  button: "#eef4f2",
  buttonStrong: "#17352d",
  card: "#ffffff",
  correct: "#2f9e5d",
  disabled: "#8a95a1",
  key: "#e3e9ed",
  keyActive: "#17352d",
  overlay: "rgba(10, 22, 28, 0.46)",
  present: "#d6a12a",
  primaryText: "#17352d",
  secondaryText: "#66727f",
  shadow: "#17352d",
  tile: "#fbfcfd",
  tileBorder: "#cad5dc",
  tileFilled: "#ffffff"
};

const darkColors: AppColors = {
  absent: "#52606f",
  accent: "#48c978",
  accentMuted: "#12392d",
  background: "#0c1117",
  border: "#263542",
  button: "#172530",
  buttonStrong: "#e8f4ee",
  card: "#121b24",
  correct: "#34a967",
  disabled: "#6f7d88",
  key: "#243240",
  keyActive: "#48c978",
  overlay: "rgba(3, 7, 10, 0.72)",
  present: "#dfb34a",
  primaryText: "#e8f4ee",
  secondaryText: "#aab8c4",
  shadow: "#000000",
  tile: "#101820",
  tileBorder: "#334451",
  tileFilled: "#17232e"
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(THEME_KEY)
      .then((storedMode) => {
        if (active && (storedMode === "light" || storedMode === "dark" || storedMode === "system")) {
          setModeState(storedMode);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    AsyncStorage.setItem(THEME_KEY, nextMode).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setModeState((currentMode) => {
      const nextMode = currentMode === "dark" ? "light" : "dark";
      AsyncStorage.setItem(THEME_KEY, nextMode).catch(() => {});
      return nextMode;
    });
  }, []);

  const resolvedDark = useMemo(() => {
    if (mode === "system") return systemColorScheme === "dark";
    return mode === "dark";
  }, [mode, systemColorScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: resolvedDark ? darkColors : lightColors,
      isDark: resolvedDark,
      mode,
      setMode,
      toggleTheme
    }),
    [resolvedDark, mode, setMode, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useAppTheme must be used inside ThemeProvider");
  return value;
}
