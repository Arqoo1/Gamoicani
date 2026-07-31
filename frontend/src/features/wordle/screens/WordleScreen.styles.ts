import { StyleSheet } from "react-native";
import { AppColors } from "@/application/providers/theme";
import { Easing } from "react-native";

export const keyScoreStyles = StyleSheet.create({
  correct: {
    backgroundColor: "#2f9e5d"
  },
  present: {
    backgroundColor: "#d6a12a"
  },
  absent: {
    backgroundColor: "#66727f"
  }
});

export function createStyles(colors: AppColors) {
  return StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.card
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
  headerActions: {
    alignItems: "center",
    flexDirection: "row"
  },
  headerButton: {
    alignItems: "center",
    backgroundColor: colors.button,
    borderRadius: 8,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  headerIcon: {
    color: colors.primaryText,
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 36
  },
  logo: {
    color: colors.primaryText,
    fontSize: 29,
    fontWeight: "900",
    letterSpacing: 0,
    textAlign: "center"
  },
  logoWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  statsIcon: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 3,
    height: 20,
    justifyContent: "center",
    width: 22
  },
  statsBar: {
    backgroundColor: colors.primaryText,
    borderRadius: 2,
    width: 4
  },
  metaRow: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 42,
    paddingHorizontal: 14,
    shadowColor: colors.shadow,
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 5
  },
  metaText: {
    color: colors.secondaryText,
    fontSize: 13,
    fontWeight: "800"
  },
  message: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: "800"
  },
  boardArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  board: {
    alignSelf: "center",
    marginTop: 10
  },
  boardRow: {
    flexDirection: "row"
  },
  tile: {
    alignItems: "center",
    backgroundColor: colors.tile,
    borderColor: colors.tileBorder,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: "center"
  },
  tileFilled: {
    backgroundColor: colors.tileFilled,
    borderColor: colors.primaryText
  },
  tileText: {
    color: colors.primaryText,
    fontSize: 27,
    fontWeight: "900",
    lineHeight: 34,
    textTransform: "uppercase"
  },
  tileTextScored: {
    color: "#ffffff"
  },
  toast: {
    alignSelf: "center",
    backgroundColor: colors.buttonStrong,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    position: "absolute",
    top: 108,
    zIndex: 10
  },
  toastText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800"
  },
  footer: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 10,
    paddingHorizontal: 7
  },
  shareButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.accent,
    borderRadius: 8,
    marginBottom: 10,
    paddingHorizontal: 22,
    paddingVertical: 11
  },
  shareText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900"
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
  keyTextScored: {
    color: "#ffffff"
  },
  actionKeyText: {
    fontSize: 11,
    paddingHorizontal: 2
  },
  shiftKeyText: {
    color: colors.primaryText,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 26
  },
  backspaceKeyText: {
    fontSize: 15
  },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: "center",
    padding: 18
  },
  resultModal: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 420,
    padding: 18,
    width: "100%"
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
    opacity: 0.65
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
  modePickerOptionTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900"
  },
  modePickerOptionSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2
  },
  modePickerDisabledText: {
    color: colors.secondaryText
  },
  modePickerDoneCheck: {
    color: colors.secondaryText,
    fontSize: 22,
    fontWeight: "900"
  },
  modePickerArrow: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 24,
    fontWeight: "700"
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
  },
  practiceBadge: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  practiceBadgeText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "900"
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  resultKicker: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "900"
  },
  resultTitle: {
    color: colors.primaryText,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0
  },
  modalCloseButton: {
    alignItems: "center",
    backgroundColor: colors.button,
    borderRadius: 8,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  modalCloseText: {
    color: colors.primaryText,
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 29
  },
  resultSubtitle: {
    color: colors.secondaryText,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 14
  },
  previewBox: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    marginBottom: 16,
    padding: 14
  },
  previewText: {
    color: colors.primaryText,
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 24,
    textAlign: "center"
  },
  resultActions: {
    flexDirection: "row",
    gap: 10
  },
  resultButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 12
  },
  resultButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900"
  },
  secondaryResultButton: {
    backgroundColor: colors.button
  },
  secondaryResultButtonText: {
    color: colors.primaryText
  },
  pressed: {
    opacity: 0.64
  },
  keyPressed: {
    opacity: 0.72
  }
  });
}
