import { StyleSheet } from "react-native";
import { AppColors } from "@/application/providers/theme";

const CELL_GAP = 5;

export function createStyles(colors: AppColors, cellSize: number) {
  return StyleSheet.create({
    myGrid: { alignItems: "center", flex: 1, gap: CELL_GAP, justifyContent: "center", paddingHorizontal: 16 },
    gridRow: { flexDirection: "row", gap: CELL_GAP },
    gridCell: {
      alignItems: "center",
      borderRadius: 5,
      borderWidth: 2,
      height: cellSize,
      justifyContent: "center",
      width: cellSize,
    },
    cellLetter: { color: colors.primaryText, fontSize: Math.round(cellSize * 0.5), fontWeight: "900" },
    cellLetterWhite: { color: "#ffffff" },
  });
}
