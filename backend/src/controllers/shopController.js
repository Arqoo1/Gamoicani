import { asyncHandler } from "../middleware/asyncHandler.js";
import { SHOP_ITEMS, getShopItem } from "../config/shopItems.js";
import { serializeUser } from "../utils/userPresenter.js";
import { createHttpError } from "../utils/validators.js";

export const getShopItems = asyncHandler(async (req, res) => {
  const inventory = (req.user.inventory ?? []).map((i) => i.itemId);
  const equippedItems = req.user.equippedItems?.toObject?.() ?? req.user.equippedItems ?? {};
  res.json({
    data: {
      items: SHOP_ITEMS.map((item) => ({
        ...item,
        owned: inventory.includes(item.id),
        equipped: Object.values(equippedItems).includes(item.id),
      })),
      totalPoints: req.user.totalPoints,
      equippedItems,
    },
  });
});

export const buyShopItem = asyncHandler(async (req, res) => {
  const { itemId } = req.body;
  if (!itemId || typeof itemId !== "string") throw createHttpError(400, "itemId required");

  const shopItem = getShopItem(itemId);
  if (!shopItem) throw createHttpError(404, "Item not found");

  const owned = (req.user.inventory ?? []).some((i) => i.itemId === itemId);
  if (owned) throw createHttpError(400, "Already owned");

  if (req.user.totalPoints < shopItem.price) throw createHttpError(400, "Not enough points");

  req.user.totalPoints -= shopItem.price;
  req.user.inventory = [...(req.user.inventory ?? []), { itemId, purchasedAt: new Date() }];
  await req.user.save();

  const inventory = req.user.inventory.map((i) => i.itemId);
  const equippedItems = req.user.equippedItems?.toObject?.() ?? req.user.equippedItems ?? {};

  res.json({
    data: {
      message: "Purchased successfully",
      totalPoints: req.user.totalPoints,
      items: SHOP_ITEMS.map((item) => ({
        ...item,
        owned: inventory.includes(item.id),
        equipped: Object.values(equippedItems).includes(item.id),
      })),
    },
  });
});

export const equipShopItem = asyncHandler(async (req, res) => {
  const { itemId } = req.body;
  if (!itemId || typeof itemId !== "string") throw createHttpError(400, "itemId required");

  const shopItem = getShopItem(itemId);
  if (!shopItem) throw createHttpError(404, "Item not found");

  const owned = (req.user.inventory ?? []).some((i) => i.itemId === itemId);
  if (!owned) throw createHttpError(400, "Item not owned");

  if (!req.user.equippedItems) req.user.equippedItems = {};

  const categoryKey = shopItem.category; 
  const current = req.user.equippedItems?.toObject?.() ?? { ...req.user.equippedItems };

  if (current[categoryKey] === itemId) {
    current[categoryKey] = null;
  } else {
    current[categoryKey] = itemId;
  }

  req.user.equippedItems = current;
  req.user.markModified("equippedItems");
  await req.user.save();

  res.json({ data: { equippedItems: req.user.equippedItems } });
});

export const unequipShopItem = asyncHandler(async (req, res) => {
  const { category } = req.body;
  if (!category) throw createHttpError(400, "category required");

  const current = req.user.equippedItems?.toObject?.() ?? { ...req.user.equippedItems };
  current[category] = null;
  req.user.equippedItems = current;
  req.user.markModified("equippedItems");
  await req.user.save();

  res.json({ data: { equippedItems: req.user.equippedItems } });
});
