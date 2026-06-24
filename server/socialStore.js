// مخزن الميزات الاجتماعية — يحفظ على القرص في social.json حتى تبقى البيانات بعد
// إعادة تشغيل الخادم. يغطّي أربعة أنظمة تظهر في تبويب «الرسائل»:
//
//  • المحكمة 🏛️  — الزواج والطلاق:
//      - طلب زواج: يُرسل لمستخدم آخر، وبقبوله يصبح الطرفان متزوجَين.
//      - طلاق إجباري (خلع): يفسخ الزواج فوراً من طرف واحد.
//      - طلاق بالتراضي: يُرسل طلب للطرف الآخر، وبقبوله يقع الطلاق.
//  • صديق اللعب 👥 — طلبات الصداقة وقائمة الأصدقاء.
//  • القبيلة 🏅   — إنشاء/الانضمام للقبائل ونقاطها.
//  • اللحظات 🌀   — منشورات اجتماعية قصيرة مع الإعجاب.
//
// كل مستخدم يُعرّف بمعرّفه الثابت (uid) ويُمنح رقماً قصيراً (shortId) من 6 خانات
// يشاركه مع الآخرين ليجدوه (مثل معرّف الغرفة).

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, "social.json");

function cleanUid(uid) {
  return String(uid || "").trim().slice(0, 64);
}
function cleanText(t, max) {
  return String(t || "").replace(/\s+/g, " ").trim().slice(0, max);
}
function rid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// الحالة الافتراضية الفارغة
function emptyState() {
  return {
    users: {},          // uid -> { uid, shortId, name, avatar, partnerUid, partnerSince, clanId }
    seq: { user: 100000, clan: 1000 },
    marriageReqs: [],   // { id, fromUid, toUid, ts }
    divorceReqs: [],    // { id, fromUid, toUid, ts }  (طلاق بالتراضي)
    friendReqs: [],     // { id, fromUid, toUid, ts }
    friends: {},        // uid -> [uid, ...]
    clans: {},          // clanId -> { id, name, emblem, ownerUid, members:[uid], points, createdAt }
    moments: [],        // { id, uid, text, ts, likes:[uid] }
  };
}

let state = emptyState();

function load() {
  if (existsSync(FILE)) {
    try {
      const data = JSON.parse(readFileSync(FILE, "utf8"));
      if (data && typeof data === "object") {
        state = { ...emptyState(), ...data };
        // اضمن وجود الحقول الفرعية بعد ترقيات المخطط
        const def = emptyState();
        for (const k of Object.keys(def)) {
          if (state[k] == null) state[k] = def[k];
        }
        state.seq = { ...def.seq, ...state.seq };
        return;
      }
    } catch {
      /* تالف → ابدأ فارغاً */
    }
  }
  state = emptyState();
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
      console.error("تعذّر حفظ social.json:", e.message);
    }
  }, 200);
}

// ===== المستخدمون =====

// يُولّد رقماً قصيراً فريداً (6 خانات) للمستخدم
function nextShortId() {
  let id;
  const taken = new Set(Object.values(state.users).map((u) => u.shortId));
  do {
    id = String(state.seq.user++);
  } while (taken.has(id));
  return id;
}

// يُسجّل/يحدّث ملف المستخدم (الاسم/الصورة) ويُرجعه. يُنشئه مع رقم قصير إن كان جديداً.
function registerUser(uid, name, avatar) {
  uid = cleanUid(uid);
  if (!uid) return null;
  let u = state.users[uid];
  if (!u) {
    u = {
      uid,
      shortId: nextShortId(),
      name: cleanText(name, 20) || "لاعب",
      avatar: avatar || "🧑🏻",
      partnerUid: null,
      partnerSince: null,
      clanId: null,
    };
    state.users[uid] = u;
  } else {
    if (name) u.name = cleanText(name, 20) || u.name;
    if (avatar) u.avatar = avatar;
  }
  persist();
  return u;
}

function getUser(uid) {
  return state.users[cleanUid(uid)] || null;
}
function getUserByShortId(shortId) {
  shortId = String(shortId || "").trim();
  return Object.values(state.users).find((u) => u.shortId === shortId) || null;
}

// عرض عام مبسّط لمستخدم (آمن للإرسال للواجهة)
function publicUser(uid) {
  const u = getUser(uid);
  if (!u) return null;
  return { uid: u.uid, shortId: u.shortId, name: u.name, avatar: u.avatar };
}

// ===== المحكمة: الزواج =====

function isMarried(uid) {
  const u = getUser(uid);
  return !!(u && u.partnerUid);
}

// يزيل كل طلبات الزواج التي يظهر فيها أيٌّ من الطرفين (بعد زواج أو طلاق)
function dropMarriageReqsInvolving(...uids) {
  const set = new Set(uids);
  state.marriageReqs = state.marriageReqs.filter(
    (r) => !set.has(r.fromUid) && !set.has(r.toUid)
  );
}

