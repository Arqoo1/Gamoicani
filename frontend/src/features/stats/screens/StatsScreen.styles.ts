import { StyleSheet } from "react-native";
import { AppColors } from "@/application/providers/theme";

export function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.card,
    },
    scrollView: {
      backgroundColor: colors.background,
    },
    header: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      elevation: 2,
      flexDirection: "row",
      height: 56,
      justifyContent: "space-between",
      paddingHorizontal: 10,
      shadowColor: colors.shadow,
      shadowOffset: { height: 2, width: 0 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    headerButton: {
      alignItems: "center",
      backgroundColor: colors.button,
      borderRadius: 8,
      height: 42,
      justifyContent: "center",
      width: 42,
    },
    headerSpacer: {
      height: 42,
      width: 42,
    },
    headerIcon: {
      color: colors.primaryText,
      fontSize: 30,
      fontWeight: "700",
      lineHeight: 36,
    },
    logo: {
      color: colors.primaryText,
      fontSize: 22,
      fontWeight: "900",
      letterSpacing: 0,
    },
    content: {
      paddingBottom: 30,
      paddingHorizontal: 24,
      paddingTop: 28,
    },
    statsGrid: {
      flexDirection: "row",
      gap: 10,
      justifyContent: "center",
      marginBottom: 32,
    },
    statBox: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      elevation: 1,
      flex: 1,
      paddingHorizontal: 6,
      paddingVertical: 13,
      shadowColor: colors.shadow,
      shadowOffset: { height: 2, width: 0 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
    },
    statNumber: {
      color: colors.primaryText,
      fontSize: 30,
      fontWeight: "800",
      lineHeight: 36,
    },
    statLabel: {
      color: colors.secondaryText,
      fontSize: 12,
      fontWeight: "700",
      marginTop: 4,
      textAlign: "center",
    },
    sectionTitle: {
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: "900",
      marginBottom: 16,
      textAlign: "center",
    },
    calendar: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      justifyContent: "center",
      marginBottom: 12,
    },
    calendarDay: {
      alignItems: "center",
      backgroundColor: colors.button,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      height: 34,
      justifyContent: "center",
      width: 34,
    },
    calendarDayWon: {
      backgroundColor: colors.correct,
      borderColor: colors.correct,
    },
    calendarDayLost: {
      backgroundColor: colors.absent,
      borderColor: colors.absent,
    },
    calendarDayToday: {
      borderColor: colors.accent,
      borderWidth: 2,
    },
    calendarDayText: {
      color: colors.secondaryText,
      fontSize: 12,
      fontWeight: "900",
    },
    calendarDayTextStrong: {
      color: "#ffffff",
    },
    legend: {
      flexDirection: "row",
      gap: 10,
      justifyContent: "center",
      marginBottom: 30,
    },
    legendItem: {
      color: colors.secondaryText,
      fontSize: 12,
      fontWeight: "800",
    },
    distribution: {
      gap: 7,
    },
    distributionRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
    },
    guessNumber: {
      color: colors.primaryText,
      fontSize: 14,
      fontWeight: "700",
      width: 14,
    },
    barTrack: {
      backgroundColor: colors.key,
      borderRadius: 8,
      flex: 1,
      overflow: "hidden",
    },
    bar: {
      alignItems: "flex-end",
      backgroundColor: colors.accent,
      borderRadius: 8,
      justifyContent: "center",
      minHeight: 24,
      paddingHorizontal: 8,
    },
    barText: {
      color: "#ffffff",
      fontSize: 13,
      fontWeight: "900",
    },
    pressed: {
      opacity: 0.64,
    },
  });
}
