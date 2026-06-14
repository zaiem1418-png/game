// خادم الغرف الصوتية — Socket.IO
// يدير: حالة الغرف، المقاعد، أخذ/ترك المايك، الكتم، الشات، والهدايا.
// الصوت الحقيقي (WebRTC) غير مدمج بعد — هذه طبقة الحالة والمزامنة فقط.

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { giftStore } from "./giftStore.js";

const PORT = process.env.PORT || 3001;
const SEAT_COUNT = 12; // عدد المقاعد في كل غرفة
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "admin123"; // غيّره في الإنتاج

giftStore.init();

const app = express();
app.use(cors());
app.use(express.json({ limit: "256kb" }));
app.get("/health", (_req, res) => res.json({ ok: true }));

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

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

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

// يحوّل حالة الغرفة لصيغة قابلة للإرسال (Map -> Array)
function serializeRoom(room) {
  return {
    id: room.id,
    name: room.name,
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

  // الانضمام للغرفة
  socket.on("room:join", ({ roomId, user }) => {
    roomId = roomId || "130096";
    currentRoomId = roomId;
    const room = getRoom(roomId);
    // أول من يدخل الغرفة = صاحب الغرفة (owner)، والبقية أعضاء
    const role = room.members.size === 0 ? "owner" : "member";
    currentUser = {
      id: socket.id,
      name: (user?.name || "زائر").slice(0, 20),
      avatar: user?.avatar || null,
      frame: user?.frame || null, // إطار VIP اختياري
      role, // owner | admin | member — يحدّد الإطار المتحرك
      coins: 10000,
    };

    room.members.set(socket.id, currentUser);
    socket.join(roomId);

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
    const to = toUserId ? room.members.get(toUserId) : null;
    // الإرسال المجهول يُخفي اسم المرسِل
    const from = anon ? { id: currentUser.id, name: "مجهول", avatar: "🎭", role: "member" } : currentUser;
    const payload = {
      id: cryptoId(),
      gift, // تعريف كامل: rarity/priority/duration/renderer/scenario/sound/...
      combo: Math.max(1, Math.min(1314, Number(combo) || 1)),
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
    broadcastRoom(room);
  });

  // قائمة الهدايا المتاحة (التعريفات الكاملة)
  socket.on("gift:list", () => {
    socket.emit("gift:list", giftStore.all());
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

  // ===== تمرير إشارات WebRTC للصوت (signaling) =====
  // السيرفر يمرّر العرض/الرد/مرشحات ICE بين طرفين فقط؛ الصوت نفسه ينتقل P2P.
  socket.on("voice:signal", ({ to, data }) => {
    if (!to) return;
    io.to(to).emit("voice:signal", { from: socket.id, data });
  });

  socket.on("disconnect", () => {
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
