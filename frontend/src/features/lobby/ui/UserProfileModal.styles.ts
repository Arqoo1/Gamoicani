import { StyleSheet } from "react-native";
import { AppColors } from "@/application/providers/theme";

export function createStyles(colors: AppColors) {
  return StyleSheet.create({
    profileModalBackdrop: {
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.4)",
      flex: 1,
      justifyContent: "flex-end",
    },
    profileModalCard: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
      width: "100%",
    },
    profileBanner: {
      borderRadius: 12,
      height: 72,
      width: "100%",
    },
    profileAvatarBox: {
      alignItems: "center",
      borderColor: colors.card,
      borderRadius: 44,
      borderWidth: 4,
      height: 80,
      justifyContent: "center",
      marginTop: -40,
      width: 80,
    },
    profileAvatarText: { color: "#fff", fontSize: 24, fontWeight: "900" },
    profileInfo: { alignItems: "center", marginVertical: 12 },
    profileName: { color: colors.primaryText, fontSize: 18, fontWeight: "800" },
    profileUsername: { color: colors.secondaryText, fontSize: 13, fontWeight: "700" },
    profileActions: { flexDirection: "row", gap: 10, width: "100%" },
    profileBtnClose: {
      alignItems: "center",
      backgroundColor: colors.button,
      borderRadius: 12,
      flex: 1,
      paddingVertical: 12,
    },
    profileBtnCloseText: { color: colors.primaryText, fontSize: 14, fontWeight: "700" },
    profileBtnView: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: 12,
      flex: 1,
      paddingVertical: 12,
    },
    profileBtnViewText: { color: "#fff", fontSize: 14, fontWeight: "700" },
    profileBtnAdd: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: 12,
      flexDirection: "row",
      gap: 6,
      justifyContent: "center",
      paddingVertical: 12,
      width: "100%",
    },
    profileBtnAddText: { color: "#fff", fontSize: 14, fontWeight: "700" },
    pressed: { opacity: 0.7 },
  });
}
