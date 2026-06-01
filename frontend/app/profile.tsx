import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth, useLogoutAndGoLogin } from "../src/auth";
import { AppColors, useAppTheme } from "../src/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const { updateProfile, user } = useAuth();
  const logout = useLogoutAndGoLogin();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      await updateProfile({ displayName, username });
      setMessage("შენახულია");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ვერ მოხერხდა");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safe}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.card} />
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          onPress={() => router.push("/")}
        >
          <Text style={styles.headerIcon}>‹</Text>
        </Pressable>
        <Text style={styles.logo}>პროფილი</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.panel}>
          <Text style={styles.label}>სახელი</Text>
          <TextInput
            placeholderTextColor={colors.secondaryText}
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
          />

          <Text style={styles.label}>username</Text>
          <TextInput
            autoCapitalize="none"
            placeholderTextColor={colors.secondaryText}
            style={styles.input}
            value={username}
            onChangeText={setUsername}
          />

          <Text style={styles.email}>{user?.email}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              onPress={save}
            >
              <Text style={styles.primaryButtonText}>{isSaving ? "იტვირთება" : "შენახვა"}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              onPress={logout}
            >
              <Text style={styles.secondaryButtonText}>გასვლა</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: {
      backgroundColor: colors.card,
      flex: 1
    },
    scrollView: {
      backgroundColor: colors.background
    },
    header: {
      alignItems: "center",
      backgroundColor: colors.card,
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
    headerButton: {
      alignItems: "center",
      backgroundColor: colors.button,
      borderRadius: 8,
      height: 42,
      justifyContent: "center",
      width: 42
    },
    headerSpacer: {
      height: 42,
      width: 42
    },
    headerIcon: {
      color: colors.primaryText,
      fontSize: 30,
      fontWeight: "700",
      lineHeight: 36
    },
    logo: {
      color: colors.primaryText,
      fontSize: 22,
      fontWeight: "900",
      letterSpacing: 0
    },
    content: {
      padding: 20
    },
    panel: {
      alignSelf: "center",
      maxWidth: 460,
      width: "100%"
    },
    label: {
      color: colors.primaryText,
      fontSize: 13,
      fontWeight: "900",
      marginBottom: 6
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
      marginBottom: 14,
      paddingHorizontal: 14
    },
    email: {
      color: colors.secondaryText,
      fontSize: 13,
      fontWeight: "800",
      marginBottom: 12
    },
    message: {
      color: colors.present,
      fontSize: 13,
      fontWeight: "900",
      marginBottom: 10,
      textAlign: "center"
    },
    actions: {
      flexDirection: "row",
      gap: 10
    },
    primaryButton: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: 8,
      flex: 1,
      justifyContent: "center",
      minHeight: 48
    },
    primaryButtonText: {
      color: "#ffffff",
      fontSize: 15,
      fontWeight: "900"
    },
    secondaryButton: {
      alignItems: "center",
      backgroundColor: colors.button,
      borderRadius: 8,
      flex: 1,
      justifyContent: "center",
      minHeight: 48
    },
    secondaryButtonText: {
      color: colors.primaryText,
      fontSize: 15,
      fontWeight: "900"
    },
    pressed: {
      opacity: 0.64
    }
  });
}
