import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth, useLogoutAndGoLogin } from "@/application/providers/auth";
import { getPendingCount, syncPracticeXp } from "@/features/settings/model/practiceXp";
import { useSettings } from "@/application/providers/settings";
import { AppColors, ThemeMode, useAppTheme } from "@/application/providers/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, mode, setMode } = useAppTheme();
  const { hapticsEnabled, soundEnabled, setHapticsEnabled, setSoundEnabled } = useSettings();
  const { user, updateUser } = useAuth();
  const logoutAndGoLogin = useLogoutAndGoLogin();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [pendingXp, setPendingXp] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    getPendingCount().then(setPendingXp).catch(() => {});
  }, []);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const count = await syncPracticeXp(updateUser);
      setPendingXp(0);
      if (count > 0) {
        Alert.alert("✅ სინქრონიზაცია", `${count} სესია სინქრონიზებულია!`);
      } else {
        Alert.alert("ინფო", "სინქრონიზაციისთვის მოლოდინში არაფერია.");
      }
    } catch {
      Alert.alert("შეცდომა", "სინქრონიზაცია ვერ მოხერხდა.");
    } finally {
      setSyncing(false);
    }
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert("გასვლა", "დარწმუნებული ხარ?", [
      { text: "გაუქმება", style: "cancel" },
      { text: "გასვლა", style: "destructive", onPress: logoutAndGoLogin },
    ]);
  }, [logoutAndGoLogin]);

  const themeModes: { key: ThemeMode; label: string; icon: string }[] = [
    { key: "light", label: "ნათელი", icon: "sun" },
    { key: "dark", label: "მუქი", icon: "moon" },
    { key: "system", label: "სისტემა", icon: "smartphone" },
  ];

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safe}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <Feather color={colors.primaryText} name="chevron-left" size={28} />
        </Pressable>
        <Text style={styles.title}>პარამეტრები</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Appearance */}
        <Text style={styles.sectionTitle}>გარეგნობა</Text>
        <View style={styles.card}>
          <View style={styles.themeRow}>
            {themeModes.map(({ key, label, icon }) => {
              const isActive = mode === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setMode(key)}
                  style={[styles.themeBtn, isActive && styles.themeBtnActive]}
                >
                  <Feather
                    name={icon as any}
                    size={18}
                    color={isActive ? colors.accent : colors.secondaryText}
                  />
                  <Text style={[styles.themeBtnText, isActive && styles.themeBtnTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Sound & Haptics */}
        <Text style={styles.sectionTitle}>ხმა და ვიბრაცია</Text>
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Feather name="volume-2" size={20} color={colors.accent} />
              <Text style={styles.toggleLabel}>ხმოვანი ეფექტები</Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: colors.border, true: colors.accent + "66" }}
              thumbColor={soundEnabled ? colors.accent : colors.disabled}
            />
          </View>
          <View style={styles.separator} />
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Feather name="zap" size={20} color={colors.accent} />
              <Text style={styles.toggleLabel}>ვიბრაცია</Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{ false: colors.border, true: colors.accent + "66" }}
              thumbColor={hapticsEnabled ? colors.accent : colors.disabled}
            />
          </View>
        </View>

        {/* Practice XP */}
        <Text style={styles.sectionTitle}>პრაქტიკის XP</Text>
        <View style={styles.card}>
          <View style={styles.xpRow}>
            <View>
              <Text style={styles.xpLabel}>მოლოდინში სესიები</Text>
              <Text style={styles.xpValue}>{pendingXp} სესია</Text>
            </View>
            <Pressable
              onPress={handleSync}
              disabled={syncing}
              style={({ pressed }) => [styles.syncBtn, (pressed || syncing) && styles.pressed]}
            >
              <Feather name="refresh-cw" size={16} color="#fff" />
              <Text style={styles.syncBtnText}>
                {syncing ? "..." : "სინქრონიზაცია"}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.xpHint}>
            პრაქტიკის რეჟიმის შედეგები ითვლება ონლაინ სინქრონიზაციის შემდეგ.
          </Text>
        </View>

        {/* Account */}
        {user && (
          <>
            <Text style={styles.sectionTitle}>ანგარიში</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>სახელი</Text>
                <Text style={styles.infoValue}>{user.displayName}</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>მომხმარებელი</Text>
                <Text style={styles.infoValue}>@{user.username}</Text>
              </View>
              {user.email && (
                <>
                  <View style={styles.separator} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>ელ. ფოსტა</Text>
                    <Text style={styles.infoValue}>{user.email}</Text>
                  </View>
                </>
              )}
              <View style={styles.separator} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ქულები</Text>
                <Text style={[styles.infoValue, { color: colors.accent, fontWeight: "900" }]}>
                  {user.totalPoints.toLocaleString()} pts
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Quick Links */}
        <Text style={styles.sectionTitle}>სწრაფი ბმულები</Text>
        <View style={styles.card}>
          <Pressable
            style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
            onPress={() => router.push("/shop" as any)}
          >
            <View style={styles.linkLeft}>
              <Feather name="shopping-bag" size={20} color={colors.accent} />
              <Text style={styles.linkLabel}>მაღაზია</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.secondaryText} />
          </Pressable>
          <View style={styles.separator} />
          <Pressable
            style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
            onPress={() => router.push("/feed" as any)}
          >
            <View style={styles.linkLeft}>
              <Feather name="activity" size={20} color={colors.accent} />
              <Text style={styles.linkLabel}>თამაშების ისტორია</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.secondaryText} />
          </Pressable>
          <View style={styles.separator} />
          <Pressable
            style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
            onPress={() => router.push("/profile" as any)}
          >
            <View style={styles.linkLeft}>
              <Feather name="user" size={20} color={colors.accent} />
              <Text style={styles.linkLabel}>პროფილი</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.secondaryText} />
          </Pressable>
        </View>

        {/* Logout */}
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
        >
          <Feather name="log-out" size={20} color="#e63946" />
          <Text style={styles.logoutText}>გასვლა</Text>
        </Pressable>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background , paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) : 0 },
    header: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    backBtn: { alignItems: "center", height: 44, justifyContent: "center", width: 44 },
    title: { color: colors.primaryText, fontSize: 18, fontWeight: "900" },
    pressed: { opacity: 0.65 },
    content: { padding: 20, paddingTop: 8 },
    sectionTitle: {
      color: colors.secondaryText,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 1,
      marginBottom: 8,
      marginTop: 24,
      textTransform: "uppercase",
    },
    card: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      overflow: "hidden",
    },
    separator: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
    themeRow: { flexDirection: "row", gap: 8, padding: 12 },
    themeBtn: {
      alignItems: "center",
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 2,
      flex: 1,
      gap: 6,
      paddingVertical: 14,
    },
    themeBtnActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accent + "18",
    },
    themeBtnText: { color: colors.secondaryText, fontSize: 12, fontWeight: "700" },
    themeBtnTextActive: { color: colors.accent },
    toggleRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    toggleLeft: { alignItems: "center", flexDirection: "row", gap: 12 },
    toggleLabel: { color: colors.primaryText, fontSize: 16, fontWeight: "600" },
    xpRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 16,
    },
    xpLabel: { color: colors.secondaryText, fontSize: 13, fontWeight: "700", marginBottom: 2 },
    xpValue: { color: colors.primaryText, fontSize: 22, fontWeight: "900" },
    syncBtn: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: 10,
      flexDirection: "row",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    syncBtnText: { color: "#fff", fontSize: 13, fontWeight: "800" },
    xpHint: {
      color: colors.secondaryText,
      fontSize: 12,
      lineHeight: 17,
      paddingBottom: 14,
      paddingHorizontal: 16,
    },
    infoRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    infoLabel: { color: colors.secondaryText, fontSize: 14, fontWeight: "700" },
    infoValue: { color: colors.primaryText, fontSize: 14, fontWeight: "700" },
    linkRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    linkLeft: { alignItems: "center", flexDirection: "row", gap: 12 },
    linkLabel: { color: colors.primaryText, fontSize: 16, fontWeight: "700" },
    logoutBtn: {
      alignItems: "center",
      backgroundColor: "#e6394618",
      borderColor: "#e63946",
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: "row",
      gap: 10,
      justifyContent: "center",
      marginTop: 32,
      paddingVertical: 16,
    },
    logoutText: { color: "#e63946", fontSize: 16, fontWeight: "800" },
  });
}
