// ===== لعبة لودو (Ludo) — منطق مرجعي على الخادم =====
// لوحة دائرية 52 خانة. كل لاعب 4 بيادق. يخرج البيدق بالرقم 6.
// خانات آمنة لا يُؤكل عليها. الوصول للبيت يتطلب رمية بالضبط (57).
// رمي 6 أو الأكل أو إيصال بيدق للبيت = رمية إضافية.

const COLORS = ["#e94f4f", "#37c26a", "#f5c451", "#3aa3ff"];
const NAMES_COLOR = ["أحمر", "أخضر", "أصفر", "أزرق"];
const OFFSETS = [0, 13, 26, 39]; // بداية كل لاعب على المسار الرئيسي
const SAFE = new Set([0, 8, 13, 21, 26, 34, 39, 47]); // خانات آمنة (مطلقة)

const HOME_STEP = 57; // الوصول للبيت
const LAST_MAIN = 51; // آخر خطوة على المسار الرئيسي

function rollDie() {
  return 1 + Math.floor(Math.random() * 6);
}

// الخانة المطلقة (0..51) لبيدق على المسار الرئيسي، أو null لو في البيت/القاعدة
function absCell(offsetIdx, steps) {
  if (steps < 1 || steps > LAST_MAIN) return null;
  return (OFFSETS[offsetIdx] + steps - 1) % 52;
}

export default {
  id: "ludo",
  title: "لودو",
  minHumans: 1,
  maxSeats: 4,
  defaultSeats: 4,

  create({ players }) {
    return {
      game: "ludo",
      players: players.map((p, i) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar || "🧑",
        bot: !!p.bot,
        seat: i, // 0..3 يحدّد اللون والبداية
        color: COLORS[i],
        colorName: NAMES_COLOR[i],
        tokens: [0, 0, 0, 0], // steps لكل بيدق: 0=القاعدة، 1..51 مسار، 52..56 عمود البيت، 57=البيت
        finishedCount: 0,
        rank: null,
      })),
      turn: 0,
      dice: null,
      phase: "roll", // roll | move | over
      movable: [], // فهارس البيادق القابلة للتحريك (في طور move)
      lastEvent: null, // { type:"capture"|"home"|"move", ... }
      winners: [],
    };
  },

  publicState(state) {
    return state;
  },

  currentTurn(state) {
    return state.players[state.turn]?.id ?? null;
  },

  isOver(state) {
    return state.phase === "over";
  },

  applyAction(state, playerId, action) {
    const p = state.players[state.turn];
    if (!p || p.id !== playerId) return { error: "ليس دورك" };

    if (state.phase === "roll") {
      if (action.type !== "roll") return { error: "ارمِ النرد أولاً" };
      const dice = rollDie();
      state.dice = dice;
      state.lastEvent = null;
      const movable = movableTokens(state, p, dice);
      if (movable.length === 0) {
        // لا حركة ممكنة — ينتقل الدور (لا رمية إضافية حتى مع 6)
        endTurn(state, false);
        return { events: [{ type: "nomove" }] };
      }
      if (movable.length === 1) {
        // حركة وحيدة — نفّذها تلقائياً
        return doMove(state, p, movable[0]);
      }
      state.phase = "move";
      state.movable = movable;
      return { events: [{ type: "choose", movable }] };
    }

    if (state.phase === "move") {
      if (action.type !== "move") return { error: "اختر بيدقاً" };
      const ti = action.token;
      if (!state.movable.includes(ti)) return { error: "بيدق غير صالح" };
      return doMove(state, p, ti);
    }

    return { error: "غير متاح الآن" };
  },

  // ===== البوت =====
  botAction(state, playerId) {
    const p = state.players[state.turn];
    if (!p || p.id !== playerId) return null;
    if (state.phase === "roll") return { type: "roll" };
    if (state.phase === "move") {
      const ti = chooseBotToken(state, p, state.movable, state.dice);
      return { type: "move", token: ti };
    }
    return null;
  },
};

