import React, { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { AppColors, useAppTheme } from "@/application/providers/theme";

export interface GameModeOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  disabled?: boolean;
  disabledSubtitle?: string;
  isDone?: boolean;
  onSelect: () => void;
}

export interface GameModePickerProps {
  visible: boolean;
  kicker: string;
  title: string;
  options: GameModeOption[];
  onClose: () => void;
}

export function GameModePicker({
  visible,
  kicker,
  title,
  options,
  onClose
}: GameModePickerProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modePickerModal}>
          <Text style={styles.modePickerKicker}>{kicker}</Text>
          <Text style={styles.modePickerTitle}>{title}</Text>

          {options.map((option) => {
            const isDisabled = option.disabled;
            const subtitleText = isDisabled && option.disabledSubtitle ? option.disabledSubtitle : option.subtitle;

            return (
              <Pressable
                key={option.id}
                disabled={isDisabled}
                style={({ pressed }) => [
                  styles.modePickerOption,
                  isDisabled && styles.modePickerOptionDisabled,
                  !isDisabled && pressed && styles.pressed
                ]}
                onPress={option.onSelect}
              >
                <View style={styles.modePickerIconWrap}>
                  <Text style={styles.modePickerIcon}>{option.icon}</Text>
                </View>
                <View style={styles.modePickerText}>
                  <Text
                    style={[
                      styles.modePickerOptionTitle,
                      isDisabled && styles.modePickerDisabledText
                    ]}
                  >
                    {option.title}
                  </Text>
                  <Text
                    style={[
                      styles.modePickerOptionSub,
                      isDisabled && styles.modePickerDisabledText
                    ]}
                  >
                    {subtitleText}
                  </Text>
                </View>
                {option.isDone ? (
                  <Text style={styles.modePickerDoneCheck}>✓</Text>
                ) : (
                  <Text style={styles.modePickerArrow}>›</Text>
                )}
              </Pressable>
            );
          })}

          <Pressable
            style={({ pressed }) => [styles.modePickerBack, pressed && styles.pressed]}
            onPress={onClose}
          >
            <Text style={styles.modePickerBackText}>← უკან</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.55)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20
    },
    modePickerModal: {
      width: "100%",
      maxWidth: 400,
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border
    },
    modePickerKicker: {
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      color: colors.accent,
      letterSpacing: 1,
      textAlign: "center",
      marginBottom: 4
    },
    modePickerTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.primaryText,
      textAlign: "center",
      marginBottom: 20
    },
    modePickerOption: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.button,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border
    },
    modePickerOptionDisabled: {
      opacity: 0.6
    },
    pressed: {
      opacity: 0.8
    },
    modePickerIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.card,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14
    },
    modePickerIcon: {
      fontSize: 22
    },
    modePickerText: {
      flex: 1
    },
    modePickerOptionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.primaryText,
      marginBottom: 2
    },
    modePickerOptionSub: {
      fontSize: 13,
      color: colors.secondaryText
    },
    modePickerDisabledText: {
      color: colors.secondaryText
    },
    modePickerArrow: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.accent,
      marginLeft: 8
    },
    modePickerDoneCheck: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.correct || "#10B981",
      marginLeft: 8
    },
    modePickerBack: {
      marginTop: 8,
      paddingVertical: 12,
      alignItems: "center"
    },
    modePickerBackText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.secondaryText
    }
  });
