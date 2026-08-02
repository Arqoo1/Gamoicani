import { StyleSheet } from "react-native";
import { AppColors } from "@/application/providers/theme";

const HARD_RED = "#d94841";
const SKIPPED_GRAY = "#7b8794";

const staticStyles = StyleSheet.create({
  levelText: { color: "#ffffff", fontSize: 12, fontWeight: "900" },
  summaryPillText: { color: "#ffffff", fontSize: 12, fontWeight: "900" },
  resultButtonText: { color: "#ffffff", fontSize: 13, fontWeight: "900", textAlign: "center" },
  primaryButtonText: { color: "#ffffff", fontSize: 15, fontWeight: "900" },
  skipButtonText: { color: "#ffffff" },
  feedbackWrong: { color: HARD_RED },
  inputTextWrong: { color: HARD_RED },
  modePickerOptionTitle: { color: "#ffffff", fontSize: 17, fontWeight: "900" },
  modePickerOptionSub: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600", marginTop: 2 },
  modePickerArrow: { color: "rgba(255,255,255,0.7)", fontSize: 24, fontWeight: "700" },
  pressed: { opacity: 0.64 },
  keyPressed: { opacity: 0.72 },
  actionKeyText: { fontSize: 11, paddingHorizontal: 2 },
  backspaceKeyText: { fontSize: 15 },
});

