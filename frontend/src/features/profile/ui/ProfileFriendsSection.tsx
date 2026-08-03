import { Feather } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";
import { FriendItem } from "@/features/profile/ui/FriendItem";
import { AppColors } from "@/application/providers/theme";
import { createStyles } from "@/features/profile/screens/ProfileScreen.styles";

type Props = {
  colors: AppColors;
  friends: Array<{ id: string; displayName: string; username: string; avatarColor?: string; totalPoints?: number }>;
  handleAcceptRequest: (id: string) => void;
  handleRejectRequest: (id: string) => void;
  handleRemoveFriend: (id: string) => void;
  handleSearch: (text: string) => void;
  handleSendRequest: (id: string) => void;
  isSearching: boolean;
  safeRequests: Array<{ from: { id: string; displayName: string; username: string; avatarColor?: string }; createdAt: string }>;
  searchQuery: string;
  searchResults: Array<{ id: string; displayName: string; username: string; avatarColor: string }>;
  styles: ReturnType<typeof createStyles>;
};

export function ProfileFriendsSection({ colors, friends, handleAcceptRequest, handleRejectRequest, handleRemoveFriend, handleSearch, handleSendRequest, isSearching, safeRequests, searchQuery, searchResults, styles }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>მეგობრები</Text>
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color={colors.secondaryText} />
          <TextInput style={styles.searchInput} placeholder="მოძებნე მეგობარი (@username)" placeholderTextColor={colors.secondaryText} value={searchQuery} onChangeText={handleSearch} />
        </View>
        {searchQuery.length > 0 && (
          <View style={styles.searchResults}>
            {isSearching ? <Text style={styles.friendListEmpty}>ვეძებთ...</Text> : searchResults.length > 0 ? searchResults.map((u) => (
              <View key={u.id} style={styles.friendRow}>
                <View style={[styles.friendAvatar, { backgroundColor: u.avatarColor }]}><Text style={styles.friendAvatarInitials}>{u.displayName.slice(0, 2).toUpperCase()}</Text></View>
                <View style={styles.friendInfo}><Text style={styles.friendName}>{u.displayName}</Text><Text style={styles.friendUsername}>@{u.username}</Text></View>
                <Pressable style={styles.addFriendBtn} onPress={() => handleSendRequest(u.id)}><Text style={styles.addFriendBtnText}>+ დამატება</Text></Pressable>
              </View>
            )) : <Text style={styles.friendListEmpty}>მომხმარებელი არ მოიძებნა</Text>}
          </View>
        )}
        {safeRequests.length > 0 && (
          <>
            <Text style={styles.friendSectionTitle}>მოთხოვნები ({safeRequests.length})</Text>
            {safeRequests.map((req) => (
              <View key={req.from.id} style={styles.friendRow}>
                <View style={[styles.friendAvatar, { backgroundColor: req.from.avatarColor ?? "#2f9e5d" }]}><Text style={styles.friendAvatarInitials}>{req.from.displayName.slice(0, 2).toUpperCase()}</Text></View>
                <View style={styles.friendInfo}><Text style={styles.friendName}>{req.from.displayName}</Text><Text style={styles.friendUsername}>@{req.from.username}</Text></View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable style={styles.acceptBtn} onPress={() => handleAcceptRequest(req.from.id)}><Feather name="check" size={16} color="#fff" /></Pressable>
                  <Pressable style={styles.rejectBtn} onPress={() => handleRejectRequest(req.from.id)}><Feather name="x" size={16} color="#e63946" /></Pressable>
                </View>
              </View>
            ))}
          </>
        )}
        <Text style={styles.friendSectionTitle}>ჩემი მეგობრები ({friends.length})</Text>
        {friends.length === 0 ? <Text style={styles.friendListEmpty}>ჯერ არ გყავს მეგობრები</Text> : friends.map((f) => <FriendItem key={f.id} friend={f} colors={colors} styles={styles} onRemove={handleRemoveFriend} />)}
      </View>
    </View>
  );
}
