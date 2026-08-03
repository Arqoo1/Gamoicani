import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { useAuth } from "@/application/providers/auth";
import { useAppTheme } from "@/application/providers/theme";
import { WordleTiles } from "@/features/auth/ui/AuthBrand";
import { loginAccount, loginWithGoogleAPI, registerAccount } from "@/features/auth/api/authApi";
import { MoonIcon, SunIcon } from "@/shared/ui/ThemeGlyphs";
import { AuthMode, createStyles } from "@/features/auth/screens/LoginScreen.styles";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton";

export default function LoginScreen() {
  const router = useRouter();
  const { setSessionUser } = useAuth();
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
      let result;
      if (mode === "login") {
        result = await loginAccount({ email, password });
      } else {
        result = await registerAccount({ displayName, email, password, username });
      }
      setSessionUser(result.user);
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
        const result = await loginWithGoogleAPI(response.data.idToken);
        setSessionUser(result.user);
        router.replace("/");
      } else {
        setMessage("Google Sign-In failed (no token)");
      }
    } catch (error: unknown) {
      const e = error as { code?: string; message?: string };
      if (e.code === "SIGN_IN_CANCELLED") {
        setMessage("");
      } else {
        setMessage(e.message || "Google Sign-In Error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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

          {mode === "register" ? (
            <RegisterForm
              colors={colors}
              displayName={displayName}
              email={email}
              focusedField={focusedField}
              password={password}
              setDisplayName={setDisplayName}
              setEmail={setEmail}
              setFocusedField={setFocusedField}
              setPassword={setPassword}
              setUsername={setUsername}
              styles={styles}
              username={username}
            />
          ) : (
            <LoginForm
              colors={colors}
              email={email}
              focusedField={focusedField}
              password={password}
              setEmail={setEmail}
              setFocusedField={setFocusedField}
              setPassword={setPassword}
              styles={styles}
            />
          )}

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

          <GoogleSignInButton
            disabled={isSubmitting}
            onPress={handleGoogleSignIn}
            styles={styles}
          />

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
