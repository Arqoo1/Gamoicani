import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  keyboard: {
    alignSelf: "center",
    borderRadius: 8,
    borderWidth: 1,
    elevation: 2,
    maxWidth: 460,
    paddingHorizontal: 4,
    paddingVertical: 8,
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    width: "100%",
  },
  keyboardRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  key: {
    alignItems: "center",
    borderRadius: 8,
    elevation: 1,
    flex: 1,
    justifyContent: "center",
    minWidth: 23,
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  actionKey: {
    flex: 1.55,
  },
  keyText: {
    fontSize: 17,
    fontWeight: "900",
  },
  shiftKeyText: {
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 26,
  },
  actionKeyText: {
    fontSize: 11,
    paddingHorizontal: 2,
  },
  backspaceKeyText: {
    fontSize: 15,
  },
});
