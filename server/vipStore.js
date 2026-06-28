// نظام VIP — عضوية مدفوعة بالألماس تمنح:
//   • علامة VIP على الملف الشخصي (شارة ذهبية).
//   • دخول مسابقة VIP الحصريّة (لوحة صدارة أسبوعيّة للمشتركين فقط).
//   • جوائز ألماس قيّمة تُستلَم حسب ترتيبك في نهاية كل أسبوع.
//   • عناصر متجر حصريّة (vipOnly) تُفتح بمجرّد الاشتراك.
//
// الحالة تُحفظ على القرص في vip.json حتى تبقى بعد إعادة تشغيل الخادم.

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { socialStore } from "./socialStore.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, "vip.json");

const DAY = 86_400_000;

// خطط الاشتراك — السعر بالألماس. كلما طالت المدّة كانت القيمة أفضل.
export const VIP_PLANS = [
  { id: "v_week",  name: "VIP أسبوعي",  days: 7,   price: 3000,  tier: "فضّي",  color: "#cdd6e0" },
  { id: "v_month", name: "VIP شهري",    days: 30,  price: 9000,  tier: "ذهبي",  color: "#f5c451", popular: true },
  { id: "v_year",  name: "VIP سنوي",    days: 365, price: 80000, tier: "ملكي",  color: "#b06bff" },
];

export function getPlan(planId) {
  return VIP_PLANS.find((p) => p.id === planId) || null;
}

// جوائز مسابقة VIP الأسبوعيّة (ألماس) حسب المركز
export const VIP_PRIZES = [
  { rank: 1, diamonds: 10000 },
  { rank: 2, diamonds: 6000 },
  { rank: 3, diamonds: 3000 },
  { rank: 4, diamonds: 1500 },
  { rank: 5, diamonds: 1000 },
];
// جائزة مشاركة لكل عضو VIP خارج المراكز الخمسة الأولى
const PARTICIPATION = 300;
const PLAY_COOLDOWN_MS = 8_000;
const MIN_GAIN = 50, MAX_GAIN = 200;

function cleanUid(uid) {
  return String(uid || "").trim().slice(0, 64);
}

// مفتاح الموسم (السنة + رقم الأسبوع ISO) — يتغيّر كل إثنين
function seasonKey(d = new Date()) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round((date - firstThursday) / (7 * 86400000));
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
function seasonEndsAt() {
  const now = new Date();
  const dayNum = (now.getUTCDay() + 6) % 7;
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  end.setUTCDate(end.getUTCDate() + (7 - dayNum));
  return end.getTime();
}

// state:
//   members[uid] = { until: ts, tier }
//   comp = { season, scores: { uid: { points, plays, lastPlay } }, claimed: { uid: true } }
let state = { members: {}, comp: { season: seasonKey(), scores: {}, claimed: {} } };

function load() {
  if (existsSync(FILE)) {
    try {
      const data = JSON.parse(readFileSync(FILE, "utf8"));
      if (data && typeof data === "object") {
        state = {
          members: data.members || {},
          comp: {
            season: data.comp?.season || seasonKey(),
            scores: data.comp?.scores || {},
            claimed: data.comp?.claimed || {},
          },
        };
        ensureSeason();
        return;
      }
    } catch {
      /* تالف → ابدأ فارغاً */
    }
  }
  state = { members: {}, comp: { season: seasonKey(), scores: {}, claimed: {} } };
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
      console.error("تعذّر حفظ vip.json:", e.message);
    }
  }, 200);
}

// إعادة ضبط مسابقة VIP إن دخلنا أسبوعاً جديداً (تُمحى النقاط والمستلِمون)
function ensureSeason() {
  const k = seasonKey();
  if (state.comp.season !== k) {
    state.comp.season = k;
    state.comp.scores = {};
    state.comp.claimed = {};
    persist();
  }
}

// هل المستخدم مشترك VIP حالياً؟ (لم تنتهِ مدّته)
function isVip(uid) {
  const m = state.members[cleanUid(uid)];
  return !!(m && m.until > Date.now());
}

function status(uid) {
  uid = cleanUid(uid);
  const m = state.members[uid];
  const active = isVip(uid);
  const until = m?.until || 0;
  return {
    vip: active,
    tier: active ? m.tier : null,
    until: active ? until : null,
    daysLeft: active ? Math.max(0, Math.ceil((until - Date.now()) / DAY)) : 0,
    plans: VIP_PLANS,
  };
}

