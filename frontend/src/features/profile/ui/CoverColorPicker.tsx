import { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COVER_GRADIENTS, SHOP_ITEMS_META } from "@/features/profile/model/profileMeta";
import { AuthUser } from "@/entities/user/types";

type CoverColorPickerProps = {
  user: AuthUser;
  coverIndex: number;
  equippedBannerId: string | null;
  styles: Record<string, any>;
  onSelectColor: (index: number) => void;
  onEquipShopItem: (id: string) => void;
  onUnequipShopItem: (category: "banner" | "avatar") => void;
};

export const CoverColorPicker = memo(function CoverColorPicker({
  user,
  coverIndex,
  equippedBannerId,
  styles,
  onSelectColor,
  onEquipShopItem,
  onUnequipShopItem
}: CoverColorPickerProps) {
  const ownedBanners = Object.entries(SHOP_ITEMS_META).filter(
    ([id]) => SHOP_ITEMS_META[id].category === "banner" && (user?.inventory ?? []).includes(id)
  );

  return (
    <View style={styles.colorPicker}>
      <Text style={styles.colorPickerLabel}>ბანერი</Text>
      <View style={styles.colorSwatches}>
        {COVER_GRADIENTS.map((gradient, index) => (
          <TouchableOpacity
            key={`grad-${index}`}
            style={[
              styles.colorSwatch,
              !equippedBannerId && index === coverIndex && styles.colorSwatchActive,
              { overflow: "hidden" }
            ]}
            onPress={() => onSelectColor(index)}
          >
            <View style={{ flex: 1, backgroundColor: gradient[0] }} />
            <View style={{ flex: 1, backgroundColor: gradient[1] }} />
          </TouchableOpacity>
        ))}
        {ownedBanners.map(([id, meta]) => {
          const cols = meta.colors!;
          const isEquipped = equippedBannerId === id;
          return (
            <TouchableOpacity
              key={id}
              style={[styles.colorSwatch, isEquipped && styles.colorSwatchActive, { overflow: "hidden" }]}
              onPress={() => (isEquipped ? onUnequipShopItem("banner") : onEquipShopItem(id))}
            >
              <View style={{ flex: 1, backgroundColor: cols[0] }} />
              <View style={{ flex: 1, backgroundColor: cols[Math.floor(cols.length / 2)] }} />
              <View style={{ flex: 1, backgroundColor: cols[cols.length - 1] }} />
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
