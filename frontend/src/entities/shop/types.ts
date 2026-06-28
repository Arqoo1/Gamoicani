export type ShopItem = {
  id: string;
  category: "avatar" | "nameTag" | "banner";
  label: string;
  price: number;
  description: string;
  emoji?: string;
  color?: string;
  colors?: string[];
  owned: boolean;
  equipped: boolean;
};

export type ShopData = {
  items: ShopItem[];
  totalPoints: number;
  equippedItems: { avatar: string | null; nameTag: string | null; banner: string | null };
};
