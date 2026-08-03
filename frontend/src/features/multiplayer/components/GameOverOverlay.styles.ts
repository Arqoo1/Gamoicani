import { StyleSheet } from "react-native";
import { AppColors } from "@/application/providers/theme";

export function createStyles(colors: AppColors) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFill,
      alignItems: "center",
      backgroundColor: colors.overlay,
      justifyContent: "center",
      padding: 24,
      zIndex: 200,
    },
    resultCard: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 20,
      elevation: 12,
      maxWidth: 320,
      padding: 28,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      width: "100%",
    },
    resultEmoji: { fontSize: 52, marginBottom: 4 },
    resultTitle: {
      color: colors.primaryText,
      fontSize: 28,
      fontWeight: "900",
      marginBottom: 8,
      textAlign: "center",
    },
    resultAnswer: {
      color: colors.secondaryText,
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 20,
      textAlign: "center",
    },
    resultActions: { gap: 10, width: "100%" },
    primaryBtn: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 14,
    },
    primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "900" },
    secondaryBtn: {
      alignItems: "center",
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      paddingVertical: 14,
    },
    secondaryBtnText: { color: colors.primaryText, fontSize: 16, fontWeight: "800" },
  });
}
