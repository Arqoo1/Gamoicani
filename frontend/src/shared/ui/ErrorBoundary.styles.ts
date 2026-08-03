import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#0f1117",
    flex: 1,
    justifyContent: "center",
    padding: 32,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    color: "#f0f0f0",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    color: "#9aa3af",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    marginBottom: 32,
    textAlign: "center",
  },
  devBox: {
    backgroundColor: "#1e1e2e",
    borderColor: "#e63946",
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 24,
    padding: 12,
    width: "100%",
  },
  devText: {
    color: "#ff6b6b",
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 18,
  },
  btn: {
    backgroundColor: "#2f9e5d",
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  btnPressed: {
    opacity: 0.75,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
});
