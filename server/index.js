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
import { roomStore, maxAdminsForLevel, POINTS_PER_LEVEL } from "./roomStore.js";
import { storeCatalog, resolvePackage } from "./storeCatalog.js";
import { processPayment } from "./payment.js";
import { attachGames } from "./games/tables.js";

const PORT = process.env.PORT || 3001;
const SEAT_COUNT = 12; // عدد المقاعد في كل غرفة
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "admin123"; // غيّره في الإنتاج
// كلمة سر مالك اللعبة — من يدخلها يحصل على رصيد لانهائي. غيّرها في الإنتاج عبر متغير البيئة.
const OWNER_KEY = process.env.OWNER_KEY || "owner-jackaroo-2026";

// غرفة مالك اللعبة الرسمية — أي دي مميز لا مثيل له (7 خانات، خارج نطاق الغرف العادية
// 6 خانات فلا يتولّد عشوائياً أبداً). تُنشأ تلقائياً وتظهر دائماً في صدارة الدليل.
const OWNER_ROOM_ID = "1000000";

// ===== إعدادات LiveKit (الصوت) — تُقرأ من متغيرات البيئة فقط، لا تُكتب في الكود =====
const LIVEKIT_URL = process.env.LIVEKIT_URL || "";
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "";

giftStore.init();
walletStore.init();
roomStore.init();

// أنشئ غرفة المالك الرسمية مرة واحدة إن لم تكن موجودة — أي دي مميز ثابت لا مثيل له.
function ensureOwnerRoom() {
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
app.use(express.json({ limit: "256kb" }));
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
  res.json({ ok: true, roomId: id });
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
    nextLevelPoints: level * POINTS_PER_LEVEL, // نقاط الوصول للمستوى التالي
    pointsPerLevel: POINTS_PER_LEVEL,
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
    if (currentUid) uidSockets.set(currentUid, socket.id);
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
    const cost = (gift.coins || 0) * qty;
    // اخصم الكوينز من المرسِل. المالك لانهائي. غيره يُرفض إن لم يكفِ الرصيد.
    if (currentUid) {
      const ok = walletStore.spend(currentUid, { coins: cost });
      if (!ok) {
        socket.emit("wallet:insufficient", { need: cost, kind: "coins" });
        return;
      }
      pushWalletUpdate(currentUid);
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

    // نقاط الغرفة تتجمّع من قيمة الهدايا (الكوينز × العدد) → الترقية كل 5000 نقطة
    const prog = roomStore.addPoints(room.id, cost);
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