// اشتراك/تجديد VIP — يُمدّد المدّة (يُراكم على المتبقّي). الخصم يتم في الخادم.
function subscribe(uid, planId) {
  uid = cleanUid(uid);
  if (!socialStore.getUser(uid)) return { ok: false, error: "سجّل دخولك أولاً" };
  const plan = getPlan(planId);
  if (!plan) return { ok: false, error: "خطّة غير معروفة" };
  const cur = state.members[uid];
  const base = cur && cur.until > Date.now() ? cur.until : Date.now();
  state.members[uid] = { until: base + plan.days * DAY, tier: plan.tier };
  persist();
  return { ok: true, plan, status: status(uid) };
}

// ===== مسابقة VIP =====

function compRec(uid) {
  ensureSeason();
  uid = cleanUid(uid);
  if (!state.comp.scores[uid]) state.comp.scores[uid] = { points: 0, plays: 0, lastPlay: 0 };
  return state.comp.scores[uid];
}

// جولة مسابقة (VIP فقط) — تكسب نقاطاً مع مهلة بسيطة
function play(uid) {
  uid = cleanUid(uid);
  if (!isVip(uid)) return { ok: false, error: "مسابقة VIP حصريّة للمشتركين" };
  const r = compRec(uid);
  const wait = r.lastPlay + PLAY_COOLDOWN_MS - Date.now();
  if (wait > 0) return { ok: false, error: "انتظر قليلاً قبل الجولة التالية", waitMs: wait };
  const gained = MIN_GAIN + Math.floor(Math.random() * (MAX_GAIN - MIN_GAIN + 1));
  r.points += gained;
  r.plays += 1;
  r.lastPlay = Date.now();
  persist();
  return { ok: true, gained };
}

function leaderboard(limit = 50) {
  ensureSeason();
  return Object.keys(state.comp.scores)
    .filter((uid) => isVip(uid))
    .map((uid) => {
      const pub = socialStore.publicUser(uid);
      const s = state.comp.scores[uid];
      return {
        uid,
        name: pub?.name || "عضو VIP",
        avatar: pub?.avatar || "🧑🏻",
        shortId: pub?.shortId || null,
        points: s.points,
        plays: s.plays,
      };
    })
    .sort((a, b) => b.points - a.points || b.plays - a.plays)
    .slice(0, limit);
}

function prizeForRank(rank) {
  const p = VIP_PRIZES.find((x) => x.rank === rank);
  return p ? p.diamonds : PARTICIPATION;
}

// نظرة عامة على المسابقة لعرضها في الواجهة
function compOverview(uid) {
  ensureSeason();
  uid = cleanUid(uid);
  const board = leaderboard();
  const myIdx = board.findIndex((p) => p.uid === uid);
  const rec = state.comp.scores[uid];
  const claimed = !!state.comp.claimed[uid];
  return {
    season: state.comp.season,
    endsAt: seasonEndsAt(),
    cooldownMs: PLAY_COOLDOWN_MS,
    prizes: VIP_PRIZES,
    participation: PARTICIPATION,
    board,
    me: {
      vip: isVip(uid),
      points: rec?.points || 0,
      plays: rec?.plays || 0,
      rank: myIdx >= 0 ? myIdx + 1 : null,
      claimed,
      cooldownLeft: rec ? Math.max(0, rec.lastPlay + PLAY_COOLDOWN_MS - Date.now()) : 0,
    },
  };
}

// استلام جائزة الأسبوع — مرّة واحدة لكل عضو في الموسم. القيمة حسب الترتيب الحالي.
// يُرجع عدد الألماس ليُضاف للمحفظة في الخادم.
function claimPrize(uid) {
  ensureSeason();
  uid = cleanUid(uid);
  if (!isVip(uid)) return { ok: false, error: "الجوائز للمشتركين في VIP فقط" };
  const rec = state.comp.scores[uid];
  if (!rec || rec.plays === 0) return { ok: false, error: "العب جولة واحدة على الأقل أولاً" };
  if (state.comp.claimed[uid]) return { ok: false, error: "استلمت جائزة هذا الأسبوع — عُد الأسبوع القادم" };
  const board = leaderboard();
  const rank = board.findIndex((p) => p.uid === uid) + 1;
  const diamonds = prizeForRank(rank);
  state.comp.claimed[uid] = true;
  persist();
  return { ok: true, diamonds, rank };
}

export const vipStore = {
  init: load,
  isVip,
  status,
  subscribe,
  play,
  compOverview,
  claimPrize,
  VIP_PLANS,
};
