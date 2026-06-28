import { ShopData, ShopItem } from "@/entities/shop/types";
import { requestJson } from "@/shared/api/client";

export async function fetchShopData(): Promise<ShopData> {
  const response = await requestJson<ShopData>("/shop");
  return response.data;
}

export async function buyItem(itemId: string): Promise<{ message: string; totalPoints: number; items: ShopItem[] }> {
  const response = await requestJson<{ message: string; totalPoints: number; items: ShopItem[] }>("/shop/buy", {
    body: JSON.stringify({ itemId }),
    method: "POST"
  });
  return response.data;
}

export async function equipItem(itemId: string): Promise<{ equippedItems: ShopData["equippedItems"] }> {
  const response = await requestJson<{ equippedItems: ShopData["equippedItems"] }>("/shop/equip", {
    body: JSON.stringify({ itemId }),
    method: "POST"
  });
  return response.data;
}
