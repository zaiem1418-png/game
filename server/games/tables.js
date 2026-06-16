// ===== مدير طاولات الألعاب (متعدد اللاعبين عبر الإنترنت) =====
// - مطابقة: ينضم اللاعب لطاولة مفتوحة لنفس (اللعبة + النمط) أو يُنشئ واحدة.
// - الانتظار في "اللوبي" حتى يبدأ المضيف؛ تُملأ المقاعد الفارغة ببوتات.
// - الحالة مرجعية بالكامل على الخادم؛ العميل يعرض فقط ويرسل الإجراءات.
// - يسجّل معالج اتصال مستقل حتى لا يلمس منطق الغرفة الصوتية.

import { getGameModule } from "./registry.js";

const BOT_NAMES = ["نورة", "سعد", "ليان", "خالد", "ريم", "فهد", "جود", "ماجد"];
const BOT_AVATARS = ["🦊", "🐼", "🐯", "🦉", "🐧", "🐵", "🐸", "🦁"];
const BOT_TURN_DELAY = 850; // ms — تأخير لطيف ليبدو البوت طبيعياً

function rid() {
  return Math.random().toString(36).slice(2, 9);
}

export function attachGames(io) {
  /** tables: Map<tableId, table> */
  const tables = new Map();
  /** socketId -> tableId (لتنظيف عند الانفصال) */
  const playerTable = new Map();

  function roomName(tableId) {
    return `game:${tableId}`;
  }

  function findOpenTable(gameId, mode) {
    for (const t of tables.values()) {
      if (t.gameId === gameId && t.mode === mode && !t.started) {
        const humans = t.players.filter((p) => !p.bot).length;
        if (humans < t.mod.maxSeats) return t;
      }
    }
    return null;
  }

  function createTable(gameId, mode) {
    const mod = getGameModule(gameId);
    if (!mod) return null;
    const table = {
      id: rid(),
      gameId,
      mode,
      mod,
      players: [], // { id, name, avatar, bot, connected }
      hostId: null,
      started: false,
      state: null,
      botTimer: null,
    };
    tables.set(table.id, table);
    return table;
  }

  // الحالة المرسلة للوبي (قبل البدء)
  function lobbyView(table) {
    return {
      phase: "lobby",
      tableId: table.id,
      gameId: table.gameId,
      mode: table.mode,
      hostId: table.hostId,
      maxSeats: table.mod.maxSeats,
      minHumans: table.mod.minHumans,
      players: table.players.map((p) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        bot: p.bot,
        connected: p.connected,
      })),
    };
  }

  function broadcastLobby(table) {
    io.to(roomName(table.id)).emit("game:lobby", lobbyView(table));
  }

  // بثّ حالة اللعبة الجارية + من دوره الآن
  function broadcastState(table) {
    const pub = table.mod.publicState(table.state);
    const turn = table.mod.currentTurn(table.state);
    io.to(roomName(table.id)).emit("game:state", {
      tableId: table.id,
      gameId: table.gameId,
      state: pub,
      turn,
      over: table.mod.isOver(table.state),
    });
  }

  function startGame(table) {
    if (table.started) return;
    // املأ المقاعد الفارغة ببوتات حتى defaultSeats
    const target = table.mod.defaultSeats || table.mod.maxSeats;
    let bi = 0;
    while (table.players.length < target) {
      const name = BOT_NAMES[bi % BOT_NAMES.length];
      const avatar = BOT_AVATARS[bi % BOT_AVATARS.length];
      table.players.push({
        id: "bot_" + rid(),
        name,
        avatar,
        bot: true,
        connected: true,
      });
      bi++;
    }
    table.started = true;
    table.state = table.mod.create({ players: table.players });
    broadcastState(table);
    maybeRunBots(table);
  }

  // إذا كان دور بوت الآن، شغّل حركته بعد تأخير لطيف (بشكل متكرر)
  function maybeRunBots(table) {
    if (table.botTimer) {
      clearTimeout(table.botTimer);
      table.botTimer = null;
    }
    if (!table.state || table.mod.isOver(table.state)) return;
    const turnId = table.mod.currentTurn(table.state);
    const p = table.players.find((x) => x.id === turnId);
    if (!p || !p.bot) return; // دور بشري — ننتظر إجراءه

    table.botTimer = setTimeout(() => {
      table.botTimer = null;
      if (!table.state || table.mod.isOver(table.state)) return;
      const stillTurn = table.mod.currentTurn(table.state);
      if (stillTurn !== turnId) return;
      const action = table.mod.botAction(table.state, turnId);
      if (action) {
        const res = table.mod.applyAction(table.state, turnId, action) || {};
        if (!res.error) broadcastState(table);
      }
      maybeRunBots(table); // قد يكون التالي بوتاً أيضاً
    }, BOT_TURN_DELAY);
  }

  function removeFromTable(socket) {
    const tableId = playerTable.get(socket.id);
    if (!tableId) return;
    playerTable.delete(socket.id);
    const table = tables.get(tableId);
    if (!table) return;
    socket.leave(roomName(tableId));

    const p = table.players.find((x) => x.id === socket.id);
    if (p) p.connected = false;

    if (!table.started) {
      // في اللوبي: أزل اللاعب فعلياً
      table.players = table.players.filter((x) => x.id !== socket.id);
      if (table.hostId === socket.id) {
        const nextHuman = table.players.find((x) => !x.bot);
        table.hostId = nextHuman ? nextHuman.id : null;
      }
      if (table.players.filter((x) => !x.bot).length === 0) {
        if (table.botTimer) clearTimeout(table.botTimer);
        tables.delete(tableId);
      } else {
        broadcastLobby(table);
      }
    } else {
      // أثناء اللعب: إذا غادر كل البشر، أزل الطاولة
      if (table.players.filter((x) => !x.bot && x.connected).length === 0) {
        if (table.botTimer) clearTimeout(table.botTimer);
        tables.delete(tableId);
      } else {
        broadcastState(table);
      }
    }
  }

  io.on("connection", (socket) => {
    // الانضمام لطاولة لعبة (مطابقة)
    socket.on("game:join", ({ gameId, mode, user } = {}) => {
      const mod = getGameModule(gameId);
      if (!mod) return socket.emit("game:error", { message: "لعبة غير متاحة بعد" });

      // غادر أي طاولة سابقة
      removeFromTable(socket);

      let table = findOpenTable(gameId, mode) || createTable(gameId, mode);
      if (!table) return socket.emit("game:error", { message: "تعذّر إنشاء الطاولة" });

      const player = {
        id: socket.id,
        name: (user?.name || "زائر").slice(0, 20),
        avatar: user?.avatar || "🧑",
        bot: false,
        connected: true,
      };
      table.players.push(player);
      if (!table.hostId) table.hostId = socket.id;
      playerTable.set(socket.id, table.id);
      socket.join(roomName(table.id));

      socket.emit("game:joined", { tableId: table.id, you: socket.id, hostId: table.hostId });
      broadcastLobby(table);
    });

    // المضيف يبدأ اللعبة (تُملأ المقاعد ببوتات)
    socket.on("game:start", () => {
      const table = tables.get(playerTable.get(socket.id));
      if (!table || table.started) return;
      if (table.hostId !== socket.id) return; // المضيف فقط
      startGame(table);
    });

    // إجراء داخل اللعبة (رمي/تحريك/لعب ورقة...)
    socket.on("game:action", (action = {}) => {
      const table = tables.get(playerTable.get(socket.id));
      if (!table || !table.started || !table.state) return;
      if (table.mod.isOver(table.state)) return;
      const res = table.mod.applyAction(table.state, socket.id, action) || {};
      if (res.error) {
        socket.emit("game:error", { message: res.error });
        return;
      }
      broadcastState(table);
      maybeRunBots(table);
    });

    // مغادرة الطاولة يدوياً (رجوع للوبي)
    socket.on("game:leave", () => removeFromTable(socket));

    socket.on("disconnect", () => removeFromTable(socket));
  });
}
