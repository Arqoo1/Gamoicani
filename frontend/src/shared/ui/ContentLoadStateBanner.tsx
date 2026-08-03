import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/application/providers/theme";

type Props = {
  isOffline?: boolean;
  message?: string;
};

export function ContentLoadStateBanner({ isOffline = false, message }: Props) {
  const { colors } = useAppTheme();

  if (!isOffline && !message) return null;

  const displayMessage = message ?? "ოფლაინ რეჟიმი: გამოიყენება შენახული მონაცემები";

  return (
    <View style={[styles.banner, { backgroundColor: colors.button, borderColor: colors.border }]}>
      <Text style={[styles.text, { color: colors.secondaryText }]}>
        ⚠️ {displayMessage}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
});
