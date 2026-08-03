import { Feather } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";

import { getInitials } from "@/features/profile/model/profileMeta";
import { createStyles } from "@/features/profile/screens/ProfileScreen.styles";

export type FriendListUser = {
  avatarColor?: string;
  displayName: string;
  id: string;
  totalPoints?: number | null;
  username: string;
};

export type FriendRequestItem = {
  createdAt?: string;
  from: FriendListUser;
};

type ProfileFriendsSectionProps = {
  colors: {
    correct: string;
    primaryText: string;
    secondaryText: string;
  };
  friends: FriendListUser[];
  isSearching: boolean;
  onAcceptRequest: (id: string) => Promise<void>;
  onRemoveFriend: (id: string) => Promise<void>;
  onRejectRequest: (id: string) => Promise<void>;
  onSearch: (text: string) => void;
  onSendRequest: (id: string) => Promise<void>;
  safeRequests: FriendRequestItem[];
  searchQuery: string;
  searchResults: FriendListUser[];
  styles: ReturnType<typeof createStyles>;
};

export function ProfileFriendsSection({
  colors,
  friends,
  isSearching,
  onAcceptRequest,
  onRemoveFriend,
  onRejectRequest,
  onSearch,
  onSendRequest,
  safeRequests,
  searchQuery,
  searchResults,
  styles,
}: ProfileFriendsSectionProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>👥 მეგობრები</Text>
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color={colors.secondaryText} />
          <TextInput
            style={styles.searchInput}
            placeholder="მოძებნე მეგობარი (@username)"
            placeholderTextColor={colors.secondaryText}
            value={searchQuery}
            onChangeText={onSearch}
          />
        </View>

        {searchQuery.length > 0 && (
          <View style={styles.searchResults}>
            {isSearching ? (
              <Text style={styles.friendListEmpty}>ვეძებთ...</Text>
            ) : searchResults.length > 0 ? (
              searchResults.map((u) => (
                <View key={u.id} style={styles.friendRow}>
                  <View style={[styles.friendAvatar, { backgroundColor: u.avatarColor ?? "#2f9e5d" }]}>
                    <Text style={styles.friendAvatarInitials}>{getInitials(u.displayName)}</Text>
                  </View>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{u.displayName}</Text>
                    <Text style={styles.friendUsername}>@{u.username}</Text>
                  </View>
                  <Pressable style={styles.addFriendBtn} onPress={() => void onSendRequest(u.id)}>
                    <Text style={styles.addFriendBtnText}>+ დამატება</Text>
                  </Pressable>
                </View>
              ))
            ) : (
              <Text style={styles.friendListEmpty}>მომხმარებელი არ მოიძებნა</Text>
            )}
          </View>
        )}

        {safeRequests.length > 0 && (
          <>
            <Text style={styles.friendSectionTitle}>მოთხოვნები ({safeRequests.length})</Text>
            {safeRequests.map((req) => (
              <View key={req.from.id} style={styles.friendRow}>
                <View style={[styles.friendAvatar, { backgroundColor: req.from.avatarColor ?? "#2f9e5d" }]}>
                  <Text style={styles.friendAvatarInitials}>
                    {getInitials(req.from.displayName || req.from.username)}
                  </Text>
                </View>
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{req.from.displayName || req.from.username}</Text>
                  <Text style={styles.friendUsername}>@{req.from.username}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable style={styles.acceptBtn} onPress={() => void onAcceptRequest(req.from.id)}>
                    <Feather name="check" size={16} color="#fff" />
                  </Pressable>
                  <Pressable style={styles.rejectBtn} onPress={() => void onRejectRequest(req.from.id)}>
                    <Feather name="x" size={16} color="#e63946" />
                  </Pressable>
                </View>
              </View>
            ))}
          </>
        )}

        <Text style={styles.friendSectionTitle}>ჩემი მეგობრები ({friends.length})</Text>
        {friends.length === 0 ? (
          <Text style={styles.friendListEmpty}>ჯერ არ გყავს მეგობრები</Text>
        ) : (
          friends.map((f) => (
            <View key={f.id} style={styles.friendRow}>
              <View style={[styles.friendAvatar, { backgroundColor: f.avatarColor ?? "#2f9e5d" }]}>
                <Text style={styles.friendAvatarInitials}>{getInitials(f.displayName)}</Text>
              </View>
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{f.displayName}</Text>
                <Text style={styles.friendUsername}>
                  @{f.username} · ქულა: {f.totalPoints ?? 0}
                </Text>
                <Text style={styles.h2hText}>
                  ურითიერთშეხვედრები: <Text style={{ color: colors.correct }}>მოგება 50%</Text>
                </Text>
              </View>
              <Pressable style={styles.removeBtn} onPress={() => void onRemoveFriend(f.id)}>
                <Feather name="user-minus" size={18} color="#e63946" />
              </Pressable>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
