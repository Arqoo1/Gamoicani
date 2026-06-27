import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { Platform, Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  acceptFriendRequest,
  API_BASE_URL,
  FriendRequest,
  FriendUser,
  listFriendRequests,
  listFriends,
  rejectFriendRequest,
  removeFriend,
  searchUsers,
  sendFriendRequest
} from "../src/api";
import { useAuth, useLogoutAndGoLogin } from "../src/auth";
import { AppColors, useAppTheme } from "../src/theme";

const COVER_GRADIENTS = [
  ["#0f4c35", "#2f9e5d"],
  ["#1a1a2e", "#48c978"],
  ["#0d1b2a", "#2176ae"],
  ["#2d0037", "#9b5de5"],
  ["#3d0000", "#e63946"],
  ["#1b2838", "#f77f00"],
  ["#101820", "#fee715"],
  ["#1c1c1c", "#aab8c4"]
];

const AVATAR_COLORS = [
  "#2f9e5d", "#48c978", "#2176ae", "#9b5de5",
  "#e63946", "#f77f00", "#dfb34a", "#66727f"
];

const GAME_META: Record<string, { label: string; emoji: string }> = {
  wordle:   { label: "Wordle",   emoji: "🟩" },
  andazebi: { label: "Andazebi", emoji: "🎯" },
  trivia:   { label: "Trivia",   emoji: "🧠" }
};

const ACHIEVEMENTS_META: Record<string, { label: string; emoji: string }> = {
  "first-win": { label: "პირველი გამარჯვება", emoji: "🏆" },
  "wordle-1": { label: "პირველივე ცდა", emoji: "🎯" },
  "wordle-2": { label: "ორი ცდა", emoji: "⚡" },
  "wordle-3": { label: "სამი ცდა", emoji: "🧠" },
  "streak-7": { label: "7 დღის სტრიქი", emoji: "🔥" },
  "perfect-week": { label: "იდეალური კვირა", emoji: "⭐" },
  "all-games": { label: "ყველა თამაში", emoji: "🎮" }
};

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

function getRankInfo(points: number) {
  if (points >= 5000) return { label: "Gold", color: "#FFD700", icon: "🏆", next: null };
  if (points >= 1000) return { label: "Silver", color: "#C0C0C0", icon: "🥈", next: 5000 };
  return { label: "Bronze", color: "#cd7f32", icon: "🥉", next: 1000 };
}

function getMediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  return API_BASE_URL.replace("/api", "") + path;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("ka-GE", { year: "numeric", month: "long" });
}

interface EditRowProps {
  colors: AppColors;
  label: string;
  multiline?: boolean;
  onSave: (val: string) => Promise<void>;
  placeholder?: string;
  styles: ReturnType<typeof createStyles>;
  value: string;
}