// طلب زواج من fromUid إلى toUid
function proposeMarriage(fromUid, toUid) {
  fromUid = cleanUid(fromUid);
  toUid = cleanUid(toUid);
  if (!getUser(fromUid)) return { ok: false, error: "سجّل دخولك أولاً" };
  if (!getUser(toUid)) return { ok: false, error: "هذا المعرّف غير موجود" };
  if (fromUid === toUid) return { ok: false, error: "لا يمكنك الزواج من نفسك 😄" };
  if (isMarried(fromUid)) return { ok: false, error: "أنت متزوّج بالفعل" };
  if (isMarried(toUid)) return { ok: false, error: "هذا الشخص متزوّج بالفعل" };
  // طلب معاكس قائم؟ تزوّجا مباشرة
  const reverse = state.marriageReqs.find((r) => r.fromUid === toUid && r.toUid === fromUid);
  if (reverse) return acceptMarriage(fromUid, reverse.id);
  if (state.marriageReqs.some((r) => r.fromUid === fromUid && r.toUid === toUid)) {
    return { ok: false, error: "أرسلت الطلب من قبل — بانتظار الرد" };
  }
  const req = { id: rid(), fromUid, toUid, ts: Date.now() };
  state.marriageReqs.push(req);
  persist();
  return { ok: true, req };
}

// قبول طلب زواج (uid هو المستقبِل للطلب)
function acceptMarriage(uid, reqId) {
  uid = cleanUid(uid);
  const req = state.marriageReqs.find((r) => r.id === reqId && r.toUid === uid);
  if (!req) return { ok: false, error: "الطلب غير موجود" };
  if (isMarried(uid)) return { ok: false, error: "أنت متزوّج بالفعل" };
  if (isMarried(req.fromUid)) return { ok: false, error: "الطرف الآخر تزوّج بالفعل" };
  const a = getUser(req.fromUid);
  const b = getUser(uid);
  const since = Date.now();
  a.partnerUid = b.uid;
  a.partnerSince = since;
  b.partnerUid = a.uid;
  b.partnerSince = since;
  // أزل كل طلبات الزواج المتعلّقة بأيٍّ منهما
  dropMarriageReqsInvolving(a.uid, b.uid);
  persist();
  return { ok: true, partner: publicUser(a.uid), since };
}

function rejectMarriage(uid, reqId) {
  uid = cleanUid(uid);
  const before = state.marriageReqs.length;
  state.marriageReqs = state.marriageReqs.filter(
    (r) => !(r.id === reqId && (r.toUid === uid || r.fromUid === uid))
  );
  if (state.marriageReqs.length !== before) persist();
  return { ok: true };
}

// طلاق إجباري (خلع) — يفسخ الزواج فوراً من طرف واحد
function forcedDivorce(uid) {
  uid = cleanUid(uid);
  const me = getUser(uid);
  if (!me || !me.partnerUid) return { ok: false, error: "لست متزوّجاً" };
  const other = getUser(me.partnerUid);
  me.partnerUid = null;
  me.partnerSince = null;
  if (other) {
    other.partnerUid = null;
    other.partnerSince = null;
  }
  // نظّف أي طلبات طلاق بالتراضي معلّقة بينهما
  state.divorceReqs = state.divorceReqs.filter(
    (r) => r.fromUid !== uid && r.toUid !== uid
  );
  persist();
  return { ok: true };
}

// طلاق بالتراضي — يُرسل طلباً للشريك، ولا يقع إلا بقبوله
function proposeDivorce(uid) {
  uid = cleanUid(uid);
  const me = getUser(uid);
  if (!me || !me.partnerUid) return { ok: false, error: "لست متزوّجاً" };
  if (state.divorceReqs.some((r) => r.fromUid === uid && r.toUid === me.partnerUid)) {
    return { ok: false, error: "أرسلت طلب الطلاق — بانتظار رد الشريك" };
  }
  const req = { id: rid(), fromUid: uid, toUid: me.partnerUid, ts: Date.now() };
  state.divorceReqs.push(req);
  persist();
  return { ok: true, req };
}

function acceptDivorce(uid, reqId) {
  uid = cleanUid(uid);
  const req = state.divorceReqs.find((r) => r.id === reqId && r.toUid === uid);
  if (!req) return { ok: false, error: "الطلب غير موجود" };
  return forcedDivorce(uid); // القبول يفسخ الزواج (forcedDivorce ينظّف الطلبات)
}

function rejectDivorce(uid, reqId) {
  uid = cleanUid(uid);
  const before = state.divorceReqs.length;
  state.divorceReqs = state.divorceReqs.filter(
    (r) => !(r.id === reqId && r.toUid === uid)
  );
  if (state.divorceReqs.length !== before) persist();
  return { ok: true };
}

