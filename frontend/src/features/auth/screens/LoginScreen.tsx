import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { useAuth } from "@/application/providers/auth";
import { AppColors, useAppTheme } from "@/application/providers/theme";
import { WordleTiles } from "@/features/auth/ui/AuthBrand";
import { MoonIcon, SunIcon } from "@/shared/ui/ThemeGlyphs";

type AuthMode = "login" | "register";

export default function LoginScreen() {
  const router = useRouter();
  const { login, register, loginWithGoogle } = useAuth();
  const { colors, isDark, toggleTheme } = useAppTheme();
  const [mode, setMode] = useState<AuthMode>("login");
  const styles = useMemo(
    () => createStyles(colors, isDark, mode),
    [colors, isDark, mode],
  );
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setMessage("");
  };

  const submit = async () => {
    if (isSubmitting) return;
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

  const handleGoogleSignIn = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setMessage("");
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (response.data?.idToken) {
        await loginWithGoogle(response.data.idToken);
        router.replace("/");
      } else {
        setMessage("Google Sign-In failed (no token)");
      }
    } catch (error: any) {
      if (error.code === "SIGN_IN_CANCELLED") {
        setMessage("");
      } else {
        setMessage(error.message || "Google Sign-In Error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = (field: string) => [
    styles.input,
    focusedField === field && styles.inputFocused,
  ];

  return (
    <SafeAreaView
      edges={["top", "right", "bottom", "left"]}
      style={styles.safe}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {mode === "login" && (
            <Pressable
              accessibilityLabel="თემის შეცვლა"
              style={({ pressed }) => [
                styles.themeToggle,
                pressed && styles.pressed,
              ]}
              onPress={toggleTheme}
            >
              {isDark ? (
                <SunIcon color={colors.primaryText} />
              ) : (
                <MoonIcon color={colors.primaryText} />
              )}
              <Text style={styles.themeLabel}>
                {isDark ? "ღია რეჟიმი" : "მუქი რეჟიმი"}
              </Text>
            </Pressable>
          )}

          <WordleTiles colors={colors} compact={mode === "register"} />

          <Text style={styles.kicker}>ქართული თამაშები</Text>
          <Text style={styles.title}>
            {mode === "login" ? "მოგესალმებით" : "შექმენი ანგარიში"}
          </Text>

          <View style={styles.tabPill}>
            <Pressable
              style={[
                styles.tabOption,
                mode === "login" && styles.tabOptionActive,
              ]}
              onPress={() => switchMode("login")}
            >
              <Text
                style={[
                  styles.tabOptionText,
                  mode === "login" && styles.tabOptionTextActive,
                ]}
              >
                შესვლა
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.tabOption,
                mode === "register" && styles.tabOptionActive,
              ]}
              onPress={() => switchMode("register")}
            >
              <Text
                style={[
                  styles.tabOptionText,
                  mode === "register" && styles.tabOptionTextActive,
                ]}
              >
                რეგისტრაცია
              </Text>
            </Pressable>
          </View>

          {mode === "register" && (
            <>
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>სახელი</Text>
                <TextInput
                  autoCapitalize="words"
                  placeholder="შენი სახელი"
                  placeholderTextColor={colors.secondaryText}
                  style={inputStyle("displayName")}
                  value={displayName}
                  onChangeText={setDisplayName}
                  onFocus={() => setFocusedField("displayName")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>მომხმარებელი</Text>
                <TextInput
                  autoCapitalize="none"
                  placeholder="მომხმარებლის სახელი"
                  placeholderTextColor={colors.secondaryText}
                  style={inputStyle("username")}
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </>
          )}

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>ელ-ფოსტა</Text>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="შენი ელ-ფოსტა"
              placeholderTextColor={colors.secondaryText}
              style={inputStyle("email")}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>პაროლი</Text>
            <TextInput
              placeholder="შენი პაროლი"
              placeholderTextColor={colors.secondaryText}
              secureTextEntry
              style={inputStyle("password")}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          {message ? (
            <View style={styles.errorBubble}>
              <Text style={styles.errorText}>{message}</Text>
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              pressed && styles.pressed,
            ]}
            onPress={submit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitText}>
              {isSubmitting
                ? "იტვირთება..."
                : mode === "login"
                  ? "შესვლა"
                  : "ანგარიშის შექმნა"}
            </Text>
          </Pressable>

          <View style={styles.dividerWrap}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ან</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.googleBtn,
              pressed && styles.pressed,
            ]}
            onPress={handleGoogleSignIn}
            disabled={isSubmitting}
          >
            <Image
              source={{
                uri: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg",
              }}
              style={{ width: 20, height: 20, marginRight: 12 }}
            />
            <Text style={styles.googleText}>Google-ით შესვლა</Text>
          </Pressable>

          <Pressable
            style={styles.switchRow}
            onPress={() => switchMode(mode === "login" ? "register" : "login")}
          >
            <Text style={styles.switchText}>
              {mode === "login"
                ? "ანგარიში არ გაქვს? "
                : "უკვე გაქვს ანგარიში? "}
              <Text style={styles.switchLink}>
                {mode === "login" ? "რეგისტრაცია" : "შესვლა"}
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors, isDark: boolean, mode: AuthMode) {
  const reg = mode === "register";
  return StyleSheet.create({
    safe: {
      backgroundColor: colors.background,
      flex: 1,
      paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 24 : 0,
    },
    flex: { flex: 1 },
    scroll: {
      alignItems: "center",
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 28,
      paddingVertical: reg ? 16 : 40,
    },

    themeToggle: {
      alignItems: "center",
      backgroundColor: colors.button,
      borderColor: colors.border,
      borderRadius: 20,
      borderWidth: 1,
      flexDirection: "row",
      gap: 8,
      marginBottom: reg ? 14 : 40,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    themeLabel: {
      color: colors.secondaryText,
      fontSize: 13,
      fontWeight: "700",
    },

    kicker: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 2.5,
      marginBottom: 8,
      textAlign: "center",
      textTransform: "uppercase",
    },
    title: {
      color: colors.primaryText,
      fontSize: reg ? 28 : 36,
      fontWeight: "900",
      letterSpacing: -1,
      marginBottom: reg ? 30 : 15,
      textAlign: "center",
    },
    subtitle: {
      color: colors.secondaryText,
      fontSize: 14,
      fontWeight: "500",
      marginBottom: reg ? 16 : 36,
      textAlign: "center",
    },

    tabPill: {
      backgroundColor: colors.button,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: "row",
      marginBottom: reg ? 16 : 32,
      padding: 4,
      width: "100%",
    },
    tabOption: {
      alignItems: "center",
      borderRadius: 11,
      flex: 1,
      paddingVertical: reg ? 7 : 10,
    },
    tabOptionActive: {
      backgroundColor: colors.accent,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    tabOptionText: {
      color: colors.secondaryText,
      fontSize: 14,
      fontWeight: "700",
    },
    tabOptionTextActive: {
      color: "#ffffff",
      fontWeight: "900",
    },

    fieldWrap: {
      marginBottom: reg ? 10 : 20,
      width: "100%",
    },
    fieldLabel: {
      color: colors.secondaryText,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.2,
      marginBottom: reg ? 5 : 8,
      textTransform: "uppercase",
    },
    input: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1.5,
      color: colors.primaryText,
      fontSize: 15,
      fontWeight: "600",
      height: reg ? 46 : 54,
      paddingHorizontal: 18,
      width: "100%",
    },
    inputFocused: {
      borderColor: colors.accent,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: isDark ? 0.3 : 0.2,
      shadowRadius: 8,
      elevation: 3,
    },

    errorBubble: {
      backgroundColor: "rgba(214,97,97,0.1)",
      borderColor: "rgba(214,97,97,0.35)",
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      width: "100%",
    },
    errorText: {
      color: "#d66161",
      fontSize: 13,
      fontWeight: "700",
      textAlign: "center",
    },

    submitBtn: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: 16,
      height: reg ? 48 : 56,
      justifyContent: "center",
      marginBottom: reg ? 12 : 20,
      marginTop: reg ? 4 : 0,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.5 : 0.35,
      shadowRadius: 14,
      elevation: 8,
      width: "100%",
    },
    submitText: {
      color: "#ffffff",
      fontSize: 17,
      fontWeight: "900",
      letterSpacing: 0.3,
    },

    dividerWrap: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 12,
      width: "100%",
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      color: colors.secondaryText,
      marginHorizontal: 16,
      fontSize: 13,
      fontWeight: "700",
    },

    googleBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#ffffff",
      borderColor: isDark ? "transparent" : "#e0e0e0",
      borderWidth: isDark ? 0 : 1,
      borderRadius: 16,
      height: reg ? 48 : 56,
      justifyContent: "center",
      marginBottom: reg ? 12 : 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
      width: "100%",
    },
    googleText: {
      color: "#000000",
      fontSize: 16,
      fontWeight: "700",
    },

    switchRow: {
      alignItems: "center",
      paddingVertical: 4,
    },
    switchText: {
      color: colors.secondaryText,
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
    },
    switchLink: {
      color: colors.accent,
      fontWeight: "900",
    },

    pressed: { opacity: 0.68 },
  });
}
