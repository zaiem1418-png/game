// محفظة العميل — معرّف ثابت للمستخدم (uid) + نداءات REST للمحفظة/المتجر/المالك.

import { SERVER_URL } from "./serverUrl.js";

// معرّف ثابت يُخزّن محلياً ليُربط بنفس المحفظة في كل مرة (نفس الجهاز/المتصفح)
export function getUid() {
  let uid = localStorage.getItem("jackaroo_uid");
  if (!uid) {
    uid =
      "u_" +
      (crypto?.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36));
    localStorage.setItem("jackaroo_uid", uid);
  }
  return uid;
}

// ملف الحساب المحلي: الاسم/الصورة/الإطار — يُستخدم للدخول التلقائي للغرف الصوتية.
// الإطار يُكتسب من الهدايا أو المهام (لا يُختار يدوياً عند الدخول).
const PROFILE_KEY = "jackaroo_profile";

export function getProfile() {
  try {
    const p = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
    return {
      name: p.name || "Mohammad",
      avatar: p.avatar || "🧑🏻",
      frame: p.frame || null,
    };
  } catch {
    return { name: "Mohammad", avatar: "🧑🏻", frame: null };
  }
}

export function setProfile(patch) {
  const next = { ...getProfile(), ...patch };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  return next;
}

export const getUserName = () => getProfile().name;

async function jget(path) {
  const r = await fetch(SERVER_URL + path);
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "خطأ في الخادم");
  return r.json();
}

async function jpost(path, body) {
  const r = await fetch(SERVER_URL + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "فشل الطلب");
  return data;
}

// يجلب رصيد المستخدم (يُنشئ المحفظة مع مكافأة البداية لو جديد)
export function fetchWallet() {
  return jget(`/api/wallet?uid=${encodeURIComponent(getUid())}`);
}

export function fetchPackages() {
  return jget("/api/store/packages");
}

// شراء باقة بالفيزا — kind: "diamonds" | "coins"
export function purchase({ kind, packageId, card }) {
  return jpost("/api/store/purchase", { uid: getUid(), kind, packageId, card });
}

// تسجيل دخول المالك بكلمة السر
export function ownerLogin(key) {
  return jpost("/api/owner/login", { uid: getUid(), key });
}