// حالة المحكمة الكاملة للعرض في الواجهة
function marriageStatus(uid) {
  uid = cleanUid(uid);
  const me = getUser(uid);
  const partner = me && me.partnerUid ? publicUser(me.partnerUid) : null;
  const incoming = state.marriageReqs
    .filter((r) => r.toUid === uid)
    .map((r) => ({ id: r.id, ts: r.ts, from: publicUser(r.fromUid) }));
  const outgoing = state.marriageReqs
    .filter((r) => r.fromUid === uid)
    .map((r) => ({ id: r.id, ts: r.ts, to: publicUser(r.toUid) }));
  // طلبات الطلاق بالتراضي الموجّهة لي / الصادرة منّي
  const divorceIncoming = state.divorceReqs
    .filter((r) => r.toUid === uid)
    .map((r) => ({ id: r.id, ts: r.ts, from: publicUser(r.fromUid) }));
  const divorceOutgoing = state.divorceReqs
    .filter((r) => r.fromUid === uid)
    .map((r) => ({ id: r.id, ts: r.ts, to: publicUser(r.toUid) }));
  return {
    me: me ? publicUser(uid) : null,
    partner,
    since: me?.partnerSince || null,
    incoming,
    outgoing,
    divorceIncoming,
    divorceOutgoing,
  };
}

// ===== صديق اللعب: الصداقة =====

function areFriends(a, b) {
  return (state.friends[a] || []).includes(b);
}

function friendRequest(fromUid, toUid) {
  fromUid = cleanUid(fromUid);
  toUid = cleanUid(toUid);
  if (!getUser(fromUid)) return { ok: false, error: "سجّل دخولك أولاً" };
  if (!getUser(toUid)) return { ok: false, error: "هذا المعرّف غير موجود" };
  if (fromUid === toUid) return { ok: false, error: "لا يمكنك إضافة نفسك" };
  if (areFriends(fromUid, toUid)) return { ok: false, error: "أنتما صديقان بالفعل" };
  const reverse = state.friendReqs.find((r) => r.fromUid === toUid && r.toUid === fromUid);
  if (reverse) return acceptFriend(fromUid, reverse.id);
  if (state.friendReqs.some((r) => r.fromUid === fromUid && r.toUid === toUid)) {
    return { ok: false, error: "أرسلت الطلب من قبل" };
  }
  const req = { id: rid(), fromUid, toUid, ts: Date.now() };
  state.friendReqs.push(req);
  persist();
  return { ok: true, req };
}

function acceptFriend(uid, reqId) {
  uid = cleanUid(uid);
  const req = state.friendReqs.find((r) => r.id === reqId && r.toUid === uid);
  if (!req) return { ok: false, error: "الطلب غير موجود" };
  const a = req.fromUid, b = req.toUid;
  state.friends[a] = state.friends[a] || [];
  state.friends[b] = state.friends[b] || [];
  if (!state.friends[a].includes(b)) state.friends[a].push(b);
  if (!state.friends[b].includes(a)) state.friends[b].push(a);
  state.friendReqs = state.friendReqs.filter((r) => r.id !== reqId);
  persist();
  return { ok: true };
}

function rejectFriend(uid, reqId) {
  uid = cleanUid(uid);
  const before = state.friendReqs.length;
  state.friendReqs = state.friendReqs.filter(
    (r) => !(r.id === reqId && (r.toUid === uid || r.fromUid === uid))
  );
  if (state.friendReqs.length !== before) persist();
  return { ok: true };
}

function removeFriend(uid, otherUid) {
  uid = cleanUid(uid);
  otherUid = cleanUid(otherUid);
  state.friends[uid] = (state.friends[uid] || []).filter((u) => u !== otherUid);
  state.friends[otherUid] = (state.friends[otherUid] || []).filter((u) => u !== uid);
  persist();
  return { ok: true };
}

function friendStatus(uid) {
  uid = cleanUid(uid);
  const friends = (state.friends[uid] || []).map(publicUser).filter(Boolean);
  const incoming = state.friendReqs
    .filter((r) => r.toUid === uid)
    .map((r) => ({ id: r.id, ts: r.ts, from: publicUser(r.fromUid) }));
  const outgoing = state.friendReqs
    .filter((r) => r.fromUid === uid)
    .map((r) => ({ id: r.id, ts: r.ts, to: publicUser(r.toUid) }));
  return { me: getUser(uid) ? publicUser(uid) : null, friends, incoming, outgoing };
}

// ===== القبيلة: القبائل =====

function nextClanId() {
  let id;
  do {
    id = String(state.seq.clan++);
  } while (state.clans[id]);
  return id;
}

