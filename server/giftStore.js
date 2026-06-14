// مخزن الهدايا — data-driven حتى يمكن إضافة هدايا جديدة من لوحة الإدارة دون تعديل الكود.
// يُحفظ على القرص في gifts.json ويُحمَّل عند الإقلاع. أي تعديل (إضافة/تحرير/حذف) يُحفظ فوراً.

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, "gifts.json");

/**
 * مخطط الهدية:
 * {
 *   id, name, emoji, coins,
 *   rarity: "common" | "rare" | "epic" | "legendary",
 *   priority: number,        // الأعلى يتجاوز في الطابور
 *   duration: ms,            // مدة عرض الأنيميشن
 *   renderer: "scenario" | "lottie" | "rive" | "video" | "gif",
 *   scenario: string|null,   // اسم سيناريو مدمج (لـ renderer=scenario)
 *   asset: url|null,         // رابط lottie/rive/mp4/webm/gif
 *   sound: string|null,      // معرّف صوت مدمج أو رابط mp3
 *   volume: 0..1,
 *   shake: bool,             // اهتزاز خفيف للشاشة
 *   fullscreen: bool,
 *   loopAsset: bool,         // تكرار الفيديو/الـrive داخل المدة
 * }
 */

// الكتالوج الافتراضي — يشمل أمثلة المستخدم + هدايا إضافية كثيرة.
const DEFAULT_GIFTS = [
  // ── عادية ──────────────────────────────────────────────
  { id: "rose",   name: "وردة",   emoji: "🌹", coins: 1,   rarity: "common", priority: 1, duration: 2600, renderer: "scenario", scenario: "floatUp", sound: "pop",    volume: 0.5, shake: false, fullscreen: false },
  { id: "heart",  name: "قلب",    emoji: "❤️", coins: 5,   rarity: "common", priority: 1, duration: 3000, renderer: "scenario", scenario: "heartBurst", sound: "chime", volume: 0.6, shake: false, fullscreen: false },
  { id: "kiss",   name: "قبلة",   emoji: "💋", coins: 8,   rarity: "common", priority: 1, duration: 2800, renderer: "scenario", scenario: "floatUp", sound: "pop", volume: 0.5, shake: false, fullscreen: false },
  { id: "clap",   name: "تصفيق",  emoji: "👏", coins: 10,  rarity: "common", priority: 1, duration: 2600, renderer: "scenario", scenario: "popStars", sound: "pop", volume: 0.5, shake: false, fullscreen: false },
  { id: "beer",   name: "نخب",    emoji: "🍻", coins: 12,  rarity: "common", priority: 1, duration: 2800, renderer: "scenario", scenario: "popStars", sound: "chime", volume: 0.5, shake: false, fullscreen: false },

  // ── نادرة ──────────────────────────────────────────────
  { id: "crown",  name: "تاج",      emoji: "👑", coins: 50,  rarity: "rare", priority: 2, duration: 4000, renderer: "scenario", scenario: "crown",     sound: "fanfare", volume: 0.7, shake: false, fullscreen: true },
  { id: "ring",   name: "خاتم",     emoji: "💍", coins: 80,  rarity: "rare", priority: 2, duration: 4200, renderer: "scenario", scenario: "diamond",   sound: "sparkle", volume: 0.7, shake: false, fullscreen: true },
  { id: "fireworks", name: "ألعاب نارية", emoji: "🎆", coins: 120, rarity: "rare", priority: 2, duration: 4500, renderer: "scenario", scenario: "fireworksShow", sound: "fireworks", volume: 0.8, shake: true, fullscreen: true },
  { id: "moneyrain", name: "مطر نقود", emoji: "💸", coins: 150, rarity: "rare", priority: 2, duration: 4500, renderer: "scenario", scenario: "moneyRain", sound: "cash", volume: 0.7, shake: false, fullscreen: true },

  // ── ملحمية (Epic) ──────────────────────────────────────
  { id: "rocket", name: "صاروخ",        emoji: "🚀", coins: 200,  rarity: "epic", priority: 3, duration: 7000, renderer: "scenario", scenario: "rocket",  sound: "rocket", volume: 0.85, shake: true, fullscreen: true },
  { id: "plane",  name: "طائرة خاصة",   emoji: "✈️", coins: 300,  rarity: "epic", priority: 3, duration: 6500, renderer: "scenario", scenario: "plane",   sound: "jet",    volume: 0.8,  shake: false, fullscreen: true },
  { id: "sportscar", name: "سيارة رياضية", emoji: "🏎️", coins: 500, rarity: "epic", priority: 3, duration: 6500, renderer: "scenario", scenario: "sportscar", sound: "engine", volume: 0.85, shake: true, fullscreen: true },
  { id: "lion",   name: "أسد",          emoji: "🦁", coins: 600,  rarity: "epic", priority: 3, duration: 6000, renderer: "scenario", scenario: "lion",    sound: "roar",   volume: 0.9,  shake: true, fullscreen: true },

  // ── أسطورية (Legendary) — أكبر تأثيرات ──────────────────
  { id: "castle",  name: "قصر",     emoji: "🏰", coins: 1000, rarity: "legendary", priority: 5, duration: 8000, renderer: "scenario", scenario: "castle",  sound: "build",    volume: 0.85, shake: true, fullscreen: true },
  { id: "diamond", name: "ألماسة",  emoji: "💎", coins: 1500, rarity: "legendary", priority: 5, duration: 7000, renderer: "scenario", scenario: "diamond", sound: "sparkle",  volume: 0.85, shake: true, fullscreen: true },
  { id: "dragon",  name: "تنين",    emoji: "🐉", coins: 2000, rarity: "legendary", priority: 6, duration: 7500, renderer: "scenario", scenario: "dragon",  sound: "roar",     volume: 0.95, shake: true, fullscreen: true },
  { id: "phoenix", name: "عنقاء",   emoji: "🦅", coins: 2500, rarity: "legendary", priority: 6, duration: 7500, renderer: "scenario", scenario: "phoenix", sound: "whoosh",   volume: 0.9,  shake: true, fullscreen: true },
  { id: "yacht",   name: "يخت فاخر", emoji: "🛥️", coins: 3000, rarity: "legendary", priority: 6, duration: 8000, renderer: "scenario", scenario: "yacht",   sound: "horn",     volume: 0.85, shake: true, fullscreen: true },
  { id: "galaxy",  name: "مجرّة",   emoji: "🌌", coins: 5000, rarity: "legendary", priority: 7, duration: 8500, renderer: "scenario", scenario: "galaxy",  sound: "cosmic",   volume: 0.9,  shake: true, fullscreen: true },
];

