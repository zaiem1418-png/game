// نداءات REST البسيطة للسيرفر (قائمة الغرف + المحفظة + الهدايا).
import { SERVER_URL } from "./config";

async function jget(path) {
  const res = await fetch(`${SERVER_URL}${path}`);
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

// قائمة الغرف الصوتية (نفس /api/rooms في الويب).
export function fetchRooms(q = "") {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  return jget(`/api/rooms${qs}`);
}

// محفظة المستخدم بالـuid.
export function fetchWallet(uid) {
  return jget(`/api/wallet?uid=${encodeURIComponent(uid)}`);
}

// كتالوج الهدايا.
export function fetchGifts() {
  return jget(`/api/gifts`);
}
