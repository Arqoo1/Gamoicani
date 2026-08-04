import { Pressable, Text, View } from "react-native";

import type { MultiplayerScreenStyles } from "@/features/multiplayer/hooks/useMultiplayerScreenModel";

type Props = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  styles: MultiplayerScreenStyles;
};

export function LeaveConfirmOverlay({ visible, onCancel, onConfirm, styles }: Props) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.resultCard}>
        <Text style={styles.resultEmoji}>🚪</Text>
        <Text style={styles.resultTitle}>ნამდვილად გინდა გასვლა?</Text>
        <Text style={styles.resultAnswer}>თუ გახვალ, თამაში ავტომატურად წააგებ.</Text>
        <View style={styles.resultActions}>
          <Pressable onPress={onConfirm} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>დიახ, გასვლა</Text>
          </Pressable>
          <Pressable onPress={onCancel} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>არა, დარჩენა</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
