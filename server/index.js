// خادم الغرف الصوتية — Socket.IO
// يدير: حالة الغرف، المقاعد، أخذ/ترك المايك، الكتم، الشات، والهدايا.
// الصوت الحقيقي ينتقل عبر LiveKit Cloud (بنية SFU تدعم 10+ أشخاص).
// هذا السيرفر يصدر فقط "توكن الدخول" لـ LiveKit ويدير حالة الغرفة.

import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { AccessToken } from "livekit-server-sdk";
import { giftStore } from "./giftStore.js";
import { walletStore } from "./walletStore.js";
import { socialStore } from "./socialStore.js";
import { profileStore } from "./profileStore.js";
import { vipIdPrice, vipIdTier, vipIdSuggestions } from "./vipId.js";
import { taskStore } from "./taskStore.js";
import { competitionStore } from "./competitionStore.js";
import { shopStore } from "./shopStore.js";
import { vipStore } from "./vipStore.js";
import { guestbookStore } from "./guestbookStore.js";
import { gloryStore } from "./gloryStore.js";
import { PACKAGES, getPackage } from "./packagesStore.js";
import {
  roomStore,
  maxAdminsForLevel,
  pointsToNextLevel,
  totalPointsForLevel,
  GEMS_PER_POINT,
} from "./roomStore.js";
import { storeCatalog, resolvePackage } from "./storeCatalog.js";
import { processPayment } from "./payment.js";
import { attachGames } from "./games/tables.js";

const PORT = process.env.PORT || 3001;
const SEAT_COUNT = 12; // عدد المقاعد في كل غرفة
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "admin123"; // غيّره في الإنتاج
// كلمة سر مالك اللعبة — من يدخلها يحصل على رصيد لانهائي + ملكية الغرفة الرسمية.
// تُضبط سرّاً عبر متغير البيئة OWNER_KEY فقط (لا قيمة افتراضية في الكود).
// إن لم تُضبط، يُعطَّل دخول المالك بالكامل.
const OWNER_KEY = process.env.OWNER_KEY || "";

// غرفة مالك اللعبة الرسمية — أي دي مميز لا مثيل له: كله أصفار. الغرف العادية تبدأ
// دائماً من 100000 فأعلى، فهذا المعرّف لا يتولّد عشوائياً أبداً ويبقى فريداً.
const OWNER_ROOM_ID = "000000";
const LEGACY_OWNER_ROOM_IDS = ["1000000"]; // معرّفات قديمة تُنظَّف عند الإقلاع

// تكلفة فتح غرفة دردشة جديدة (ألماس) — تُخصم من المنشئ. المالك معفى (رصيد لانهائي).
const ROOM_CREATE_COST = 5000;

// عتبة عملة الهدايا: الهدايا التي سعرها < 100 تُدفع بالكوينز،
// و >= 100 تُدفع بالمجوهرات (الألماس).
const GIFT_GEM_THRESHOLD = 100;

// ===== إعدادات LiveKit (الصوت) — تُقرأ من متغيرات البيئة فقط، لا تُكتب في الكود =====
const LIVEKIT_URL = process.env.LIVEKIT_URL || "";
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "";

giftStore.init();
walletStore.init();
roomStore.init();
socialStore.init();
profileStore.init();
taskStore.init();
competitionStore.init();
shopStore.init();
vipStore.init();
guestbookStore.init();
gloryStore.init();

// أنشئ غرفة المالك الرسمية مرة واحدة إن لم تكن موجودة — أي دي مميز ثابت لا مثيل له.
function ensureOwnerRoom() {
  // نظّف أي غرفة مالك بمعرّف قديم (هجرة المعرّف إلى الأصفار)
  for (const old of LEGACY_OWNER_ROOM_IDS) {
    if (roomStore.has(old)) roomStore.remove(old);
  }
  if (roomStore.has(OWNER_ROOM_ID)) return;
  roomStore.create({
    id: OWNER_ROOM_ID,
    name: "غرفة المالك 👑",
    type: "public",
    pin: null,
    category: "الأصدقاء",
    country: "🌍",
    cover: "#f5c451", // ذهبي مميّز
    tag: "👑 رسمية",
    ownerUid: "", // تُسنَد لمالك اللعبة عند تسجيل دخوله بكلمة السر
    createdAt: Date.now(),
  });
}
ensureOwnerRoom();

const app = express();
app.use(cors());
// محلّل JSON: حدّ صغير افتراضي، وحدّ أكبر لنشر اللحظات (صور/فيديو base64)
const jsonSmall = express.json({ limit: "256kb" });
const jsonMedia = express.json({ limit: "12mb" });
app.use((req, res, next) =>
  req.method === "POST" && req.path === "/api/social/moments"
    ? jsonMedia(req, res, next)
    : jsonSmall(req, res, next)
);
app.get("/health", (_req, res) => res.json({ ok: true }));

// ===== إصدار توكن الدخول لـ LiveKit (الصوت) =====
// العميل يطلب هذا التوكن ثم يتصل بـ LiveKit Cloud مباشرة لنقل الصوت.
// المفاتيح السرية تبقى هنا في الخادم ولا تصل أبداً للواجهة.
app.get("/api/voice-token", async (req, res) => {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
    return res.status(500).json({ error: "الصوت غير مهيّأ على الخادم (LiveKit env مفقود)" });
  }
  const room = String(req.query.room || "130096").slice(0, 64);
  const identity = String(req.query.identity || "").slice(0, 64);
  const name = String(req.query.name || "زائر").slice(0, 40);
  if (!identity) return res.status(400).json({ error: "identity مطلوب" });

  try {
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity,
      name,
      ttl: "2h",
    });
    at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true });
    const token = await at.toJwt();
    res.json({ token, url: LIVEKIT_URL });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== لوحة الإدارة: إدارة الهدايا عبر REST (دون تعديل الكود) =====
function requireAdmin(req, res, next) {
  const token = req.headers["x-admin-token"] || req.query.token;
  if (token !== ADMIN_TOKEN) return res.status(401).json({ error: "غير مصرّح" });
  next();
}

app.get("/api/gifts", (_req, res) => res.json(giftStore.all()));

