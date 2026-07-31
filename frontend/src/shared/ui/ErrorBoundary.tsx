import React, { Component, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>💥</Text>
          <Text style={styles.title}>რაღაც შეცდომა მოხდა</Text>
          <Text style={styles.subtitle}>
            აპლიკაციაში მოხდა მოულოდნელი შეცდომა. გთხოვთ სცადეთ ხელახლა.
          </Text>
          {__DEV__ && this.state.error && (
            <View style={styles.devBox}>
              <Text style={styles.devText} numberOfLines={6}>
                {this.state.error.message}
              </Text>
            </View>
          )}
          <Pressable
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
            onPress={this.handleReset}
          >
            <Text style={styles.btnText}>ხელახლა ცდა</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
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
