import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppColors } from "@/application/providers/theme";
import { createStyles } from "@/features/multiplayer/components/LeaveConfirmOverlay.styles";

interface LeaveConfirmOverlayProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  colors: AppColors;
}

export function LeaveConfirmOverlay({ visible, onConfirm, onCancel, colors }: LeaveConfirmOverlayProps) {
  const styles = createStyles(colors);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.resultCard}>
        <Text style={styles.resultEmoji}>🚪</Text>
        <Text style={styles.resultTitle}>ნამდვილად გადიხარ?</Text>
        <Text style={styles.resultAnswer}>თუ გახვალ, ავტომატურად წააგებ.</Text>
        <View style={styles.resultActions}>
          <Pressable style={styles.primaryBtn} onPress={onConfirm}>
            <Text style={styles.primaryBtnText}>დიახ, გასვლა</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={onCancel}>
            <Text style={styles.secondaryBtnText}>არა, გაგრძელება</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
