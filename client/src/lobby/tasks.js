// واجهة REST للمهام اليومية — تجلب حالة المهام وتستلم المكافآت.
// كل النداءات تُرفق uid الثابت من المحفظة.

import { SERVER_URL } from "../serverUrl.js";
import { getUid } from "../wallet.js";

async function jget(path) {
  const sep = path.includes("?") ? "&" : "?";
  const r = await fetch(`${SERVER_URL}${path}${sep}uid=${encodeURIComponent(getUid())}`);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "تعذّر جلب المهام");
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

export const tasks = {
  // جلب حالة المهام (وتُكمل مهمة تسجيل الدخول اليومي تلقائياً)
  status: () => jget("/api/tasks"),
  // استلام مكافأة مهمة مكتملة — يُرجع { reward, wallet, status }
  claim: (taskId) => jpost("/api/tasks/claim", { taskId }),
};

// بطاقة المجد — مسار مكافآت تراكمي
export const glory = {
  status: () => jget("/api/glory"),
  claim: (level) => jpost("/api/glory/claim", { level }),
};

// الحزم الحصرية — باقات تُشترى بالألماس
export const packages = {
  list: () => jget("/api/packages"),
  buy: (packageId) => jpost("/api/packages/buy", { packageId }),
};
