// واجهة REST لدليل الغرف الصوتية + إنشاء غرفة (عامة/خاصة برمز PIN)
import { getUid } from "../wallet.js";
import { SERVER_URL } from "../serverUrl.js";

// خادم Render المجاني "ينام" بعد الخمول ويستغرق ~30-50ث للاستيقاظ في أول طلب،
// لذا نمهل المهلة بسخاء بدل أن يتجمّد الزرّ بلا حدّ، ونعطي رسالة واضحة عند الفشل.
async function fetchWithTimeout(url, opts = {}, ms = 45000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } catch (e) {
    if (e.name === "AbortError") {
      throw new Error("السيرفر يستغرق وقتاً للاستجابة (قد يكون نائماً). حاول مرة أخرى بعد لحظات.");
    }
    throw new Error("تعذّر الاتصال بالسيرفر — تحقّق من اتصالك بالإنترنت.");
  } finally {
    clearTimeout(t);
  }
}

export async function fetchRooms() {
  const r = await fetchWithTimeout(SERVER_URL + "/api/rooms");
  if (!r.ok) throw new Error("تعذّر جلب الغرف");
  return r.json();
}

// cfg: { name, type:"public"|"private", pin, category, country, cover }
export async function createRoom(cfg) {
  const r = await fetchWithTimeout(SERVER_URL + "/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...cfg, uid: getUid() }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "تعذّر إنشاء الغرفة");
  return data; // { ok, roomId }
}

// حذف غرفة أنشأها المستخدم نفسه (يتحقق الخادم من ملكية uid)
export async function deleteRoom(roomId) {
  const qs = new URLSearchParams({ uid: getUid() });
  const r = await fetchWithTimeout(`${SERVER_URL}/api/rooms/${roomId}?${qs}`, { method: "DELETE" });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "تعذّر حذف الغرفة");
  return data;
}
