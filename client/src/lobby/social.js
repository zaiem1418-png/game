// واجهة REST للأنظمة الاجتماعية: المحكمة (زواج/طلاق) + الأصدقاء + القبائل + اللحظات.
// كل النداءات تُرفق uid الثابت من المحفظة. الملف الشخصي (الاسم/الصورة) يُسجَّل مرة
// عند فتح التطبيق ليجدك الآخرون برقمك القصير (shortId).

import { SERVER_URL } from "../serverUrl.js";
import { getUid, getProfile } from "../wallet.js";

async function jget(path) {
  const sep = path.includes("?") ? "&" : "?";
  const r = await fetch(`${SERVER_URL}${path}${sep}uid=${encodeURIComponent(getUid())}`);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "تعذّر جلب البيانات");
  return data;
}

async function jpost(path, body = {}) {
  const r = await fetch(SERVER_URL + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid: getUid(), ...body }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "فشل الطلب");
  return data;
}

// يُسجّل ملف المستخدم في الخادم (يُستدعى عند الإقلاع) — يُرجع shortId
let myShortId = null;
export function registerSocial() {
  const p = getProfile();
  return jpost("/api/social/register", { name: p.name, avatar: p.avatar })
    .then((d) => {
      myShortId = d.shortId;
      try { localStorage.setItem("jackaroo_shortid", d.shortId); } catch {}
      return d;
    })
    .catch(() => null);
}

// الرقم القصير المحفوظ محلياً (للعرض الفوري قبل اكتمال التسجيل)
export function getMyShortId() {
  return myShortId || (() => { try { return localStorage.getItem("jackaroo_shortid"); } catch { return null; } })();
}

// ===== المحكمة =====
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

// ===== الأصدقاء =====
export const friends = {
  status: () => jget("/api/social/friends"),
  request: (toId) => jpost("/api/social/friends/request", { toId }),
  accept: (reqId) => jpost("/api/social/friends/accept", { reqId }),
  reject: (reqId) => jpost("/api/social/friends/reject", { reqId }),
  remove: (otherUid) => jpost("/api/social/friends/remove", { otherUid }),
};

// ===== القبائل =====
export const clans = {
  list: () => jget("/api/social/clans"),
  create: (name, emblem) => jpost("/api/social/clans/create", { name, emblem }),
  join: (clanId) => jpost("/api/social/clans/join", { clanId }),
  leave: () => jpost("/api/social/clans/leave"),
};

// ===== اللحظات =====
export const moments = {
  list: () => jget("/api/social/moments"),
  post: (text) => jpost("/api/social/moments", { text }),
  like: (momentId) => jpost("/api/social/moments/like", { momentId }),
};