let gifts = [];

function load() {
  if (existsSync(FILE)) {
    try {
      gifts = JSON.parse(readFileSync(FILE, "utf8"));
      if (!Array.isArray(gifts) || gifts.length === 0) throw new Error("empty");
      return;
    } catch {
      /* تالف → أعد البناء من الافتراضي */
    }
  }
  gifts = DEFAULT_GIFTS.map((g) => ({ ...g }));
  persist();
}

function persist() {
  try {
    writeFileSync(FILE, JSON.stringify(gifts, null, 2), "utf8");
  } catch (e) {
    console.error("تعذّر حفظ gifts.json:", e.message);
  }
}

// قيم افتراضية آمنة لأي حقل ناقص (يسهّل الإضافة من لوحة الإدارة)
function normalize(g) {
  return {
    id: String(g.id || "").trim(),
    name: String(g.name || "هدية").slice(0, 40),
    emoji: g.emoji || "🎁",
    coins: Math.max(0, Number(g.coins) || 0),
    rarity: ["common", "rare", "epic", "legendary"].includes(g.rarity) ? g.rarity : "common",
    priority: Math.max(1, Math.min(10, Number(g.priority) || 1)),
    duration: Math.max(1000, Math.min(20000, Number(g.duration) || 3000)),
    renderer: ["scenario", "lottie", "rive", "video", "gif"].includes(g.renderer) ? g.renderer : "scenario",
    scenario: g.scenario || (g.renderer === "scenario" ? "default" : null),
    asset: g.asset || null,
    sound: g.sound || null,
    volume: Math.max(0, Math.min(1, g.volume == null ? 0.7 : Number(g.volume))),
    shake: !!g.shake,
    fullscreen: g.fullscreen == null ? true : !!g.fullscreen,
    loopAsset: !!g.loopAsset,
  };
}

export const giftStore = {
  init: load,
  all: () => gifts.map((g) => ({ ...g })),
  get: (id) => gifts.find((g) => g.id === id) || null,

  upsert(raw) {
    const g = normalize(raw);
    if (!g.id) throw new Error("معرّف الهدية مطلوب");
    const i = gifts.findIndex((x) => x.id === g.id);
    if (i === -1) gifts.push(g);
    else gifts[i] = g;
    persist();
    return g;
  },

  remove(id) {
    const before = gifts.length;
    gifts = gifts.filter((g) => g.id !== id);
    if (gifts.length !== before) persist();
    return gifts.length !== before;
  },

  reset() {
    gifts = DEFAULT_GIFTS.map((g) => ({ ...g }));
    persist();
    return gifts;
  },
};
