// أنظمة الترتيب — أربعة أنظمة مستقلّة لأزرار الترتيبات.
//  A) vip        : ترتيب الغرف حسب قوّة VIP (شاشة الغرف الصوتية).
//  B) popular    : ترتيب الغرف حسب الشعبية/الأعضاء (شاشة الغرف الصوتية).
//  C) players    : ترتيب اللاعبين العالمي حسب النقاط (اللوبي).
//  D) ranked     : مسابقة التصنيف برتب ودرجات تصاعدية (اللوبي).
//
// لا يوجد خادم خاص بلوحات الصدارة هذه، لذا تُولّد البيانات محلياً بمولّد
// عشوائي مُبذّر (deterministic) لتبقى ثابتة بين عمليات إعادة الرسم.

// مولّد عشوائي مُبذّر: نفس البذرة ⇒ نفس التسلسل (mulberry32).
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// بذرة يومية ثابتة (تتغيّر مرّة كل يوم) لتبدو اللوحة "حيّة" دون أن تقفز.
const DAY_SEED = Math.floor(Date.now() / 86_400_000);

const NICKS = [
  "الفهد", "نمر الشمال", "ملكة القلوب", "الصقر الذهبي", "أسطورة", "الغامض",
  "شبح الليل", "قيصر", "الوحش", "نجمة الشرق", "البرق", "العقرب", "الذيب",
  "سلطان", "الفارس", "ريم", "الجوكر", "المحارب", "التنين", "عنكبوت",
  "الإعصار", "حلم", "الملاك", "صقر قريش", "ندى", "الزعيم", "وردة", "الهاوي",
];
const AVAS = ["🦁", "🐯", "🦅", "🐺", "🐉", "🦂", "🐆", "👑", "🌟", "⚡", "🃏", "🛡️", "🦊", "🐍", "🦈", "🔥", "💎", "🌙", "⭐", "🎭"];
const COUNTRIES = ["🇸🇦", "🇪🇬", "🇦🇪", "🇰🇼", "🇮🇶", "🇲🇦", "🇯🇴", "🇩🇿", "🇶🇦", "🇧🇭"];

const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];

// يولّد قائمة لاعبين تنازليّة حسب القيمة، ابتداءً من قمّة عالية.
function genPlayers(seed, count, top, step) {
  const rnd = rng(seed);
  const used = new Set();
  let value = top;
  const rows = [];
  for (let i = 0; i < count; i++) {
    let name = pick(rnd, NICKS);
    let guard = 0;
    while (used.has(name) && guard++ < 40) name = pick(rnd, NICKS) + " " + (1 + Math.floor(rnd() * 99));
    used.add(name);
    value = Math.max(10, Math.round(value - step * (0.6 + rnd() * 0.9)));
    rows.push({
      id: "p" + seed + "_" + i,
      name,
      avatar: pick(rnd, AVAS),
      flag: pick(rnd, COUNTRIES),
      value,
      trend: rnd() < 0.5 ? "up" : rnd() < 0.6 ? "down" : "flat",
    });
  }
  return rows;
}

// رتب مسابقة التصنيف — تصاعدياً.
export const TIERS = [
  { key: "bronze", name: "برونزي", icon: "🥉", color: "#cd7f32", min: 0 },
  { key: "silver", name: "فضّي", icon: "🥈", color: "#c0c0d8", min: 500 },
  { key: "gold", name: "ذهبي", icon: "🥇", color: "#f5c451", min: 1200 },
  { key: "plat", name: "بلاتيني", icon: "💠", color: "#5fd0d0", min: 2200 },
  { key: "diamond", name: "ماسي", icon: "💎", color: "#36c5f0", min: 3600 },
  { key: "legend", name: "أسطوري", icon: "👑", color: "#b06bff", min: 5500 },
];

export function tierOf(points) {
  let t = TIERS[0];
  for (const tier of TIERS) if (points >= tier.min) t = tier;
  return t;
}
export function nextTier(points) {
  return TIERS.find((t) => t.min > points) || null;
}

// نقاط تصنيف "أنا" — تُحفظ محلياً وتُكسَب من الترقية.
const RANKED_KEY = "jackaroo_ranked_lp";
export function getRankedLP() {
  const v = Number(localStorage.getItem(RANKED_KEY));
  return Number.isFinite(v) && v > 0 ? v : 1180; // افتراضي: حافة الذهبي
}
export function addRankedLP(delta) {
  const v = Math.max(0, getRankedLP() + delta);
  localStorage.setItem(RANKED_KEY, String(v));
  return v;
}

// نقاط اللاعب العالمية "أنا".
const PLAYER_KEY = "jackaroo_global_pts";
export function getGlobalPts() {
  const v = Number(localStorage.getItem(PLAYER_KEY));
  return Number.isFinite(v) && v > 0 ? v : 100;
}
export function addGlobalPts(delta) {
  const v = Math.max(0, getGlobalPts() + delta);
  localStorage.setItem(PLAYER_KEY, String(v));
  return v;
}

// إدراج "أنا" في قائمة مرتّبة تنازليّاً حسب القيمة، وإرجاع الرتبة (1-based).
function insertMe(rows, me) {
  const list = [...rows, me].sort((a, b) => b.value - a.value);
  const rank = list.findIndex((r) => r.isMe) + 1;
  return { list, rank };
}

/* ===================== تعريف الأنظمة الأربعة ===================== */