app.post("/api/admin/gifts", requireAdmin, (req, res) => {
  try {
    const gift = giftStore.upsert(req.body);
    broadcastGiftList();
    res.json(gift);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete("/api/admin/gifts/:id", requireAdmin, (req, res) => {
  const ok = giftStore.remove(req.params.id);
  if (ok) broadcastGiftList();
  res.json({ ok });
});

app.post("/api/admin/gifts-reset", requireAdmin, (_req, res) => {
  giftStore.reset();
  broadcastGiftList();
  res.json(giftStore.all());
});

function broadcastGiftList() {
  io.emit("gift:list", giftStore.all());
}

// ===== المحفظة + المتجر (شحن الألماس/الكوينز بالفيزا) =====

// خريطة uid -> socketId لبثّ تحديث الرصيد لحظياً بعد الشحن
const uidSockets = new Map();

// يبثّ رصيد المستخدم المحدّث لجلسته الحالية (إن كان متصلاً) ويحدّث عضويته بالغرفة
function pushWalletUpdate(uid) {
  const sid = uidSockets.get(uid);
  if (!sid) return;
  const { wallet } = walletStore.ensure(uid);
  io.to(sid).emit("wallet:update", wallet);
  // حدّث الرصيد المعروض داخل الغرفة (المقعد/الملف)
  for (const room of rooms.values()) {
    const m = room.members.get(sid);
    if (m) {
      m.coins = wallet.coins;
      m.diamonds = wallet.diamonds;
      m.isOwner = wallet.owner;
      broadcastRoom(room);
    }
  }
}

// رصيد المستخدم (يُنشئ المحفظة مع مكافأة البداية لو جديد)
app.get("/api/wallet", (req, res) => {
  const uid = String(req.query.uid || "");
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  const { wallet, isNew } = walletStore.ensure(uid);
  res.json({ wallet, isNew, starter: { diamonds: 500, coins: 10000 } });
});

// باقات المتجر
app.get("/api/store/packages", (_req, res) => res.json(storeCatalog));

// شراء باقة بالفيزا — يتحقق من البطاقة ثم يشحن الرصيد
app.post("/api/store/purchase", async (req, res) => {
  const { uid, kind, packageId, card } = req.body || {};
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  const pkg = resolvePackage(kind, packageId);
  if (!pkg) return res.status(400).json({ error: "باقة غير معروفة" });

  const pay = await processPayment({ card, amount: pkg.price });
  if (!pay.ok) return res.status(402).json({ error: pay.error });

  const wallet = walletStore.credit(uid, pkg.credit);
  pushWalletUpdate(uid);
  res.json({ ok: true, txId: pay.txId, wallet, credited: pkg.credit });
});

// تسجيل دخول المالك بكلمة السر — يرفع علم المالك (رصيد لانهائي)
app.post("/api/owner/login", (req, res) => {
  const { uid, key } = req.body || {};
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  if (!OWNER_KEY) {
    return res.status(503).json({ error: "دخول المالك غير مُفعّل (OWNER_KEY غير مضبوط)" });
  }
  if (String(key || "") !== OWNER_KEY) {
    return res.status(401).json({ error: "كلمة سر المالك غير صحيحة" });
  }
  const wallet = walletStore.setOwner(uid, true);
  // اربط الغرفة الرسمية بمالك اللعبة ليملك صلاحياتها كاملةً
  roomStore.setOwner(OWNER_ROOM_ID, uid);
  io.emit("room:list", listRooms());
  pushWalletUpdate(uid);
  res.json({ ok: true, wallet });
});

// ===== دليل الغرف الصوتية + إنشاء غرفة (عامة/خاصة برمز PIN) =====
// يدعم البحث: /api/rooms?q=130096 (بالمعرّف أو الاسم)
app.get("/api/rooms", (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  let list = listRooms();
  if (q) list = list.filter((r) => r.id.includes(q) || r.name.toLowerCase().includes(q));
  res.json(list);
});

// جلب غرفة واحدة بالمعرّف (للبحث المباشر عن غرفة برقمها)
app.get("/api/rooms/:id", (req, res) => {
  const view = roomStore.publicView(String(req.params.id || ""), liveMemberCount(req.params.id));
  if (!view) return res.status(404).json({ error: "الغرفة غير موجودة" });
  res.json(view);
});

app.post("/api/rooms", (req, res) => {
  const { name, type, pin, category, country, cover, uid } = req.body || {};
  const isPrivate = type === "private";
  if (isPrivate && !/^\d{4,8}$/.test(String(pin || ""))) {
    return res.status(400).json({ error: "رمز PIN يجب أن يكون 4 إلى 8 أرقام" });
  }
  // الغرفة الخاصة (PIN) مجانية. الغرفة العامة تكلّف 5000 ألماسة تُخصم من المنشئ
  // (المالك معفى/لانهائي).
  const cleanUidStr = String(uid || "").trim();
  if (!cleanUidStr) {
    return res.status(400).json({ error: "uid مطلوب لفتح غرفة" });
  }
  if (!isPrivate) {
    const { wallet: balance } = walletStore.ensure(cleanUidStr);
    if (!balance.owner && balance.diamonds < ROOM_CREATE_COST) {
      return res.status(402).json({
        error: `تحتاج ${ROOM_CREATE_COST} ألماسة لفتح غرفة عامة`,
        need: ROOM_CREATE_COST,
        have: balance.diamonds,
        kind: "diamonds",
      });
    }
    const paid = walletStore.spend(cleanUidStr, { diamonds: ROOM_CREATE_COST });
    if (!paid) {
      return res.status(402).json({
        error: `تحتاج ${ROOM_CREATE_COST} ألماسة لفتح غرفة عامة`,
        need: ROOM_CREATE_COST,
        kind: "diamonds",
      });
    }
    pushWalletUpdate(cleanUidStr);
  }
  const id = genRoomId();
  roomStore.create({
    id,
    name,
    type: isPrivate ? "private" : "public",
    pin: isPrivate ? pin : null,
    category,
    country,
    cover,
    ownerUid: uid,
    createdAt: Date.now(),
  });
  io.emit("room:list", listRooms());
  const { wallet } = walletStore.ensure(cleanUidStr);
  res.json({ ok: true, roomId: id, wallet, cost: isPrivate ? 0 : ROOM_CREATE_COST });
});

// حذف غرفة — يسمح فقط لمنشئ الغرفة (بنفس uid)
app.delete("/api/rooms/:id", (req, res) => {
  const id = String(req.params.id || "");
  const uid = String(req.query.uid || req.body?.uid || "");
  if (id === OWNER_ROOM_ID) {
    return res.status(403).json({ error: "لا يمكن حذف الغرفة الرسمية" });
  }
  const meta = roomStore.get(id);
  if (!meta) return res.status(404).json({ error: "الغرفة غير موجودة" });
  if (!meta.ownerUid || meta.ownerUid !== uid) {
    return res.status(403).json({ error: "لا تملك صلاحية حذف هذه الغرفة" });
  }
  roomStore.remove(id);
  // أخرِج الأعضاء الحاليين وأغلق الغرفة الحيّة إن وُجدت
  const live = rooms.get(id);
  if (live) {
    io.to(id).emit("room:closed", { roomId: id });
    rooms.delete(id);
  }
  io.emit("room:list", listRooms());
  res.json({ ok: true });
});

// ===== الأنظمة الاجتماعية (المحكمة/الأصدقاء/القبيلة/اللحظات) =====
// كلها عبر REST. تُعرّف المستخدمين بمعرّفهم الثابت (uid) وتمنحهم رقماً قصيراً
// (shortId) يبحث به الآخرون عنهم لإرسال طلبات الزواج/الصداقة.

// تكلفة إنشاء قبيلة (ألماس) — تُخصم من المنشئ (المالك معفى).
const CLAN_CREATE_COST = 2000;

// يقرأ uid من جسم الطلب أو الكويري ويُرجعه منظَّفاً (أو "")
function uidOf(req) {
  return String(req.body?.uid || req.query.uid || "").trim().slice(0, 64);
}

// غلاف موحّد: نتيجة المخزن { ok, error? } → استجابة HTTP
function send(res, result, extra = {}) {
  if (!result || !result.ok) {
    return res.status(400).json({ error: result?.error || "تعذّرت العملية" });
  }
  res.json({ ...result, ...extra });
}

// تسجيل/تحديث ملف المستخدم (الاسم/الصورة) — يُستدعى عند فتح التطبيق.
// يُرجع ملفه العام مع رقمه القصير (shortId) ليشاركه.
app.post("/api/social/register", (req, res) => {
  const uid = uidOf(req);
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  const { name, avatar } = req.body || {};
  const u = socialStore.registerUser(uid, name, avatar);
  res.json({ ok: true, me: socialStore.publicUser(uid), shortId: u.shortId });
});

// بحث عن مستخدم برقمه القصير (لإرسال طلب زواج/صداقة)
app.get("/api/social/lookup", (req, res) => {
  const u = socialStore.getUserByShortId(req.query.id);
  if (!u) return res.status(404).json({ error: "لا يوجد مستخدم بهذا المعرّف" });
  // سجّل أن الباحث زار ملف هذا المستخدم (يظهر في «الزوار»)
  socialStore.recordVisit(uidOf(req), u.shortId);
  res.json({ user: socialStore.publicUser(u.uid) });
});

// ----- المحكمة: الزواج والطلاق -----
app.get("/api/social/marriage", (req, res) => {
  const uid = uidOf(req);
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  res.json(socialStore.marriageStatus(uid));
});

// طلب زواج (toId = الرقم القصير للطرف الآخر)
app.post("/api/social/marriage/propose", (req, res) => {
  const uid = uidOf(req);
  const target = socialStore.getUserByShortId(req.body?.toId);
  if (!target) return res.status(404).json({ error: "لا يوجد مستخدم بهذا المعرّف" });
  send(res, socialStore.proposeMarriage(uid, target.uid));
});

app.post("/api/social/marriage/accept", (req, res) =>
  send(res, socialStore.acceptMarriage(uidOf(req), req.body?.reqId))
);
app.post("/api/social/marriage/reject", (req, res) =>
  send(res, socialStore.rejectMarriage(uidOf(req), req.body?.reqId))
);

// طلاق إجباري (خلع) — يفسخ الزواج فوراً
app.post("/api/social/divorce/force", (req, res) =>
  send(res, socialStore.forcedDivorce(uidOf(req)))
);
// طلاق بالتراضي — يُرسل طلباً للشريك
app.post("/api/social/divorce/propose", (req, res) =>
  send(res, socialStore.proposeDivorce(uidOf(req)))
);
app.post("/api/social/divorce/accept", (req, res) =>
  send(res, socialStore.acceptDivorce(uidOf(req), req.body?.reqId))
);
app.post("/api/social/divorce/reject", (req, res) =>
  send(res, socialStore.rejectDivorce(uidOf(req), req.body?.reqId))
);

// ----- صديق اللعب: الصداقة -----
app.get("/api/social/friends", (req, res) => {
  const uid = uidOf(req);
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  res.json(socialStore.friendStatus(uid));
});
app.post("/api/social/friends/request", (req, res) => {
  const uid = uidOf(req);
  const target = socialStore.getUserByShortId(req.body?.toId);
  if (!target) return res.status(404).json({ error: "لا يوجد مستخدم بهذا المعرّف" });
  send(res, socialStore.friendRequest(uid, target.uid));
});
app.post("/api/social/friends/accept", (req, res) =>
  send(res, socialStore.acceptFriend(uidOf(req), req.body?.reqId))
);
app.post("/api/social/friends/reject", (req, res) =>
  send(res, socialStore.rejectFriend(uidOf(req), req.body?.reqId))
);
app.post("/api/social/friends/remove", (req, res) =>
  send(res, socialStore.removeFriend(uidOf(req), String(req.body?.otherUid || "")))
);

// ----- القبيلة: القبائل -----
app.get("/api/social/clans", (req, res) => {
  res.json({ mine: socialStore.myClan(uidOf(req)), clans: socialStore.listClans() });
});
app.post("/api/social/clans/create", (req, res) => {
  const uid = uidOf(req);
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  // تكلفة الإنشاء بالألماس (المالك معفى). يُتحقق قبل الإنشاء.
  const { wallet } = walletStore.ensure(uid);
  if (!wallet.owner && wallet.diamonds < CLAN_CREATE_COST) {
    return res.status(402).json({
      error: `تحتاج ${CLAN_CREATE_COST} ألماسة لتأسيس قبيلة`,
      need: CLAN_CREATE_COST,
      kind: "diamonds",
    });
  }
  const result = socialStore.createClan(uid, req.body?.name, req.body?.emblem);
  if (!result.ok) return res.status(400).json({ error: result.error });
  walletStore.spend(uid, { diamonds: CLAN_CREATE_COST });
  pushWalletUpdate(uid);
  res.json(result);
});
app.post("/api/social/clans/join", (req, res) =>
  send(res, socialStore.joinClan(uidOf(req), req.body?.clanId))
);
app.post("/api/social/clans/leave", (req, res) =>
  send(res, socialStore.leaveClan(uidOf(req)))
);

// ----- اللحظات: المنشورات -----
app.get("/api/social/moments", (req, res) => {
  res.json({ moments: socialStore.listMoments(uidOf(req)) });
});
app.post("/api/social/moments", (req, res) => {
  const uid = uidOf(req);
  const result = socialStore.postMoment(uid, req.body?.text, req.body?.media);
  if (result.ok) taskStore.progress(uid, "post_moment"); // مهمة: انشر لحظة
  send(res, result);
});
app.post("/api/social/moments/like", (req, res) =>
  send(res, socialStore.likeMoment(uidOf(req), req.body?.momentId))
);

// ----- الأي دي المميّز (Vanity ID) — يُشترى بالألماس -----
// يجلب المعرّف الحالي + اقتراحات معرّفات متاحة بأسعارها.
app.get("/api/vip-id", (req, res) => {
  const uid = uidOf(req);
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  const me = socialStore.getUser(uid);
  // استبعد المعرّفات المحجوزة من الاقتراحات
  const taken = new Set();
  // (الاقتراحات تُولّد محلياً؛ نمرّر مجموعة فارغة ونفلتر المحجوز عبر isShortIdAvailable)
  const suggestions = vipIdSuggestions(taken).filter((s) =>
    socialStore.isShortIdAvailable(s.id, uid)
  );
  res.json({
    current: me?.shortId || null,
    vip: !!me?.vip,
    suggestions,
  });
});

// تسعير معرّف يكتبه المستخدم + توفّره
app.post("/api/vip-id/quote", (req, res) => {
  const uid = uidOf(req);
  const id = String(req.body?.id || "").trim();
  if (!/^\d{4,8}$/.test(id)) {
    return res.status(400).json({ error: "المعرّف يجب أن يكون من 4 إلى 8 أرقام" });
  }
  res.json({
    id,
    price: vipIdPrice(id),
    tier: vipIdTier(id),
    available: socialStore.isShortIdAvailable(id, uid),
  });
});

// شراء معرّف مميّز — يخصم الألماس ويضبطه كرقم قصير للمستخدم
app.post("/api/vip-id/buy", (req, res) => {
  const uid = uidOf(req);
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  const id = String(req.body?.id || "").trim();
  if (!/^\d{4,8}$/.test(id)) {
    return res.status(400).json({ error: "المعرّف يجب أن يكون من 4 إلى 8 أرقام" });
  }
  if (!socialStore.isShortIdAvailable(id, uid)) {
    return res.status(409).json({ error: "هذا المعرّف محجوز لمستخدم آخر" });
  }
  const price = vipIdPrice(id);
  const { wallet } = walletStore.ensure(uid);
  if (!wallet.owner && wallet.diamonds < price) {
    return res.status(402).json({
      error: `تحتاج ${price.toLocaleString("en-US")} ألماسة لهذا المعرّف`,
      need: price,
      have: wallet.diamonds,
      kind: "diamonds",
    });
  }
  // اضمن أن المستخدم مسجّل في الدليل قبل ضبط معرّفه
  if (!socialStore.getUser(uid)) socialStore.registerUser(uid, null, null);
  const set = socialStore.setShortId(uid, id);
  if (!set.ok) return res.status(400).json({ error: set.error });
  walletStore.spend(uid, { diamonds: price });
  pushWalletUpdate(uid);
  const { wallet: updated } = walletStore.ensure(uid);
  res.json({ ok: true, id, price, wallet: updated, user: set.user });
});

// ----- زوّار الملف الشخصي -----
// تظهر القائمة فقط لمن اشترى «دفتر الزوّار»؛ غير ذلك تُرجَع مقفلة دون كشف الزوّار.
app.get("/api/profile/visitors", (req, res) => {
  const uid = uidOf(req);
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  const gb = guestbookStore.status(uid);
  if (!gb.active) return res.json({ locked: true, guestbook: gb, visitors: [] });
  res.json({ locked: false, guestbook: gb, visitors: socialStore.listVisitors(uid) });
});

// ----- دفتر الزوّار (اشتراك شهري بالألماس يفتح قائمة الزوّار) -----
app.get("/api/profile/guestbook", (req, res) => {
  const uid = uidOf(req);
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  res.json(guestbookStore.status(uid));
});

// شراء/تجديد دفتر الزوّار — يخصم 1000 ألماسة ويُفعّل الاشتراك لمدّة شهر
app.post("/api/profile/guestbook/buy", (req, res) => {
  const uid = uidOf(req);
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  if (!socialStore.getUser(uid)) socialStore.registerUser(uid, null, null);
  const price = guestbookStore.GUESTBOOK_PRICE;
  const { wallet } = walletStore.ensure(uid);
  if (!wallet.owner && wallet.diamonds < price) {
    return res.status(402).json({
      error: `تحتاج ${price.toLocaleString("en-US")} ألماسة`,
      need: price,
      have: wallet.diamonds,
      kind: "diamonds",
    });
  }
  const paid = walletStore.spend(uid, { diamonds: price });
  if (!paid) return res.status(402).json({ error: "الرصيد غير كافٍ", kind: "diamonds" });
  const sub = guestbookStore.subscribe(uid);
  pushWalletUpdate(uid);
  const { wallet: updated } = walletStore.ensure(uid);
  res.json({ ok: true, price, wallet: updated, status: sub.status });
});

// ----- مساهمة الأغاني -----
app.get("/api/songs", (req, res) => {
  res.json({ songs: profileStore.list(uidOf(req)) });
});
app.post("/api/songs", (req, res) => {
  const uid = uidOf(req);
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  const result = profileStore.add(uid, req.body?.title, req.body?.artist);
  if (!result.ok) return res.status(400).json({ error: result.error });
  res.json({ ...result, songs: profileStore.list(uid) });
});
app.post("/api/songs/vote", (req, res) =>
  send(res, profileStore.vote(uidOf(req), req.body?.songId))
);

// ----- المهام اليومية -----
// جلب حالة المهام. زيارة الصفحة تُكمل مهمة «تسجيل الدخول اليومي» تلقائياً.
app.get("/api/tasks", (req, res) => {
  const uid = uidOf(req);
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  taskStore.progress(uid, "daily_login");
  gloryStore.dailyLogin(uid); // مكافأة مجد يومية لتسجيل الدخول
  res.json(taskStore.status(uid));
});

// استلام مكافأة مهمة مكتملة — يُضيف الألماس للمحفظة ويبثّ الرصيد المحدّث
app.post("/api/tasks/claim", (req, res) => {
  const uid = uidOf(req);
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  const result = taskStore.claim(uid, req.body?.taskId);
  if (!result.ok) return res.status(400).json({ error: result.error });
  walletStore.credit(uid, { diamonds: result.reward });
  gloryStore.addPoints(uid, 10); // استلام مهمة يمنح نقاط مجد
  pushWalletUpdate(uid);
  const { wallet } = walletStore.ensure(uid);
  res.json({ ok: true, reward: result.reward, wallet, status: taskStore.status(uid) });
});

// ----- بطاقة المجد (Glory Pass) -----
app.get("/api/glory", (req, res) => {
  const uid = uidOf(req);
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  res.json(gloryStore.status(uid));
});
app.post("/api/glory/claim", (req, res) => {
  const uid = uidOf(req);
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  const result = gloryStore.claim(uid, req.body?.level);
  if (!result.ok) return res.status(400).json({ error: result.error });
  walletStore.credit(uid, result.reward);
  pushWalletUpdate(uid);
  const { wallet } = walletStore.ensure(uid);
  res.json({ ok: true, reward: result.reward, wallet, status: gloryStore.status(uid) });
});

// ----- الحزم الحصرية (باقات تُشترى بالألماس) -----
app.get("/api/packages", (_req, res) => {
  res.json({ packages: PACKAGES });
});
app.post("/api/packages/buy", (req, res) => {
  const uid = uidOf(req);
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  const pkg = getPackage(req.body?.packageId);
  if (!pkg) return res.status(400).json({ error: "باقة غير معروفة" });
  const paid = walletStore.spend(uid, { diamonds: pkg.priceDiamonds });
  if (!paid) return res.status(400).json({ error: "رصيد الألماس غير كافٍ" });
  walletStore.credit(uid, pkg.grant || {});
  if (pkg.grantItem) shopStore.grant(uid, pkg.grantItem); // عنصر حصري مع الباقة
  pushWalletUpdate(uid);
  const { wallet } = walletStore.ensure(uid);
  res.json({ ok: true, package: pkg, wallet });
});

// ----- المنافسات (الأفراد + القبائل) -----
// لوحتا صدارة موسميّتان: الأفراد بنقاط مبارياتهم، والقبائل بمجموع نقاط أعضائها.
app.get("/api/competitions", (req, res) => {
  const uid = uidOf(req);
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  res.json(competitionStore.overview(uid));
});

// خوض مباراة — يكسب نقاطاً ويُحدّث الترتيب (مع مهلة بين المباريات)
app.post("/api/competitions/play", (req, res) => {
  const uid = uidOf(req);
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  const result = competitionStore.play(uid);
  if (!result.ok) return res.status(400).json({ error: result.error, waitMs: result.waitMs });
  res.json({ ...result, overview: competitionStore.overview(uid) });
});

// ===== متجر الإطارات والخواتم =====
// كتالوج العناصر مع علم الملكية + المخزون (المُجهَّز حالياً).
app.get("/api/shop", (req, res) => {
  const uid = uidOf(req);
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  res.json({
    items: shopStore.catalogFor(uid),
    inventory: shopStore.inventory(uid),
    vip: vipStore.isVip(uid),
  });
});

// شراء عنصر — يتحقّق من الرصيد والعملة وحصريّة VIP، يخصم ثم يمنح ويُجهّز
app.post("/api/shop/buy", (req, res) => {
  const uid = uidOf(req);
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  const item = shopStore.catalogFor(uid).find((x) => x.id === req.body?.itemId);
  if (!item) return res.status(400).json({ error: "عنصر غير معروف" });
  if (item.owned) return res.status(409).json({ error: "تملك هذا العنصر بالفعل" });
  if (item.vipOnly && !vipStore.isVip(uid)) {
    return res.status(403).json({ error: "هذا العنصر حصريّ لمشتركي VIP", vipOnly: true });
  }
  if (!socialStore.getUser(uid)) socialStore.registerUser(uid, null, null);
  const { wallet } = walletStore.ensure(uid);
  const have = item.currency === "diamonds" ? wallet.diamonds : wallet.coins;
  if (!wallet.owner && have < item.price) {
    return res.status(402).json({
      error: `تحتاج ${item.price.toLocaleString("en-US")} ${item.currency === "diamonds" ? "ألماسة" : "كوين"}`,
      need: item.price,
      have,
      kind: item.currency,
    });
  }
  const paid = walletStore.spend(uid, { [item.currency]: item.price });
  if (!paid) return res.status(402).json({ error: "الرصيد غير كافٍ", kind: item.currency });
  const result = shopStore.grant(uid, item.id);
  pushWalletUpdate(uid);
  const { wallet: updated } = walletStore.ensure(uid);
  res.json({ ...result, wallet: updated });
});

// تجهيز عنصر مملوك (إطار/خاتم)
app.post("/api/shop/equip", (req, res) =>
  send(res, shopStore.equip(uidOf(req), req.body?.itemId))
);
// إلغاء تجهيز نوع (frame|ring)
app.post("/api/shop/unequip", (req, res) =>
  send(res, shopStore.unequip(uidOf(req), req.body?.kind))
);

// ===== نظام VIP =====
// حالة العضوية + الخطط المتاحة
app.get("/api/vip", (req, res) => {
  const uid = uidOf(req);
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  res.json(vipStore.status(uid));
});

// الاشتراك في VIP — يخصم الألماس ويُفعّل/يجدّد العضوية
app.post("/api/vip/subscribe", (req, res) => {
  const uid = uidOf(req);
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  const plan = vipStore.VIP_PLANS.find((p) => p.id === req.body?.planId);
  if (!plan) return res.status(400).json({ error: "خطّة غير معروفة" });
  if (!socialStore.getUser(uid)) socialStore.registerUser(uid, null, null);
  const { wallet } = walletStore.ensure(uid);
  if (!wallet.owner && wallet.diamonds < plan.price) {
    return res.status(402).json({
      error: `تحتاج ${plan.price.toLocaleString("en-US")} ألماسة للاشتراك`,
      need: plan.price,
      have: wallet.diamonds,
      kind: "diamonds",
    });
  }
  walletStore.spend(uid, { diamonds: plan.price });
  const result = vipStore.subscribe(uid, plan.id);
  pushWalletUpdate(uid);
  const { wallet: updated } = walletStore.ensure(uid);
  res.json({ ...result, wallet: updated });
});

// مسابقة VIP — نظرة عامة على اللوحة والجوائز
app.get("/api/vip/competition", (req, res) => {
  const uid = uidOf(req);
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  res.json(vipStore.compOverview(uid));
});

// جولة في مسابقة VIP (للمشتركين فقط)
app.post("/api/vip/competition/play", (req, res) => {
  const uid = uidOf(req);
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  const result = vipStore.play(uid);
  if (!result.ok) return res.status(400).json({ error: result.error, waitMs: result.waitMs });
  res.json({ ...result, overview: vipStore.compOverview(uid) });
});

// استلام جائزة الأسبوع — يُضيف الألماس للمحفظة
app.post("/api/vip/competition/claim", (req, res) => {
  const uid = uidOf(req);
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  const result = vipStore.claimPrize(uid);
  if (!result.ok) return res.status(400).json({ error: result.error });
  walletStore.credit(uid, { diamonds: result.diamonds });
  pushWalletUpdate(uid);
  const { wallet } = walletStore.ensure(uid);
  res.json({ ...result, wallet, overview: vipStore.compOverview(uid) });
});

// ===== إنجازات اللعب =====
// تُحتسب من نشاط المستخدم (المباريات/الفوز/الاجتماعيات/المقتنيات/VIP).
app.get("/api/achievements", (req, res) => {
  const uid = uidOf(req);
  if (!uid) return res.status(400).json({ error: "uid مطلوب" });
  const comp = competitionStore.overview(uid).me || {};
  const friendCount = socialStore.friendStatus(uid).friends.length;
  const mar = socialStore.marriageStatus(uid);
  const myClan = socialStore.myClan(uid);
  const inv = shopStore.inventory(uid);
  const vip = vipStore.isVip(uid);
  const owner = walletStore.isOwner(uid);

  const ach = [
    { id: "first_match", icon: "🎮", title: "أول مباراة", desc: "خُض مباراتك الأولى", goal: 1, progress: comp.matches || 0 },
    { id: "veteran",     icon: "⚔️", title: "محارب", desc: "خُض 10 مباريات", goal: 10, progress: comp.matches || 0 },
    { id: "champion",    icon: "🏆", title: "بطل", desc: "حقّق 5 انتصارات", goal: 5, progress: comp.wins || 0 },
    { id: "scorer",      icon: "💯", title: "جامع النقاط", desc: "اجمع 1000 نقطة منافسة", goal: 1000, progress: comp.points || 0 },
    { id: "social",      icon: "🤝", title: "اجتماعي", desc: "أضف 3 أصدقاء", goal: 3, progress: friendCount },
    { id: "married",     icon: "💍", title: "ارتباط", desc: "تزوّج في المحكمة", goal: 1, progress: mar.partner ? 1 : 0 },
    { id: "tribe",       icon: "🛡️", title: "ابن القبيلة", desc: "انضم لقبيلة", goal: 1, progress: myClan ? 1 : 0 },
    { id: "collector",   icon: "💍", title: "هاوي المقتنيات", desc: "امتلك إطاراً أو خاتماً", goal: 1, progress: inv.owned.length ? 1 : 0 },
    { id: "vip",         icon: "💎", title: "عضو VIP", desc: "اشترك في VIP", goal: 1, progress: vip ? 1 : 0 },
    { id: "owner",       icon: "👑", title: "المالك", desc: "مالك اللعبة", goal: 1, progress: owner ? 1 : 0 },
  ].map((a) => ({ ...a, done: a.progress >= a.goal, progress: Math.min(a.progress, a.goal) }));

  res.json({ achievements: ach, unlocked: ach.filter((a) => a.done).length, total: ach.length });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// طاولات الألعاب (جاكارو/لودو/بلوت/السلم والثعبان) — معالج اتصال مستقل
attachGames(io);

/**
 * حالة الغرف في الذاكرة.
 * rooms[roomId] = {
 *   id, name, members: Map<socketId, user>,
 *   seats: Array<{ index, userId|null, muted, locked, speaking }>,
 *   messages: [] (آخر 50 رسالة)
 * }
 */
const rooms = new Map();

function createRoom(roomId) {
  const room = {
    id: roomId,
    name: "جلسة وناسة 🥂",
    members: new Map(),
    seats: Array.from({ length: SEAT_COUNT }, (_, index) => ({
      index,
      userId: null,
      muted: false,
      locked: false,
      speaking: false,
    })),
    messages: [],
  };
  rooms.set(roomId, room);
  return room;
}

function getRoom(roomId) {
  return rooms.get(roomId) || createRoom(roomId);
}

// ===== سجلّ بيانات الغرف (Meta) — يُدار عبر roomStore (يُحفظ على القرص) =====

function genRoomId() {
  let id;
  do {
    id = String(Math.floor(100000 + Math.random() * 900000));
  } while (rooms.has(id) || roomStore.has(id));
  return id;
}

// عدد الأعضاء المتصلين فعلياً في غرفة حيّة (أو 0)
function liveMemberCount(id) {
  const room = rooms.get(id);
  return room ? room.members.size : null;
}

// لا توجد غرف افتراضية — الدليل يعرض فقط الغرف الحقيقية التي ينشئها المستخدمون.

// قائمة الغرف للعرض (تشمل الخاصة بعلامة قفل دون كشف الرمز)
function listRooms() {
  return roomStore
    .all()
    .map((meta) => roomStore.publicView(meta.id, liveMemberCount(meta.id)))
    .sort((a, b) => {
      // غرفة المالك الرسمية تبقى دائماً في الصدارة
      if (a.id === OWNER_ROOM_ID) return -1;
      if (b.id === OWNER_ROOM_ID) return 1;
      return b.members - a.members;
    });
}

// يحوّل حالة الغرفة لصيغة قابلة للإرسال (Map -> Array)
function serializeRoom(room) {
  const meta = roomStore.get(room.id);
  const level = meta?.level || 1;
  const points = meta?.points || 0;
  return {
    id: room.id,
    name: meta?.name || room.name,
    seatCount: SEAT_COUNT,
    members: [...room.members.values()],
    seats: room.seats.map((s) => ({
      index: s.index,
      muted: s.muted,
      locked: s.locked,
      speaking: s.speaking,
      user: s.userId ? room.members.get(s.userId) || null : null,
    })),
    messages: room.messages,
    // بيانات الغرفة: المستوى/النقاط/الملكية/المشرفون
    level,
    points,
    nextLevelPoints: totalPointsForLevel(level + 1), // إجمالي النقاط للوصول للمستوى التالي
    levelStartPoints: totalPointsForLevel(level), // النقاط التراكمية عند بداية المستوى الحالي
    pointsPerLevel: pointsToNextLevel(level), // تكلفة هذه الترقية (تزداد كل مستوى)
    gemsPerPoint: GEMS_PER_POINT,
    ownerUid: meta?.ownerUid || null,
    admins: meta?.admins || [],
    maxAdmins: maxAdminsForLevel(level),
  };
}

function broadcastRoom(room) {
  io.to(room.id).emit("room:update", serializeRoom(room));
}

function pushMessage(room, message) {
  const full = { id: cryptoId(), ts: Date.now(), ...message };
  room.messages.push(full);
  if (room.messages.length > 50) room.messages.shift();
  return full;
}

function cryptoId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// يجد مقعد المستخدم الحالي (أو -1)
function seatOf(room, userId) {
  return room.seats.findIndex((s) => s.userId === userId);
}

io.on("connection", (socket) => {
  let currentRoomId = null;
  let currentUser = null;

  let currentUid = null; // معرّف المستخدم الثابت (للمحفظة)
  let seatSince = null; // طابع زمني لبدء الجلوس على المقعد (لمهمة وقت الجلوس)

  // يحتسب الوقت المنقضي على المقعد ويضيفه لتقدّم مهمة الجلوس (نصف ساعة).
  // يُستدعى عند ترك المقعد/تبديله/قطع الاتصال. reset=true يعيد بدء العدّاد (للتبديل).
  function flushSeatTime(reset = false) {
    if (seatSince && currentUid) {
      const secs = Math.floor((Date.now() - seatSince) / 1000);
      if (secs > 0) taskStore.progress(currentUid, "sit_seat", secs);
    }
    seatSince = reset ? Date.now() : null;
  }

  // قائمة الغرف لحظياً عبر السوكِت
  socket.on("room:list", () => socket.emit("room:list", listRooms()));

  // الانضمام للغرفة
  socket.on("room:join", ({ roomId, user, pin }) => {
    roomId = roomId || "130096";
    // تحقّق رمز PIN للغرف الخاصة
    const meta = roomStore.get(roomId);
    if (meta && meta.type === "private" && meta.pin && String(pin || "") !== meta.pin) {
      socket.emit("room:join:error", { reason: "pin", roomId });
      return;
    }
    currentRoomId = roomId;
    const room = getRoom(roomId);
    if (meta?.name) room.name = meta.name; // اسم الغرفة من السجلّ

    // اربط المحفظة الدائمة عبر uid (يُنشئها مع مكافأة البداية إن كانت جديدة)
    currentUid = String(user?.uid || "").slice(0, 64);
    // الدور داخل الغرفة: المالك (ownerUid) أو مشرف (admins) أو عضو عادي
    const role = meta && currentUid && meta.ownerUid === currentUid
      ? "owner"
      : meta && currentUid && meta.admins.includes(currentUid)
        ? "admin"
        : "member";
    if (currentUid) {
      uidSockets.set(currentUid, socket.id);
      // سجّل ملف المستخدم في الدليل الاجتماعي (اسم/صورة) ليجده الآخرون
      socialStore.registerUser(currentUid, user?.name, user?.avatar);
      taskStore.progress(currentUid, "join_room"); // مهمة: ادخل غرفة صوتية
    }
    const { wallet } = currentUid
      ? walletStore.ensure(currentUid)
      : { wallet: { coins: 0, diamonds: 0, owner: false } };

    currentUser = {
      id: socket.id,
      uid: currentUid,
      name: (user?.name || "زائر").slice(0, 20),
      avatar: user?.avatar || null,
      frame: user?.frame || null, // إطار VIP اختياري
      role, // owner | admin | member — يحدّد الإطار المتحرك
      coins: wallet.coins,
      diamonds: wallet.diamonds,
      isOwner: !!wallet.owner, // مالك اللعبة (رصيد لانهائي)
    };

    room.members.set(socket.id, currentUser);
    socket.join(roomId);
    socket.emit("wallet:update", wallet);

    // رسالة نظام ترحيب
    pushMessage(room, {
      type: "system",
      text: `مرحباً بكم في غرفة Jackaroo. المحتويات غير القانونية ممنوعة. ندعوكم للعب بأدب لبيئة نقية.`,
    });
    pushMessage(room, {
      type: "enter",
      text: `دخل ${currentUser.name}`,
      user: currentUser,
    });

    socket.emit("room:joined", { selfId: socket.id, room: serializeRoom(room) });
    broadcastRoom(room);
  });

  // أخذ مقعد (أخذ المايك)
  socket.on("seat:take", ({ index }) => {
    const room = rooms.get(currentRoomId);
    if (!room || !currentUser) return;

    const target = room.seats[index];
    if (!target || target.locked || target.userId) return;

    // غادر المقعد القديم إن وجد
    const old = seatOf(room, currentUser.id);
    if (old !== -1) {
      room.seats[old].userId = null;
      room.seats[old].speaking = false;
    }
    // ابدأ/أعد عدّاد وقت الجلوس على المقعد (لمهمة نصف الساعة)
    flushSeatTime(true);

    target.userId = currentUser.id;
    target.muted = false;
    pushMessage(room, {
      type: "system",
      text: `صعد ${currentUser.name} على المايك رقم ${index + 1}`,
    });
    broadcastRoom(room);
  });

  // ترك المقعد (نزول عن المايك)
  socket.on("seat:leave", () => {
    const room = rooms.get(currentRoomId);
    if (!room || !currentUser) return;
    const idx = seatOf(room, currentUser.id);
    if (idx === -1) return;
    flushSeatTime(); // احتسب وقت الجلوس قبل النزول
    room.seats[idx].userId = null;
    room.seats[idx].speaking = false;
    room.seats[idx].muted = false;
    broadcastRoom(room);
  });

  // كتم / فتح المايك (لمقعد المستخدم نفسه)
  socket.on("seat:toggleMute", () => {
    const room = rooms.get(currentRoomId);
    if (!room || !currentUser) return;
    const idx = seatOf(room, currentUser.id);
    if (idx === -1) return;
    room.seats[idx].muted = !room.seats[idx].muted;
    if (room.seats[idx].muted) room.seats[idx].speaking = false;
    broadcastRoom(room);
  });

  // مؤشر التحدث (محاكاة موجة الصوت — لاحقاً يربط بمستوى المايك الحقيقي)
  socket.on("seat:speaking", ({ speaking }) => {
    const room = rooms.get(currentRoomId);
    if (!room || !currentUser) return;
    const idx = seatOf(room, currentUser.id);
    if (idx === -1) return;
    if (room.seats[idx].muted) return;
    room.seats[idx].speaking = !!speaking;
    // بث خفيف لمؤشر التحدث فقط
    io.to(room.id).emit("seat:speaking", { index: idx, speaking: !!speaking });
  });

  // قفل / فتح مقعد (للمالك — مبسّط: أي أحد يقدر هنا)
  socket.on("seat:toggleLock", ({ index }) => {
    const room = rooms.get(currentRoomId);
    if (!room) return;
    const target = room.seats[index];
    if (!target || target.userId) return;
    target.locked = !target.locked;
    broadcastRoom(room);
  });

  // رسالة شات
  socket.on("chat:send", ({ text }) => {
    const room = rooms.get(currentRoomId);
    if (!room || !currentUser) return;
    const clean = String(text || "").trim().slice(0, 200);
    if (!clean) return;
    const msg = pushMessage(room, {
      type: "chat",
      text: clean,
      user: currentUser,
    });
    io.to(room.id).emit("chat:new", msg);
  });

  // إرسال هدية — يبعث تعريف الهدية الكامل ليعرف العميل كيف يحرّكها
  socket.on("gift:send", ({ giftId, toUserId, combo, anon }) => {
    const room = rooms.get(currentRoomId);
    if (!room || !currentUser) return;
    const gift = giftStore.get(giftId);
    if (!gift) return;
    const qty = Math.max(1, Math.min(1314, Number(combo) || 1));
    const price = gift.coins || 0; // سعر الهدية الواحدة
    const cost = price * qty;
    // عملة الدفع حسب سعر الهدية: الهدايا العادية (< 100) بالكوينز،
    // والهدايا الغالية (>= 100) بالمجوهرات (الألماس).
    const payWithGems = price >= GIFT_GEM_THRESHOLD;
    const kind = payWithGems ? "diamonds" : "coins";
    // اخصم من المرسِل. المالك لانهائي. غيره يُرفض إن لم يكفِ الرصيد.
    if (currentUid) {
      const ok = walletStore.spend(currentUid, payWithGems ? { diamonds: cost } : { coins: cost });
      if (!ok) {
        socket.emit("wallet:insufficient", { need: cost, kind });
        return;
      }
      pushWalletUpdate(currentUid);
      taskStore.progress(currentUid, "send_gift"); // مهمة: أرسل هدية
    }
    const to = toUserId ? room.members.get(toUserId) : null;
    // الإرسال المجهول يُخفي اسم المرسِل
    const from = anon ? { id: currentUser.id, name: "مجهول", avatar: "🎭", role: "member" } : currentUser;
    const payload = {
      id: cryptoId(),
      gift, // تعريف كامل: rarity/priority/duration/renderer/scenario/sound/...
      combo: qty,
      from,
      to,
      ts: Date.now(),
    };
    pushMessage(room, {
      type: "gift",
      text: `${from.name} أرسل ${gift.emoji} ${gift.name}${to ? " إلى " + to.name : ""}`,
      user: from,
    });
    io.to(room.id).emit("gift:new", payload);

    // نقاط الغرفة تتجمّع من قيمة الهدايا: كل 10 مجوهرات (كوينز) = نقطة واحدة،
    // والترقية تصاعدية (5000 نقطة للمستوى 2، ثم تزداد كل مستوى).
    const earned = Math.floor(cost / GEMS_PER_POINT);
    const prog = roomStore.addPoints(room.id, earned);
    if (prog?.leveledUp) {
      pushMessage(room, {
        type: "system",
        text: `🎉 ارتقت الغرفة إلى المستوى ${prog.level}!`,
      });
      io.to(room.id).emit("room:levelup", { roomId: room.id, level: prog.level });
      io.emit("room:list", listRooms()); // حدّث ترتيب/مستوى الغرفة في الدليل
    }
    broadcastRoom(room);
  });

  // قائمة الهدايا المتاحة (التعريفات الكاملة)
  socket.on("gift:list", () => {
    socket.emit("gift:list", giftStore.all());
  });

  // ===== إدارة المشرفين (للمالك فقط) =====
  // يحدّث دور العضو المتصل داخل الغرفة فوراً ويعيد بثّ الحالة.
  function applyRoleInRoom(room, uid, role) {
    for (const m of room.members.values()) {
      if (m.uid && m.uid === uid) m.role = role;
    }
  }

  socket.on("admin:add", ({ uid }) => {
    const room = rooms.get(currentRoomId);
    const meta = room && roomStore.get(currentRoomId);
    if (!room || !meta || !currentUid || meta.ownerUid !== currentUid) {
      return socket.emit("admin:error", { reason: "forbidden" });
    }
    const r = roomStore.addAdmin(currentRoomId, uid);
    if (!r.ok) return socket.emit("admin:error", { reason: r.error });
    applyRoleInRoom(room, String(uid), "admin");
    broadcastRoom(room);
  });

  socket.on("admin:remove", ({ uid }) => {
    const room = rooms.get(currentRoomId);
    const meta = room && roomStore.get(currentRoomId);
    if (!room || !meta || !currentUid || meta.ownerUid !== currentUid) {
      return socket.emit("admin:error", { reason: "forbidden" });
    }
    const r = roomStore.removeAdmin(currentRoomId, uid);
    if (!r.ok) return socket.emit("admin:error", { reason: r.error });
    applyRoleInRoom(room, String(uid), "member");
    broadcastRoom(room);
  });

  // ===== التفاعلات السريعة (Reactions) =====
  // تظهر فوق صورة المستخدم على مقعده وتُزامَن لحظياً للجميع.
  const REACTIONS = ["laugh", "cry", "angry", "clap", "fire", "love", "celebrate", "dance", "like", "respect"];
  let lastReactionAt = 0;
  socket.on("reaction:send", ({ type }) => {
    const room = rooms.get(currentRoomId);
    if (!room || !currentUser) return;
    if (!REACTIONS.includes(type)) return;
    const now = Date.now();
    if (now - lastReactionAt < 250) return; // حدّ بسيط لمنع السبام
    lastReactionAt = now;
    const seatIndex = seatOf(room, currentUser.id);
    if (seatIndex === -1) return; // التفاعل يظهر فوق المقعد فقط
    io.to(room.id).emit("reaction:new", {
      id: cryptoId(),
      seatIndex,
      userId: currentUser.id,
      type,
      ts: now,
    });
  });

  // ملاحظة: لم نعد نمرّر إشارات WebRTC هنا — الصوت ينتقل عبر LiveKit Cloud (SFU).

  socket.on("disconnect", () => {
    // احتسب آخر فترة جلوس على المقعد قبل الخروج (لمهمة نصف الساعة)
    flushSeatTime();
    // نظّف ربط uid->socket إن كان يخصّ هذه الجلسة
    if (currentUid && uidSockets.get(currentUid) === socket.id) {
      uidSockets.delete(currentUid);
    }
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;
    const idx = seatOf(room, socket.id);
    if (idx !== -1) {
      room.seats[idx].userId = null;
      room.seats[idx].speaking = false;
      room.seats[idx].muted = false;
    }
    const name = room.members.get(socket.id)?.name;
    room.members.delete(socket.id);
    if (name) pushMessage(room, { type: "system", text: `غادر ${name} الغرفة` });

    // نظّف الغرف الفارغة
    if (room.members.size === 0) {
      rooms.delete(currentRoomId);
    } else {
      broadcastRoom(room);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`🎙️  خادم الغرف الصوتية يعمل على http://localhost:${PORT}`);
});
