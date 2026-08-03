import { Image } from "expo-image";
import { Pressable, Text, TouchableOpacity, View } from "react-native";
import { getMediaUrl } from "@/features/profile/model/profileMeta";
import { AuthUser } from "@/entities/user/types";
import { AppColors } from "@/application/providers/theme";

type Props = {
  avatarColor: string;
  colors: AppColors;
  coverColors: [string, string];
  equippedAvatarEmoji: string | null;
  equippedNameTagColor: string | null;
  handleAvatarTap: () => void;
  handleCoverTap: () => void;
  rank: { color: string; icon: string; label: string; next: number | null };
  styles: Record<string, any>;
  user: AuthUser;
};

export function ProfileHeroSection(props: Props) {
  const { avatarColor, coverColors, equippedAvatarEmoji, equippedNameTagColor, handleAvatarTap, handleCoverTap, rank, styles, user } = props;
  return (
    <View>
      <TouchableOpacity activeOpacity={0.85} onPress={handleCoverTap} style={styles.cover}>
        {user.coverPhotoUrl ? (
          <Image contentFit="cover" source={{ uri: getMediaUrl(user.coverPhotoUrl) }} style={styles.coverImage} />
        ) : (
          <>
            <View style={[styles.coverGradientTop, { backgroundColor: coverColors[0] }]} />
            <View style={[styles.coverGradientBottom, { backgroundColor: coverColors[1] }]} />
          </>
        )}
        <View style={styles.coverOverlay} />
        <View style={styles.coverEditBtn}><Text style={{ color: "#fff" }}>✎</Text></View>
      </TouchableOpacity>
      <View style={styles.avatarRow}>
        <TouchableOpacity style={[styles.avatar, !equippedAvatarEmoji && !user.profilePhotoUrl && { backgroundColor: avatarColor }]} onPress={handleAvatarTap} activeOpacity={0.8}>
          {equippedAvatarEmoji ? <Text style={styles.avatarEmoji}>{equippedAvatarEmoji}</Text> : user.profilePhotoUrl ? <Image contentFit="cover" source={{ uri: getMediaUrl(user.profilePhotoUrl) }} style={styles.avatarImage} /> : <Text style={styles.avatarInitials}>{user.displayName.slice(0, 2).toUpperCase()}</Text>}
          <View style={styles.avatarEditBadge}><Text style={styles.avatarEditIcon}>✎</Text></View>
        </TouchableOpacity>
        <View style={styles.heroInfo}>
          <View style={styles.heroNameRow}>
            <Text style={[styles.heroName, equippedNameTagColor ? { color: equippedNameTagColor } : undefined]} numberOfLines={1}>{user.displayName}</Text>
            <View style={[styles.rankBadge, { borderColor: rank.color }]}><Text style={styles.rankBadgeIcon}>{rank.icon}</Text><Text style={[styles.rankBadgeText, { color: rank.color }]}>{rank.label}</Text></View>
          </View>
          <Text style={styles.heroUsername}>@{user.username}</Text>
        </View>
      </View>
    </View>
  );
}
