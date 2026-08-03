import { Text, View } from "react-native";
import { AuthUser } from "@/entities/user/types";
import { AppColors } from "@/application/providers/theme";
import { EditRow } from "@/features/profile/ui/EditRow";
import { CoverColorPicker } from "@/features/profile/ui/CoverColorPicker";
import { AvatarColorPicker } from "@/features/profile/ui/AvatarColorPicker";
import { AchievementsCard } from "@/features/profile/ui/AchievementsCard";
import { ChangePasswordCard } from "@/features/profile/ui/ChangePasswordCard";
import { updateMyProfile } from "@/features/auth/api/authApi";
import { createStyles } from "@/features/profile/screens/ProfileScreen.styles";

type Props = {
  colors: AppColors;
  coverColors: [string, string];
  coverIndex: number;
  equippedAvatarId: string | null;
  equippedBannerId: string | null;
  onEquipShopItem: (id: string) => void;
  onSelectAvatarColor: (color: string) => void;
  onSelectCoverColor: (index: number) => void;
  onUnequipShopItem: (category: "banner" | "avatar") => void;
  showColorPicker: boolean;
  showCoverPicker: boolean;
  styles: ReturnType<typeof createStyles>;
  updateProfile: (input: Parameters<typeof updateMyProfile>[0]) => Promise<void>;
  changePassword: (input: { currentPassword: string; newPassword: string }) => Promise<void>;
  user: AuthUser;
};

export function ProfileInfoSection({
  colors,
  coverColors,
  coverIndex,
  equippedAvatarId,
  equippedBannerId,
  onEquipShopItem,
  onSelectAvatarColor,
  onSelectCoverColor,
  onUnequipShopItem,
  showColorPicker,
  showCoverPicker,
  styles,
  updateProfile,
  changePassword,
  user,
}: Props) {
  return (
    <>
      {showCoverPicker && (
        <CoverColorPicker
          user={user}
          coverIndex={coverIndex}
          equippedBannerId={equippedBannerId}
          styles={styles}
          onSelectColor={onSelectCoverColor}
          onEquipShopItem={onEquipShopItem}
          onUnequipShopItem={onUnequipShopItem}
        />
      )}
      {showColorPicker && (
        <AvatarColorPicker
          user={user}
          avatarColor={user.avatarColor}
          equippedAvatarId={equippedAvatarId}
          styles={styles}
          colors={colors}
          onSelectColor={onSelectAvatarColor}
          onEquipShopItem={onEquipShopItem}
          onUnequipShopItem={onUnequipShopItem}
        />
      )}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>პროფილის ინფორმაცია</Text>
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
        </View>
      </View>
      <AchievementsCard user={user} styles={styles} colors={colors} />
      <ChangePasswordCard styles={styles} colors={colors} changePassword={changePassword} />
    </>
  );
}
