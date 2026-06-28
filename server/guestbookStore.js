// دفتر الزوّار 📒 — اشتراك شهري بالألماس يكشف لك قائمة من زار ملفك الشخصي.
//   • السعر 1000 ألماسة لكل شهر (30 يوماً)، ويُراكم على المتبقّي عند التجديد.
//   • بدون اشتراكٍ فعّال لا تظهر قائمة الزوّار (تبقى مقفلة بعلامة على الأيقونة).
//
// الحالة تُحفظ على القرص في guestbook.json حتى تبقى بعد إعادة تشغيل الخادم.

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { socialStore } from "./socialStore.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, "guestbook.json");

const DAY = 86_400_000;

export const GUESTBOOK_PRICE = 1000; // ألماس لكل شهر
export const GUESTBOOK_DAYS = 30;    // مدّة الاشتراك بالأيام

function cleanUid(uid) {
  return String(uid || "").trim().slice(0, 64);
}

// state: members[uid] = { until: ts }
let state = { members: {} };

function load() {
  if (existsSync(FILE)) {
    try {
      const data = JSON.parse(readFileSync(FILE, "utf8"));
      if (data && typeof data === "object") {
        state = { members: data.members || {} };
        return;
      }
    } catch {
      /* تالف → ابدأ فارغاً */
    }
  }
  state = { members: {} };
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
      console.error("تعذّر حفظ guestbook.json:", e.message);
    }
  }, 200);
}

// هل اشتراك دفتر الزوّار فعّال حالياً؟
function isActive(uid) {
  const m = state.members[cleanUid(uid)];
  return !!(m && m.until > Date.now());
}

function status(uid) {
  uid = cleanUid(uid);
  const m = state.members[uid];
  const active = isActive(uid);
  const until = m?.until || 0;
  return {
    active,
    until: active ? until : null,
    daysLeft: active ? Math.max(0, Math.ceil((until - Date.now()) / DAY)) : 0,
    price: GUESTBOOK_PRICE,
    days: GUESTBOOK_DAYS,
  };
}

// اشتراك/تجديد دفتر الزوّار — يُمدّد المدّة (يُراكم على المتبقّي). الخصم يتم في الخادم.
function subscribe(uid) {
  uid = cleanUid(uid);
  if (!socialStore.getUser(uid)) return { ok: false, error: "سجّل دخولك أولاً" };
  const cur = state.members[uid];
  const base = cur && cur.until > Date.now() ? cur.until : Date.now();
  state.members[uid] = { until: base + GUESTBOOK_DAYS * DAY };
  persist();
  return { ok: true, status: status(uid) };
}

export const guestbookStore = {
  init: load,
  isActive,
  status,
  subscribe,
  GUESTBOOK_PRICE,
  GUESTBOOK_DAYS,
};
