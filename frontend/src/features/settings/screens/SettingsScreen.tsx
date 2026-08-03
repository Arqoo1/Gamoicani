import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Platform,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth, useLogoutAndGoLogin } from "@/application/providers/auth";
import { getPendingCount, syncPracticeXp } from "@/features/settings/model/practiceXp";
import { useSettings } from "@/application/providers/settings";
import { AppColors, ThemeMode, useAppTheme } from "@/application/providers/theme";
import { Href } from "expo-router";
import { createStyles } from "@/features/settings/screens/SettingsScreen.styles";

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, mode, setMode } = useAppTheme();
  const { hapticsEnabled, soundEnabled, setHapticsEnabled, setSoundEnabled } = useSettings();
  const { user, updateUser } = useAuth();
  const logoutAndGoLogin = useLogoutAndGoLogin();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [pendingXp, setPendingXp] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    getPendingCount()
      .then(setPendingXp)
      .catch(() => {});
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
    setShowLogoutConfirm(true);
  }, []);

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
        {}
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
                    name={icon as "sun" | "moon" | "smartphone"}
                    size={18}
                    color={isActive ? colors.accent : colors.secondaryText}
                  />
                  <Text style={[styles.themeBtnText, isActive && styles.themeBtnTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {}
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

        {}
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
              <Text style={styles.syncBtnText}>{syncing ? "..." : "სინქრონიზაცია"}</Text>
            </Pressable>
          </View>
          <Text style={styles.xpHint}>პრაქტიკის რეჟიმის შედეგები ითვლება ონლაინ სინქრონიზაციის შემდეგ.</Text>
        </View>

        {}
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

        {}
        <Text style={styles.sectionTitle}>სწრაფი ბმულები</Text>
        <View style={styles.card}>
          <Pressable
            style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
            onPress={() => router.push("/shop" as Href)}
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
            onPress={() => router.push("/feed" as Href)}
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
            onPress={() => router.push("/profile" as Href)}
          >
            <View style={styles.linkLeft}>
              <Feather name="user" size={20} color={colors.accent} />
              <Text style={styles.linkLabel}>პროფილი</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.secondaryText} />
          </Pressable>
        </View>

        {}
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
        >
          <Feather name="log-out" size={20} color="#e63946" />
          <Text style={styles.logoutText}>გასვლა</Text>
        </Pressable>

        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View style={styles.modalBackdropDialog}>
          <View style={styles.dialog}>
            <View style={styles.dialogIconContainer}>
              <Feather name="log-out" size={28} color="#e63946" />
            </View>
            <Text style={styles.dialogTitle}>გასვლა</Text>
            <Text style={styles.dialogText}>ნამდვილად გსურს ანგარიშიდან გასვლა?</Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.dialogCancelBtn} onPress={() => setShowLogoutConfirm(false)}>
                <Text style={styles.dialogCancelBtnText}>გაუქმება</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogDangerBtn}
                onPress={() => {
                  setShowLogoutConfirm(false);
                  logoutAndGoLogin();
                }}
              >
                <Text style={styles.dialogDangerBtnText}>გასვლა</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