function clanView(clan, withMembers = false) {
  if (!clan) return null;
  const base = {
    id: clan.id,
    name: clan.name,
    emblem: clan.emblem,
    ownerUid: clan.ownerUid,
    owner: publicUser(clan.ownerUid),
    points: clan.points,
    level: 1 + Math.floor(clan.points / 1000),
    memberCount: clan.members.length,
    createdAt: clan.createdAt,
  };
  if (withMembers) base.members = clan.members.map(publicUser).filter(Boolean);
  return base;
}

function createClan(uid, name, emblem) {
  uid = cleanUid(uid);
  const me = getUser(uid);
  if (!me) return { ok: false, error: "سجّل دخولك أولاً" };
  if (me.clanId) return { ok: false, error: "أنت في قبيلة بالفعل — غادرها أولاً" };
  name = cleanText(name, 24);
  if (name.length < 2) return { ok: false, error: "اسم القبيلة قصير جداً" };
  const id = nextClanId();
  const clan = {
    id,
    name,
    emblem: emblem || "🛡️",
    ownerUid: uid,
    members: [uid],
    points: 0,
    createdAt: Date.now(),
  };
  state.clans[id] = clan;
  me.clanId = id;
  persist();
  return { ok: true, clan: clanView(clan, true) };
}

function joinClan(uid, clanId) {
  uid = cleanUid(uid);
  const me = getUser(uid);
  if (!me) return { ok: false, error: "سجّل دخولك أولاً" };
  if (me.clanId) return { ok: false, error: "أنت في قبيلة بالفعل — غادرها أولاً" };
  const clan = state.clans[String(clanId)];
  if (!clan) return { ok: false, error: "القبيلة غير موجودة" };
  if (!clan.members.includes(uid)) clan.members.push(uid);
  me.clanId = clan.id;
  persist();
  return { ok: true, clan: clanView(clan, true) };
}

function leaveClan(uid) {
  uid = cleanUid(uid);
  const me = getUser(uid);
  if (!me || !me.clanId) return { ok: false, error: "لست في قبيلة" };
  const clan = state.clans[me.clanId];
  me.clanId = null;
  if (clan) {
    clan.members = clan.members.filter((u) => u !== uid);
    // إن غادر المالك: انقل الملكية أو احذف القبيلة الفارغة
    if (clan.ownerUid === uid) {
      if (clan.members.length > 0) clan.ownerUid = clan.members[0];
      else delete state.clans[clan.id];
    }
  }
  persist();
  return { ok: true };
}

function listClans() {
  return Object.values(state.clans)
    .map((c) => clanView(c))
    .sort((a, b) => b.points - a.points || b.memberCount - a.memberCount);
}

function myClan(uid) {
  const me = getUser(uid);
  if (!me || !me.clanId) return null;
  return clanView(state.clans[me.clanId], true);
}

// ===== اللحظات: المنشورات =====

function postMoment(uid, text) {
  uid = cleanUid(uid);
  if (!getUser(uid)) return { ok: false, error: "سجّل دخولك أولاً" };
  text = cleanText(text, 280);
  if (!text) return { ok: false, error: "اكتب شيئاً لنشره" };
  const m = { id: rid(), uid, text, ts: Date.now(), likes: [] };
  state.moments.unshift(m);
  if (state.moments.length > 300) state.moments.length = 300; // سقف بسيط
  persist();
  return { ok: true, moment: momentView(m, uid) };
}

function momentView(m, viewerUid) {
  return {
    id: m.id,
    text: m.text,
    ts: m.ts,
    author: publicUser(m.uid),
    likeCount: m.likes.length,
    likedByMe: viewerUid ? m.likes.includes(viewerUid) : false,
  };
}

function listMoments(viewerUid, limit = 50) {
  return state.moments.slice(0, limit).map((m) => momentView(m, viewerUid));
}

function likeMoment(uid, momentId) {
  uid = cleanUid(uid);
  const m = state.moments.find((x) => x.id === momentId);
  if (!m) return { ok: false, error: "المنشور غير موجود" };
  const i = m.likes.indexOf(uid);
  if (i === -1) m.likes.push(uid);
  else m.likes.splice(i, 1);
  persist();
  return { ok: true, likeCount: m.likes.length, likedByMe: i === -1 };
}

export const socialStore = {
  init: load,
  registerUser,
  getUser,
  getUserByShortId,
  publicUser,
  // المحكمة
  proposeMarriage,
  acceptMarriage,
  rejectMarriage,
  forcedDivorce,
  proposeDivorce,
  acceptDivorce,
  rejectDivorce,
  marriageStatus,
  // الأصدقاء
  friendRequest,
  acceptFriend,
  rejectFriend,
  removeFriend,
  friendStatus,
  // القبائل
  createClan,
  joinClan,
  leaveClan,
  listClans,
  myClan,
  // اللحظات
  postMoment,
  listMoments,
  likeMoment,
};