export function createStyles(colors: AppColors) {
  const dynamic = StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.card
     },
    keyboardArea: {
      flex: 1,
      backgroundColor: colors.background
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
      shadowRadius: 8
    },
    headerButton: {
      alignItems: "center",
      backgroundColor: colors.button,
      borderRadius: 8,
      height: 42,
      justifyContent: "center",
      width: 42
    },
    headerSpacer: {
      height: 42,
      width: 42
    },
    doneBadge: {
      alignItems: "center",
      backgroundColor: colors.correct,
      borderRadius: 8,
      height: 42,
      justifyContent: "center",
      width: 42
    },
    doneBadgeText: {
      color: "#ffffff",
      fontSize: 20,
      fontWeight: "900",
      lineHeight: 24
    },
    headerIcon: {
      color: colors.primaryText,
      fontSize: 30,
      fontWeight: "700",
      lineHeight: 36
    },
    logo: {
      color: colors.primaryText,
      fontSize: 24,
      fontWeight: "900",
      letterSpacing: 0
    },
    content: {
      flexGrow: 1,
      justifyContent: "center",
      paddingBottom: 16,
      paddingHorizontal: 20,
      paddingTop: 24
    },
    modeRow: {
      alignSelf: "center",
      backgroundColor: colors.button,
      borderRadius: 8,
      flexDirection: "row",
      gap: 4,
      marginBottom: 14,
      maxWidth: 360,
      padding: 4,
      width: "100%"
    },
    modeButton: {
      alignItems: "center",
      borderRadius: 7,
      flex: 1,
      justifyContent: "center",
      minHeight: 38
    },
    modeButtonActive: {
      backgroundColor: colors.card
    },
    modeButtonText: {
      color: colors.secondaryText,
      fontSize: 14,
      fontWeight: "900"
    },
    modeButtonTextActive: {
      color: colors.primaryText
    },
    modePickerOptionTitleSecondary: {
      color: colors.primaryText
    },
    modePickerOptionSubSecondary: {
      color: colors.secondaryText
    },
    modePickerArrowSecondary: {
      color: colors.secondaryText
    },
    metaRow: {
      alignItems: "center",
      alignSelf: "center",
      flexDirection: "row",
      gap: 8,
      marginBottom: 14
    },
    progressText: {
      color: colors.secondaryText,
      fontSize: 13,
      fontWeight: "900"
    },
    levelPill: {
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 7
    },
    easyLevel: {
      backgroundColor: colors.correct
    },
    mediumLevel: {
      backgroundColor: colors.present
    },
    hardLevel: {
      backgroundColor: HARD_RED
    },
    wordsText: {
      color: colors.primaryText,
      fontSize: 13,
      fontWeight: "900"
    },
    gameCard: {
      alignSelf: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      elevation: 2,
      maxWidth: 560,
      padding: 18,
      shadowColor: colors.shadow,
      shadowOffset: { height: 3, width: 0 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      width: "100%"
    },
    doneCard: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      elevation: 2,
      maxWidth: 520,
      padding: 22,
      shadowColor: colors.shadow,
      shadowOffset: { height: 3, width: 0 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      width: "100%"
    },
    doneTitle: {
      color: colors.primaryText,
      fontSize: 24,
      fontWeight: "900",
      letterSpacing: 0,
      marginBottom: 10,
      textAlign: "center"
    },
    doneText: {
      color: colors.secondaryText,
      fontSize: 15,
      fontWeight: "800",
      lineHeight: 22,
      textAlign: "center"
    },
    doneCount: {
      color: colors.accent,
      fontSize: 34,
      fontWeight: "900",
      marginTop: 16
    },
    resultStats: {
      flexDirection: "row",
      gap: 24,
      justifyContent: "center",
      marginTop: 18,
      width: "100%"
    },
    resultStatBox: {
      alignItems: "center",
      minWidth: 92
    },
    resultStatNumber: {
      color: colors.primaryText,
      fontSize: 30,
      fontWeight: "900"
    },
    resultStatLabel: {
      color: colors.secondaryText,
      fontSize: 12,
      fontWeight: "800",
      marginTop: 3,
      textAlign: "center"
    },
    levelSummary: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      justifyContent: "center",
      marginBottom: 12,
      marginTop: 18
    },
    summaryPill: {
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 7
    },
    resultActions: {
      flexDirection: "row",
      gap: 10,
      marginTop: 16,
      width: "100%"
    },
    resultButton: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: 8,
      flex: 1,
      justifyContent: "center",
      minHeight: 46,
      paddingHorizontal: 8
    },
    secondaryResultButton: {
      backgroundColor: colors.button
    },
    secondaryResultButtonText: {
      color: colors.primaryText
    },
    prompt: {
      color: colors.primaryText,
      fontSize: 25,
      fontWeight: "900",
      letterSpacing: 0,
      lineHeight: 36,
      marginBottom: 12,
      textAlign: "center"
    },
    feedback: {
      color: colors.secondaryText,
      fontSize: 14,
      fontWeight: "800",
      marginBottom: 16,
      textAlign: "center"
    },
    feedbackCorrect: {
      color: colors.correct
    },
    inputs: {
      gap: 10,
      marginBottom: 16
    },
    input: {
      backgroundColor: colors.tile,
      borderColor: colors.tileBorder,
      borderRadius: 8,
      borderWidth: 2,
      justifyContent: "center",
      minHeight: 52,
      paddingHorizontal: 14,
      transform: [{ scale: 1 }]
    },
    inputActive: {
      borderColor: colors.accent
    },
    inputPressed: {
      backgroundColor: colors.tileFilled
    },
    inputWrong: {
      borderColor: HARD_RED
    },
    inputCorrect: {
      borderColor: colors.correct
    },
    inputText: {
      color: colors.primaryText,
      fontSize: 20,
      fontWeight: "900",
      textAlign: "center"
    },
    inputPlaceholder: {
      color: colors.secondaryText
    },
    inputTextCorrect: {
      color: colors.primaryText
    },
    actions: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 10
    },
    primaryButton: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: 8,
      flex: 1,
      justifyContent: "center",
      minHeight: 48,
      paddingHorizontal: 12
    },
    primaryButtonComplete: {
      backgroundColor: colors.correct
    },
    secondaryButton: {
      alignItems: "center",
      backgroundColor: colors.button,
      borderRadius: 8,
      flex: 1,
      justifyContent: "center",
      minHeight: 48,
      paddingHorizontal: 12
    },
    secondaryButtonText: {
      color: colors.primaryText,
      fontSize: 15,
      fontWeight: "900"
    },
    hintButton: {
      alignItems: "center",
      alignSelf: "center",
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      marginTop: 2,
      minHeight: 42,
      paddingHorizontal: 16
    },
    hintButtonText: {
      color: colors.primaryText,
      fontSize: 14,
      fontWeight: "900",
      lineHeight: 40
    },
    hintText: {
      color: colors.secondaryText,
      fontSize: 14,
      fontWeight: "800",
      lineHeight: 20,
      marginTop: 12,
      textAlign: "center"
    },
    helpActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      justifyContent: "center",
      marginTop: 12
    },
    helpButton: {
      alignItems: "center",
      backgroundColor: colors.button,
      borderRadius: 8,
      justifyContent: "center",
      minHeight: 40,
      paddingHorizontal: 12
    },
    helpButtonText: {
      color: colors.primaryText,
      fontSize: 13,
      fontWeight: "900"
    },
    skipButton: {
      backgroundColor: SKIPPED_GRAY
    },
    completeBox: {
      borderTopColor: colors.border,
      borderTopWidth: 1,
      marginTop: 16,
      paddingTop: 16
    },
    fullText: {
      color: colors.primaryText,
      fontSize: 17,
      fontWeight: "900",
      lineHeight: 24,
      marginBottom: 14,
      textAlign: "center"
    },
    nextButton: {
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: colors.buttonStrong,
      borderRadius: 8,
      justifyContent: "center",
      minHeight: 46,
      minWidth: 150,
      paddingHorizontal: 18
    },
    nextButtonText: {
      color: colors.card,
      fontSize: 15,
      fontWeight: "900"
    },
    footer: {
      backgroundColor: colors.background,
      paddingBottom: 10,
      paddingHorizontal: 7,
      paddingTop: 4
    },
    keyboard: {
      alignSelf: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      elevation: 2,
      maxWidth: 460,
      paddingHorizontal: 4,
      paddingVertical: 8,
      shadowColor: colors.shadow,
      shadowOffset: { height: 3, width: 0 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      width: "100%"
    },
    keyboardRow: {
      flexDirection: "row",
      justifyContent: "center"
    },
    key: {
      alignItems: "center",
      backgroundColor: colors.key,
      borderRadius: 8,
      elevation: 1,
      flex: 1,
      justifyContent: "center",
      minWidth: 23,
      shadowColor: colors.shadow,
      shadowOffset: { height: 1, width: 0 },
      shadowOpacity: 0.08,
      shadowRadius: 2
    },
    actionKey: {
      flex: 1.55
    },
    shiftKey: {
      backgroundColor: colors.button
    },
    shiftKeyActive: {
      backgroundColor: colors.keyActive
    },
    keyText: {
      color: colors.primaryText,
      fontSize: 17,
      fontWeight: "900"
    },
    keyTextActive: {
      color: "#ffffff"
    },
    shiftKeyText: {
      color: colors.primaryText,
      fontSize: 22,
      fontWeight: "900",
      lineHeight: 26
    },
    modalBackdrop: {
      alignItems: "center",
      backgroundColor: colors.overlay,
      flex: 1,
      justifyContent: "center",
      padding: 24
    },
    modePickerModal: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 20,
      borderWidth: 1,
      maxWidth: 420,
      padding: 24,
      width: "100%"
    },
    modePickerKicker: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 2,
      marginBottom: 4,
      textAlign: "center",
      textTransform: "uppercase"
    },
    modePickerTitle: {
      color: colors.primaryText,
      fontSize: 26,
      fontWeight: "900",
      letterSpacing: -0.5,
      marginBottom: 24,
      textAlign: "center"
    },
    modePickerOption: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: 14,
      flexDirection: "row",
      marginBottom: 12,
      paddingHorizontal: 16,
      paddingVertical: 16
    },
    modePickerOptionSecondary: {
      backgroundColor: colors.button,
      borderColor: colors.border,
      borderWidth: 1
    },
    modePickerOptionDisabled: {
      backgroundColor: colors.button,
      borderColor: colors.border,
      borderWidth: 1,
      opacity: 0.7
    },
    modePickerIconWrap: {
      marginRight: 14
    },
    modePickerIcon: {
      fontSize: 28
    },
    modePickerText: {
      flex: 1
    },
    modePickerDisabledText: {
      color: colors.disabled
    },
    modePickerDoneCheck: {
      color: colors.disabled,
      fontSize: 24,
      fontWeight: "900",
      paddingLeft: 8
    },
    modePickerBack: {
      alignItems: "center",
      marginTop: 8,
      paddingVertical: 10
    },
    modePickerBackText: {
      color: colors.secondaryText,
      fontSize: 14,
      fontWeight: "700"
    }
  });
  return { ...dynamic, ...staticStyles };
}
