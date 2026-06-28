// بطاقة المجد 🏅 — مسار مكافآت تراكمي. يكسب المستخدم "نقاط مجد" من النشاط اليومي
// (تسجيل الدخول + استلام المهام)، وكل مستوى يفتح مكافأة تُستلم يدوياً.
// التقدّم يُحفظ على القرص في glory.json ليبقى بعد إعادة التشغيل.

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, "glory.json");

// مستويات البطاقة: need = نقاط المجد المطلوبة، reward = ما يُمنح عند الاستلام.
export const GLORY_TIERS = [
  { level: 1, need: 20,   reward: { diamonds: 10 } },
  { level: 2, need: 50,   reward: { coins: 5000 } },
  { level: 3, need: 100,  reward: { diamonds: 25 } },
  { level: 4, need: 180,  reward: { coins: 15000 } },
  { level: 5, need: 300,  reward: { diamonds: 50 } },
  { level: 6, need: 500,  reward: { coins: 40000 } },
  { level: 7, need: 800,  reward: { diamonds: 120 } },
  { level: 8, need: 1200, reward: { coins: 100000 } },
];

const TIER_BY_LEVEL = Object.fromEntries(GLORY_TIERS.map((t) => [t.level, t]));

let state = { users: {} }; // uid -> { points, claimed:[levels], loginDay }

function cleanUid(uid) {
  return String(uid || "").trim().slice(0, 64);
}
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function load() {
  if (existsSync(FILE)) {
    try {
      const data = JSON.parse(readFileSync(FILE, "utf8"));
      if (data && typeof data === "object" && data.users) { state = { users: data.users }; return; }
    } catch { /* تالف → ابدأ فارغاً */ }
  }
  state = { users: {} };
  persist();
}

let saveTimer = null;
function persist() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try { writeFileSync(FILE, JSON.stringify(state, null, 2), "utf8"); }
    catch (e) { console.error("تعذّر حفظ glory.json:", e.message); }
  }, 200);
}

function rec(uid) {
  uid = cleanUid(uid);
  if (!uid) return null;
  if (!state.users[uid]) state.users[uid] = { points: 0, claimed: [], loginDay: "" };
  return state.users[uid];
}

// يضيف نقاط مجد للمستخدم
function addPoints(uid, n = 0) {
  const r = rec(uid);
  if (!r) return;
  r.points = Math.max(0, r.points + Math.max(0, Math.floor(n)));
  persist();
}

// مكافأة المجد اليومية لتسجيل الدخول (مرّة واحدة في اليوم)
function dailyLogin(uid) {
  const r = rec(uid);
  if (!r) return;
  const day = today();
  if (r.loginDay !== day) {
    r.loginDay = day;
    r.points += 10;
    persist();
  }
}

function status(uid) {
  const r = rec(uid) || { points: 0, claimed: [] };
  const tiers = GLORY_TIERS.map((t) => {
    const claimed = r.claimed.includes(t.level);
    return {
      level: t.level,
      need: t.need,
      reward: t.reward,
      reached: r.points >= t.need,
      claimed,
      claimable: r.points >= t.need && !claimed,
    };
  });
  return {
    points: r.points,
    nextNeed: GLORY_TIERS.find((t) => r.points < t.need)?.need || null,
    tiers,
    claimable: tiers.filter((t) => t.claimable).length,
  };
}

// استلام مكافأة مستوى مكتمل — لا يلمس الرصيد (المنادي يضيفه عبر walletStore)
function claim(uid, level) {
  const t = TIER_BY_LEVEL[Number(level)];
  if (!t) return { ok: false, error: "مستوى غير معروف" };
  const r = rec(uid);
  if (!r) return { ok: false, error: "سجّل دخولك أولاً" };
  if (r.points < t.need) return { ok: false, error: "لم تبلغ هذا المستوى بعد" };
  if (r.claimed.includes(t.level)) return { ok: false, error: "استلمت هذه المكافأة" };
  r.claimed.push(t.level);
  persist();
  return { ok: true, reward: t.reward };
}

export const gloryStore = {
  init: load,
  GLORY_TIERS,
  addPoints,
  dailyLogin,
  status,
  claim,
};
