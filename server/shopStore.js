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

// ===== الكتالوج =====
// kind: "frame" (إطار حول الصورة) | "ring" (خاتم بجانب الاسم)
// currency: "diamonds" | "coins"
export const SHOP_ITEMS = [
  // ---- الإطارات ----
  { id: "f_leaf",   kind: "frame", name: "إطار الغزال",   emoji: "🦌", price: 1500,  currency: "diamonds" },
  { id: "f_flame",  kind: "frame", name: "إطار اللهب",    emoji: "🔥", price: 3000,  currency: "diamonds" },
  { id: "f_galaxy", kind: "frame", name: "إطار المجرّة",  emoji: "🌌", price: 6000,  currency: "diamonds" },
  { id: "f_crown",  kind: "frame", name: "إطار التاج",    emoji: "👑", price: 12000, currency: "diamonds", vipOnly: true },
  { id: "f_phoenix",kind: "frame", name: "إطار العنقاء",  emoji: "🕊️", price: 20000, currency: "diamonds", vipOnly: true },

  // ---- الخواتم ----
  { id: "r_silver", kind: "ring", name: "خاتم فضّي",     emoji: "💍", price: 80000,  currency: "coins" },
  { id: "r_ruby",   kind: "ring", name: "خاتم الياقوت",  emoji: "❤️", price: 2500,   currency: "diamonds" },
  { id: "r_emerald",kind: "ring", name: "خاتم الزمرّد",  emoji: "💚", price: 4500,   currency: "diamonds" },
  { id: "r_diamond",kind: "ring", name: "خاتم الألماس",  emoji: "💎", price: 9000,   currency: "diamonds" },
  { id: "r_royal",  kind: "ring", name: "الخاتم الملكي", emoji: "🔱", price: 18000,  currency: "diamonds", vipOnly: true },
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
  if (!state.users[uid]) state.users[uid] = { owned: [], frame: null, ring: null };
  return state.users[uid];
}

// مخزون المستخدم — يُرجع المُملوك والمُجهَّز
function inventory(uid) {
  const r = rec(uid);
  if (!r) return { owned: [], frame: null, ring: null };
  return { owned: r.owned.slice(), frame: r.frame, ring: r.ring };
}

function owns(uid, itemId) {
  const r = rec(uid);
  return !!r && r.owned.includes(itemId);
}

// يضيف عنصراً لمخزون المستخدم (بعد خصم الثمن في الخادم) ويُجهّزه تلقائياً
function grant(uid, itemId) {
  const r = rec(uid);
  if (!r) return { ok: false, error: "سجّل دخولك أولاً" };
  const item = getItem(itemId);
  if (!item) return { ok: false, error: "عنصر غير معروف" };
  if (!r.owned.includes(itemId)) r.owned.push(itemId);
  // جهّزه فوراً (إطار/خاتم)
  if (item.kind === "frame") r.frame = itemId;
  else r.ring = itemId;
  persist();
  return { ok: true, item, inventory: inventory(uid) };
}

// يجهّز عنصراً يملكه المستخدم (أو يلغي التجهيز بتمرير null للنوع)
function equip(uid, itemId) {
  const r = rec(uid);
  if (!r) return { ok: false, error: "سجّل دخولك أولاً" };
  const item = getItem(itemId);
  if (!item) return { ok: false, error: "عنصر غير معروف" };
  if (!r.owned.includes(itemId)) return { ok: false, error: "لا تملك هذا العنصر" };
  if (item.kind === "frame") r.frame = itemId;
  else r.ring = itemId;
  persist();
  return { ok: true, inventory: inventory(uid) };
}

function unequip(uid, kind) {
  const r = rec(uid);
  if (!r) return { ok: false, error: "سجّل دخولك أولاً" };
  if (kind === "frame") r.frame = null;
  else if (kind === "ring") r.ring = null;
  else return { ok: false, error: "نوع غير معروف" };
  persist();
  return { ok: true, inventory: inventory(uid) };
}

// كتالوج معروض للواجهة مع علم الملكية
function catalogFor(uid) {
  const inv = inventory(uid);
  return SHOP_ITEMS.map((it) => ({
    ...it,
    owned: inv.owned.includes(it.id),
    equipped: inv.frame === it.id || inv.ring === it.id,
  }));
}

export const shopStore = {
  init: load,
  inventory,
  catalogFor,
  owns,
  grant,
  equip,
  unequip,
};
