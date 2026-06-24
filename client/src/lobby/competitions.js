// واجهة REST للمنافسات — تجلب لوحتي صدارة (الأفراد + القبائل) وتخوض المباريات.
// كل النداءات تُرفق uid الثابت من المحفظة. التعريف بالاسم/الصورة يأتي من تسجيل
// الأنظمة الاجتماعية (registerSocial) الذي يُستدعى عند فتح التطبيق.

import { SERVER_URL } from "../serverUrl.js";
import { getUid } from "../wallet.js";

async function jget(path) {
  const sep = path.includes("?") ? "&" : "?";
  const r = await fetch(`${SERVER_URL}${path}${sep}uid=${encodeURIComponent(getUid())}`);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "تعذّر جلب المنافسات");
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

export const competitions = {
  // نظرة كاملة: الموسم + ترتيب الأفراد + ترتيب القبائل + حالتي
  overview: () => jget("/api/competitions"),
  // خوض مباراة — يُرجع { gained, won, overview }
  play: () => jpost("/api/competitions/play"),
};
