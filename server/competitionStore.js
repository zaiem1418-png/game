// مخزن المنافسات — لوحتا صدارة موسميّتان (تتجدّدان كل أسبوع):
//
//   • منافسة الأفراد:  ترتيب اللاعبين بنقاط المنافسة التي يجمعونها بخوض المباريات.
//   • منافسة القبائل:  ترتيب القبائل بمجموع نقاط أعضائها (تُجمع من socialStore).
//
// كل لاعب يخوض «مباراة» (زر واحد) فيكسب نقاطاً عشوائية ويُحتسب له فوز/خسارة، مع مهلة
// بسيطة بين المباراة والأخرى. النقاط تُعاد صفراً مع بداية كل موسم (أسبوع). تُحفظ على
// القرص في competitions.json حتى تبقى بعد إعادة تشغيل الخادم.

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { socialStore } from "./socialStore.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, "competitions.json");

const COOLDOWN_MS = 10_000;            // مهلة بين مباراة وأخرى
const MIN_GAIN = 30, MAX_GAIN = 120;   // مدى نقاط المباراة الواحدة

function cleanUid(uid) {
  return String(uid || "").trim().slice(0, 64);
}

// مفتاح الموسم = السنة + رقم الأسبوع (ISO) — يتغيّر كل يوم إثنين
function seasonKey(d = new Date()) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;          // 0 = الإثنين
  date.setUTCDate(date.getUTCDate() - dayNum + 3);    // الخميس من نفس الأسبوع
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round((date - firstThursday) / (7 * 86400000));
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// لحظة انتهاء الموسم الحالي (الإثنين 00:00 UTC القادم)
function seasonEndsAt() {
  const now = new Date();
  const dayNum = (now.getUTCDay() + 6) % 7; // 0 = الإثنين
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  end.setUTCDate(end.getUTCDate() + (7 - dayNum));
  return end.getTime();
}

let state = { season: seasonKey(), users: {} }; // uid -> { points, matches, wins, lastPlay }

function load() {
  if (existsSync(FILE)) {
    try {
      const data = JSON.parse(readFileSync(FILE, "utf8"));
      if (data && typeof data === "object" && data.users) {
        state = { season: data.season || seasonKey(), users: data.users };
        ensureSeason();
        return;
      }
    } catch {
      /* تالف → ابدأ فارغاً */
    }
  }
  state = { season: seasonKey(), users: {} };
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
      console.error("تعذّر حفظ competitions.json:", e.message);
    }
  }, 200);
}

// يُعيد ضبط الموسم إن دخلنا أسبوعاً جديداً (تُمحى كل النقاط)
function ensureSeason() {
  const k = seasonKey();
  if (state.season !== k) {
    state.season = k;
    state.users = {};
    persist();
  }
}

function rec(uid) {
  uid = cleanUid(uid);
  if (!uid) return null;
  ensureSeason();
  if (!state.users[uid]) state.users[uid] = { points: 0, matches: 0, wins: 0, lastPlay: 0 };
  return state.users[uid];
}

// خوض مباراة واحدة — يكسب نقاطاً ويُحتسب فوز/خسارة (بعد مرور المهلة)
function play(uid) {
  uid = cleanUid(uid);
  if (!socialStore.getUser(uid)) return { ok: false, error: "سجّل دخولك أولاً" };
  const r = rec(uid);
  const wait = r.lastPlay + COOLDOWN_MS - Date.now();
  if (wait > 0) return { ok: false, error: "انتظر قليلاً قبل المباراة التالية", waitMs: wait };
  const gained = MIN_GAIN + Math.floor(Math.random() * (MAX_GAIN - MIN_GAIN + 1));
  const won = Math.random() < 0.5;
  r.points += gained;
  r.matches += 1;
  if (won) r.wins += 1;
  r.lastPlay = Date.now();
  persist();
  return { ok: true, gained, won };
}

// عرض عام للاعب (آمن للواجهة) مع نقاطه
function playerView(uid) {
  const v = state.users[uid];
  const pub = socialStore.publicUser(uid);
  return {
    uid,
    name: pub?.name || "لاعب",
    avatar: pub?.avatar || "🧑🏻",
    shortId: pub?.shortId || null,
    points: v?.points || 0,
    wins: v?.wins || 0,
    matches: v?.matches || 0,
  };
}

// ترتيب الأفراد (الأعلى نقاطاً أولاً)
function players(limit = 50) {
  ensureSeason();
  return Object.keys(state.users)
    .map(playerView)
    .sort((a, b) => b.points - a.points || b.wins - a.wins)
    .slice(0, limit);
}

// ترتيب القبائل = مجموع نقاط منافسة أعضائها
function tribes(limit = 50) {
  ensureSeason();
  return socialStore
    .listClansDetailed()
    .map((c) => ({
      id: c.id,
      name: c.name,
      emblem: c.emblem,
      memberCount: c.memberCount,
      points: (c.members || []).reduce((s, m) => s + (state.users[m.uid]?.points || 0), 0),
    }))
    .sort((a, b) => b.points - a.points || b.memberCount - a.memberCount)
    .slice(0, limit);
}

// كل ما تحتاجه الواجهة في نداء واحد
function overview(uid) {
  ensureSeason();
  uid = cleanUid(uid);
  const playersList = players();
  const tribesList = tribes();
  const meRec = state.users[uid];
  const meUser = socialStore.getUser(uid);
  const myClanId = meUser?.clanId || null;
  const myRank = playersList.findIndex((p) => p.uid === uid);
  const myTribeRank = myClanId ? tribesList.findIndex((t) => t.id === myClanId) : -1;
  return {
    season: state.season,
    endsAt: seasonEndsAt(),
    cooldownMs: COOLDOWN_MS,
    players: playersList,
    tribes: tribesList,
    me: {
      registered: !!meUser,
      points: meRec?.points || 0,
      matches: meRec?.matches || 0,
      wins: meRec?.wins || 0,
      rank: myRank >= 0 ? myRank + 1 : null,
      cooldownLeft: meRec ? Math.max(0, meRec.lastPlay + COOLDOWN_MS - Date.now()) : 0,
      clanId: myClanId,
      tribeRank: myTribeRank >= 0 ? myTribeRank + 1 : null,
    },
  };
}

export const competitionStore = {
  init: load,
  play,
  overview,
  COOLDOWN_MS,
};
