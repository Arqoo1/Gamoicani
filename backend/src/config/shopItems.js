export const SHOP_ITEMS = [
  { id: "avatar-fire",    category: "avatar",  label: "ცეცხლი",    emoji: "🔥", price: 100,  description: "ცეცხლოვანი ავატარი" },
  { id: "avatar-crown",   category: "avatar",  label: "გვირგვინი", emoji: "👑", price: 300,  description: "სამეფო ავატარი" },
  { id: "avatar-gem",     category: "avatar",  label: "ძვირფასი",  emoji: "💎", price: 250,  description: "ბრილიანტის ავატარი" },
  { id: "avatar-star",    category: "avatar",  label: "ვარსკვლავი",emoji: "⭐", price: 150,  description: "ვარსკვლავური ავატარი" },
  { id: "avatar-bolt",    category: "avatar",  label: "მეხი",      emoji: "⚡", price: 120,  description: "ელვური ავატარი" },
  { id: "avatar-brain",   category: "avatar",  label: "ჭკუა",      emoji: "🧠", price: 200,  description: "გონებრივი ავატარი" },
  { id: "avatar-trophy",  category: "avatar",  label: "ჯილდო",    emoji: "🏆", price: 350,  description: "ჩემპიონის ავატარი" },
  { id: "avatar-rocket",  category: "avatar",  label: "რაკეტა",   emoji: "🚀", price: 280,  description: "კოსმოსური ავატარი" },

  { id: "tag-gold",       category: "nameTag", label: "ოქრო",      color: "#FFD700", price: 150, description: "ოქროს სახელი" },
  { id: "tag-purple",     category: "nameTag", label: "იასამანი",  color: "#9b5de5", price: 100, description: "იასამნისფერი სახელი" },
  { id: "tag-red",        category: "nameTag", label: "წითელი",    color: "#e63946", price: 80,  description: "წითელი სახელი" },
  { id: "tag-blue",       category: "nameTag", label: "ლურჯი",    color: "#2176ae", price: 80,  description: "ლურჯი სახელი" },
  { id: "tag-orange",     category: "nameTag", label: "ნარინჯი",  color: "#f77f00", price: 90,  description: "ნარინჯისფერი სახელი" },
  { id: "tag-teal",       category: "nameTag", label: "ფირუზი",   color: "#2ec4b6", price: 90,  description: "ფირუზისფერი სახელი" },

  { id: "banner-aurora",  category: "banner",  label: "ავრორა",    colors: ["#0f0c29","#302b63","#24243e"], price: 200, description: "ავრორის ბანერი" },
  { id: "banner-sunset",  category: "banner",  label: "მზის ჩასვლა",colors: ["#f77f00","#e63946","#9b5de5"], price: 250, description: "მზის ჩასვლის ბანერი" },
  { id: "banner-ocean",   category: "banner",  label: "ოკეანე",    colors: ["#0077b6","#00b4d8","#90e0ef"], price: 200, description: "ოკეანის ბანერი" },
  { id: "banner-forest",  category: "banner",  label: "ტყე",       colors: ["#1b4332","#2d6a4f","#74c69d"], price: 180, description: "ტყის ბანერი" },
  { id: "banner-fire",    category: "banner",  label: "ცეცხლი",    colors: ["#6a040f","#d00000","#ffba08"], price: 300, description: "ცეცხლის ბანერი" },
  { id: "banner-galaxy",  category: "banner",  label: "გალაქტიკა", colors: ["#03045e","#7209b7","#f72585"], price: 350, description: "გალაქტიკის ბანერი" },
  { id: "banner-neon",    category: "banner",  label: "ნეონი",      colors: ["#0d0d0d","#39ff14","#00f5ff"], price: 400, description: "ნეონის ბანერი" },
  { id: "banner-candy",   category: "banner",  label: "ტკბილი",    colors: ["#ff6b9d","#c44dff","#45e3ff"], price: 280, description: "ტკბილი ბანერი" },
  { id: "banner-gold",    category: "banner",  label: "ოქრო",      colors: ["#1a0a00","#b8860b","#ffd700"], price: 500, description: "ოქრის ბანერი" },
  { id: "banner-ice",     category: "banner",  label: "ყინული",    colors: ["#e8f4f8","#a8dadc","#457b9d"], price: 220, description: "ყინულის ბანერი" },
];

export function getShopItem(id) {
  return SHOP_ITEMS.find((item) => item.id === id) ?? null;
}
