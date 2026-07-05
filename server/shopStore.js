// متجر المقتنيات — الإطارات (frames) والخواتم (rings) التي تُشترى برصيد اللعبة.
//
//  • الكتالوج ثابت في الكود (سهل التعديل): كل عنصر له نوع وسعر وعملة.
//  • مخزون كل مستخدم (ما يملكه + المُجهَّز حالياً) يُحفظ على القرص في shop.json
//    حتى يبقى بعد إعادة تشغيل الخادم.
//  • بعض العناصر حصرية لمشتركي VIP (vipOnly) — يتحقّق الخادم من العضوية قبل الشراء.

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, "shop.json");

// أنواع المقتنيات القابلة للتجهيز (كل نوع خانة تجهيز مستقلّة).
export const SLOTS = ["frame", "ring", "entrance", "bubble"];

// ===== الكتالوج =====
// kind: "frame" (إطار حول الصورة) | "ring" (خاتم بجانب الاسم)
//     | "entrance" (دخولية تُعرض عند الدخول للغرفة) | "bubble" (فقاعة الدردشة)
// currency: "diamonds" | "coins"
// glow: لون الهالة المزخرفة في الواجهة (اختياري)
// grad: تدرّج لوني لخلفية فقاعة الدردشة (لعناصر bubble)
export const SHOP_ITEMS = [
  // ---- الإطارات المزخرفة ----
  { id: "f_leaf",    kind: "frame", name: "إطار الغزال",   emoji: "🦌", price: 60000,  currency: "coins",    glow: "#19e08a" },
  { id: "f_rose",    kind: "frame", name: "إطار الورد",    emoji: "🌹", price: 1500,   currency: "diamonds", glow: "#ff7eb3" },
  { id: "f_ocean",   kind: "frame", name: "إطار المحيط",   emoji: "🌊", price: 2200,   currency: "diamonds", glow: "#3a7bff" },
  { id: "f_flame",   kind: "frame", name: "إطار اللهب",    emoji: "🔥", price: 3000,   currency: "diamonds", glow: "#ff6a00" },
  { id: "f_ice",     kind: "frame", name: "إطار الجليد",   emoji: "❄️", price: 3600,   currency: "diamonds", glow: "#7fd8ff" },
  { id: "f_star",    kind: "frame", name: "إطار النجوم",   emoji: "✨", price: 4800,   currency: "diamonds", glow: "#ffe45e" },
  { id: "f_galaxy",  kind: "frame", name: "إطار المجرّة",  emoji: "🌌", price: 6000,   currency: "diamonds", glow: "#7a5cff" },
  { id: "f_rainbow", kind: "frame", name: "إطار قوس قزح",  emoji: "🌈", price: 8000,   currency: "diamonds", glow: "#ff5cc8" },
  { id: "f_crown",   kind: "frame", name: "إطار التاج",    emoji: "👑", price: 12000,  currency: "diamonds", glow: "#ffd700", vipOnly: true },
  { id: "f_dragon",  kind: "frame", name: "إطار التنّين",  emoji: "🐉", price: 16000,  currency: "diamonds", glow: "#19e08a", vipOnly: true },
  { id: "f_phoenix", kind: "frame", name: "إطار العنقاء",  emoji: "🕊️", price: 20000,  currency: "diamonds", glow: "#ff6a00", vipOnly: true },
  { id: "f_diamond", kind: "frame", name: "إطار الألماس",  emoji: "💎", price: 28000,  currency: "diamonds", glow: "#bff0ff", vipOnly: true },

  // ---- الخواتم المزخرفة ----
  { id: "r_silver",  kind: "ring", name: "خاتم فضّي",            emoji: "💍", price: 80000, currency: "coins",    glow: "#d8e0ec", metal: "silver" },
  { id: "r_gold",    kind: "ring", name: "خاتم ذهبي",           emoji: "💛", price: 150000,currency: "coins",    glow: "#f5c451" },
  { id: "r_rose",    kind: "ring", name: "خاتم وردي",           emoji: "🌸", price: 1800,  currency: "diamonds", glow: "#ff7eb3" },
  { id: "r_ruby",    kind: "ring", name: "خاتم الياقوت",        emoji: "❤️", price: 2500,  currency: "diamonds", glow: "#ff2d55" },
  { id: "r_ice",     kind: "ring", name: "خاتم ثلجي",           emoji: "❄️", price: 3200,  currency: "diamonds", glow: "#7fd8ff", metal: "silver" },
  { id: "r_fire",    kind: "ring", name: "خاتم ناري",           emoji: "🔥", price: 3800,  currency: "diamonds", glow: "#ff6a00" },
  { id: "r_emerald", kind: "ring", name: "خاتم الزمرّد",        emoji: "💚", price: 4500,  currency: "diamonds", glow: "#19e08a" },
  { id: "r_sapphire",kind: "ring", name: "خاتم الياقوت الأزرق", emoji: "💙", price: 5500,  currency: "diamonds", glow: "#3a7bff", metal: "silver" },
  { id: "r_amethyst",kind: "ring", name: "خاتم الجمشت",         emoji: "🔮", price: 6800,  currency: "diamonds", glow: "#b15bff" },
  { id: "r_diamond", kind: "ring", name: "خاتم الألماس",        emoji: "💎", price: 9000,  currency: "diamonds", glow: "#bff0ff", metal: "silver" },
  { id: "r_white_diamond", kind: "ring", name: "خاتم الألماس الأبيض", emoji: "🤍", price: 12000, currency: "diamonds", glow: "#ffffff", metal: "silver" },
  { id: "r_star",    kind: "ring", name: "خاتم النجمة",         emoji: "🌟", price: 15000, currency: "diamonds", glow: "#ffe45e" },
  { id: "r_royal",   kind: "ring", name: "الخاتم الملكي",       emoji: "🔱", price: 18000, currency: "diamonds", glow: "#f5c451", vipOnly: true },
  { id: "r_galaxy",  kind: "ring", name: "خاتم المجرّة",        emoji: "🌌", price: 24000, currency: "diamonds", glow: "#7a5cff", vipOnly: true },
  { id: "r_crown",   kind: "ring", name: "خاتم التاج",          emoji: "👑", price: 30000, currency: "diamonds", glow: "#ffd700", vipOnly: true },

  // ---- الدخوليات (تُعرض عند دخول اللاعب للغرفة) ----
  { id: "e_coins",  kind: "entrance", name: "مطر الذهب",   emoji: "🪙", price: 90000, currency: "coins",    glow: "#f5c451" },
  { id: "e_car",    kind: "entrance", name: "دخول بسيارة", emoji: "🏎️", price: 2500,  currency: "diamonds", glow: "#ff4d4d" },
  { id: "e_wings",  kind: "entrance", name: "أجنحة",       emoji: "🕊️", price: 3200,  currency: "diamonds", glow: "#7fd8ff" },
  { id: "e_fire",   kind: "entrance", name: "دخول ناري",   emoji: "🔥", price: 4200,  currency: "diamonds", glow: "#ff6a00" },
  { id: "e_star",   kind: "entrance", name: "موكب النجوم", emoji: "🌟", price: 6000,  currency: "diamonds", glow: "#ffe45e" },
  { id: "e_crown",  kind: "entrance", name: "موكب ملكي",   emoji: "👑", price: 9000,  currency: "diamonds", glow: "#ffd700", vipOnly: true },
  { id: "e_dragon", kind: "entrance", name: "زحف التنّين", emoji: "🐉", price: 14000, currency: "diamonds", glow: "#19e08a", vipOnly: true },

  // ---- فقاعات الدردشة (خلفية رسائلك في الشات) ----
  { id: "b_green",  kind: "bubble", name: "فقاعة الزمرّد", emoji: "💚", price: 50000, currency: "coins",    glow: "#19e08a", grad: "linear-gradient(135deg,#3ff0a8,#12b56b)" },
  { id: "b_rose",   kind: "bubble", name: "فقاعة وردية",  emoji: "🌸", price: 1200,  currency: "diamonds", glow: "#ff7eb3", grad: "linear-gradient(135deg,#ff9ec7,#ff5ea8)" },
  { id: "b_ocean",  kind: "bubble", name: "فقاعة المحيط", emoji: "🌊", price: 1600,  currency: "diamonds", glow: "#3a7bff", grad: "linear-gradient(135deg,#4f9bff,#2b5cff)" },
  { id: "b_flame",  kind: "bubble", name: "فقاعة اللهب",  emoji: "🔥", price: 2000,  currency: "diamonds", glow: "#ff6a00", grad: "linear-gradient(135deg,#ff8a3d,#ff5722)" },
  { id: "b_gold",   kind: "bubble", name: "فقاعة ذهبية",  emoji: "👑", price: 6000,  currency: "diamonds", glow: "#ffd700", grad: "linear-gradient(135deg,#ffe27a,#f5b301)", vipOnly: true },
  { id: "b_galaxy", kind: "bubble", name: "فقاعة المجرّة", emoji: "🌌", price: 7000,  currency: "diamonds", glow: "#7a5cff", grad: "linear-gradient(135deg,#8f6cff,#5b34d6)", vipOnly: true },
];

