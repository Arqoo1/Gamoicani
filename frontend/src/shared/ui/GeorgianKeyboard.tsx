import React, { memo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  BACKSPACE_KEY,
  BASE_GEORGIAN_KEYBOARD_ROWS,
  ENTER_KEY,
  SHIFT_KEY,
  SHIFTED_GEORGIAN_KEYS,
} from "@/shared/constants/georgianKeyboard";
import { useAppTheme } from "@/application/providers/theme";

type LetterScore = "correct" | "present" | "absent" | undefined;

type GeorgianKeyboardProps = {
  onKeyPress: (key: string) => void;
  isShifted?: boolean;
  letterScores?: Record<string, LetterScore>;
  disabled?: boolean;
  keyHeight?: number;
};


type KeyButtonProps = {
  keyValue: string;
  displayValue: string;
  bgColor: string;
  textColor: string;
  keyMaxWidth: number;
  keyHeight: number;
  disabled: boolean;
  isBackspace: boolean;
  isShiftKey: boolean;
  isEnter: boolean;
  onPress: (key: string) => void;
  colors: any;
};

const KeyButton = memo(function KeyButton({
  keyValue,
  displayValue,
  bgColor,
  textColor,
  keyMaxWidth,
  keyHeight,
  disabled,
  isBackspace,
  isShiftKey,
  isEnter,
  onPress,
  colors,
}: KeyButtonProps) {
  const handlePress = useCallback(() => onPress(keyValue), [keyValue, onPress]);

  const isActionKey = isBackspace || isEnter || isShiftKey;

  return (
    <Pressable
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.key,
        isActionKey && styles.actionKey,
        {
          backgroundColor: bgColor,
          height: keyHeight,
          maxWidth: keyMaxWidth,
          transform: [{ scale: pressed && !disabled ? 0.92 : 1 }],
          opacity: disabled ? 0.7 : 1,
          shadowColor: colors.shadow,
        },
      ]}
    >
      {isBackspace ? (
        <Text style={[styles.keyText, styles.backspaceKeyText, { color: textColor }]}>⌫</Text>
      ) : isShiftKey ? (
        <Text style={[styles.shiftKeyText, { color: textColor }]}>⇧</Text>
      ) : isEnter ? (
        <Text
          adjustsFontSizeToFit
          numberOfLines={1}
          style={[styles.keyText, styles.actionKeyText, { color: textColor }]}
        >
          {displayValue}
        </Text>
      ) : (
        <Text style={[styles.keyText, { color: textColor }]}>{displayValue}</Text>
      )}
    </Pressable>
  );
});


type KeyboardRowProps = {
  row: readonly string[];
  keyboardGap: number;
  keyMaxWidth: number;
  actionKeyMaxWidth: number;
  keyHeight: number;
  isShifted: boolean;
  disabled: boolean;
  isDark: boolean;
  letterScores: Record<string, LetterScore>;
  colors: any;
  onKeyPress: (key: string) => void;
};

const KeyboardRow = memo(function KeyboardRow({
  row,
  keyboardGap,
  keyMaxWidth,
  actionKeyMaxWidth,
  keyHeight,
  isShifted,
  disabled,
  isDark,
  letterScores,
  colors,
  onKeyPress,
}: KeyboardRowProps) {
  return (
    <View style={[styles.keyboardRow, { gap: keyboardGap }]}>
      {row.map((key) => {
        const isBackspace = key === BACKSPACE_KEY;
        const isShift = key === SHIFT_KEY;
        const isEnter = key === ENTER_KEY;
        const isSpecial = isBackspace || isShift || isEnter;
        
        let displayValue = key;
        if (isShifted && SHIFTED_GEORGIAN_KEYS[key]) {
          displayValue = SHIFTED_GEORGIAN_KEYS[key]!;
        }
        if (isEnter) {
          displayValue = "შემოწმება";
        }
        
        const score = letterScores[displayValue] || letterScores[key];

        let bgColor = colors.key;
        let textColor = colors.primaryText;

        if (!isSpecial && score) {
          if (score === "correct") {
            bgColor = colors.correct;
            textColor = "#ffffff";
          } else if (score === "present") {
            bgColor = colors.present;
            textColor = "#ffffff";
          } else if (score === "absent") {
            bgColor = isDark ? "#3a3d42" : "#cbd5e1";
            textColor = isDark ? "#64748b" : "#94a3b8";
          }
        } else if (isShift && isShifted) {
          bgColor = colors.keyActive;
          textColor = "#ffffff";
        } else if (isShift && !isShifted) {
          bgColor = colors.button;
        }

        const currentMaxWidth = isSpecial ? actionKeyMaxWidth : keyMaxWidth;

        return (
          <KeyButton
            key={key}
            keyValue={key}
            displayValue={displayValue}
            bgColor={bgColor}
            textColor={textColor}
            keyMaxWidth={currentMaxWidth}
            keyHeight={keyHeight}
            disabled={disabled}
            isBackspace={isBackspace}
            isShiftKey={isShift}
            isEnter={isEnter}
            onPress={onKeyPress}
            colors={colors}
          />
        );
      })}
    </View>
  );
});


export const GeorgianKeyboard = memo(function GeorgianKeyboard({
  onKeyPress,
  isShifted = false,
  letterScores = {},
  disabled = false,
  keyHeight = 44,
}: GeorgianKeyboardProps) {
  const { width } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();

  const keyboardGap = width < 380 ? 3 : 4;
  const keyboardRowGap = keyboardGap + 2;
  const keyMaxWidth = Math.max(25, Math.min(38, (width - 14 - keyboardGap * 9) / 10));
  const actionKeyMaxWidth = keyMaxWidth * 1.55;

  const rows = [
    BASE_GEORGIAN_KEYBOARD_ROWS[0],
    [SHIFT_KEY, ...BASE_GEORGIAN_KEYBOARD_ROWS[1]],
    [ENTER_KEY, ...BASE_GEORGIAN_KEYBOARD_ROWS[2]],
  ];

  return (
    <View style={[styles.keyboard, { gap: keyboardRowGap, shadowColor: colors.shadow, backgroundColor: colors.card, borderColor: colors.border }]}>
      {rows.map((row, rowIndex) => (
        <KeyboardRow
          key={rowIndex}
          row={row}
          keyboardGap={keyboardGap}
          keyMaxWidth={keyMaxWidth}
          actionKeyMaxWidth={actionKeyMaxWidth}
          keyHeight={keyHeight}
          isShifted={isShifted}
          disabled={disabled}
          isDark={isDark}
          letterScores={letterScores}
          colors={colors}
          onKeyPress={onKeyPress}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  keyboard: {
    alignSelf: "center",
    borderRadius: 8,
    borderWidth: 1,
    elevation: 2,
    maxWidth: 460,
    paddingHorizontal: 4,
    paddingVertical: 8,
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    width: "100%",
  },
  keyboardRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  key: {
    alignItems: "center",
    borderRadius: 8,
    elevation: 1,
    flex: 1,
    justifyContent: "center",
    minWidth: 23,
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  actionKey: {
    flex: 1.55,
  },
  keyText: {
    fontSize: 17,
    fontWeight: "900",
  },
  shiftKeyText: {
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 26,
  },
  actionKeyText: {
    fontSize: 11,
    paddingHorizontal: 2,
  },
  backspaceKeyText: {
    fontSize: 15,
  },
});
