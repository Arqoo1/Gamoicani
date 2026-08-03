import { StyleSheet } from "react-native";
import { AppColors } from "@/application/providers/theme";

export type AuthMode = "login" | "register";

export function createStyles(colors: AppColors, isDark: boolean, mode: AuthMode) {
  const reg = mode === "register";
  return StyleSheet.create({
    safe: {
      backgroundColor: colors.background,
      flex: 1,
    },
    flex: { flex: 1 },
    scroll: {
      alignItems: "center",
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 28,
      paddingVertical: reg ? 16 : 40,
    },

    themeToggle: {
      alignItems: "center",
      backgroundColor: colors.button,
      borderColor: colors.border,
      borderRadius: 20,
      borderWidth: 1,
      flexDirection: "row",
      gap: 8,
      marginBottom: reg ? 14 : 40,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    themeLabel: {
      color: colors.secondaryText,
      fontSize: 13,
      fontWeight: "700",
    },

    kicker: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 2.5,
      marginBottom: 8,
      textAlign: "center",
      textTransform: "uppercase",
    },
    title: {
      color: colors.primaryText,
      fontSize: reg ? 28 : 36,
      fontWeight: "900",
      letterSpacing: -1,
      marginBottom: reg ? 30 : 15,
      textAlign: "center",
    },
    subtitle: {
      color: colors.secondaryText,
      fontSize: 14,
      fontWeight: "500",
      marginBottom: reg ? 16 : 36,
      textAlign: "center",
    },

    tabPill: {
      backgroundColor: colors.button,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: "row",
      marginBottom: reg ? 16 : 32,
      padding: 4,
      width: "100%",
    },
    tabOption: {
      alignItems: "center",
      borderRadius: 11,
      flex: 1,
      paddingVertical: reg ? 7 : 10,
    },
    tabOptionActive: {
      backgroundColor: colors.accent,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    tabOptionText: {
      color: colors.secondaryText,
      fontSize: 14,
      fontWeight: "700",
    },
    tabOptionTextActive: {
      color: "#ffffff",
      fontWeight: "900",
    },

    fieldWrap: {
      marginBottom: reg ? 10 : 20,
      width: "100%",
    },
    fieldLabel: {
      color: colors.secondaryText,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.2,
      marginBottom: reg ? 5 : 8,
      textTransform: "uppercase",
    },
    input: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1.5,
      color: colors.primaryText,
      fontSize: 15,
      fontWeight: "600",
      height: reg ? 46 : 54,
      paddingHorizontal: 18,
      width: "100%",
    },
    inputFocused: {
      borderColor: colors.accent,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: isDark ? 0.3 : 0.2,
      shadowRadius: 8,
      elevation: 3,
    },

    errorBubble: {
      backgroundColor: "rgba(214,97,97,0.1)",
      borderColor: "rgba(214,97,97,0.35)",
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      width: "100%",
    },
    errorText: {
      color: "#d66161",
      fontSize: 13,
      fontWeight: "700",
      textAlign: "center",
    },

    submitBtn: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: 16,
      height: reg ? 48 : 56,
      justifyContent: "center",
      marginBottom: reg ? 12 : 20,
      marginTop: reg ? 4 : 0,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.5 : 0.35,
      shadowRadius: 14,
      elevation: 8,
      width: "100%",
    },
    submitText: {
      color: "#ffffff",
      fontSize: 17,
      fontWeight: "900",
      letterSpacing: 0.3,
    },

    dividerWrap: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 12,
      width: "100%",
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      color: colors.secondaryText,
      marginHorizontal: 16,
      fontSize: 13,
      fontWeight: "700",
    },

    googleBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#ffffff",
      borderColor: isDark ? "transparent" : "#e0e0e0",
      borderWidth: isDark ? 0 : 1,
      borderRadius: 16,
      height: reg ? 48 : 56,
      justifyContent: "center",
      marginBottom: reg ? 12 : 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
      width: "100%",
    },
    googleText: {
      color: "#000000",
      fontSize: 16,
      fontWeight: "700",
    },

    switchRow: {
      alignItems: "center",
      paddingVertical: 4,
    },
    switchText: {
      color: colors.secondaryText,
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
    },
    switchLink: {
      color: colors.accent,
      fontWeight: "900",
    },

    pressed: { opacity: 0.68 },
  });
}
