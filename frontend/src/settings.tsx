import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

const HAPTICS_KEY = "settings:haptics:v1";
const SOUND_KEY = "settings:sound:v1";

type SettingsContextValue = {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  setHapticsEnabled: (val: boolean) => void;
  setSoundEnabled: (val: boolean) => void;
};

const SettingsContext = createContext<SettingsContextValue>({
  hapticsEnabled: true,
  soundEnabled: true,
  setHapticsEnabled: () => {},
  setSoundEnabled: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [hapticsEnabled, setHapticsEnabledState] = useState(true);
  const [soundEnabled, setSoundEnabledState] = useState(true);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(HAPTICS_KEY),
      AsyncStorage.getItem(SOUND_KEY),
    ]).then(([h, s]) => {
      if (h !== null) setHapticsEnabledState(h === "true");
      if (s !== null) setSoundEnabledState(s === "true");
    }).catch(() => {});
  }, []);

  const setHapticsEnabled = useCallback((val: boolean) => {
    setHapticsEnabledState(val);
    AsyncStorage.setItem(HAPTICS_KEY, String(val)).catch(() => {});
  }, []);

  const setSoundEnabled = useCallback((val: boolean) => {
    setSoundEnabledState(val);
    AsyncStorage.setItem(SOUND_KEY, String(val)).catch(() => {});
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({ hapticsEnabled, soundEnabled, setHapticsEnabled, setSoundEnabled }),
    [hapticsEnabled, soundEnabled, setHapticsEnabled, setSoundEnabled]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
