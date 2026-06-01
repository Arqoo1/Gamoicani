import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../src/auth";
import { AppColors, useAppTheme } from "../src/theme";

type AuthMode = "login" | "register";

export default function LoginScreen() {
  const router = useRouter();
  const { login, register } = useAuth();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [mode, setMode] = useState<AuthMode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await register({ displayName, email, password, username });
      }

      router.replace("/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ვერ მოხერხდა");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safe}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardArea}
      >
        <View style={styles.panel}>
          <Text style={styles.kicker}>ქართული თამაშები</Text>
          <Text style={styles.title}>შესვლა</Text>

          <View style={styles.modeRow}>
            <Pressable
              style={({ pressed }) => [
                styles.modeButton,
                mode === "login" && styles.modeButtonActive,
                pressed && styles.pressed
              ]}
              onPress={() => setMode("login")}
            >
              <Text style={[styles.modeButtonText, mode === "login" && styles.modeButtonTextActive]}>
                შესვლა
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.modeButton,
                mode === "register" && styles.modeButtonActive,
                pressed && styles.pressed
              ]}
              onPress={() => setMode("register")}
            >
              <Text style={[styles.modeButtonText, mode === "register" && styles.modeButtonTextActive]}>
                რეგისტრაცია
              </Text>
            </Pressable>
          </View>

          {mode === "register" && (
            <>
              <TextInput
                autoCapitalize="words"
                placeholder="სახელი"
                placeholderTextColor={colors.secondaryText}
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
              />
              <TextInput
                autoCapitalize="none"
                placeholder="username"
                placeholderTextColor={colors.secondaryText}
                style={styles.input}
                value={username}
                onChangeText={setUsername}
              />
            </>
          )}

          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="email"
            placeholderTextColor={colors.secondaryText}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            placeholder="password"
            placeholderTextColor={colors.secondaryText}
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            onPress={submit}
          >
            <Text style={styles.primaryButtonText}>
              {isSubmitting ? "იტვირთება" : mode === "login" ? "შესვლა" : "ანგარიშის შექმნა"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: {
      backgroundColor: colors.background,
      flex: 1
    },
    keyboardArea: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      padding: 20
    },
    panel: {
      alignSelf: "center",
      maxWidth: 420,
      width: "100%"
    },
    kicker: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: "900",
      marginBottom: 4,
      textAlign: "center"
    },
    title: {
      color: colors.primaryText,
      fontSize: 38,
      fontWeight: "900",
      letterSpacing: 0,
      marginBottom: 22,
      textAlign: "center"
    },
    modeRow: {
      backgroundColor: colors.button,
      borderRadius: 8,
      flexDirection: "row",
      gap: 4,
      marginBottom: 14,
      padding: 4
    },
    modeButton: {
      alignItems: "center",
      borderRadius: 7,
      flex: 1,
      justifyContent: "center",
      minHeight: 40
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
    input: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: "800",
      minHeight: 50,
      marginBottom: 10,
      paddingHorizontal: 14
    },
    message: {
      color: colors.present,
      fontSize: 13,
      fontWeight: "900",
      marginBottom: 10,
      textAlign: "center"
    },
    primaryButton: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: 8,
      justifyContent: "center",
      minHeight: 50,
      paddingHorizontal: 14
    },
    primaryButtonText: {
      color: "#ffffff",
      fontSize: 15,
      fontWeight: "900"
    },
    pressed: {
      opacity: 0.64
    }
  });
}
