// واجهة REST لأنظمة الملف الشخصي: الأي دي المميّز + الزوّار + مساهمة الأغاني.
// كل النداءات تُرفق uid الثابت من المحفظة (مثل social.js).

import { SERVER_URL } from "../serverUrl.js";
import { getUid } from "../wallet.js";

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

// ===== الأي دي المميّز =====
export const vipId = {
  info: () => jget("/api/vip-id"),
  quote: (id) => jpost("/api/vip-id/quote", { id }),
  buy: (id) => jpost("/api/vip-id/buy", { id }),
};

// ===== زوّار الملف =====
export const visitors = {
  list: () => jget("/api/profile/visitors"),
};

// ===== دفتر الزوّار (اشتراك شهري يفتح قائمة الزوّار) =====
export const guestbook = {
  status: () => jget("/api/profile/guestbook"),
  buy: () => jpost("/api/profile/guestbook/buy"),
};

// ===== مساهمة الأغاني =====
export const songs = {
  list: () => jget("/api/songs"),
  add: (title, artist) => jpost("/api/songs", { title, artist }),
  vote: (songId) => jpost("/api/songs/vote", { songId }),
};

// ===== إنجازات اللعب =====
export const achievements = {
  list: () => jget("/api/achievements"),
};

// ===== متجر الإطارات والخواتم =====
export const shop = {
  list: () => jget("/api/shop"),
  buy: (itemId) => jpost("/api/shop/buy", { itemId }),
  equip: (itemId) => jpost("/api/shop/equip", { itemId }),
  unequip: (kind) => jpost("/api/shop/unequip", { kind }),
  gift: (itemId, toShortId) => jpost("/api/shop/gift", { itemId, toShortId }),
};

// ===== نظام VIP =====
export const vip = {
  status: () => jget("/api/vip"),
  subscribe: (planId) => jpost("/api/vip/subscribe", { planId }),
  competition: () => jget("/api/vip/competition"),
  play: () => jpost("/api/vip/competition/play"),
  claim: () => jpost("/api/vip/competition/claim"),
};
