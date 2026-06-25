import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { buyItem, equipItem, fetchShopData, ShopData, ShopItem } from "../src/api";
import { AppColors, useAppTheme } from "../src/theme";
import { useSocket } from "../src/socket";

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

  useEffect(() => { load(); }, [load]);

  const handleBuy = useCallback(async (item: ShopItem) => {
    if (!shopData) return;
    if (shopData.totalPoints < item.price) {
      Alert.alert("არასაკმარისი ქულები", `საჭიროა ${item.price} ქულა, გაქვს ${shopData.totalPoints}`);
      return;
    }
    Alert.alert(
      `${item.label} — ${item.price} ქულა`,
      `გსურს შეძენა?`,
      [
        { text: "გაუქმება", style: "cancel" },
        {
          text: "შეძენა",
          onPress: async () => {
            setBusy(item.id);
            try {
              const result = await buyItem(item.id);
              setShopData((prev) => prev ? {
                ...prev,
                totalPoints: result.totalPoints,
                items: result.items,
              } : prev);
            } catch (e: any) {
              Alert.alert("შეცდომა", e.message ?? "შეძენა ვერ მოხერხდა");
            } finally {
              setBusy(null);
            }
          },
        },
      ]
    );
  }, [shopData]);

  const handleEquip = useCallback(async (item: ShopItem) => {
    setBusy(item.id);
    try {
      const result = await equipItem(item.id);
      setShopData((prev) => prev ? { ...prev, equippedItems: result.equippedItems } : prev);
      emitProfileUpdate(result.equippedItems);
    } catch (e: any) {
      Alert.alert("შეცდომა", e.message ?? "ჩართვა ვერ მოხერხდა");
    } finally {
      setBusy(null);
    }
  }, [emitProfileUpdate]);

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
        <Text style={styles.title}>მაღაზია</Text>
        <View style={styles.pointsBadge}>
          <Feather name="star" size={14} color={colors.accent} />
          <Text style={styles.pointsText}>{shopData?.totalPoints.toLocaleString() ?? "..."}</Text>
        </View>
      </View>

      {/* Category Tabs */}
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
              <View key={item.id} style={[styles.itemCard, isEquipped && styles.itemCardEquipped]}>
                {/* Preview tap zone */}
                <Pressable
                  onPress={() => setPreviewItem(item)}
                  style={styles.preview}
                >
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
                    onPress={() => handleEquip(item)}
                    disabled={isBusy}
                    style={({ pressed }) => [
                      styles.equipBtn,
                      isEquipped && styles.equipBtnActive,
                      (pressed || isBusy) && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.equipBtnText, isEquipped && styles.equipBtnTextActive]}>
                      {isEquipped ? "გამორთვა" : "ჩართვა"}
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => handleBuy(item)}
                    disabled={isBusy}
                    style={({ pressed }) => [
                      styles.buyBtn,
                      (pressed || isBusy) && styles.pressed,
                    ]}
                  >
                    <Feather name="star" size={14} color="#fff" />
                    <Text style={styles.buyBtnText}>{item.price}</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ── Shop Item Preview Modal ───────────────────────────────────────── */}
      <Modal
        visible={!!previewItem}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewItem(null)}
      >
        <Pressable style={styles.previewModalBackdrop} onPress={() => setPreviewItem(null)}>
          <Pressable style={styles.previewModalCard} onPress={() => {}}>
            {/* Mock profile card */}
            {/* Banner */}
            <View style={[
              styles.previewMockBanner,
              previewItem?.category === "banner" && previewItem.colors
                ? { backgroundColor: previewItem.colors[0] }
                : { backgroundColor: colors.accent + "55" }
            ]}>
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
                    {previewItem?.category === "avatar" ? previewItem.emoji ?? "🧩" : "🧩"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Name + tag */}
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
                  onPress={() => { setPreviewItem(null); handleBuy(previewItem!); }}
                >
                  <Feather name="star" size={14} color="#fff" />
                  <Text style={styles.previewActionBuyText}>{previewItem?.price} შეძენა</Text>
                </Pressable>
              )}
              {previewItem?.owned && (
                <Pressable
                  style={[styles.previewActionBtn, styles.previewActionBuy]}
                  onPress={() => { setPreviewItem(null); handleEquip(previewItem!); }}
                >
                  <Text style={styles.previewActionBuyText}>
                    {shopData?.equippedItems && Object.values(shopData.equippedItems).includes(previewItem.id)
                      ? "გამორთვა" : "ჩართვა"}
                  </Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    backBtn: { alignItems: "center", height: 44, justifyContent: "center", width: 44 },
    title: { color: colors.primaryText, fontSize: 18, fontWeight: "900" },
    pressed: { opacity: 0.65 },
    pointsBadge: {
      alignItems: "center",
      backgroundColor: colors.accent + "20",
      borderColor: colors.accent,
      borderRadius: 20,
      borderWidth: 1.5,
      flexDirection: "row",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    pointsText: { color: colors.accent, fontSize: 14, fontWeight: "900" },
    tabRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    tab: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 20,
      borderWidth: 1,
      flex: 1,
      paddingVertical: 10,
    },
    tabActive: {
      backgroundColor: colors.accent + "1A",
      borderColor: colors.accent,
    },
    tabText: { color: colors.secondaryText, fontSize: 13, fontWeight: "800" },
    tabTextActive: { color: colors.accent },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      padding: 16,
    },
    itemCard: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1.5,
      padding: 14,
      width: "47%",
    },
    itemCardEquipped: {
      borderColor: colors.accent,
      backgroundColor: colors.accent + "0D",
    },
    preview: {
      alignItems: "center",
      justifyContent: "center",
      height: 70,
      width: "100%",
      marginBottom: 8,
    },
    previewEmoji: { fontSize: 48 },
    nameTagPreview: {
      borderRadius: 8,
      borderWidth: 2,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    nameTagText: { fontSize: 16, fontWeight: "900" },
    bannerPreview: {
      borderRadius: 8,
      flexDirection: "row",
      height: 50,
      overflow: "hidden",
      width: "100%",
    },
    bannerStripe: { flex: 1 },
    itemLabel: {
      color: colors.primaryText,
      fontSize: 15,
      fontWeight: "900",
      marginBottom: 2,
      textAlign: "center",
    },
    itemDesc: {
      color: colors.secondaryText,
      fontSize: 11,
      marginBottom: 10,
      textAlign: "center",
    },
    equippedBadge: {
      backgroundColor: colors.accent + "20",
      borderRadius: 8,
      marginBottom: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    equippedText: { color: colors.accent, fontSize: 11, fontWeight: "800" },
    buyBtn: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: 10,
      flexDirection: "row",
      gap: 4,
      paddingHorizontal: 14,
      paddingVertical: 9,
      width: "100%",
      justifyContent: "center",
    },
    buyBtnText: { color: "#fff", fontSize: 15, fontWeight: "900" },
    equipBtn: {
      alignItems: "center",
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderRadius: 10,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 9,
      width: "100%",
    },
    equipBtnActive: {
      backgroundColor: colors.accent + "18",
      borderColor: colors.accent,
    },
    equipBtnText: { color: colors.secondaryText, fontSize: 14, fontWeight: "800", textAlign: "center" },
    equipBtnTextActive: { color: colors.accent },
    previewHint: {
      position: "absolute",
      bottom: 4,
      right: 4,
      backgroundColor: colors.background + "CC",
      borderRadius: 6,
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    previewHintText: { color: colors.secondaryText, fontSize: 9, fontWeight: "800" },
    previewModalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.65)",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    previewModalCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      overflow: "hidden",
      width: "100%",
      maxWidth: 360,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 12,
    },
    previewMockBanner: {
      height: 100,
      width: "100%",
      overflow: "hidden",
      position: "relative",
    },
    previewMockAvatarWrap: {
      position: "absolute",
      bottom: -28,
      left: 20,
    },
    previewMockAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
      borderColor: colors.card,
    },
    previewMockAvatarText: { fontSize: 30 },
    previewMockInfo: {
      marginTop: 36,
      paddingHorizontal: 20,
      paddingBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    previewMockName: {
      color: colors.primaryText,
      fontSize: 18,
      fontWeight: "900",
    },
    previewMockTag: {
      borderWidth: 1.5,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    previewMockTagText: { fontSize: 12, fontWeight: "800" },
    previewItemName: {
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: "900",
      paddingHorizontal: 20,
      marginTop: 4,
    },
    previewItemDesc: {
      color: colors.secondaryText,
      fontSize: 13,
      paddingHorizontal: 20,
      marginTop: 2,
      marginBottom: 20,
    },
    previewModalActions: {
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    previewActionBtn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      paddingVertical: 13,
      flexDirection: "row",
      gap: 6,
    },
    previewActionClose: {
      backgroundColor: colors.button,
      borderColor: colors.border,
      borderWidth: 1,
    },
    previewActionCloseText: { color: colors.primaryText, fontWeight: "800", fontSize: 14 },
    previewActionBuy: { backgroundColor: colors.accent },
    previewActionBuyText: { color: "#fff", fontWeight: "900", fontSize: 14 },
  });
}
