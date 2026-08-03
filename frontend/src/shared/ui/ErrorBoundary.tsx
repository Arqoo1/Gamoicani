import React, { Component, ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { styles } from "./ErrorBoundary.styles";

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
          <Text style={styles.subtitle}>აპლიკაციაში მოხდა მოულოდნელი შეცდომა. გთხოვთ სცადეთ ხელახლა.</Text>
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
