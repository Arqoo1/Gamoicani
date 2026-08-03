import { StyleSheet } from "react-native";
import { AppColors } from "@/application/providers/theme";


const MINI_SIZE = 9;
const MINI_GAP = 3;

export function createStyles(colors: AppColors) {
  return StyleSheet.create({
    oppStrip: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderColor: colors.border,
      borderTopWidth: 1,
      flexDirection: "row",
      gap: 10,
      height: 74,
      overflow: "visible",
      paddingHorizontal: 12,
      paddingVertical: 8,
      position: "relative",
    },
    oppInfo: { alignItems: "center", gap: 3, width: 52 },
    oppAvatar: { alignItems: "center", borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
    oppAvatarIcon: { fontSize: 18 },
    oppName: { color: colors.secondaryText, fontSize: 10, fontWeight: "700", textAlign: "center" },
    vsContainer: { width: 52, alignItems: "center", justifyContent: "center" },
    vsLabel: { color: colors.secondaryText, fontSize: 11, fontWeight: "900", letterSpacing: 1 },
    miniGrid: { flex: 1, gap: MINI_GAP, justifyContent: "center", alignItems: "center" },
    miniRow: { flexDirection: "row", gap: MINI_GAP },
    miniCell: { borderRadius: 2, height: MINI_SIZE, width: MINI_SIZE },
    miniCircle: { borderRadius: 6, height: 12, width: 12 },
    floatEmote: { elevation: 30, fontSize: 36, position: "absolute", top: 4, zIndex: 30 },
    floatLeft: { left: 10 },
    floatRight: { right: 10 },
  });
}
