import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { Alert,
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

import { useAuth, useLogoutAndGoLogin } from "@/application/providers/auth";
import { AppColors, useAppTheme } from "@/application/providers/theme";
import {
  ACHIEVEMENTS_META,
  AVATAR_COLORS,
  COVER_GRADIENTS,
  SHOP_ITEMS_META,
  formatDate,
  getInitials,
  getMediaUrl,
  getProfileStatsSummary,
  getRankInfo,
  normalizeGuessDistribution
} from "@/features/profile/model/profileMeta";
import { EditRow } from "@/features/profile/ui/EditRow";
import { CoverColorPicker } from "@/features/profile/ui/CoverColorPicker";
import { AvatarColorPicker } from "@/features/profile/ui/AvatarColorPicker";
import { AchievementsCard } from "@/features/profile/ui/AchievementsCard";
import { ChangePasswordCard } from "@/features/profile/ui/ChangePasswordCard";
import { useProfileFriends } from "@/features/profile/hooks/useProfileFriends";
import { equipItem, unequipItem } from "@/features/shop/api/shopApi";
import { fetchMyGameSummary } from "@/features/scores/api/scoresApi";
import { createStyles } from "@/features/profile/screens/ProfileScreen.styles";
import { queryKeys } from "@/shared/api/queryKeys";

export default function ProfileScreen() {
  const router = useRouter();
  const { changePassword, refreshUser, updateProfile, updateUser, uploadCoverPhoto, uploadProfilePhoto, user } = useAuth();
  const logout = useLogoutAndGoLogin();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);

  const coverIndex = user?.coverGradient ?? 0;
  const avatarColor = user?.avatarColor ?? "#2f9e5d";

  const equippedBannerId = user?.equippedItems?.banner ?? null;
  const equippedAvatarId = user?.equippedItems?.avatar ?? null;
  const equippedNameTagId = user?.equippedItems?.nameTag ?? null;
  const equippedBannerColors = equippedBannerId ? SHOP_ITEMS_META[equippedBannerId]?.colors : null;
  const equippedAvatarEmoji = equippedAvatarId ? SHOP_ITEMS_META[equippedAvatarId]?.emoji : null;
  const equippedNameTagColor = equippedNameTagId ? SHOP_ITEMS_META[equippedNameTagId]?.color : null;

  const coverColors = equippedBannerColors
    ? [equippedBannerColors[0], equippedBannerColors[equippedBannerColors.length - 1]] as [string, string]
    : COVER_GRADIENTS[coverIndex % COVER_GRADIENTS.length]!;;

  const [actionSheet, setActionSheet] = useState<"none" | "cover" | "avatar">("none");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    friends,
    handleAcceptRequest,
    handleRejectRequest,
    handleRemoveFriend,
    handleSearch,
    handleSendRequest,
    isSearching,
    safeRequests,
    searchQuery,
    searchResults
  } = useProfileFriends(Boolean(user));

  const { data: wordleSummary } = useQuery({
    queryKey: queryKeys.scores.summary("wordle"),
    queryFn: () => fetchMyGameSummary("wordle"),
    enabled: Boolean(user),
    staleTime: 60_000,
  });


  useEffect(() => {
    refreshUser();
  }, []);

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
      if (user?.equippedItems?.avatar) {
        const res = await unequipItem("avatar");
        updateUser({ ...user, equippedItems: res.equippedItems } as any);
      }
      await updateProfile({ avatarColor: color, profilePhotoUrl: null });
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Error updating avatar color");
    }
  }, [updateProfile, user, updateUser]);

  const handleCoverColor = useCallback(async (index: number) => {
    setShowCoverPicker(false);
    setShowColorPicker(false);
    try {
      if (user?.equippedItems?.banner) {
        const res = await unequipItem("banner");
        updateUser({ ...user, equippedItems: res.equippedItems } as any);
      }
      await updateProfile({ coverGradient: index, coverPhotoUrl: null });
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Error updating cover gradient");
    }
  }, [updateProfile, user, updateUser]);

  const handleEquipShopItem = useCallback(async (itemId: string) => {
    setShowColorPicker(false);
    setShowCoverPicker(false);
    try {
      const category = SHOP_ITEMS_META[itemId]?.category;
      const res = await equipItem(itemId);
      if (category === "avatar") {
        await updateProfile({ profilePhotoUrl: null });
      }
      if (category === "banner") {
        await updateProfile({ coverPhotoUrl: null });
      }
      if (user) {
        updateUser({
          ...user,
          equippedItems: res.equippedItems,
          ...(category === "avatar" ? { profilePhotoUrl: null } : {}),
          ...(category === "banner" ? { coverPhotoUrl: null } : {})
        } as any);
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Error equipping item");
    }
  }, [updateProfile, user, updateUser]);

  const handleUnequipShopItem = useCallback(async (category: string) => {
    try {
      const res = await unequipItem(category);
      if (user) updateUser({ ...user, equippedItems: res.equippedItems } as any);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Error unequipping item");
    }
  }, [user, updateUser]);



  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const { bestStreak, gameEntries, totalPlays, winPct } = useMemo(
    () => getProfileStatsSummary(user),
    [user?.gameStats]
  );
  const guessDistribution = useMemo(
    () => normalizeGuessDistribution(wordleSummary?.guessDistribution),
    [wordleSummary?.guessDistribution]
  );

  if (!user) return null;

  const initials = getInitials(user.displayName);
  const rank = getRankInfo(user.totalPoints);
  const maxDist = Math.max(1, ...guessDistribution);

  const dailyQuestsData = user.dailyQuests?.quests || [];
  const bonusClaimed = user.dailyQuests?.bonusClaimed || false;
  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={coverColors[0]} />

      {}
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
        {}
        <TouchableOpacity activeOpacity={0.85} onPress={handleCoverTap} style={styles.cover}>
          {equippedBannerColors ? (
            <>
              <View style={[styles.coverGradientTop, { backgroundColor: coverColors[0] }]} />
              <View style={[styles.coverGradientBottom, { backgroundColor: coverColors[1] }]} />
            </>
          ) : user.coverPhotoUrl ? (
            <Image contentFit="cover" source={{ uri: getMediaUrl(user.coverPhotoUrl) }} style={StyleSheet.absoluteFill} />
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

        {}
        <View style={styles.avatarRow}>
          <TouchableOpacity
            style={[styles.avatar, !equippedAvatarEmoji && !user.profilePhotoUrl && { backgroundColor: avatarColor }]}
            onPress={handleAvatarTap}
            activeOpacity={0.8}
          >
            {equippedAvatarEmoji ? (
              <Text style={styles.avatarEmoji}>{equippedAvatarEmoji}</Text>
            ) : user.profilePhotoUrl ? (
              <Image contentFit="cover" source={{ uri: getMediaUrl(user.profilePhotoUrl) }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditIcon}>✎</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.heroInfo}>
            <View style={styles.heroNameRow}>
              <Text
                style={[styles.heroName, equippedNameTagColor ? { color: equippedNameTagColor } : undefined]}
                numberOfLines={1}
              >
                {user.displayName}
              </Text>
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

        {}
        {showCoverPicker && (
          <CoverColorPicker
            user={user}
            coverIndex={coverIndex}
            equippedBannerId={equippedBannerId}
            styles={styles}
            onSelectColor={handleCoverColor}
            onEquipShopItem={handleEquipShopItem}
            onUnequipShopItem={handleUnequipShopItem}
          />
        )}

        {}
        {showColorPicker && (
          <AvatarColorPicker
            user={user}
            avatarColor={avatarColor}
            equippedAvatarId={equippedAvatarId}
            styles={styles}
            colors={colors}
            onSelectColor={handleAvatarColor}
            onEquipShopItem={handleEquipShopItem}
            onUnequipShopItem={handleUnequipShopItem}
          />
        )}

        {}
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

        {}
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
            icon="at-sign"
            label="მომხმარებლის სახელი"
            limit={15}
            styles={styles}
            value={user.username}
            placeholder="მომხმარებლის სახელი"
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

        {}
        <AchievementsCard user={user} styles={styles} colors={colors} />

        {}
        <View style={styles.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={styles.cardTitle}>📅 დღიური ქუესთები</Text>
            {bonusClaimed ? (
              <Text style={{ color: colors.correct, fontWeight: "800", marginRight: 16 }}>✓ მიღებულია</Text>
            ) : (
              <Text style={{ color: colors.correct, fontWeight: "800", marginRight: 16 }}>+3 ქულა</Text>
            )}
          </View>
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            {dailyQuestsData.length === 0 && (
              <Text style={{ color: colors.secondaryText, textAlign: "center", marginTop: 8 }}>
                ქუესთები არ მოიძებნა
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

        {}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 სტატისტიკა</Text>
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <Text style={styles.sectionSubtitle}>სიტყვობანას ცდების განაწილება</Text>
            <View style={styles.distribution}>
              {guessDistribution.map((count, index) => {
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

        {}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👥 მეგობრები</Text>
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            {}
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

            {}
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

            {}
            {safeRequests.length === 0 && (
              <>
                <Text style={styles.friendSectionTitle}>მოთხოვნები (0)</Text>
                <Text style={styles.friendListEmpty}>ახალი მოთხოვნები არ არის</Text>
              </>
            )}
            {safeRequests.length > 0 && (
              <>
                <Text style={styles.friendSectionTitle}>მოთხოვნები ({safeRequests.length})</Text>
                {safeRequests.map(req => (
                  <View key={req.from.id} style={styles.friendRow}>
                    <View style={[styles.friendAvatar, { backgroundColor: req.from.avatarColor ?? "#2f9e5d" }]}>
                      <Text style={styles.friendAvatarInitials}>{getInitials(req.from.displayName || req.from.username)}</Text>
                    </View>
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{req.from.displayName || req.from.username}</Text>
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

            {}
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

        {}
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

        {}
        <ChangePasswordCard styles={styles} colors={colors} changePassword={changePassword} />

        
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={20} color="#e63946" />
          <Text style={styles.logoutText}>გასვლა</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      
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

      {}
      <Modal visible={showLogoutConfirm} transparent animationType="fade" onRequestClose={() => setShowLogoutConfirm(false)}>
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
              <TouchableOpacity style={styles.dialogDangerBtn} onPress={() => { setShowLogoutConfirm(false); logout(); }}>
                <Text style={styles.dialogDangerBtnText}>გასვლა</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {}
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

