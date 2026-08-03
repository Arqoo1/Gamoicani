import { StyleSheet } from "react-native";
import { AppColors } from "@/application/providers/theme";

export function createStyles(colors: AppColors) {
  return StyleSheet.create({
    turnBanner: {
      paddingVertical: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    waitingText: { color: colors.secondaryText, fontSize: 13, fontWeight: "700" },
    timerText: { color: colors.primaryText, fontSize: 15, fontWeight: "800" },
    timerUrgent: { color: "#e63946" },
  });
}
