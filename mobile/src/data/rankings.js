// أنظمة الترتيب (اللاعبون + مسابقة التصنيف) — منقولة من client/src/lobby/rankings.js
// مع استبدال localStorage بذاكرة داخلية (لا حفظ دائم على الموبايل حالياً).

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
const DAY_SEED = Math.floor(Date.now() / 86_400_000);
const NICKS = ["الفهد", "نمر الشمال", "ملكة القلوب", "الصقر الذهبي", "أسطورة", "الغامض", "شبح الليل", "قيصر", "الوحش", "نجمة الشرق", "البرق", "العقرب", "الذيب", "سلطان", "الفارس", "ريم", "الجوكر", "المحارب", "التنين", "عنكبوت", "الإعصار", "حلم", "الملاك", "صقر قريش", "ندى", "الزعيم", "وردة", "الهاوي"];
const AVAS = ["🦁", "🐯", "🦅", "🐺", "🐉", "🦂", "🐆", "👑", "🌟", "⚡", "🃏", "🛡️", "🦊", "🐍", "🦈", "🔥", "💎", "🌙", "⭐", "🎭"];
const COUNTRIES = ["🇸🇦", "🇪🇬", "🇦🇪", "🇰🇼", "🇮🇶", "🇲🇦", "🇯🇴", "🇩🇿", "🇶🇦", "🇧🇭"];
const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];

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
    rows.push({ id: "p" + seed + "_" + i, name, avatar: pick(rnd, AVAS), flag: pick(rnd, COUNTRIES), value, trend: rnd() < 0.5 ? "up" : rnd() < 0.6 ? "down" : "flat" });
  }
  return rows;
}

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

// نقاط "أنا" في الذاكرة (بدلاً من localStorage)
let _rankedLP = 1180;
let _globalPts = 100;
export const getRankedLP = () => _rankedLP;
export const getGlobalPts = () => _globalPts;

function insertMe(rows, me) {
  const list = [...rows, me].sort((a, b) => b.value - a.value);
  const rank = list.findIndex((r) => r.isMe) + 1;
  return { list, rank };
}

export const playersSystem = {
  id: "players", title: "الترتيب العالمي", emoji: "🏆", accent: "#36c5f0", unit: "نقطة",
  blurb: "ترتيب أفضل اللاعبين حول العالم حسب مجموع النقاط.",
  build({ name = "أنا", avatar = "🧑🏻" }) {
    const rows = genPlayers(DAY_SEED ^ 0xc0c, 40, 98000, 2300);
    const me = { id: "me", name: name + " (أنت)", avatar, value: getGlobalPts(), isMe: true, flag: "🇸🇦" };
    const { list, rank } = insertMe(rows, me);
    return { rows: list.slice(0, 50), kind: "player", me: { ...me, rank } };
  },
};

export const rankedSystem = {
  id: "ranked", title: "مسابقة التصنيف", emoji: "⭐", accent: "#b06bff", unit: "تصنيف",
  blurb: "تنافس داخل درجتك واصعد الرتب من البرونزي حتى الأسطوري.",
  tiers: TIERS,
  build({ name = "أنا", avatar = "🧑🏻" }) {
    const lp = getRankedLP();
    const tier = tierOf(lp);
    const next = nextTier(lp);
    const ceil = next ? next.min : lp + 800;
    const rnd = rng((DAY_SEED ^ 0xd0d) + tier.min);
    const rows = [];
    for (let i = 0; i < 24; i++) {
      rows.push({ id: "rk" + i, name: pick(rnd, NICKS) + " " + (1 + Math.floor(rnd() * 99)), avatar: pick(rnd, AVAS), flag: pick(rnd, COUNTRIES), value: tier.min + Math.round(rnd() * (ceil - tier.min)) });
    }
    const me = { id: "me", name: name + " (أنت)", avatar, value: lp, isMe: true, flag: "🇸🇦" };
    const { list, rank } = insertMe(rows, me);
    return { rows: list.slice(0, 40), kind: "player", me: { ...me, rank }, tier, next, progress: next ? (lp - tier.min) / (next.min - tier.min) : 1 };
  },
};

export const SYSTEMS = { players: playersSystem, ranked: rankedSystem };
