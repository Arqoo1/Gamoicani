import { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AVATAR_COLORS, SHOP_ITEMS_META } from "@/features/profile/model/profileMeta";
import { AuthUser } from "@/entities/user/types";
import { AppColors } from "@/application/providers/theme";

type AvatarColorPickerProps = {
  user: AuthUser;
  avatarColor: string;
  equippedAvatarId: string | null;
  styles: Record<string, any>;
  colors: AppColors;
  onSelectColor: (color: string) => void;
  onEquipShopItem: (id: string) => void;
  onUnequipShopItem: (category: "banner" | "avatar") => void;
};

export const AvatarColorPicker = memo(function AvatarColorPicker({
  user,
  avatarColor,
  equippedAvatarId,
  styles,
  colors,
  onSelectColor,
  onEquipShopItem,
  onUnequipShopItem
}: AvatarColorPickerProps) {
  const ownedAvatars = Object.entries(SHOP_ITEMS_META).filter(
    ([id]) => SHOP_ITEMS_META[id].category === "avatar" && (user?.inventory ?? []).includes(id)
  );

  return (
    <View style={styles.colorPicker}>
      <Text style={styles.colorPickerLabel}>პროფილის ფერი / ავატარი</Text>
      <View style={styles.colorSwatches}>
        {AVATAR_COLORS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[
              styles.colorSwatch,
              { backgroundColor: c },
              !equippedAvatarId && c === avatarColor && styles.colorSwatchActive
            ]}
            onPress={() => onSelectColor(c)}
          />
        ))}
        {ownedAvatars.map(([id, meta]) => {
          const isEquipped = equippedAvatarId === id;
          return (
            <TouchableOpacity
              key={id}
              style={[
                styles.colorSwatch,
                styles.colorSwatchEmoji,
                isEquipped && styles.colorSwatchActive,
                { backgroundColor: colors.card }
              ]}
              onPress={() => (isEquipped ? onUnequipShopItem("avatar") : onEquipShopItem(id))}
            >
              <Text style={{ fontSize: 22 }}>{meta.emoji}</Text>
              {isEquipped && (
                <View style={styles.equippedBadge}>
                  <Text style={styles.equippedBadgeText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});
