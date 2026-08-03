import { Feather } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { AppColors } from "@/application/providers/theme";
import { FriendUser } from "@/entities/user/types";
import { getInitials, getUserColor } from "@/shared/utils/avatar";
import { createStyles } from "@/features/lobby/components/UserProfileModal.styles";

interface UserProfileModalProps {
  selectedUser: { id: string; displayName: string; username: string } | null;
  onClose: () => void;
  friendRequestStatus: "idle" | "loading" | "sent" | "error";
  friendsList: FriendUser[];
  onAddFriend: () => void;
  onViewProfile: (username: string) => void;
  colors: AppColors;
}

export function UserProfileModal({
  selectedUser,
  onClose,
  friendRequestStatus,
  friendsList,
  onAddFriend,
  onViewProfile,
  colors,
}: UserProfileModalProps) {
  const styles = createStyles(colors);

  if (!selectedUser) return null;

  const initials = getInitials(selectedUser.displayName);
  const avatarBg = getUserColor(selectedUser.username);
  const isFriend = friendsList.some((f) => f.id === selectedUser.id);

  return (
    <Modal visible={!!selectedUser} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.profileModalBackdrop} onPress={onClose}>
        <Pressable style={styles.profileModalCard} onPress={() => {}}>
          <View style={[styles.profileBanner, { backgroundColor: colors.accent + "44" }]} />
          <View style={[styles.profileAvatarBox, { backgroundColor: avatarBg }]}>
            <Text style={styles.profileAvatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{selectedUser.displayName}</Text>
            <Text style={styles.profileUsername}>@{selectedUser.username}</Text>
          </View>
          <View style={styles.profileActions}>
            <Pressable
              style={({ pressed }) => [styles.profileBtnClose, pressed && styles.pressed]}
              onPress={onClose}
            >
              <Text style={styles.profileBtnCloseText}>დახურვა</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.profileBtnView, pressed && styles.pressed]}
              onPress={() => onViewProfile(selectedUser.username)}
            >
              <Text style={styles.profileBtnViewText}>პროფილი</Text>
            </Pressable>
          </View>

          <View style={[styles.profileActions, { marginTop: 12 }]}>
            {isFriend ? (
              <View
                style={[
                  styles.profileBtnAdd,
                  { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
                ]}
              >
                <Feather name="check" size={16} color={colors.correct} />
                <Text style={[styles.profileBtnAddText, { color: colors.correct }]}>მეგობარია</Text>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.profileBtnAdd,
                  (pressed || friendRequestStatus === "loading" || friendRequestStatus === "sent") &&
                    styles.pressed,
                  friendRequestStatus === "sent" && { backgroundColor: colors.correct },
                ]}
                onPress={onAddFriend}
                disabled={friendRequestStatus === "loading" || friendRequestStatus === "sent"}
              >
                {friendRequestStatus === "loading" ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Feather
                      name={friendRequestStatus === "sent" ? "check" : "user-plus"}
                      size={16}
                      color="#fff"
                    />
                    <Text style={styles.profileBtnAddText}>
                      {friendRequestStatus === "sent" ? "გაიგზავნა" : "დამატება"}
                    </Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