export function getItem(itemId) {
  return SHOP_ITEMS.find((x) => x.id === itemId) || null;
}

function cleanUid(uid) {
  return String(uid || "").trim().slice(0, 64);
}

// state.users[uid] = { owned: [itemId], frame: itemId|null, ring: itemId|null }
let state = { users: {} };

function load() {
  if (existsSync(FILE)) {
    try {
      const data = JSON.parse(readFileSync(FILE, "utf8"));
      if (data && typeof data === "object" && data.users) {
        state = { users: data.users };
        return;
      }
    } catch {
      /* تالف → ابدأ فارغاً */
    }
  }
  state = { users: {} };
  persist();
}

let saveTimer = null;
function persist() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      writeFileSync(FILE, JSON.stringify(state, null, 2), "utf8");
    } catch (e) {
      console.error("تعذّر حفظ shop.json:", e.message);
    }
  }, 200);
}

function rec(uid) {
  uid = cleanUid(uid);
  if (!uid) return null;
  if (!state.users[uid]) state.users[uid] = { owned: [] };
  const r = state.users[uid];
  if (!Array.isArray(r.owned)) r.owned = [];
  for (const slot of SLOTS) if (!(slot in r)) r[slot] = null; // خانات التجهيز
  return r;
}

// مخزون المستخدم — يُرجع المُملوك وكل خانات التجهيز
function inventory(uid) {
  const r = rec(uid);
  const inv = { owned: r ? r.owned.slice() : [] };
  for (const slot of SLOTS) inv[slot] = r ? r[slot] : null;
  return inv;
}

