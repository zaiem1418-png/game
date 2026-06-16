// واجهة REST لدليل الغرف الصوتية + إنشاء غرفة (عامة/خاصة برمز PIN)
import { getUid } from "../wallet.js";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

export async function fetchRooms() {
  const r = await fetch(SERVER_URL + "/api/rooms");
  if (!r.ok) throw new Error("تعذّر جلب الغرف");
  return r.json();
}

// cfg: { name, type:"public"|"private", pin, category, country, cover }
export async function createRoom(cfg) {
  const r = await fetch(SERVER_URL + "/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...cfg, uid: getUid() }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "تعذّر إنشاء الغرفة");
  return data; // { ok, roomId }
}