function EditRow({ colors, label, multiline, onSave, placeholder, styles, value }: EditRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleEdit = () => {
    setDraft(value);
    setErr("");
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setErr("");
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setErr("");
    try {
      await onSave(draft.trim());
      setEditing(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "შეცდომა");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <View style={styles.editRowActive}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
          autoFocus
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          placeholder={placeholder ?? label}
          placeholderTextColor={colors.secondaryText}
          style={[styles.inlineInput, multiline && styles.inlineInputMulti]}
          value={draft}
          onChangeText={setDraft}
        />
        {err ? <Text style={styles.fieldError}>{err}</Text> : null}
        <View style={styles.editRowActions}>
          <Pressable
            style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
            onPress={handleSave}
          >
            <Text style={styles.saveBtnText}>{saving ? "..." : "შენახვა"}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
            onPress={handleCancel}
          >
            <Text style={styles.cancelBtnText}>გაუქმება</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue} numberOfLines={multiline ? 3 : 1}>
          {value || <Text style={{ color: colors.secondaryText }}>—</Text>}
        </Text>
      </View>
      <TouchableOpacity style={styles.editIconBtn} onPress={handleEdit}>
        <Text style={styles.editIcon}>✎</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { changePassword, updateProfile, uploadCoverPhoto, uploadProfilePhoto, user } = useAuth();
  const logout = useLogoutAndGoLogin();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [showPwSection, setShowPwSection] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState(false);

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);

  const coverIndex = user?.coverGradient ?? 0;
  const avatarColor = user?.avatarColor ?? "#2f9e5d";
  const coverColors = COVER_GRADIENTS[coverIndex % COVER_GRADIENTS.length]!;

  const [actionSheet, setActionSheet] = useState<"none" | "cover" | "avatar">("none");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (user) {
      loadFriends();
    }
  }, [user]);

  const loadFriends = async () => {
    try {
      const [f, r] = await Promise.all([listFriends(), listFriendRequests()]);
      setFriends(f);
      setRequests(r);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await searchUsers(text);
      setSearchResults(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (id: string) => {
    try {
      await sendFriendRequest(id);
      Alert.alert("გაგზავნილია", "მეგობრობის მოთხოვნა გაგზავნილია!");
      setSearchResults(searchResults.filter(u => u.id !== id));
    } catch (e) {
      Alert.alert("შეცდომა", e instanceof Error ? e.message : "ვერ გაიგზავნა");
    }
  };

  const handleAcceptRequest = async (id: string) => {
    try {
      await acceptFriendRequest(id);
      loadFriends();
    } catch (e) {
      Alert.alert("შეცდომა", e instanceof Error ? e.message : "ვერ მივიღეთ");
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      await rejectFriendRequest(id);
      loadFriends();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveFriend = async (id: string) => {
    Alert.alert("წაშლა", "ნამდვილად გსურთ მეგობრის წაშლა?", [
      { text: "არა", style: "cancel" },
      { text: "კი", style: "destructive", onPress: async () => {
          try {
            await removeFriend(id);
            loadFriends();
          } catch (e) {
            console.error(e);
          }
        }
      }
    ]);
  };

  const handleCoverTap = useCallback(() => {
    setActionSheet("cover");
  }, []);

  const handleAvatarTap = useCallback(() => {
    setActionSheet("avatar");
  }, []);

  const handleAvatarColor = useCallback(async (color: string) => {
    setShowColorPicker(false);
    setShowCoverPicker(false);
    try { 
      await updateProfile({ avatarColor: color, profilePhotoUrl: null }); 
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Error updating avatar color");
    }
  }, [updateProfile]);

  const handleCoverColor = useCallback(async (index: number) => {
    setShowCoverPicker(false);
    setShowColorPicker(false);
    try { 
      await updateProfile({ coverGradient: index, coverPhotoUrl: null }); 
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Error updating cover gradient");
    }
  }, [updateProfile]);

  const handleChangePw = async () => {
    setPwMsg("");
    setPwErr(false);
    if (!currentPw || !newPw || !confirmPw) {
      setPwMsg("ყველა ველი სავალდებულოა");
      setPwErr(true);
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg("პაროლები არ ემთხვევა");
      setPwErr(true);
      return;
    }
    if (newPw.length < 8) {
      setPwMsg("მინიმუმ 8 სიმბოლო");
      setPwErr(true);
      return;
    }
    setPwSaving(true);
    try {
      await changePassword({ currentPassword: currentPw, newPassword: newPw });
      setPwMsg("პაროლი შეიცვალა ✓");
      setPwErr(false);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setShowPwSection(false);
    } catch (e) {
      setPwMsg(e instanceof Error ? e.message : "შეცდომა");
      setPwErr(true);
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const gameEntries = useMemo(() => {
    if (!user?.gameStats) return [];
    return Object.entries(user.gameStats).map(([gameId, stat]) => ({
      emoji: GAME_META[gameId]?.emoji ?? "🎮",
      gameId,
      label: GAME_META[gameId]?.label ?? gameId,
      stat
    }));
  }, [user?.gameStats]);

  const totalWins = useMemo(
    () => gameEntries.reduce((sum, g) => sum + (g.stat.wins ?? 0), 0),
    [gameEntries]
  );
  const totalPlays = useMemo(
    () => gameEntries.reduce((sum, g) => sum + (g.stat.plays ?? 0), 0),
    [gameEntries]
  );
  const bestStreak = useMemo(
    () => Math.max(0, ...gameEntries.map((g) => g.stat.maxStreak ?? 0)),
    [gameEntries]
  );

  if (!user) return null;

  const initials = getInitials(user.displayName);
  const winPct = totalPlays > 0 ? Math.round((totalWins / totalPlays) * 100) : 0;
  const rank = getRankInfo(user.totalPoints);

  const mockDistribution = useMemo(() => {
    let remaining = totalWins;
    const dist = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 6; i++) {
      if (i === 5) { dist[i] = remaining; break; }
      const alloc = Math.floor(Math.random() * (remaining / 2));
      dist[i] = alloc;
      remaining -= alloc;
    }
    return dist;
  }, [totalWins]);
  const maxDist = Math.max(1, ...mockDistribution);

  const dailyQuestsData = user.dailyQuests?.quests || [];
  const bonusClaimed = user.dailyQuests?.bonusClaimed || false;

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={coverColors[0]} />

      {/* ── Header bar ── */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Pressable
          style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
          onPress={() => router.push("/")}
        >
          <Text style={styles.headerIcon}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>პროფილი</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Cover + Avatar hero ── */}
        <TouchableOpacity activeOpacity={0.85} onPress={handleCoverTap} style={styles.cover}>
          {user.coverPhotoUrl ? (
            <Image source={{ uri: getMediaUrl(user.coverPhotoUrl) }} style={StyleSheet.absoluteFill} />
          ) : (
            <>
              <View style={[styles.coverGradientTop, { backgroundColor: coverColors[0] }]} />
              <View style={[styles.coverGradientBottom, { backgroundColor: coverColors[1] }]} />
            </>
          )}
          <View style={styles.coverOverlay} />
          <View style={styles.coverEditBtn}>
            <Feather name="edit-3" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* ── Avatar row ── */}
        <View style={styles.avatarRow}>
          <TouchableOpacity
            style={[styles.avatar, !user.profilePhotoUrl && { backgroundColor: avatarColor }]}
            onPress={handleAvatarTap}
            activeOpacity={0.8}
          >
            {user.profilePhotoUrl ? (
              <Image source={{ uri: getMediaUrl(user.profilePhotoUrl) }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditIcon}>✎</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.heroInfo}>
            <View style={styles.heroNameRow}>
              <Text style={styles.heroName} numberOfLines={1}>{user.displayName}</Text>
              <View style={[styles.rankBadge, { borderColor: rank.color }]}>
                <Text style={styles.rankBadgeIcon}>{rank.icon}</Text>
                <Text style={[styles.rankBadgeText, { color: rank.color }]}>{rank.label}</Text>
              </View>
            </View>
            <Text style={styles.heroUsername}>@{user.username}</Text>
            {rank.next && (
              <Text style={styles.rankProgressText}>
                {rank.next - user.totalPoints} ქულა შემდეგ რანგამდე
              </Text>
            )}
          </View>
        </View>

        {/* ── Cover color picker ── */}
        {showCoverPicker && (
          <View style={styles.colorPicker}>
            <Text style={styles.colorPickerLabel}>ქავერის ფერი</Text>
            <View style={styles.colorSwatches}>
              {COVER_GRADIENTS.map((gradient, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.colorSwatch,
                    index === coverIndex && styles.colorSwatchActive,
                    { overflow: "hidden" }
                  ]}
                  onPress={() => handleCoverColor(index)}
                >
                  <View style={{ flex: 1, backgroundColor: gradient[0] }} />
                  <View style={{ flex: 1, backgroundColor: gradient[1] }} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Avatar color picker ── */}
        {showColorPicker && (
          <View style={styles.colorPicker}>
            <Text style={styles.colorPickerLabel}>პროფილის ფერი</Text>
            <View style={styles.colorSwatches}>
              {AVATAR_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: c },
                    c === avatarColor && styles.colorSwatchActive
                  ]}
                  onPress={() => handleAvatarColor(c)}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── Summary stats bar ── */}
        <View style={styles.statsBar}>
          <View style={styles.statBarItem}>
            <Text style={styles.statBarNum}>{totalPlays}</Text>
            <Text style={styles.statBarLbl}>თამაში</Text>
          </View>
          <View style={styles.statBarDivider} />
          <View style={styles.statBarItem}>
            <Text style={styles.statBarNum}>{winPct}%</Text>
            <Text style={styles.statBarLbl}>მოგება</Text>
          </View>
          <View style={styles.statBarDivider} />
          <View style={styles.statBarItem}>
            <Text style={styles.statBarNum}>{bestStreak}</Text>
            <Text style={styles.statBarLbl}>რეკორდი</Text>
          </View>
          <View style={styles.statBarDivider} />
          <View style={styles.statBarItem}>
            <Text style={styles.statBarNum}>{user.totalPoints}</Text>
            <Text style={styles.statBarLbl}>ქულა</Text>
          </View>
        </View>

        {/* ── Profile info card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>პროფილის ინფო</Text>

          <EditRow
            colors={colors}
            label="სახელი"
            styles={styles}
            value={user.displayName}
            onSave={(v) => updateProfile({ displayName: v })}
          />
          <View style={styles.divider} />
          <EditRow
            colors={colors}
            label="Username"
            styles={styles}
            value={user.username}
            placeholder="username"
            onSave={(v) => updateProfile({ username: v })}
          />
          <View style={styles.divider} />
          <EditRow
            colors={colors}
            label="ბიო"
            multiline
            styles={styles}
            value={user.bio ?? ""}
            placeholder="მოკლე აღწერა..."
            onSave={(v) => updateProfile({ bio: v })}
          />
          <View style={styles.divider} />

          {/* Read-only fields */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>ელ-ფოსტა</Text>
              <Text style={styles.fieldValue}>{user.email ?? "—"}</Text>
            </View>
            <View style={styles.fieldBadge}>
              <Text style={styles.fieldBadgeText}>🔒</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>წევრი</Text>
              <Text style={styles.fieldValue}>{formatDate(user.createdAt)}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>როლი</Text>
              <Text style={styles.fieldValue}>{user.role === "admin" ? "👑 ადმინი" : "👤 მომხმარებელი"}</Text>
            </View>
          </View>
        </View>

        {/* ── Badges / Achievements ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏆 მიღწევები</Text>
          <View style={styles.achievementsGrid}>
            {Object.entries(ACHIEVEMENTS_META).map(([id, meta]) => {
              const achievement = user.achievements?.find(a => a.id === id);
              const isLocked = !achievement;
              return (
                <View key={id} style={[styles.achievementBadge, isLocked && styles.achievementBadgeLocked]}>
                  <Text style={[styles.achievementEmoji, isLocked && styles.achievementEmojiLocked]}>{meta.emoji}</Text>
                  <Text style={styles.achievementLabel}>{meta.label}</Text>
                  {isLocked && <Feather name="lock" size={12} color={colors.secondaryText} style={{ marginTop: 4 }} />}
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Daily Quests ── */}
        <View style={styles.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={styles.cardTitle}>📅 დღიური კვესტები</Text>
            {bonusClaimed ? (
              <Text style={{ color: colors.correct, fontWeight: "800", marginRight: 16 }}>✓ მიღებულია</Text>
            ) : (
              <Text style={{ color: colors.correct, fontWeight: "800", marginRight: 16 }}>+3 ქულა</Text>
            )}
          </View>
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            {dailyQuestsData.length === 0 && (
              <Text style={{ color: colors.secondaryText, textAlign: "center", marginTop: 8 }}>
                კვესტები არ მოიძებნა
              </Text>
            )}
            {dailyQuestsData.map((q, idx) => {
              const isDone = q.completed;
              return (
                <View key={idx} style={styles.questRow}>
                  <View style={styles.questInfo}>
                    <Text style={[styles.questTitle, isDone && { color: colors.correct }]}>{q.title}</Text>
                    <Text style={styles.questProgressText}>{q.progress} / {q.target}</Text>
                  </View>
                  <View style={styles.questProgressBarBg}>
                    <View style={[styles.questProgressBar, { width: `${(q.progress / q.target) * 100}%`, backgroundColor: isDone ? colors.correct : colors.accent }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Detailed Stats ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 სტატისტიკა</Text>
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <Text style={styles.sectionSubtitle}>სიტყვობანას ცდების განაწილება</Text>
            <View style={styles.distribution}>
              {mockDistribution.map((count, index) => {
                const widthPercent = `${Math.max(8, (count / maxDist) * 100)}%` as `${number}%`;
                return (
                  <View key={index} style={styles.distributionRow}>
                    <Text style={styles.guessNumber}>{index + 1}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.bar, { width: widthPercent, backgroundColor: colors.accent }]}>
                        <Text style={styles.barText}>{count}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Friends ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👥 მეგობრები</Text>
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            {/* Search */}
            <View style={styles.searchBox}>
              <Feather name="search" size={18} color={colors.secondaryText} />
              <TextInput
                style={styles.searchInput}
                placeholder="მოძებნე მეგობარი (@username)"
                placeholderTextColor={colors.secondaryText}
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>

            {/* Search Results */}
            {searchQuery.length > 0 && (
              <View style={styles.searchResults}>
                {isSearching ? (
                  <Text style={styles.friendListEmpty}>ვეძებთ...</Text>
                ) : searchResults.length > 0 ? (
                  searchResults.map(u => (
                    <View key={u.id} style={styles.friendRow}>
                      <View style={[styles.friendAvatar, { backgroundColor: u.avatarColor }]}>
                        <Text style={styles.friendAvatarInitials}>{getInitials(u.displayName)}</Text>
                      </View>
                      <View style={styles.friendInfo}>
                        <Text style={styles.friendName}>{u.displayName}</Text>
                        <Text style={styles.friendUsername}>@{u.username}</Text>
                      </View>
                      <Pressable style={styles.addFriendBtn} onPress={() => handleSendRequest(u.id)}>
                        <Text style={styles.addFriendBtnText}>+ დამატება</Text>
                      </Pressable>
                    </View>
                  ))
                ) : (
                  <Text style={styles.friendListEmpty}>მომხმარებელი არ მოიძებნა</Text>
                )}
              </View>
            )}

            {/* Pending Requests */}
            {requests.length > 0 && (
              <>
                <Text style={styles.friendSectionTitle}>მოთხოვნები ({requests.length})</Text>
                {requests.map(req => (
                  <View key={req.from.id} style={styles.friendRow}>
                    <View style={[styles.friendAvatar, { backgroundColor: req.from.avatarColor }]}>
                      <Text style={styles.friendAvatarInitials}>{getInitials(req.from.displayName)}</Text>
                    </View>
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{req.from.displayName}</Text>
                      <Text style={styles.friendUsername}>@{req.from.username}</Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <Pressable style={styles.acceptBtn} onPress={() => handleAcceptRequest(req.from.id)}>
                        <Feather name="check" size={16} color="#fff" />
                      </Pressable>
                      <Pressable style={styles.rejectBtn} onPress={() => handleRejectRequest(req.from.id)}>
                        <Feather name="x" size={16} color="#e63946" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Friends List */}
            <Text style={styles.friendSectionTitle}>ჩემი მეგობრები ({friends.length})</Text>
            {friends.length === 0 ? (
              <Text style={styles.friendListEmpty}>ჯერ არ გყავთ მეგობრები</Text>
            ) : (
              friends.map((f) => {
                  const hash = f.id.charCodeAt(0) + f.id.charCodeAt(f.id.length - 1);
                  const mockWinRate = 30 + (hash % 50); 

                  return (
                    <View key={f.id} style={styles.friendRow}>
                      <View style={[styles.friendAvatar, { backgroundColor: f.avatarColor }]}>
                        <Text style={styles.friendAvatarInitials}>{getInitials(f.displayName)}</Text>
                      </View>
                      <View style={styles.friendInfo}>
                        <Text style={styles.friendName}>{f.displayName}</Text>
                        <Text style={styles.friendUsername}>@{f.username} · ქულა: {f.totalPoints ?? 0}</Text>
                        <Text style={styles.h2hText}>ურთიერთშეხვედრები: <Text style={{ color: colors.correct }}>მოგება {mockWinRate}%</Text></Text>
                      </View>
                      <Pressable style={styles.removeBtn} onPress={() => handleRemoveFriend(f.id)}>
                        <Feather name="user-minus" size={18} color="#e63946" />
                      </Pressable>
                    </View>
                  );
                })
            )}
          </View>
        </View>

        {/* ── Game records ── */}
        {gameEntries.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎮 თამაშის ჩანაწერები</Text>
            {gameEntries.map(({ emoji, gameId, label, stat }, index) => {
              const gWinPct = stat.plays > 0 ? Math.round((stat.wins / stat.plays) * 100) : 0;
              return (
                <View key={gameId}>
                  {index > 0 && <View style={styles.divider} />}
                  <View style={styles.gameRow}>
                    <View style={styles.gameHeader}>
                      <Text style={styles.gameEmoji}>{emoji}</Text>
                      <Text style={styles.gameLabel}>{label}</Text>
                      <View style={[styles.gamePointsBadge, { backgroundColor: colors.accentMuted }]}>
                        <Text style={[styles.gamePointsText, { color: colors.accent }]}>{stat.points} ქულა</Text>
                      </View>
                    </View>
                    <View style={styles.gameStats}>
                      <View style={styles.gameStatItem}>
                        <Text style={styles.gameStatNum}>{stat.plays}</Text>
                        <Text style={styles.gameStatLbl}>თამაში</Text>
                      </View>
                      <View style={styles.gameStatItem}>
                        <Text style={styles.gameStatNum}>{stat.wins}</Text>
                        <Text style={styles.gameStatLbl}>მოგება</Text>
                      </View>
                      <View style={styles.gameStatItem}>
                        <Text style={styles.gameStatNum}>{gWinPct}%</Text>
                        <Text style={styles.gameStatLbl}>%</Text>
                      </View>
                      <View style={styles.gameStatItem}>
                        <Text style={styles.gameStatNum}>{stat.currentStreak}</Text>
                        <Text style={styles.gameStatLbl}>სერია</Text>
                      </View>
                      <View style={styles.gameStatItem}>
                        <Text style={[styles.gameStatNum, { color: colors.accent }]}>{stat.maxStreak}</Text>
                        <Text style={styles.gameStatLbl}>რეკორდი</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Password change ── */}
        <View style={styles.card}>
          <Pressable
            style={({ pressed }) => [styles.sectionToggle, pressed && styles.pressed]}
            onPress={() => { setShowPwSection(!showPwSection); setPwMsg(""); setPwErr(false); }}
          >
            <Text style={styles.cardTitle}>🔑 პაროლის შეცვლა</Text>
            <Text style={[styles.toggleChevron, showPwSection && styles.toggleChevronOpen]}>›</Text>
          </Pressable>

          {showPwSection && (
            <View style={styles.pwSection}>
              <Text style={styles.pwLabel}>მიმდინარე პაროლი</Text>
              <TextInput
                secureTextEntry
                style={styles.pwInput}
                value={currentPw}
                onChangeText={setCurrentPw}
                placeholderTextColor={colors.secondaryText}
                placeholder="••••••••"
              />
              <Text style={styles.pwLabel}>ახალი პაროლი</Text>
              <TextInput
                secureTextEntry
                style={styles.pwInput}
                value={newPw}
                onChangeText={setNewPw}
                placeholderTextColor={colors.secondaryText}
                placeholder="მინ. 8 სიმბოლო"
              />
              <Text style={styles.pwLabel}>გაიმეორე პაროლი</Text>
              <TextInput
                secureTextEntry
                style={styles.pwInput}
                value={confirmPw}
                onChangeText={setConfirmPw}
                placeholderTextColor={colors.secondaryText}
                placeholder="••••••••"
              />
              {pwMsg ? (
                <Text style={[styles.pwMsg, pwErr ? styles.pwMsgErr : styles.pwMsgOk]}>{pwMsg}</Text>
              ) : null}
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                onPress={handleChangePw}
              >
                <Text style={styles.primaryBtnText}>{pwSaving ? "იტვირთება..." : "შეცვლა"}</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* ── Logout ── */}
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>⬡  გასვლა</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Action Sheet Modal (Cover/Avatar) ── */}
      <Modal visible={actionSheet !== "none"} transparent animationType="fade" onRequestClose={() => setActionSheet("none")}>
        <TouchableOpacity style={styles.modalBackdropAction} activeOpacity={1} onPress={() => setActionSheet("none")}>
          <View style={styles.actionSheet}>
            <View style={styles.actionSheetHandle} />
            
            {actionSheet === "cover" && (
              <>
                <Text style={styles.actionSheetTitle}>ქავერის შეცვლა</Text>
                <TouchableOpacity style={styles.actionSheetBtn} onPress={async () => {
                  setActionSheet("none");
                  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.8 });
                  if (!result.canceled && result.assets[0]) {
                    try { await uploadCoverPhoto(result.assets[0].uri); } catch (e) { setErrorMsg(e instanceof Error ? e.message : "Upload failed"); }
                  }
                }}>
                  <Text style={styles.actionSheetBtnText}>გალერიიდან არჩევა</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionSheetBtn} onPress={() => {
                  setActionSheet("none");
                  setShowCoverPicker(true);
                  setShowColorPicker(false);
                }}>
                  <Text style={styles.actionSheetBtnText}>ფერის არჩევა</Text>
                </TouchableOpacity>
              </>
            )}

            {actionSheet === "avatar" && (
              <>
                <Text style={styles.actionSheetTitle}>პროფილის სურათი</Text>
                <TouchableOpacity style={styles.actionSheetBtn} onPress={async () => {
                  setActionSheet("none");
                  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
                  if (!result.canceled && result.assets[0]) {
                    try { await uploadProfilePhoto(result.assets[0].uri); } catch (e) { setErrorMsg(e instanceof Error ? e.message : "Upload failed"); }
                  }
                }}>
                  <Text style={styles.actionSheetBtnText}>გალერიიდან არჩევა</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionSheetBtn} onPress={() => { setActionSheet("none"); setShowColorPicker(true); setShowCoverPicker(false); }}>
                  <Text style={styles.actionSheetBtnText}>ფერის არჩევა</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.actionSheetCancelBtn} onPress={() => setActionSheet("none")}>
              <Text style={styles.actionSheetCancelBtnText}>გაუქმება</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Logout Confirm Modal ── */}
      <Modal visible={showLogoutConfirm} transparent animationType="fade" onRequestClose={() => setShowLogoutConfirm(false)}>
        <View style={styles.modalBackdropDialog}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>გასვლა</Text>
            <Text style={styles.dialogText}>ნამდვილად გსურს გასვლა?</Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.dialogCancelBtn} onPress={() => setShowLogoutConfirm(false)}>
                <Text style={styles.dialogCancelBtnText}>გაუქმება</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dialogDangerBtn} onPress={() => { setShowLogoutConfirm(false); logout(); }}>
                <Text style={styles.dialogDangerBtnText}>გასვლა</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Error Modal ── */}
      <Modal visible={!!errorMsg} transparent animationType="fade" onRequestClose={() => setErrorMsg("")}>
        <View style={styles.modalBackdropDialog}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>შეცდომა</Text>
            <Text style={styles.dialogText}>{errorMsg}</Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.dialogBtn} onPress={() => setErrorMsg("")}>
                <Text style={styles.dialogBtnText}>კარგი</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { backgroundColor: colors.card, flex: 1 , paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) : 0 },
    scroll: { backgroundColor: colors.background },
    scrollContent: { paddingBottom: 20 },

    header: {
      alignItems: "center",
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
    headerBtn: {
      alignItems: "center",
      backgroundColor: colors.button,
      borderRadius: 8,
      height: 42,
      justifyContent: "center",
      width: 42
    },
    headerSpacer: { height: 42, width: 42 },
    headerIcon: { color: colors.primaryText, fontSize: 30, fontWeight: "700", lineHeight: 36 },
    headerTitle: { color: colors.primaryText, fontSize: 22, fontWeight: "900" },

    cover: {
      height: 140,
      overflow: "hidden",
      position: "relative"
    },
    coverGradientTop: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: "50%"
    },
    coverGradientBottom: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "50%"
    },
    coverOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: "#000",
      opacity: 0.18
    },
    coverEditBtn: {
      position: "absolute",
      right: 16,
      top: 16,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "center",
      alignItems: "center"
    },

    avatarRow: {
      alignItems: "flex-end",
      flexDirection: "row",
      marginTop: -36,
      paddingBottom: 12,
      paddingHorizontal: 20,
      gap: 14
    },
    avatar: {
      alignItems: "center",
      borderColor: colors.card,
      borderRadius: 40,
      borderWidth: 4,
      elevation: 4,
      height: 80,
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { height: 4, width: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      width: 80,
      overflow: "hidden"
    },
    avatarImage: { height: "100%", width: "100%" },
    avatarInitials: { color: "#fff", fontSize: 28, fontWeight: "900" },
    avatarEditBadge: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderColor: colors.card,
      borderRadius: 10,
      borderWidth: 2,
      bottom: 0,
      height: 20,
      justifyContent: "center",
      position: "absolute",
      right: 0,
      width: 20
    },
    avatarEditIcon: { color: "#fff", fontSize: 10, fontWeight: "900" },
    heroInfo: { flex: 1, paddingRight: 10, alignSelf: "center", marginTop: 6 },
    heroNameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 },
    heroName: { color: colors.primaryText, fontSize: 24, fontWeight: "900" },
    heroUsername: { color: colors.secondaryText, fontSize: 14, fontWeight: "800" },
    rankBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12, borderWidth: 1, backgroundColor: colors.background },
    rankBadgeIcon: { fontSize: 12, marginRight: 4 },
    rankBadgeText: { fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
    rankProgressText: { color: colors.secondaryText, fontSize: 11, fontWeight: "700", marginTop: 4 },

    colorPicker: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      marginHorizontal: 20,
      marginBottom: 12,
      padding: 14
    },
    colorPickerLabel: {
      color: colors.primaryText,
      fontSize: 13,
      fontWeight: "800",
      marginBottom: 10
    },
    colorSwatches: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    colorSwatch: {
      borderRadius: 18,
      height: 36,
      width: 36
    },
    colorSwatchActive: {
      borderColor: colors.primaryText,
      borderWidth: 3
    },

    statsBar: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1,
      elevation: 1,
      flexDirection: "row",
      marginBottom: 16,
      marginHorizontal: 20,
      paddingVertical: 14,
      shadowColor: colors.shadow,
      shadowOffset: { height: 2, width: 0 },
      shadowOpacity: 0.06,
      shadowRadius: 6
    },
    statBarItem: { alignItems: "center", flex: 1 },
    statBarDivider: { backgroundColor: colors.border, width: 1 },
    statBarNum: { color: colors.primaryText, fontSize: 22, fontWeight: "900" },
    statBarLbl: { color: colors.secondaryText, fontSize: 11, fontWeight: "700", marginTop: 2 },

    card: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 14,
      borderWidth: 1,
      elevation: 1,
      marginBottom: 16,
      marginHorizontal: 20,
      overflow: "hidden",
      shadowColor: colors.shadow,
      shadowOffset: { height: 2, width: 0 },
      shadowOpacity: 0.06,
      shadowRadius: 6
    },
    cardTitle: {
      color: colors.primaryText,
      fontSize: 15,
      fontWeight: "900",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12
    },
    divider: { backgroundColor: colors.border, height: 1, marginHorizontal: 16 },

    fieldRow: {
      alignItems: "center",
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 12
    },
    fieldContent: { flex: 1 },
    fieldLabel: { color: colors.secondaryText, fontSize: 11, fontWeight: "800", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 },
    fieldValue: { color: colors.primaryText, fontSize: 16, fontWeight: "700" },
    fieldBadge: { alignItems: "center", justifyContent: "center", width: 32 },
    fieldBadgeText: { fontSize: 16 },

    editIconBtn: {
      alignItems: "center",
      backgroundColor: colors.button,
      borderRadius: 8,
      height: 34,
      justifyContent: "center",
      width: 34
    },
    editIcon: { color: colors.primaryText, fontSize: 16 },
    editRowActive: { padding: 16 },
    inlineInput: {
      backgroundColor: colors.background,
      borderColor: colors.accent,
      borderRadius: 8,
      borderWidth: 1.5,
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: "700",
      marginTop: 6,
      marginBottom: 10,
      minHeight: 48,
      paddingHorizontal: 12
    },
    inlineInputMulti: { minHeight: 80, paddingTop: 10, textAlignVertical: "top" },
    fieldError: { color: "#e63946", fontSize: 13, fontWeight: "700", marginBottom: 8 },
    editRowActions: { flexDirection: "row", gap: 8 },
    saveBtn: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: 8,
      flex: 1,
      justifyContent: "center",
      minHeight: 42
    },
    saveBtnText: { color: "#fff", fontSize: 14, fontWeight: "900" },
    cancelBtn: {
      alignItems: "center",
      backgroundColor: colors.button,
      borderRadius: 8,
      flex: 1,
      justifyContent: "center",
      minHeight: 42
    },
    cancelBtnText: { color: colors.primaryText, fontSize: 14, fontWeight: "900" },

    gameRow: { paddingHorizontal: 16, paddingVertical: 12 },
    gameHeader: { alignItems: "center", flexDirection: "row", marginBottom: 10, gap: 8 },
    gameEmoji: { fontSize: 20 },
    gameLabel: { color: colors.primaryText, flex: 1, fontSize: 15, fontWeight: "800" },
    gamePointsBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
    gamePointsText: { fontSize: 12, fontWeight: "800" },
    gameStats: { flexDirection: "row", justifyContent: "space-between" },
    gameStatItem: { alignItems: "center", flex: 1 },
    gameStatNum: { color: colors.primaryText, fontSize: 18, fontWeight: "900" },
    gameStatLbl: { color: colors.secondaryText, fontSize: 10, fontWeight: "700", marginTop: 2 },

    sectionToggle: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingRight: 16
    },
    toggleChevron: {
      color: colors.secondaryText,
      fontSize: 22,
      fontWeight: "700",
      transform: [{ rotate: "90deg" }]
    },
    toggleChevronOpen: { transform: [{ rotate: "-90deg" }] },

    pwSection: { paddingHorizontal: 16, paddingBottom: 16 },
    pwLabel: {
      color: colors.secondaryText,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.5,
      marginBottom: 4,
      textTransform: "uppercase"
    },
    pwInput: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 12,
      minHeight: 48,
      paddingHorizontal: 12
    },
    pwMsg: { fontSize: 13, fontWeight: "800", marginBottom: 10, textAlign: "center" },
    pwMsgErr: { color: "#e63946" },
    pwMsgOk: { color: colors.correct },

    primaryBtn: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: 10,
      justifyContent: "center",
      minHeight: 48,
      marginTop: 4
    },
    primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "900" },

    logoutBtn: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: "#e6394640",
      borderRadius: 12,
      borderWidth: 1.5,
      justifyContent: "center",
      marginHorizontal: 20,
      marginTop: 4,
      minHeight: 50
    },
    logoutText: { color: "#e63946", fontSize: 15, fontWeight: "900" },

    pressed: { opacity: 0.64 },

    modalBackdropAction: { flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" },
    modalBackdropDialog: { flex: 1, backgroundColor: colors.overlay, justifyContent: "center" },
    
    actionSheet: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    actionSheetHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
    actionSheetTitle: { color: colors.primaryText, fontSize: 18, fontWeight: "900", marginBottom: 16, textAlign: "center" },
    actionSheetBtn: { backgroundColor: colors.background, borderRadius: 12, paddingVertical: 16, marginBottom: 10, alignItems: "center" },
    actionSheetBtnText: { color: colors.primaryText, fontSize: 16, fontWeight: "700" },
    actionSheetCancelBtn: { backgroundColor: "transparent", paddingVertical: 16, marginTop: 4, alignItems: "center" },
    actionSheetCancelBtnText: { color: colors.secondaryText, fontSize: 16, fontWeight: "800" },

    dialog: { backgroundColor: colors.card, borderRadius: 16, margin: 24, padding: 24, alignSelf: "center", width: "85%", maxWidth: 400 },
    dialogTitle: { color: colors.primaryText, fontSize: 18, fontWeight: "900", marginBottom: 10, textAlign: "center" },
    dialogText: { color: colors.secondaryText, fontSize: 15, fontWeight: "600", marginBottom: 24, textAlign: "center", lineHeight: 22 },
    dialogActions: { flexDirection: "row", gap: 12 },
    dialogBtn: { flex: 1, backgroundColor: colors.accent, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
    dialogBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
    dialogCancelBtn: { flex: 1, backgroundColor: colors.button, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
    dialogCancelBtnText: { color: colors.primaryText, fontSize: 15, fontWeight: "800" },
    dialogDangerBtn: { flex: 1, backgroundColor: "#e63946", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
    dialogDangerBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },

    achievementsGrid: { flexDirection: "row", flexWrap: "wrap", padding: 16, paddingTop: 4, gap: 12, justifyContent: "center" },
    achievementBadge: { alignItems: "center", backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, width: 100 },
    achievementBadgeLocked: { opacity: 0.5, backgroundColor: "transparent" },
    achievementEmoji: { fontSize: 28, marginBottom: 6 },
    achievementEmojiLocked: { opacity: 0.3 },
    achievementLabel: { color: colors.primaryText, fontSize: 11, fontWeight: "800", textAlign: "center" },

    questRow: { marginBottom: 12 },
    questInfo: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
    questTitle: { color: colors.primaryText, fontSize: 14, fontWeight: "800" },
    questProgressText: { color: colors.secondaryText, fontSize: 12, fontWeight: "700" },
    questProgressBarBg: { backgroundColor: colors.border, borderRadius: 4, height: 8, width: "100%", overflow: "hidden" },
    questProgressBar: { height: "100%", borderRadius: 4 },

    sectionSubtitle: { color: colors.secondaryText, fontSize: 12, fontWeight: "800", textTransform: "uppercase", marginBottom: 12 },
    distribution: { gap: 4 },
    distributionRow: { flexDirection: "row", alignItems: "center" },
    guessNumber: { color: colors.primaryText, fontSize: 13, fontWeight: "800", width: 16, textAlign: "center" },
    barTrack: { flex: 1, marginLeft: 8 },
    bar: { minWidth: 20, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignItems: "flex-end", justifyContent: "center" },
    barText: { color: "#fff", fontSize: 11, fontWeight: "800" },

    searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: colors.background, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, marginBottom: 16 },
    searchInput: { flex: 1, color: colors.primaryText, fontSize: 15, fontWeight: "600", minHeight: 44, paddingHorizontal: 8 },
    searchResults: { backgroundColor: colors.background, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 16 },
    friendSectionTitle: { color: colors.secondaryText, fontSize: 12, fontWeight: "800", textTransform: "uppercase", marginBottom: 12, marginTop: 8 },
    friendRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    friendAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginRight: 12 },
    friendAvatarInitials: { color: "#fff", fontSize: 16, fontWeight: "900" },
    friendInfo: { flex: 1 },
    friendName: { color: colors.primaryText, fontSize: 15, fontWeight: "800" },
    friendUsername: { color: colors.secondaryText, fontSize: 13, fontWeight: "600", marginTop: 2 },
    h2hText: { color: colors.secondaryText, fontSize: 11, fontWeight: "700", marginTop: 4 },
    addFriendBtn: { backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    addFriendBtnText: { color: "#fff", fontSize: 13, fontWeight: "800" },
    acceptBtn: { backgroundColor: colors.accent, padding: 8, borderRadius: 8 },
    rejectBtn: { backgroundColor: colors.button, borderColor: "#e63946", borderWidth: 1, padding: 7, borderRadius: 8 },
    removeBtn: { padding: 8 },
    friendListEmpty: { color: colors.secondaryText, fontSize: 14, fontWeight: "600", textAlign: "center", paddingVertical: 12 }
  });
}