function owns(uid, itemId) {
  const r = rec(uid);
  return !!r && r.owned.includes(itemId);
}

// يضيف عنصراً لمخزون المستخدم دون تجهيزه (يُستخدم للإهداء)
function grantOwned(uid, itemId) {
  const r = rec(uid);
  if (!r) return { ok: false, error: "مستخدم غير صالح" };
  const item = getItem(itemId);
  if (!item) return { ok: false, error: "عنصر غير معروف" };
  if (!r.owned.includes(itemId)) r.owned.push(itemId);
  persist();
  return { ok: true, item };
}

// يضيف عنصراً لمخزون المستخدم (بعد خصم الثمن في الخادم) ويُجهّزه تلقائياً
function grant(uid, itemId) {
  const r = rec(uid);
  if (!r) return { ok: false, error: "سجّل دخولك أولاً" };
  const item = getItem(itemId);
  if (!item) return { ok: false, error: "عنصر غير معروف" };
  if (!r.owned.includes(itemId)) r.owned.push(itemId);
  if (SLOTS.includes(item.kind)) r[item.kind] = itemId; // جهّزه فوراً
  persist();
  return { ok: true, item, inventory: inventory(uid) };
}

// يجهّز عنصراً يملكه المستخدم
function equip(uid, itemId) {
  const r = rec(uid);
  if (!r) return { ok: false, error: "سجّل دخولك أولاً" };
  const item = getItem(itemId);
  if (!item) return { ok: false, error: "عنصر غير معروف" };
  if (!r.owned.includes(itemId)) return { ok: false, error: "لا تملك هذا العنصر" };
  if (SLOTS.includes(item.kind)) r[item.kind] = itemId;
  persist();
  return { ok: true, inventory: inventory(uid) };
}

function unequip(uid, kind) {
  const r = rec(uid);
  if (!r) return { ok: false, error: "سجّل دخولك أولاً" };
  if (!SLOTS.includes(kind)) return { ok: false, error: "نوع غير معروف" };
  r[kind] = null;
  persist();
  return { ok: true, inventory: inventory(uid) };
}

// كتالوج معروض للواجهة مع علم الملكية والتجهيز
function catalogFor(uid) {
  const inv = inventory(uid);
  return SHOP_ITEMS.map((it) => ({
    ...it,
    owned: inv.owned.includes(it.id),
    equipped: inv[it.kind] === it.id,
  }));
}

export const shopStore = {
  init: load,
  inventory,
  catalogFor,
  owns,
  grant,
  grantOwned,
  equip,
  unequip,
  getItem,
};
