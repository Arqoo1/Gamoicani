import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getShopItems, buyShopItem, equipShopItem, unequipShopItem } from "../controllers/shopController.js";

export const shopRoutes = Router();

shopRoutes.get("/", requireAuth, getShopItems);
shopRoutes.post("/buy", requireAuth, buyShopItem);
shopRoutes.post("/equip", requireAuth, equipShopItem);
shopRoutes.post("/unequip", requireAuth, unequipShopItem);