// النظام A — VIP الغرف
export const vipSystem = {
  id: "vip",
  title: "ترتيب VIP",
  emoji: "👑",
  accent: "#f5c451",
  unit: "نقاط VIP",
  blurb: "أقوى الغرف حسب مستوى VIP وإنفاق أعضائها — يتجدّد كل أسبوع.",
  // ctx: { rooms }
  build({ rooms = [] }) {
    const rnd = rng(DAY_SEED ^ 0x5f1);
    // اشتقاق "قوّة VIP" لكل غرفة من مستواها وأعضائها + ضجيج ثابت
    let src = rooms.map((r) => ({
      id: String(r.id),
      name: r.name,
      cover: r.cover,
      flag: r.country,
      vip: Math.min(9, 1 + ((Number(r.id) || 0) % 7) + Math.floor((r.level || 1) / 3)),
      value: Math.round((r.level || 1) * 850 + (r.members || 0) * 120 + 4000 + rnd() * 3000),
    }));
    if (src.length === 0) {
      // لا غرف بعد — اعرض لوحة توضيحيّة
      src = genPlayers(DAY_SEED ^ 0x5f1, 12, 42000, 2600).map((p, i) => ({
        id: p.id, name: "صالة " + p.name, cover: pick(rng(i + 3), ["#7b2ff7", "#f5515f", "#1fd0b0", "#f5c451"]),
        flag: p.flag, vip: 9 - Math.min(8, i), value: p.value,
      }));
    }
    const rows = src.sort((a, b) => b.value - a.value).slice(0, 30);
    return { rows, kind: "room" };
  },
};

// النظام B — شعبية الغرف
export const popularSystem = {
  id: "popular",
  title: "ترتيب الشعبية",
  emoji: "🔥",
  accent: "#ff5f8f",
  unit: "متابع",
  blurb: "الغرف الأكثر تفاعلاً وحضوراً الآن — مباشر حسب عدد الأعضاء.",
  build({ rooms = [] }) {
    const rnd = rng(DAY_SEED ^ 0xb0b);
    let src = rooms.map((r) => ({
      id: String(r.id),
      name: r.name,
      cover: r.cover,
      flag: r.country,
      live: (r.members || 0),
      value: Math.round((r.members || 0) * 1000 + (r.level || 1) * 220 + rnd() * 1500),
      trend: rnd() < 0.6 ? "up" : "flat",
    }));
    if (src.length === 0) {
      src = genPlayers(DAY_SEED ^ 0xb0b, 12, 90000, 5200).map((p, i) => ({
        id: p.id, name: "غرفة " + p.name, cover: pick(rng(i + 9), ["#ff5f8f", "#7b2ff7", "#36c5f0", "#1fd0b0"]),
        flag: p.flag, live: 220 - i * 14, value: p.value, trend: p.trend,
      }));
    }
    const rows = src.sort((a, b) => b.value - a.value).slice(0, 30);
    return { rows, kind: "room" };
  },
};

// النظام C — ترتيب اللاعبين العالمي
export const playersSystem = {
  id: "players",
  title: "الترتيب العالمي",
  emoji: "🏆",
  accent: "#36c5f0",
  unit: "نقطة",
  blurb: "ترتيب أفضل اللاعبين حول العالم حسب مجموع النقاط.",
  // ctx: { name, avatar }
  build({ name = "أنا", avatar = "🧑🏻" }) {
    const rows = genPlayers(DAY_SEED ^ 0xc0c, 40, 98000, 2300);
    const me = { id: "me", name: name + " (أنت)", avatar, value: getGlobalPts(), isMe: true, flag: "🇸🇦" };
    const { list, rank } = insertMe(rows, me);
    return { rows: list.slice(0, 50), kind: "player", me: { ...me, rank } };
  },
};

// النظام D — مسابقة التصنيف (رتب ودرجات)
export const rankedSystem = {
  id: "ranked",
  title: "مسابقة التصنيف",
  emoji: "⭐",
  accent: "#b06bff",
  unit: "تصنيف",
  blurb: "تنافس داخل درجتك واصعد الرتب من البرونزي حتى الأسطوري.",
  tiers: TIERS,
  build({ name = "أنا", avatar = "🧑🏻" }) {
    const lp = getRankedLP();
    const tier = tierOf(lp);
    // منافسو نفس الدرجة: قيم قريبة من قيمتي
    const next = nextTier(lp);
    const ceil = next ? next.min : lp + 800;
    const rnd = rng((DAY_SEED ^ 0xd0d) + tier.min);
    const rows = [];
    for (let i = 0; i < 24; i++) {
      rows.push({
        id: "rk" + i,
        name: pick(rnd, NICKS) + " " + (1 + Math.floor(rnd() * 99)),
        avatar: pick(rnd, AVAS),
        flag: pick(rnd, COUNTRIES),
        value: tier.min + Math.round(rnd() * (ceil - tier.min)),
      });
    }
    const me = { id: "me", name: name + " (أنت)", avatar, value: lp, isMe: true, flag: "🇸🇦" };
    const { list, rank } = insertMe(rows, me);
    return {
      rows: list.slice(0, 40),
      kind: "player",
      me: { ...me, rank },
      tier,
      next,
      progress: next ? (lp - tier.min) / (next.min - tier.min) : 1,
    };
  },
};

export const SYSTEMS = {
  vip: vipSystem,
  popular: popularSystem,
  players: playersSystem,
  ranked: rankedSystem,
};
