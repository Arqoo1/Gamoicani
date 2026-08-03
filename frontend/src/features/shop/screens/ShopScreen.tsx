import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ShopData, ShopItem } from "@/entities/shop/types";
import { buyItem, equipItem, fetchShopData } from "@/features/shop/api/shopApi";
import { useAppTheme } from "@/application/providers/theme";
import { useSocket } from "@/application/providers/socket";
import { ShopItemCard } from "@/features/shop/ui/ShopItemCard";
import { getFriendlyErrorMessage } from "@/shared/utils/errorMessages";
import { createStyles } from "@/features/shop/screens/ShopScreen.styles";
type Category = "avatar" | "nameTag" | "banner";

const CATEGORY_LABELS: Record<Category, string> = {
  avatar: "ავატარები",
  nameTag: "სახელთეგები",
  banner: "ბანერები",
};

export default function ShopScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>("avatar");
  const [busy, setBusy] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<ShopItem | null>(null);
  const [buyItemPrompt, setBuyItemPrompt] = useState<ShopItem | null>(null);
  const [shopMessage, setShopMessage] = useState<{ title: string; body: string } | null>(null);
  const { emitProfileUpdate } = useSocket();

  const load = useCallback(async () => {
    try {
      const data = await fetchShopData();
      setShopData(data);
    } catch {
      Alert.alert("შეცდომა", "მაღაზიის ჩატვირთვა ვერ მოხერხდა");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleBuy = useCallback(
    async (item: ShopItem) => {
      if (!shopData) return;
      if (shopData.totalPoints < item.price) {
        setShopMessage({
          title: "არასაკმარისი ქულები",
          body: `საჭიროა ${item.price} ქულა, გაქვს ${shopData.totalPoints}`,
        });
        return;
      }
      setBuyItemPrompt(item);
    },
    [shopData]
  );

  const confirmBuy = useCallback(async () => {
    if (!buyItemPrompt) return;
    const item = buyItemPrompt;
    setBuyItemPrompt(null);
    setBusy(item.id);
    try {
      const result = await buyItem(item.id);
      setShopData((prev) =>
        prev
          ? {
              ...prev,
              totalPoints: result.totalPoints,
              items: result.items,
            }
          : prev
      );
    } catch {
      setShopMessage({
        title: "???????",
        body: getFriendlyErrorMessage("?????? ??? ????????"),
      });
      setBusy(null);
    }
  }, [buyItemPrompt]);

  const handleEquip = useCallback(
    async (item: ShopItem) => {
      setBusy(item.id);
      try {
        const result = await equipItem(item.id);
        setShopData((prev) => (prev ? { ...prev, equippedItems: result.equippedItems } : prev));
        emitProfileUpdate(result.equippedItems);
      } catch {
        Alert.alert("???????", getFriendlyErrorMessage("?????? ??? ????????"));
      } finally {
        setBusy(null);
      }
    },
    [emitProfileUpdate]
  );

  const filtered = useMemo(
    () => shopData?.items.filter((i) => i.category === activeCategory) ?? [],
    [shopData, activeCategory]
  );

  return (
    <SafeAreaView edges={["top", "right", "bottom", "left"]} style={styles.safe}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <Feather color={colors.primaryText} name="chevron-left" size={28} />
        </Pressable>
        <View style={styles.headerTitleWrap} pointerEvents="none">
          <Text style={styles.title}>მაღაზია</Text>
        </View>
        <View style={styles.pointsBadge}>
          <Feather name="star" size={14} color={colors.accent} />
          <Text style={styles.pointsText}>{shopData?.totalPoints.toLocaleString() ?? "..."}</Text>
        </View>
      </View>

      {}
      <View style={styles.tabRow}>
        {(["avatar", "nameTag", "banner"] as Category[]).map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setActiveCategory(cat)}
            style={[styles.tab, activeCategory === cat && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeCategory === cat && styles.tabTextActive]}>
              {CATEGORY_LABELS[cat]}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {filtered.map((item) => {
            const isEquipped = shopData?.equippedItems
              ? Object.values(shopData.equippedItems).includes(item.id)
              : false;
            const isBusy = busy === item.id;
            return (
              <ShopItemCard
                key={item.id}
                isBusy={isBusy}
                isEquipped={isEquipped}
                item={item}
                onBuy={handleBuy}
                onEquip={handleEquip}
                onPreview={setPreviewItem}
                styles={styles}
              />
            );
          })}
        </ScrollView>
      )}

      {}
      <Modal
        visible={!!previewItem}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewItem(null)}
      >
        <Pressable style={styles.previewModalBackdrop} onPress={() => setPreviewItem(null)}>
          <Pressable style={styles.previewModalCard} onPress={() => {}}>
            {}
            {}
            <View
              style={[
                styles.previewMockBanner,
                previewItem?.category === "banner" && previewItem.colors
                  ? { backgroundColor: previewItem.colors[0] }
                  : { backgroundColor: colors.accent + "55" },
              ]}
            >
              {previewItem?.category === "banner" && previewItem.colors && (
                <View style={{ flexDirection: "row", flex: 1 }}>
                  {previewItem.colors.map((c, i) => (
                    <View key={i} style={{ flex: 1, backgroundColor: c }} />
                  ))}
                </View>
              )}
              <View style={styles.previewMockAvatarWrap}>
                <View style={[styles.previewMockAvatar, { backgroundColor: colors.accent }]}>
                  <Text style={styles.previewMockAvatarText}>
                    {previewItem?.category === "avatar" ? (previewItem.emoji ?? "🧩") : "🧩"}
                  </Text>
                </View>
              </View>
            </View>

            {}
            <View style={styles.previewMockInfo}>
              <Text style={styles.previewMockName}>მომხმარებელი</Text>
              {previewItem?.category === "nameTag" && (
                <View style={[styles.previewMockTag, { borderColor: previewItem.color }]}>
                  <Text style={[styles.previewMockTagText, { color: previewItem.color }]}>
                    {previewItem.label}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.previewItemName}>{previewItem?.label}</Text>
            <Text style={styles.previewItemDesc}>{previewItem?.description}</Text>

            <View style={styles.previewModalActions}>
              <Pressable
                style={[styles.previewActionBtn, styles.previewActionClose]}
                onPress={() => setPreviewItem(null)}
              >
                <Text style={styles.previewActionCloseText}>დახურვა</Text>
              </Pressable>
              {previewItem && !previewItem.owned && (
                <Pressable
                  style={[styles.previewActionBtn, styles.previewActionBuy]}
                  onPress={() => {
                    setPreviewItem(null);
                    handleBuy(previewItem);
                  }}
                >
                  <Feather name="star" size={14} color="#fff" />
                  <Text style={styles.previewActionBuyText}>{previewItem?.price} შეძენა</Text>
                </Pressable>
              )}
              {previewItem?.owned && (
                <Pressable
                  style={[styles.previewActionBtn, styles.previewActionBuy]}
                  onPress={() => {
                    setPreviewItem(null);
                    handleEquip(previewItem!);
                  }}
                >
                  <Text style={styles.previewActionBuyText}>
                    {shopData?.equippedItems && Object.values(shopData.equippedItems).includes(previewItem.id)
                      ? "გამორთვა"
                      : "ჩართვა"}
                  </Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={!!buyItemPrompt}
        transparent
        animationType="fade"
        onRequestClose={() => setBuyItemPrompt(null)}
      >
        <Pressable style={styles.previewModalBackdrop} onPress={() => setBuyItemPrompt(null)}>
          <Pressable style={styles.confirmModalCard} onPress={() => {}}>
            <View style={styles.confirmIconWrap}>
              <Feather name="shopping-bag" size={28} color={colors.accent} />
            </View>
            <Text style={styles.confirmTitle}>{buyItemPrompt?.label}</Text>
            <Text style={styles.confirmText}>{buyItemPrompt ? `${buyItemPrompt.price} ქულა` : ""}</Text>
            <View style={styles.previewModalActions}>
              <Pressable
                style={[styles.previewActionBtn, styles.previewActionClose]}
                onPress={() => setBuyItemPrompt(null)}
              >
                <Text style={styles.previewActionCloseText}>გაუქმება</Text>
              </Pressable>
              <Pressable
                disabled={!!busy}
                style={[styles.previewActionBtn, styles.previewActionBuy]}
                onPress={confirmBuy}
              >
                <Text style={styles.previewActionBuyText}>შეძენა</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={!!shopMessage}
        transparent
        animationType="fade"
        onRequestClose={() => setShopMessage(null)}
      >
        <Pressable style={styles.previewModalBackdrop} onPress={() => setShopMessage(null)}>
          <Pressable style={styles.confirmModalCard} onPress={() => {}}>
            <View style={styles.confirmIconWrap}>
              <Feather name="info" size={28} color={colors.accent} />
            </View>
            <Text style={styles.confirmTitle}>{shopMessage?.title}</Text>
            <Text style={styles.confirmText}>{shopMessage?.body}</Text>
            <View style={styles.previewModalActions}>
              <Pressable
                style={[styles.previewActionBtn, styles.previewActionBuy]}
                onPress={() => setShopMessage(null)}
              >
                <Text style={styles.previewActionBuyText}>კარგი</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
