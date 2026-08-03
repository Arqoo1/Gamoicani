import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { AuthUser } from "@/entities/user/types";
import { getMediaUrl, getInitials, getRankInfo } from "@/features/profile/model/profileMeta";
import { createStyles } from "@/features/profile/screens/ProfileScreen.styles";

export function ProfileHero({
  coverColors,
  equippedAvatarEmoji,
  equippedBannerColors,
  equippedNameTagColor,
  avatarColor,
  onAvatarTap,
  onCoverTap,
  styles,
  user,
}: {
  coverColors: [string, string];
  equippedAvatarEmoji: string | null;
  equippedBannerColors: [string, string] | null;
  equippedNameTagColor: string | null;
  avatarColor: string;
  onAvatarTap: () => void;
  onCoverTap: () => void;
  styles: ReturnType<typeof createStyles>;
  user: AuthUser;
}) {
  const initials = getInitials(user.displayName);
  const rank = getRankInfo(user.totalPoints);

  return (
    <>
      <TouchableOpacity activeOpacity={0.85} onPress={onCoverTap} style={styles.cover}>
        {equippedBannerColors ? (
          <>
            <View style={[styles.coverGradientTop, { backgroundColor: coverColors[0] }]} />
            <View style={[styles.coverGradientBottom, { backgroundColor: coverColors[1] }]} />
          </>
        ) : user.coverPhotoUrl ? (
          <Image
            contentFit="cover"
            source={{ uri: getMediaUrl(user.coverPhotoUrl) }}
            style={StyleSheet.absoluteFill}
          />
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

      <View style={styles.avatarRow}>
        <TouchableOpacity
          style={[
            styles.avatar,
            !equippedAvatarEmoji && !user.profilePhotoUrl && { backgroundColor: avatarColor },
          ]}
          onPress={onAvatarTap}
          activeOpacity={0.8}
        >
          {equippedAvatarEmoji ? (
            <Text style={styles.avatarEmoji}>{equippedAvatarEmoji}</Text>
          ) : user.profilePhotoUrl ? (
            <Image
              contentFit="cover"
              source={{ uri: getMediaUrl(user.profilePhotoUrl) }}
              style={styles.avatarImage}
            />
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
            <Text style={styles.rankProgressText}>{rank.next - user.totalPoints} ქულა შემდეგ რანგამდე</Text>
          )}
        </View>
      </View>
    </>
  );
}
