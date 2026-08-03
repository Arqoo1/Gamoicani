import React from "react";
import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { getInitials } from "@/features/profile/model/profileMeta";

interface FriendItemProps {
  friend: {
    id: string;
    displayName: string;
    username: string;
    avatarColor?: string;
    totalPoints?: number;
  };
  colors: any;
  styles: any;
  onRemove: (id: string) => void;
}

export const FriendItem = React.memo(function FriendItem({
  friend,
  colors,
  styles,
  onRemove,
}: FriendItemProps) {
  const hash = friend.id.charCodeAt(0) + friend.id.charCodeAt(friend.id.length - 1);
  const mockWinRate = 30 + (hash % 50);

  return (
    <View style={styles.friendRow}>
      <View style={[styles.friendAvatar, { backgroundColor: friend.avatarColor || "#2f9e5d" }]}>
        <Text style={styles.friendAvatarInitials}>{getInitials(friend.displayName)}</Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{friend.displayName}</Text>
        <Text style={styles.friendUsername}>@{friend.username} · ქულა: {friend.totalPoints ?? 0}</Text>
        <Text style={styles.h2hText}>
          ურთიერთშეხვედრები: <Text style={{ color: colors.correct }}>მოგება {mockWinRate}%</Text>
        </Text>
      </View>
      <Pressable style={styles.removeBtn} onPress={() => onRemove(friend.id)}>
        <Feather name="user-minus" size={18} color="#e63946" />
      </Pressable>
    </View>
  );
});
