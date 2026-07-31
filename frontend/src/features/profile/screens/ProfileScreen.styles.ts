import { StyleSheet, Platform } from "react-native";
import { AppColors } from "@/application/providers/theme";

export function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { backgroundColor: colors.card, flex: 1  },
    scroll: { backgroundColor: colors.background },
    scrollContent: { paddingBottom: 20 },

    header: {
      alignItems: "center",
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
    headerBtn: {
      alignItems: "center",
      backgroundColor: colors.button,
      borderRadius: 8,
      height: 42,
      justifyContent: "center",
      width: 42
    },
    headerSpacer: { height: 42, width: 42 },
    headerIcon: { color: colors.primaryText, fontSize: 30, fontWeight: "700", lineHeight: 36 },
    headerTitle: { color: colors.primaryText, fontSize: 22, fontWeight: "900" },

    cover: {
      height: 140,
      overflow: "hidden",
      position: "relative"
    },
    coverGradientTop: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: "50%"
    },
    coverGradientBottom: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "50%"
    },
    coverOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: "#000",
      opacity: 0.18
    },
    coverEditBtn: {
      position: "absolute",
      right: 16,
      top: 16,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "center",
      alignItems: "center"
    },

    avatarRow: {
      alignItems: "flex-end",
      flexDirection: "row",
      marginTop: -36,
      paddingBottom: 12,
      paddingHorizontal: 20,
      gap: 14
    },
    avatar: {
      alignItems: "center",
      borderColor: colors.card,
      borderRadius: 40,
      borderWidth: 4,
      elevation: 4,
      height: 80,
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { height: 4, width: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      width: 80,
      overflow: "hidden"
    },
    avatarImage: { height: "100%", width: "100%" },
    avatarInitials: { color: "#fff", fontSize: 28, fontWeight: "900" },
    avatarEmoji: { fontSize: 44 },
    avatarEditBadge: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderColor: colors.card,
      borderRadius: 10,
      borderWidth: 2,
      bottom: 0,
      height: 20,
      justifyContent: "center",
      position: "absolute",
      right: 0,
      width: 20
    },
    avatarEditIcon: { color: "#fff", fontSize: 10, fontWeight: "900" },
    heroInfo: { flex: 1, paddingRight: 10, alignSelf: "center", marginTop: 6 },
    heroNameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 },
    heroName: { color: colors.primaryText, fontSize: 24, fontWeight: "900" },
    heroUsername: { color: colors.secondaryText, fontSize: 14, fontWeight: "800" },
    rankBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12, borderWidth: 1, backgroundColor: colors.background },
    rankBadgeIcon: { fontSize: 12, marginRight: 4 },
    rankBadgeText: { fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
    rankProgressText: { color: colors.secondaryText, fontSize: 11, fontWeight: "700", marginTop: 4 },

    colorPicker: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      marginHorizontal: 20,
      marginBottom: 12,
      padding: 14
    },
    colorPickerLabel: {
      color: colors.primaryText,
      fontSize: 13,
      fontWeight: "800",
      marginBottom: 10
    },
    colorSwatches: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    colorSwatch: {
      borderRadius: 18,
      height: 36,
      width: 36
    },
    colorSwatchActive: {
      borderColor: colors.primaryText,
      borderWidth: 3
    },
    colorSwatchEmoji: {
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    equippedBadge: {
      position: "absolute",
      bottom: -4,
      right: -4,
      backgroundColor: colors.accent,
      borderRadius: 8,
      width: 16,
      height: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    equippedBadgeText: {
      color: "#fff",
      fontSize: 9,
      fontWeight: "900",
    },

    statsBar: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1,
      elevation: 1,
      flexDirection: "row",
      marginBottom: 16,
      marginHorizontal: 20,
      paddingVertical: 14,
      shadowColor: colors.shadow,
      shadowOffset: { height: 2, width: 0 },
      shadowOpacity: 0.06,
      shadowRadius: 6
    },
    statBarItem: { alignItems: "center", flex: 1 },
    statBarDivider: { backgroundColor: colors.border, width: 1 },
    statBarNum: { color: colors.primaryText, fontSize: 22, fontWeight: "900" },
    statBarLbl: { color: colors.secondaryText, fontSize: 11, fontWeight: "700", marginTop: 2 },

    card: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1,
      elevation: 1,
      marginBottom: 16,
      marginHorizontal: 20,
      overflow: "hidden",
      shadowColor: colors.shadow,
      shadowOffset: { height: 2, width: 0 },
      shadowOpacity: 0.06,
      shadowRadius: 6
    },
    cardTitle: {
      color: colors.primaryText,
      fontSize: 15,
      fontWeight: "900",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12
    },
    divider: { backgroundColor: colors.border, height: 1, marginHorizontal: 16 },

    fieldRow: {
      alignItems: "center",
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 12
    },
    fieldContent: { flex: 1 },
    fieldLabel: { color: colors.secondaryText, fontSize: 11, fontWeight: "800", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 },
    fieldValue: { color: colors.primaryText, fontSize: 16, fontWeight: "700" },
    fieldBadge: { alignItems: "center", justifyContent: "center", width: 32 },
    fieldBadgeText: { fontSize: 16 },

    editIconBtn: {
      alignItems: "center",
      backgroundColor: colors.button,
      borderRadius: 8,
      height: 34,
      justifyContent: "center",
      width: 34
    },
    editIcon: { color: colors.primaryText, fontSize: 16 },
    editRowActive: { padding: 16 },
    inlineInput: {
      backgroundColor: colors.background,
      borderColor: colors.accent,
      borderRadius: 8,
      borderWidth: 1.5,
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: "700",
      marginTop: 6,
      marginBottom: 10,
      minHeight: 48,
      paddingHorizontal: 12
    },
    inlineInputMulti: { minHeight: 80, paddingTop: 10, textAlignVertical: "top" },
    fieldError: { color: "#e63946", fontSize: 13, fontWeight: "700", marginBottom: 8 },
    editRowActions: { flexDirection: "row", gap: 8 },
    saveBtn: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: 8,
      flex: 1,
      justifyContent: "center",
      minHeight: 42
    },
    saveBtnText: { color: "#fff", fontSize: 14, fontWeight: "900" },
    cancelBtn: {
      alignItems: "center",
      backgroundColor: colors.button,
      borderRadius: 8,
      flex: 1,
      justifyContent: "center",
      minHeight: 42
    },
    cancelBtnText: { color: colors.primaryText, fontSize: 14, fontWeight: "900" },

    gameRow: { paddingHorizontal: 16, paddingVertical: 12 },
    gameHeader: { alignItems: "center", flexDirection: "row", marginBottom: 10, gap: 8 },
    gameEmoji: { fontSize: 20 },
    gameLabel: { color: colors.primaryText, flex: 1, fontSize: 15, fontWeight: "800" },
    gamePointsBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
    gamePointsText: { fontSize: 12, fontWeight: "800" },
    gameStats: { flexDirection: "row", justifyContent: "space-between" },
    gameStatItem: { alignItems: "center", flex: 1 },
    gameStatNum: { color: colors.primaryText, fontSize: 18, fontWeight: "900" },
    gameStatLbl: { color: colors.secondaryText, fontSize: 10, fontWeight: "700", marginTop: 2 },

    sectionToggle: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingRight: 16
    },
    toggleChevron: {
      color: colors.secondaryText,
      fontSize: 22,
      fontWeight: "700",
      transform: [{ rotate: "90deg" }]
    },
    toggleChevronOpen: { transform: [{ rotate: "-90deg" }] },

    pwSection: { paddingHorizontal: 16, paddingBottom: 16 },
    pwLabel: {
      color: colors.secondaryText,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.5,
      marginBottom: 4,
      textTransform: "uppercase"
    },
    pwInput: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 12,
      minHeight: 48,
      paddingHorizontal: 12
    },
    pwMsg: { fontSize: 13, fontWeight: "800", marginBottom: 10, textAlign: "center" },
    pwMsgErr: { color: "#e63946" },
    pwMsgOk: { color: colors.correct },

    primaryBtn: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: 10,
      justifyContent: "center",
      minHeight: 48,
      marginTop: 4
    },
    primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "900" },

    logoutBtn: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: "#e6394640",
      borderRadius: 12,
      borderWidth: 1.5,
      flexDirection: "row",
      gap: 10,
      justifyContent: "center",
      marginHorizontal: 20,
      marginTop: 4,
      minHeight: 50
    },
    logoutText: { color: "#e63946", fontSize: 15, fontWeight: "900" },

    pressed: { opacity: 0.64 },

    modalBackdropAction: { flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" },
    modalBackdropDialog: { flex: 1, backgroundColor: colors.overlay, justifyContent: "center" },
    
    actionSheet: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    actionSheetHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
    actionSheetTitle: { color: colors.primaryText, fontSize: 18, fontWeight: "900", marginBottom: 16, textAlign: "center" },
    actionSheetBtn: { backgroundColor: colors.background, borderRadius: 12, paddingVertical: 16, marginBottom: 10, alignItems: "center" },
    actionSheetBtnText: { color: colors.primaryText, fontSize: 16, fontWeight: "700" },
    actionSheetCancelBtn: { backgroundColor: "transparent", paddingVertical: 16, marginTop: 4, alignItems: "center" },
    actionSheetCancelBtnText: { color: colors.secondaryText, fontSize: 16, fontWeight: "800" },

    dialog: { backgroundColor: colors.card, borderRadius: 16, margin: 24, padding: 24, alignSelf: "center", width: "85%", maxWidth: 400 },
    dialogIconContainer: { alignSelf: "center", backgroundColor: "#e6394612", borderRadius: 30, width: 60, height: 60, alignItems: "center", justifyContent: "center", marginBottom: 16 },
    dialogTitle: { color: colors.primaryText, fontSize: 18, fontWeight: "900", marginBottom: 10, textAlign: "center" },
    dialogText: { color: colors.secondaryText, fontSize: 15, fontWeight: "600", marginBottom: 24, textAlign: "center", lineHeight: 22 },
    dialogActions: { flexDirection: "row", gap: 12 },
    dialogBtn: { flex: 1, backgroundColor: colors.accent, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
    dialogBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
    dialogCancelBtn: { flex: 1, backgroundColor: colors.button, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
    dialogCancelBtnText: { color: colors.primaryText, fontSize: 15, fontWeight: "800" },
    dialogDangerBtn: { flex: 1, backgroundColor: "#e63946", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
    dialogDangerBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },

    achievementsGrid: { flexDirection: "row", flexWrap: "wrap", padding: 16, paddingTop: 4, gap: 12, justifyContent: "center" },
    achievementBadge: { alignItems: "center", backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, width: 100 },
    achievementBadgeLocked: { opacity: 0.5, backgroundColor: "transparent" },
    achievementEmoji: { fontSize: 28, marginBottom: 6 },
    achievementEmojiLocked: { opacity: 0.3 },
    achievementLabel: { color: colors.primaryText, fontSize: 11, fontWeight: "800", textAlign: "center" },

    questRow: { marginBottom: 12 },
    questInfo: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
    questTitle: { color: colors.primaryText, fontSize: 14, fontWeight: "800" },
    questProgressText: { color: colors.secondaryText, fontSize: 12, fontWeight: "700" },
    questProgressBarBg: { backgroundColor: colors.border, borderRadius: 4, height: 8, width: "100%", overflow: "hidden" },
    questProgressBar: { height: "100%", borderRadius: 4 },

    sectionSubtitle: { color: colors.secondaryText, fontSize: 12, fontWeight: "800", textTransform: "uppercase", marginBottom: 12 },
    distribution: { gap: 4 },
    distributionRow: { flexDirection: "row", alignItems: "center" },
    guessNumber: { color: colors.primaryText, fontSize: 13, fontWeight: "800", width: 16, textAlign: "center" },
    barTrack: { flex: 1, marginLeft: 8 },
    bar: { minWidth: 20, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignItems: "flex-end", justifyContent: "center" },
    barText: { color: "#fff", fontSize: 11, fontWeight: "800" },

    searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: colors.background, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, marginBottom: 16 },
    searchInput: { flex: 1, color: colors.primaryText, fontSize: 15, fontWeight: "600", minHeight: 44, paddingHorizontal: 8 },
    searchResults: { backgroundColor: colors.background, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 16 },
    friendSectionTitle: { color: colors.secondaryText, fontSize: 12, fontWeight: "800", textTransform: "uppercase", marginBottom: 12, marginTop: 8 },
    friendRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    friendAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginRight: 12 },
    friendAvatarInitials: { color: "#fff", fontSize: 16, fontWeight: "900" },
    friendInfo: { flex: 1 },
    friendName: { color: colors.primaryText, fontSize: 15, fontWeight: "800" },
    friendUsername: { color: colors.secondaryText, fontSize: 13, fontWeight: "600", marginTop: 2 },
    h2hText: { color: colors.secondaryText, fontSize: 11, fontWeight: "700", marginTop: 4 },
    addFriendBtn: { backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    addFriendBtnText: { color: "#fff", fontSize: 13, fontWeight: "800" },
    acceptBtn: { backgroundColor: colors.accent, padding: 8, borderRadius: 8 },
    rejectBtn: { backgroundColor: colors.button, borderColor: "#e63946", borderWidth: 1, padding: 7, borderRadius: 8 },
    removeBtn: { padding: 8 },
    friendListEmpty: { color: colors.secondaryText, fontSize: 14, fontWeight: "600", textAlign: "center", paddingVertical: 12 }
  });
}
