import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

let _hapticsEnabled = true;

export function setHapticsEnabledService(val: boolean) {
  _hapticsEnabled = val;
}

export function triggerSelectionHaptic() {
  if (!_hapticsEnabled || Platform.OS === "web") return;
  Haptics.selectionAsync().catch(() => {});
}

export function triggerInvalidHaptic() {
  if (!_hapticsEnabled || Platform.OS === "web") return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}

export function triggerSuccessHaptic() {
  if (!_hapticsEnabled || Platform.OS === "web") return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function triggerWarningHaptic() {
  if (!_hapticsEnabled || Platform.OS === "web") return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}
