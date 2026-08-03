import { StyleSheet } from "react-native";

import { AppColors } from "@/application/providers/theme";

export function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    backBtn: { alignItems: "center", height: 44, justifyContent: "center", width: 44 },
    title: { color: colors.primaryText, fontSize: 18, fontWeight: "900" },
    pressed: { opacity: 0.65 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    content: { padding: 16 },
    empty: { alignItems: "center", marginTop: 80, gap: 12 },
    emptyEmoji: { fontSize: 56 },
    emptyTitle: { color: colors.primaryText, fontSize: 20, fontWeight: "900" },
    emptyHint: { color: colors.secondaryText, fontSize: 14, textAlign: "center", maxWidth: 260 },
    retryButton: {
      backgroundColor: colors.accent,
      borderRadius: 8,
      marginTop: 16,
      paddingHorizontal: 18,
      paddingVertical: 10,
    },
    retryButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "900" },
    card: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: "row",
      gap: 12,
      marginBottom: 12,
      padding: 14,
    },
    avatar: {
      alignItems: "center",
      borderRadius: 24,
      height: 48,
      justifyContent: "center",
      width: 48,
      overflow: "hidden",
      flexShrink: 0,
    },
    avatarImg: { width: 48, height: 48, borderRadius: 24 },
    avatarText: { color: "#fff", fontSize: 18, fontWeight: "900" },
    cardBody: { flex: 1 },
    cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
    displayName: { color: colors.primaryText, fontSize: 15, fontWeight: "900" },
    timeAgo: { color: colors.secondaryText, fontSize: 11, fontWeight: "600" },
    gameDesc: { color: colors.secondaryText, fontSize: 13, fontWeight: "600", marginBottom: 6 },
    wonBadge: { color: colors.accent, fontSize: 13, fontWeight: "800" },
  });
}
