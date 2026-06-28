import { Feather } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { ShopItem } from "@/entities/shop/types";

type ShopItemCardProps = {
  isBusy: boolean;
  isEquipped: boolean;
  item: ShopItem;
  onBuy: (item: ShopItem) => void;
  onEquip: (item: ShopItem) => void;
  onPreview: (item: ShopItem) => void;
  styles: Record<string, any>;
};

export function ShopItemCard({
  isBusy,
  isEquipped,
  item,
  onBuy,
  onEquip,
  onPreview,
  styles
}: ShopItemCardProps) {
  return (
    <View style={[styles.itemCard, isEquipped && styles.itemCardEquipped]}>
      <Pressable onPress={() => onPreview(item)} style={styles.preview}>
        {item.category === "avatar" && (
          <Text style={styles.previewEmoji}>{item.emoji}</Text>
        )}
        {item.category === "nameTag" && (
          <View style={[styles.nameTagPreview, { borderColor: item.color }]}>
            <Text style={[styles.nameTagText, { color: item.color }]}>{item.label}</Text>
          </View>
        )}
        {item.category === "banner" && item.colors && (
          <View style={styles.bannerPreview}>
            {item.colors.map((c, i) => (
              <View key={i} style={[styles.bannerStripe, { backgroundColor: c }]} />
            ))}
          </View>
        )}
        <View style={styles.previewHint}>
          <Text style={styles.previewHintText}>👁️ გადახედვა</Text>
        </View>
      </Pressable>

      <Text style={styles.itemLabel}>{item.label}</Text>
      <Text style={styles.itemDesc}>{item.description}</Text>

      {isEquipped && (
        <View style={styles.equippedBadge}>
          <Text style={styles.equippedText}>ჩართულია</Text>
        </View>
      )}

      {item.owned ? (
        <Pressable
          onPress={() => onEquip(item)}
          disabled={isBusy}
          style={({ pressed }) => [
            styles.equipBtn,
            isEquipped && styles.equipBtnActive,
            (pressed || isBusy) && styles.pressed
          ]}
        >
          <Text style={[styles.equipBtnText, isEquipped && styles.equipBtnTextActive]}>
            {isEquipped ? "გამორთვა" : "ჩართვა"}
          </Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => onBuy(item)}
          disabled={isBusy}
          style={({ pressed }) => [
            styles.buyBtn,
            (pressed || isBusy) && styles.pressed
          ]}
        >
          <Feather name="star" size={14} color="#fff" />
          <Text style={styles.buyBtnText}>{item.price}</Text>
        </Pressable>
      )}
    </View>
  );
}
