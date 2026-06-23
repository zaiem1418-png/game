// مخزن الغرف الصوتية — يحفظ بيانات الغرفة الدائمة على القرص (rooms.json) حتى تبقى
// المستويات/النقاط/المشرفون/الملكية بعد إعادة تشغيل الخادم.
//
// مخطط الغرفة:
// {
//   id,                      // معرّف رقمي للبحث عنها (6 خانات)
//   name,                    // اسم الغرفة المخصّص
//   type: "public"|"private",
//   pin,                     // رمز الدخول للغرف الخاصة (أو null)
//   category, country, cover,
//   ownerUid,                // مالك الغرفة (uid)
//   admins: [uid],           // المشرفون
//   level,                   // مستوى الغرفة (يبدأ 1)
//   points,                  // مجموع نقاط الغرفة (من قيمة الهدايا)
//   createdAt,
// }

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, "rooms.json");

// كل 5000 نقطة يرتفع مستوى الغرفة بمقدار 1 (المستوى يبدأ من 1).
export const POINTS_PER_LEVEL = 5000;

export function levelForPoints(points) {
  return 1 + Math.floor(Math.max(0, points) / POINTS_PER_LEVEL);
}

// عدد المشرفين المسموح به حسب مستوى الغرفة — يزيد مشرفٌ كل مستويين، بسقف 15.
export function maxAdminsForLevel(level) {
  return Math.min(15, 2 + Math.floor(Math.max(1, level) / 2));
}

const ROOM_CATEGORIES = ["الأصدقاء", "جاكارو", "بلوت", "لودو", "القبيلة", "الموسيقى"];

let rooms = new Map(); // id -> meta

function load() {
  if (existsSync(FILE)) {
    try {
      const arr = JSON.parse(readFileSync(FILE, "utf8"));
      if (Array.isArray(arr)) {
        rooms = new Map(arr.map((r) => [r.id, normalize(r)]));
        return;
      }
    } catch {
      /* تالف → ابدأ فارغاً */
    }
  }
  rooms = new Map();
}

function persist() {
  try {
    writeFileSync(FILE, JSON.stringify([...rooms.values()], null, 2), "utf8");
  } catch (e) {
    console.error("تعذّر حفظ rooms.json:", e.message);
  }
}

function normalize(r) {
  const points = Math.max(0, Number(r.points) || 0);
  return {
    id: String(r.id || ""),
    name: String(r.name || "غرفتي").slice(0, 40),
    type: r.type === "private" ? "private" : "public",
    pin: r.type === "private" && r.pin ? String(r.pin).slice(0, 8) : null,
    category: ROOM_CATEGORIES.includes(r.category) ? r.category : "الأصدقاء",
    country: String(r.country || "🌍").slice(0, 8),
    cover: String(r.cover || "#6a2f8f").slice(0, 16),
    ownerUid: String(r.ownerUid || "").slice(0, 64),
    admins: Array.isArray(r.admins) ? r.admins.map((u) => String(u).slice(0, 64)).slice(0, 15) : [],
    level: levelForPoints(points),
    points,
    tag: r.tag || null,
    fakeMembers: Number(r.fakeMembers) || 0,
    createdAt: Number(r.createdAt) || Date.now(),
  };
}

export const roomStore = {
  init: load,
  has: (id) => rooms.has(id),
  get: (id) => rooms.get(id) || null,
  all: () => [...rooms.values()],

  create(meta) {
    const m = normalize({ ...meta, points: 0, admins: [] });
    rooms.set(m.id, m);
    persist();
    return m;
  },

  remove(id) {
    const ok = rooms.delete(id);
    if (ok) persist();
    return ok;
  },

  // يربط الغرفة بمالك (uid) دون المساس بالنقاط/المستوى — تُستخدم لغرفة المالك الرسمية.
  setOwner(id, uid) {
    const m = rooms.get(id);
    if (!m) return null;
    m.ownerUid = String(uid || "").slice(0, 64);
    persist();
    return m;
  },

  // يضيف نقاطاً للغرفة (من قيمة الهدايا) ويعيد حساب المستوى.
  // يعيد { level, points, leveledUp, prevLevel } أو null إن لم توجد الغرفة.
  addPoints(id, amount) {
    const m = rooms.get(id);
    if (!m) return null;
    const prevLevel = m.level;
    m.points = Math.max(0, m.points + (Number(amount) || 0));
    m.level = levelForPoints(m.points);
    persist();
    return { level: m.level, points: m.points, leveledUp: m.level > prevLevel, prevLevel };
  },

  // ترقية عضو لمشرف — يتحقق من السقف المسموح حسب المستوى. يعيد { ok, error?, meta? }.
  addAdmin(id, uid) {
    const m = rooms.get(id);
    if (!m) return { ok: false, error: "الغرفة غير موجودة" };
    uid = String(uid || "").slice(0, 64);
    if (!uid) return { ok: false, error: "uid مطلوب" };
    if (uid === m.ownerUid) return { ok: false, error: "المالك مشرف أصلاً" };
    if (m.admins.includes(uid)) return { ok: true, meta: m };
    if (m.admins.length >= maxAdminsForLevel(m.level)) {
      return { ok: false, error: `الحد الأقصى للمشرفين في هذا المستوى ${maxAdminsForLevel(m.level)}` };
    }
    m.admins.push(uid);
    persist();
    return { ok: true, meta: m };
  },

  removeAdmin(id, uid) {
    const m = rooms.get(id);
    if (!m) return { ok: false, error: "الغرفة غير موجودة" };
    uid = String(uid || "");
    const before = m.admins.length;
    m.admins = m.admins.filter((u) => u !== uid);
    if (m.admins.length !== before) persist();
    return { ok: true, meta: m };
  },

  // معلومات مختصرة للعرض (للدليل)
  publicView(id, liveMembers) {
    const m = rooms.get(id);
    if (!m) return null;
    return {
      id: m.id,
      name: m.name,
      category: m.category,
      country: m.country,
      cover: m.cover,
      tag: m.tag || null,
      members: liveMembers != null ? liveMembers : m.fakeMembers || 0,
      locked: m.type === "private",
      ownerUid: m.ownerUid || null,
      level: m.level,
      points: m.points,
    };
  },
};
