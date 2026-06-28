// الحزم الحصرية 🎁 — باقات قيمة تُشترى بالألماس وتمنح كوينز (وأحياناً ألماس إضافي
// أو عنصراً حصرياً من المتجر). الكتالوج ثابت في الكود. الشراء يُنفَّذ في index.js
// عبر walletStore (خصم الألماس) ثم منح المحتوى.

// grantItem: معرّف عنصر من shopStore (إطار/خاتم) يُمنح مجّاناً مع الباقة (اختياري).
export const PACKAGES = [
  { id: "p_starter", name: "باقة البداية",   emoji: "🎒", priceDiamonds: 50,  grant: { coins: 60000 } },
  { id: "p_value",   name: "الباقة الوفيرة", emoji: "💰", priceDiamonds: 120, grant: { coins: 180000 } },
  { id: "p_fire",    name: "باقة اللهب",     emoji: "🔥", priceDiamonds: 200, grant: { coins: 240000 }, grantItem: "r_fire" },
  { id: "p_royal",   name: "الباقة الملكية", emoji: "👑", priceDiamonds: 400, grant: { coins: 500000, diamonds: 80 }, grantItem: "f_crown" },
  { id: "p_legend",  name: "باقة الأسطورة",  emoji: "🐉", priceDiamonds: 800, grant: { coins: 1200000, diamonds: 200 }, grantItem: "f_dragon" },
];

export function getPackage(id) {
  return PACKAGES.find((p) => p.id === id) || null;
}