// البيادق التي يمكن تحريكها بهذا الرقم
function movableTokens(state, p, dice) {
  const out = [];
  p.tokens.forEach((s, i) => {
    if (s === HOME_STEP) return; // وصل البيت
    if (s === 0) {
      if (dice === 6) out.push(i); // يخرج بالـ6 فقط
    } else if (s + dice <= HOME_STEP) {
      out.push(i); // لا تجاوز للبيت
    }
  });
  return out;
}

function doMove(state, p, ti) {
  const from = p.tokens[ti];
  let to = from === 0 ? 1 : from + state.dice; // الخروج من القاعدة -> الخطوة 1
  p.tokens[ti] = to;

  let captured = false;
  let reachedHome = false;

  if (to === HOME_STEP) {
    reachedHome = true;
    p.finishedCount++;
    if (p.finishedCount === 4) {
      p.rank = state.winners.length + 1;
      state.winners.push(p.id);
    }
  } else {
    // الأكل: إن هبط على خانة مطلقة غير آمنة فيها بيادق خصوم
    const c = absCell(p.seat, to);
    if (c != null && !SAFE.has(c)) {
      for (const op of state.players) {
        if (op === p) continue;
        op.tokens.forEach((os, oi) => {
          if (os >= 1 && os <= LAST_MAIN && absCell(op.seat, os) === c) {
            op.tokens[oi] = 0; // عُد للقاعدة
            captured = true;
          }
        });
      }
    }
  }

  state.lastEvent = {
    type: reachedHome ? "home" : captured ? "capture" : "move",
    player: p.id,
    token: ti,
    from,
    to,
  };

  // نهاية اللعبة: بقي لاعب واحد لم يُنهِ؟
  const remaining = state.players.filter((x) => x.finishedCount < 4);
  if (remaining.length <= 1) {
    if (remaining.length === 1 && remaining[0].rank == null) {
      remaining[0].rank = state.winners.length + 1;
      state.winners.push(remaining[0].id);
    }
    state.phase = "over";
    state.movable = [];
    return { events: [{ type: "over" }] };
  }

  // رمية إضافية مع 6 أو أكل أو وصول بيت
  const extra = state.dice === 6 || captured || reachedHome;
  endTurn(state, extra);
  return { events: [{ type: state.lastEvent.type }] };
}

function endTurn(state, extra) {
  state.movable = [];
  if (extra) {
    state.phase = "roll";
    state.dice = state.dice; // يحتفظ بعرض النرد
    return;
  }
  advanceTurn(state);
  state.phase = "roll";
}

function advanceTurn(state) {
  const n = state.players.length;
  let t = state.turn;
  for (let i = 0; i < n; i++) {
    t = (t + 1) % n;
    if (state.players[t].finishedCount < 4) {
      state.turn = t;
      return;
    }
  }
}

// ===== ذكاء البوت البسيط =====
function chooseBotToken(state, p, movable, dice) {
  // 1) إن كان بإمكانه الأكل، افعل
  let best = null;
  let bestScore = -1;
  for (const ti of movable) {
    const s = p.tokens[ti];
    const to = s === 0 ? 1 : s + dice;
    let score = 0;
    if (to === HOME_STEP) score = 100; // إيصال بيدق للبيت أولوية
    else {
      const c = absCell(p.seat, to);
      if (c != null && !SAFE.has(c)) {
        for (const op of state.players) {
          if (op === p) continue;
          op.tokens.forEach((os) => {
            if (os >= 1 && os <= LAST_MAIN && absCell(op.seat, os) === c) score += 50; // أكل
          });
        }
      }
      if (s === 0) score += 10; // إخراج بيدق جديد جيد
      score += to / 10; // الأقرب للبيت أفضل قليلاً
    }
    if (score > bestScore) {
      bestScore = score;
      best = ti;
    }
  }
  return best ?? movable[0];
}
