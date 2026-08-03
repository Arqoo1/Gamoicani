import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { useAuth } from "@/application/providers/auth";
import { useAppTheme } from "@/application/providers/theme";
import { WordleTiles } from "@/features/auth/ui/AuthBrand";
import { MoonIcon, SunIcon } from "@/shared/ui/ThemeGlyphs";
import { getFriendlyErrorMessage } from "@/shared/utils/errorMessages";
import { createStyles } from "@/features/auth/screens/LoginScreen.styles";

type AuthMode = "login" | "register";

export default function LoginScreen() {
  const router = useRouter();
  const { login, register, loginWithGoogle } = useAuth();
  const { colors, isDark, toggleTheme } = useAppTheme();
  const [mode, setMode] = useState<AuthMode>("login");
  const styles = useMemo(() => createStyles(colors, isDark, mode), [colors, isDark, mode]);
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
    } catch {
      setMessage("ან უცნობი შეცდომა მოხდა");
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
    } catch {
      setMessage("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = (field: string) => [styles.input, focusedField === field && styles.inputFocused];

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safe}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {mode === "login" && (
            <Pressable
              accessibilityLabel="თემის შეცვლა"
              style={({ pressed }) => [styles.themeToggle, pressed && styles.pressed]}
              onPress={toggleTheme}
            >
              {isDark ? <SunIcon color={colors.primaryText} /> : <MoonIcon color={colors.primaryText} />}
              <Text style={styles.themeLabel}>{isDark ? "ღია რეჟიმი" : "მუქი რეჟიმი"}</Text>
            </Pressable>
          )}

          <WordleTiles colors={colors} compact={mode === "register"} />

          <Text style={styles.kicker}>ქართული თამაშები</Text>
          <Text style={styles.title}>{mode === "login" ? "მოგესალმებით" : "შექმენი ანგარიში"}</Text>

          <View style={styles.tabPill}>
            <Pressable
              style={[styles.tabOption, mode === "login" && styles.tabOptionActive]}
              onPress={() => switchMode("login")}
            >
              <Text style={[styles.tabOptionText, mode === "login" && styles.tabOptionTextActive]}>
                შესვლა
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tabOption, mode === "register" && styles.tabOptionActive]}
              onPress={() => switchMode("register")}
            >
              <Text style={[styles.tabOptionText, mode === "register" && styles.tabOptionTextActive]}>
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
            style={({ pressed }) => [styles.submitBtn, pressed && styles.pressed]}
            onPress={submit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitText}>
              {isSubmitting ? "იტვირთება..." : mode === "login" ? "შესვლა" : "ანგარიშის შექმნა"}
            </Text>
          </Pressable>

          <View style={styles.dividerWrap}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ან</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={({ pressed }) => [styles.googleBtn, pressed && styles.pressed]}
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
              {mode === "login" ? "ანგარიში არ გაქვს? " : "უკვე გაქვს ანგარიში? "}
              <Text style={styles.switchLink}>{mode === "login" ? "რეგისტრაცია" : "შესვლა"}</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
