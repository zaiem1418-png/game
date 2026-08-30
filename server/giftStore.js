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

// الكتالوج الافتراضي — مستوحى من تطبيقات الغرف (Jackaroo King) + إضافات.
// category: للتبويبات (gift | vip | celeb | member | tribe). كلها هنا "gift".
// ملاحظة: الهدايا السينمائية renderer:"video" مع asset (مسار MP4) — إذا لم يوجد الملف
// يتراجع المحرك تلقائياً إلى scenario المُولّد + مؤثّر synth (يعمل بلا أي ملفات).
// sounds: خريطة أصوات حقيقية لكل حدث داخل السيناريو (اختياري) مع تراجع للـsynth.
const DEFAULT_GIFTS = [
  // ── عادية (رخيصة) ──────────────────────────────────────
  { id: "rose",   name: "وردة",   emoji: "🌹", coins: 5,   rarity: "common", priority: 1, duration: 2600, renderer: "scenario", scenario: "floatUp",    sound: "pop",   volume: 0.5, shake: false, fullscreen: false, category: "gift" },
  { id: "kiss",   name: "قبلة",   emoji: "💋", coins: 30,  rarity: "common", priority: 1, duration: 2800, renderer: "scenario", scenario: "heartBurst", sound: "pop",   volume: 0.5, shake: false, fullscreen: false, category: "gift" },
  { id: "hookah", name: "شيشة",   emoji: "💨", coins: 30,  rarity: "common", priority: 1, duration: 3000, renderer: "scenario", scenario: "smokeRise",  sound: "whoosh", volume: 0.5, shake: false, fullscreen: false, category: "gift" },
  { id: "kafu",   name: "كفو",    emoji: "🏅", coins: 50,  rarity: "rare",   priority: 2, duration: 3200, renderer: "scenario", scenario: "popStars",   sound: "fanfare", volume: 0.6, shake: false, fullscreen: false, category: "gift" },

  // ── نادرة ──────────────────────────────────────────────
  { id: "icecream",  name: "آيس كريم", emoji: "🍦", coins: 120, rarity: "rare", priority: 2, duration: 3000, renderer: "scenario", scenario: "floatUp",   sound: "chime",   volume: 0.6, shake: false, fullscreen: false, category: "gift" },
  { id: "chocolate", name: "شوكولاتة", emoji: "🍫", coins: 120, rarity: "rare", priority: 2, duration: 3000, renderer: "scenario", scenario: "heartBurst", sound: "chime",  volume: 0.6, shake: false, fullscreen: false, category: "gift" },
  { id: "baymax",    name: "بي ماكس",  emoji: "🤍", coins: 150, rarity: "rare", priority: 2, duration: 3400, renderer: "scenario", scenario: "floatUp",   sound: "chime",   volume: 0.6, shake: false, fullscreen: false, category: "gift" },
  { id: "crown",     name: "تاج",      emoji: "👑", coins: 200, rarity: "rare", priority: 2, duration: 4000, renderer: "scenario", asset: null, scenario: "crown", sound: "fanfare", sounds: { fanfare: "/sounds/fanfare.mp3" }, volume: 0.7, shake: false, fullscreen: true, category: "vip" },

  // ── ملحمية (Epic) ──────────────────────────────────────
  { id: "heart",     name: "قلب",         emoji: "❤️", coins: 520,  rarity: "epic", priority: 3, duration: 4200, renderer: "scenario", scenario: "heartBurst", sound: "chime",  volume: 0.7, shake: false, fullscreen: true, category: "gift" },
  { id: "loveletter",name: "رسالة العشاق", emoji: "💌", coins: 1200, rarity: "epic", priority: 3, duration: 4500, renderer: "scenario", scenario: "heartStorm", sound: "chime",  volume: 0.7, shake: false, fullscreen: true, category: "gift" },
  { id: "kissyou",   name: "Kiss You",    emoji: "💋", coins: 1200, rarity: "epic", priority: 3, duration: 4500, renderer: "scenario", scenario: "heartStorm", sound: "chime",  volume: 0.7, shake: false, fullscreen: true, category: "gift" },
  { id: "steak",     name: "شريحة لحم",   emoji: "🥩", coins: 1200, rarity: "epic", priority: 3, duration: 4000, renderer: "scenario", scenario: "popStars",   sound: "pop",    volume: 0.6, shake: false, fullscreen: true, category: "gift" },

  // ── أسطورية (Legendary) — أكبر تأثيرات ──────────────────
  { id: "fireworks",   name: "ألعاب نارية", emoji: "🎆", coins: 2000, rarity: "legendary", priority: 5, duration: 5000, renderer: "video", asset: "https://github.com/zaiem1418-png/game/releases/download/gift-assets-v1/fireworks.mp4", assetAudio: false, scenario: "fireworksShow", sound: "fireworks", sounds: { fireworks: "/sounds/fireworks.mp3" }, volume: 0.85, shake: true, fullscreen: true, category: "gift" },
  { id: "oud",         name: "عود",        emoji: "🪕", coins: 2000, rarity: "legendary", priority: 5, duration: 5000, renderer: "scenario", scenario: "musicNotes",    sound: "fanfare",   volume: 0.8,  shake: false, fullscreen: true, category: "gift" },
  { id: "moneybouquet",name: "باقة المال", emoji: "💐", coins: 2000, rarity: "legendary", priority: 5, duration: 5000, renderer: "scenario", scenario: "moneyRain",     sound: "cash",      volume: 0.8,  shake: false, fullscreen: true, category: "gift" },
  { id: "balloons",    name: "بالونات",    emoji: "🎈", coins: 5200, rarity: "legendary", priority: 5, duration: 5500, renderer: "scenario", scenario: "balloonsRise",  sound: "party",     volume: 0.8,  shake: false, fullscreen: true, category: "gift" },

  // ── أسطورية سينمائية (premium) — تفضّل ملفات MP4 مع تراجع للسيناريو ──
  { id: "rocket",     name: "صاروخ",      emoji: "🚀", coins: 3000,  rarity: "legendary", priority: 6, duration: 7000, renderer: "video", asset: "https://github.com/zaiem1418-png/game/releases/download/gift-assets-v1/rocket.mp4",     assetAudio: false, scenario: "rocket",    sound: "rocket",  sounds: { rocket: "/sounds/rocket.mp3", fireworks: "/sounds/fireworks.mp3", countdown: "/sounds/beep.mp3" }, volume: 0.85, shake: true, fullscreen: true, category: "gift" },
  { id: "plane",      name: "طائرة خاصة", emoji: "✈️", coins: 4000,  rarity: "legendary", priority: 6, duration: 6500, renderer: "video", asset: "https://github.com/zaiem1418-png/game/releases/download/gift-assets-v1/plane.mp4",      assetAudio: false, scenario: "plane",     sound: "jet",     sounds: { jet: "/sounds/jet.mp3" }, volume: 0.8, shake: false, fullscreen: true, category: "gift" },
  { id: "helicopter", name: "هليكوبتر",   emoji: "🚁", coins: 7000,  rarity: "legendary", priority: 7, duration: 6500, renderer: "video", asset: "https://github.com/zaiem1418-png/game/releases/download/gift-assets-v1/helicopter.mp4", assetAudio: false, scenario: "helicopter", sound: "helicopter", sounds: { helicopter: "/sounds/helicopter.mp3" }, volume: 0.9, shake: true, fullscreen: true, category: "celeb" },
  { id: "lion",       name: "أسد",        emoji: "🦁", coins: 6000,  rarity: "legendary", priority: 6, duration: 6000, renderer: "video", asset: "https://github.com/zaiem1418-png/game/releases/download/gift-assets-v1/lion.mp4", assetAudio: false, scenario: "lion",      sound: "roar",    sounds: { roar: "/sounds/lion_roar.mp3", whoosh: "/sounds/whoosh.mp3" }, volume: 0.9, shake: true, fullscreen: true, category: "celeb" },
  { id: "tiger",      name: "نمر",        emoji: "🐅", coins: 6500,  rarity: "legendary", priority: 6, duration: 6000, renderer: "video", asset: "https://github.com/zaiem1418-png/game/releases/download/gift-assets-v1/tiger.mp4",      assetAudio: false, scenario: "lion",      sound: "roar",    sounds: { roar: "/sounds/tiger_roar.mp3", whoosh: "/sounds/whoosh.mp3" }, volume: 0.9, shake: true, fullscreen: true, category: "celeb" },
  { id: "ferrari",    name: "فيراري",     emoji: "🏎️", coins: 9999,  rarity: "legendary", priority: 7, duration: 6500, renderer: "video", asset: "https://github.com/zaiem1418-png/game/releases/download/gift-assets-v1/ferrari.mp4",    assetAudio: false, scenario: "sportscar", sound: "engine",  sounds: { engine: "/sounds/ferrari_engine.mp3" }, volume: 0.9, shake: true, fullscreen: true, category: "celeb" },
  { id: "goldencar",  name: "سيارة ذهبية", emoji: "🚗", coins: 25000, rarity: "legendary", priority: 9, duration: 6500, renderer: "video", asset: "https://github.com/zaiem1418-png/game/releases/download/gift-assets-v1/goldencar.mp4",  assetAudio: false, scenario: "sportscar", sound: "engine",  sounds: { engine: "/sounds/supercar_engine.mp3" }, volume: 0.9, shake: true, fullscreen: true, category: "celeb" },
  { id: "castle",     name: "قصر",        emoji: "🏰", coins: 8000,  rarity: "legendary", priority: 7, duration: 8000, renderer: "video", asset: "https://github.com/zaiem1418-png/game/releases/download/gift-assets-v1/castle.mp4",     assetAudio: false, scenario: "castle",    sound: "build",   sounds: { build: "/sounds/build.mp3" }, volume: 0.85, shake: true, fullscreen: true, category: "vip" },
  { id: "diamond",    name: "ألماسة",     emoji: "💎", coins: 8888,  rarity: "legendary", priority: 7, duration: 7000, renderer: "video", asset: "https://github.com/zaiem1418-png/game/releases/download/gift-assets-v1/diamond.mp4",    assetAudio: false, scenario: "diamond",   sound: "sparkle", sounds: { sparkle: "/sounds/sparkle.mp3" }, volume: 0.85, shake: true, fullscreen: true, category: "vip" },
  { id: "dragon",     name: "تنين",       emoji: "🐉", coins: 12000, rarity: "legendary", priority: 8, duration: 7500, renderer: "video", asset: "https://github.com/zaiem1418-png/game/releases/download/gift-assets-v1/dragon.mp4",     assetAudio: false, scenario: "dragon",    sound: "roar",    sounds: { roar: "/sounds/dragon_roar.mp3" }, volume: 0.95, shake: true, fullscreen: true, category: "celeb" },
  { id: "phoenix",    name: "عنقاء",      emoji: "🦅", coins: 15000, rarity: "legendary", priority: 8, duration: 7500, renderer: "video", asset: "https://github.com/zaiem1418-png/game/releases/download/gift-assets-v1/phoenix.mp4",    assetAudio: false, scenario: "phoenix",   sound: "whoosh",  sounds: { whoosh: "/sounds/phoenix.mp3" }, volume: 0.9, shake: true, fullscreen: true, category: "celeb" },
  { id: "yacht",      name: "يخت فاخر",   emoji: "🛥️", coins: 20000, rarity: "legendary", priority: 9, duration: 8000, renderer: "video", asset: "https://github.com/zaiem1418-png/game/releases/download/gift-assets-v1/yacht.mp4",      assetAudio: false, scenario: "yacht",     sound: "horn",    sounds: { horn: "/sounds/yacht_horn.mp3" }, volume: 0.85, shake: true, fullscreen: true, category: "vip" },
  { id: "whale",      name: "حوت",        emoji: "🐋", coins: 30000, rarity: "legendary", priority: 9, duration: 7000, renderer: "scenario", asset: null,      scenario: "whale",     sound: "whale",   sounds: { whale: "/sounds/whale.mp3" }, volume: 0.9, shake: true, fullscreen: true, category: "vip" },
  { id: "galaxy",     name: "مجرّة",      emoji: "🌌", coins: 50000, rarity: "legendary", priority: 10, duration: 8500, renderer: "video", asset: "https://github.com/zaiem1418-png/game/releases/download/gift-assets-v1/galaxy.mp4",    assetAudio: false, scenario: "galaxy",    sound: "cosmic",  sounds: { cosmic: "/sounds/cosmic.mp3" }, volume: 0.9, shake: true, fullscreen: true, category: "vip" },
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
    // السيناريو يُحفظ دائماً كتراجع مضمون (يعمل حتى لو كان renderer=video/lottie ولم يوجد الملف)
    scenario: g.scenario || "default",
    asset: g.asset || null,
    // false = ملف الفيديو صامت/لقطة واقعية → يُكتم ويُشغَّل الصوت الحقيقي المنفصل بدلاً منه
    assetAudio: g.assetAudio === false ? false : undefined,
    sound: g.sound || null,
    // خريطة أصوات حقيقية لكل حدث داخل السيناريو: { roar: "/sounds/lion.mp3", ... }
    sounds: g.sounds && typeof g.sounds === "object" ? g.sounds : null,
    volume: Math.max(0, Math.min(1, g.volume == null ? 0.7 : Number(g.volume))),
    shake: !!g.shake,
    fullscreen: g.fullscreen == null ? true : !!g.fullscreen,
    loopAsset: !!g.loopAsset,
    category: ["gift", "vip", "celeb", "member", "tribe"].includes(g.category) ? g.category : "gift",
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
