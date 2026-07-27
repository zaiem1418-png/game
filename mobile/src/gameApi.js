// واجهة REST موحّدة لأنظمة اللعبة (المهام/VIP/المتجر/المجد/الحزم) —
// تعكس client/src/lobby/{tasks.js,profile.js}. كل النداءات تُرفق uid الثابت.
import { SERVER_URL } from "./config";

// الـuid يُضبط مرّة عند إقلاع التطبيق (App.js) بعد getIdentity.
let _uid = null;
export function setUid(uid) { _uid = uid; }

async function jget(path) {
  const sep = path.includes("?") ? "&" : "?";
  const r = await fetch(`${SERVER_URL}${path}${sep}uid=${encodeURIComponent(_uid || "")}`);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "تعذّر جلب البيانات");
  return data;
}

async function jpost(path, body = {}) {
  const r = await fetch(SERVER_URL + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid: _uid, ...body }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "فشل الطلب");
  return data;
}

// المهام اليومية
export const tasks = {
  status: () => jget("/api/tasks"),
  claim: (taskId) => jpost("/api/tasks/claim", { taskId }),
};

// بطاقة المجد
export const glory = {
  status: () => jget("/api/glory"),
  claim: (level) => jpost("/api/glory/claim", { level }),
};

// الحزم الحصرية
export const packages = {
  list: () => jget("/api/packages"),
  buy: (packageId) => jpost("/api/packages/buy", { packageId }),
};

// متجر الإطارات والخواتم
export const shop = {
  list: () => jget("/api/shop"),
  buy: (itemId) => jpost("/api/shop/buy", { itemId }),
  equip: (itemId) => jpost("/api/shop/equip", { itemId }),
  unequip: (kind) => jpost("/api/shop/unequip", { kind }),
};

// نظام VIP
export const vip = {
  status: () => jget("/api/vip"),
  subscribe: (planId) => jpost("/api/vip/subscribe", { planId }),
  competition: () => jget("/api/vip/competition"),
  play: () => jpost("/api/vip/competition/play"),
  claim: () => jpost("/api/vip/competition/claim"),
};

// إنجازات اللعب
export const achievements = {
  list: () => jget("/api/achievements"),
};

// ===== الأنظمة الاجتماعية (المحكمة/الأصدقاء/اللحظات) =====
let _shortId = null;
export function getMyShortId() { return _shortId; }
export function registerSocial(profile = {}) {
  return jpost("/api/social/register", { name: profile.name, avatar: profile.avatar })
    .then((d) => { _shortId = d.shortId; return d; })
    .catch(() => null);
}

export const friends = {
  status: () => jget("/api/social/friends"),
  request: (toId) => jpost("/api/social/friends/request", { toId }),
  accept: (reqId) => jpost("/api/social/friends/accept", { reqId }),
  reject: (reqId) => jpost("/api/social/friends/reject", { reqId }),
  remove: (otherUid) => jpost("/api/social/friends/remove", { otherUid }),
};

export const moments = {
  list: () => jget("/api/social/moments"),
  post: (text, media) => jpost("/api/social/moments", { text, media }),
  like: (momentId) => jpost("/api/social/moments/like", { momentId }),
};

export const clans = {
  list: () => jget("/api/social/clans"),
  create: (name, emblem) => jpost("/api/social/clans/create", { name, emblem }),
  join: (clanId) => jpost("/api/social/clans/join", { clanId }),
  leave: () => jpost("/api/social/clans/leave"),
};

export const marriage = {
  status: () => jget("/api/social/marriage"),
  propose: (toId) => jpost("/api/social/marriage/propose", { toId }),
  accept: (reqId) => jpost("/api/social/marriage/accept", { reqId }),
  reject: (reqId) => jpost("/api/social/marriage/reject", { reqId }),
  forceDivorce: () => jpost("/api/social/divorce/force"),
  proposeDivorce: () => jpost("/api/social/divorce/propose"),
  acceptDivorce: (reqId) => jpost("/api/social/divorce/accept", { reqId }),
  rejectDivorce: (reqId) => jpost("/api/social/divorce/reject", { reqId }),
};
