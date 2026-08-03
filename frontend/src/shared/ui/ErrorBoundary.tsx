import React, { Component, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/application/providers/theme";
import { crashReporter } from "@/shared/services/crashReporter";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  route?: string;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

function ErrorFallbackView({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.emoji}>💥</Text>
      <Text style={[styles.title, { color: colors.primaryText }]}>რაღაც შეცდომა მოხდა</Text>
      <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
        აპლიკაციაში მოხდა მოულოდნელი შეცდომა. გთხოვთ სცადეთ ხელახლა.
      </Text>
      {__DEV__ && error && (
        <View style={[styles.devBox, { backgroundColor: colors.card, borderColor: "#e63946" }]}>
          <Text style={[styles.devText, { color: "#e63946" }]} numberOfLines={6}>
            {error.message}
          </Text>
        </View>
      )}
      <Pressable
        style={({ pressed }) => [styles.btn, { backgroundColor: colors.accent }, pressed && styles.btnPressed]}
        onPress={onReset}
      >
        <Text style={styles.btnText}>ხელახლა ცდა</Text>
      </Pressable>
    </View>
  );
}

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
    crashReporter.reportError(error, this.props.route, { componentStack: info.componentStack });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallbackView error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 32,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    marginBottom: 32,
    textAlign: "center",
  },
  devBox: {
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 24,
    padding: 12,
    width: "100%",
  },
  devText: {
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 18,
  },
  btn: {
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
