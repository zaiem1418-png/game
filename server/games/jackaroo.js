// ===== لعبة جاكارو (Jackaroo) — منطق مرجعي على الخادم =====
// 4 لاعبين، فريقان (المتقابلان شركاء): 0&2 ضد 1&3.
// لكل لاعب 4 بيادق وأوراق في اليد. الأوراق تحرّك البيادق حول مسار 64 خانة.
// الخروج من البيت يكون بـ A أو K أو جوكر. الوصول لبيت النهاية (4 خانات) يتطلب رمية بالضبط.
// الأكل: الهبوط على بيدق خصم يعيده للبيت. لا يُؤكل الشريك ولا يُهبط على بيدق من نفس الفريق.
// تبسيط مقصود: الورقة 7 تتحرك 7 (دون تقسيم)، والجوكر يتحرك 18 أو يُخرج بيدقاً.

const COLORS = ["#e94f4f", "#37c26a", "#f5c451", "#3aa3ff"];
const LOOP = 64; // خانات المسار
const SEG = 16; // المسافة بين بدايات اللاعبين
const HOME_FIRST = 65; // أول خانة في بيت النهاية
const HOME_LAST = 68; // آخر خانة (4 خانات: 65..68)

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
// قيمة التقدّم لكل ورقة (الورقة 4 تتحرك للخلف، تُعالج بشكل خاص)
const FWD = { A: 1, K: 13, Q: 12, J: 11, "10": 10, "9": 9, "8": 8, "7": 7, "6": 6, "5": 5, "3": 3, "2": 2, JK: 18 };
const CAN_EXIT = new Set(["A", "K", "JK"]); // أوراق تُخرج بيدقاً من البيت

function offsetOf(seat) {
  return seat * SEG;
}
function absCell(seat, step) {
  if (step < 1 || step > LOOP) return null;
  return (offsetOf(seat) + step - 1) % LOOP;
}
function teamOf(seat) {
  return seat % 2;
}

// ===== تخطيط المقاعد/الفرق حسب عدد اللاعبين =====
// - لاعبان (1ضد1): مقعدان متقابلان (0 و 2)، كل لاعب في فريق مستقل = خصمان.
// - أربعة (2ضد2): الشركاء المتقابلون 0&2 (فريق A) ضد 1&3 (فريق B).
const SEAT_LAYOUTS = {
  2: [{ seat: 0, team: 0 }, { seat: 2, team: 1 }],
  4: [{ seat: 0, team: 0 }, { seat: 1, team: 1 }, { seat: 2, team: 0 }, { seat: 3, team: 1 }],
};
function seatLayout(n) {
  return SEAT_LAYOUTS[n] || SEAT_LAYOUTS[4];
}

function buildDeck() {
  const d = [];
  let id = 0;
  for (const s of SUITS) for (const r of RANKS) d.push({ id: id++, rank: r, suit: s });
  d.push({ id: id++, rank: "JK", suit: "🃏" });
  d.push({ id: id++, rank: "JK", suit: "🃏" });
  return shuffle(d);
}
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default {
  id: "jackaroo",
  title: "جاكارو",
  minHumans: 1,
  maxSeats: 4,
  defaultSeats: 4,

  // عدد اللاعبين حسب النمط: «1ضد1» = لاعبان، غير ذلك = أربعة (2ضد2)
  seatsForMode(mode) {
    return mode === "1v1" ? 2 : 4;
  },

  create({ players, mode }) {
    const deck = buildDeck();
    const layout = seatLayout(players.length);
    const st = {
      game: "jackaroo",
      mode: mode || (players.length <= 2 ? "1v1" : "normal"),
      players: players.map((p, i) => {
        const slot = layout[i] || { seat: i, team: teamOf(i) };
        return {
          id: p.id,
          name: p.name,
          avatar: p.avatar || "🧑",
          bot: !!p.bot,
          seat: slot.seat,
          team: slot.team,
          color: COLORS[slot.seat],
          marbles: [0, 0, 0, 0], // 0=البيت(القاعدة)، 1..64 مسار، 65..68 بيت النهاية
          hand: [],
          homeCount: 0,
        };
      }),
      deck,
      turn: 0,
      phase: "play",
      lastEvent: null,
      winnerTeam: null,
    };
    dealRound(st);
    return st;
  },

  // عرض خاص لكل لاعب: يخفي أوراق الآخرين (يبقي عددها فقط)،
  // ويرفق الحركات القانونية لصاحب الدور ليُظلّلها العميل.
  playerView(state, viewerId) {
    const viewer = state.players[state.turn];
    const myTurn = viewer && viewer.id === viewerId && state.phase === "play";
    return {
      ...state,
      deckCount: state.deck.length,
      deck: undefined,
      myLegal: myTurn ? legalPlays(state, viewer) : [],
      players: state.players.map((p) => ({
        ...p,
        hand: p.id === viewerId ? p.hand : null,
        handCount: p.hand.length,
      })),
    };
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
    if (state.phase !== "play") return { error: "غير متاح الآن" };

    const legal = legalPlays(state, p);

    if (action.type === "play") {
      const ci = action.card;
      const card = p.hand[ci];
      if (!card) return { error: "ورقة غير موجودة" };
      const move = legal.find((m) => m.card === ci && m.marble === action.marble);
      if (!move) return { error: "حركة غير مسموحة بهذه الورقة" };
      applyMove(state, p, move);
      p.hand.splice(ci, 1);
      return finishTurn(state, p);
    }

    if (action.type === "discard") {
      if (legal.length > 0) return { error: "لديك حركة متاحة — يجب اللعب" };
      const ci = action.card;
      if (!p.hand[ci]) return { error: "ورقة غير موجودة" };
      p.hand.splice(ci, 1);
      state.lastEvent = { type: "discard", player: p.id };
      return finishTurn(state, p);
    }

    return { error: "إجراء غير معروف" };
  },

  // ===== البوت =====
  botAction(state, playerId) {
    const p = state.players[state.turn];
    if (!p || p.id !== playerId) return null;
    const legal = legalPlays(state, p);
    if (legal.length === 0) {
      // لا حركة — تخلّص من أعلى ورقة
      if (p.hand.length === 0) return { type: "discard", card: 0 };
      return { type: "discard", card: worstCardIndex(p) };
    }
    legal.sort((a, b) => scoreMove(state, p, b) - scoreMove(state, p, a));
    const best = legal[0];
    return { type: "play", card: best.card, marble: best.marble };
  },
};

// ===== توزيع جولة جديدة =====
function dealRound(state) {
  if (state.deck.length < state.players.length * 4) state.deck = buildDeck();
  for (const p of state.players) p.hand = [];
  for (let k = 0; k < 4; k++) {
    for (const p of state.players) {
      if (state.deck.length === 0) state.deck = buildDeck();
      p.hand.push(state.deck.pop());
    }
  }
}

// ===== حساب الحركات القانونية للاعب =====
function legalPlays(state, p) {
  const out = [];
  p.hand.forEach((card, ci) => {
    p.marbles.forEach((step, mi) => {
      const move = resolveMove(state, p, card, step, mi);
      if (move) out.push({ card: ci, marble: mi, ...move });
    });
  });
  return out;
}

// يحسب وجهة بيدق لو لُعبت هذه الورقة عليه (أو null لو غير قانوني)
function resolveMove(state, p, card, step, mi) {
  // الخروج من البيت
  if (step === 0) {
    if (!CAN_EXIT.has(card.rank)) return null;
    const target = 1; // خانة البداية
    if (occupiedByAlly(state, p, p.seat, target)) return null;
    return { kind: "exit", to: target, capture: captureAt(state, p, p.seat, target) };
  }

  // بيدق في بيت النهاية لا يتحرك (وصل)
  if (step >= HOME_FIRST) return null;

  // الورقة 4 = للخلف
  if (card.rank === "4") {
    let to = step - 4;
    if (to < 1) to += LOOP; // التفاف على المسار
    if (occupiedByAlly(state, p, p.seat, to)) return null;
    return { kind: "back", to, capture: captureAt(state, p, p.seat, to) };
  }

  const dist = FWD[card.rank];
  if (dist == null) return null;
  const to = step + dist;
  if (to > HOME_LAST) return null; // تجاوز بيت النهاية ممنوع
  if (to >= HOME_FIRST) {
    // دخول بيت النهاية — لا يُهبط على خانة بيت مشغولة بنفس البيدق صاحبها
    if (occupiedOwnHome(p, to, mi)) return null;
    return { kind: "home", to, capture: false };
  }
  // البقاء على المسار
  if (occupiedByAlly(state, p, p.seat, to)) return null;
  return { kind: "move", to, capture: captureAt(state, p, p.seat, to) };
}

// خانة المسار مشغولة ببيدق من نفس الفريق؟
function occupiedByAlly(state, p, seat, step) {
  const c = absCell(seat, step);
  if (c == null) return false;
  for (const q of state.players) {
    if (q.team !== p.team) continue;
    for (let i = 0; i < 4; i++) {
      const s = q.marbles[i];
      if (s >= 1 && s <= LOOP && absCell(q.seat, s) === c) return true;
    }
  }
  return false;
}

// خانة بيت النهاية مشغولة ببيدق آخر لنفس اللاعب؟
function occupiedOwnHome(p, homeStep, mi) {
  return p.marbles.some((s, i) => i !== mi && s === homeStep);
}

// هل سيُؤكل بيدق خصم على هذه الخانة؟ (يُرجع {seat,marble} أو null)
function captureAt(state, p, seat, step) {
  const c = absCell(seat, step);
  if (c == null) return null;
  for (const q of state.players) {
    if (q.team === p.team) continue; // لا يُؤكل الفريق نفسه
    for (let i = 0; i < 4; i++) {
      const s = q.marbles[i];
      if (s >= 1 && s <= LOOP && absCell(q.seat, s) === c) return { seat: q.seat, marble: i };
    }
  }
  return null;
}

// ===== تنفيذ الحركة =====
function applyMove(state, p, move) {
  const mi = move.marble;
  if (move.capture) {
    const victim = state.players.find((q) => q.seat === move.capture.seat);
    if (victim) victim.marbles[move.capture.marble] = 0; // عودة للبيت
  }
  p.marbles[mi] = move.to;
  if (move.to >= HOME_FIRST) p.homeCount = p.marbles.filter((s) => s >= HOME_FIRST).length;
  state.lastEvent = {
    type: move.capture ? "capture" : move.kind === "home" ? "home" : "move",
    player: p.id,
    marble: mi,
    to: move.to,
  };
}

function finishTurn(state, p) {
  // فوز فريق: كل بيادق أعضائه في بيت النهاية (لاعب واحد في 1ضد1، شريكان في 2ضد2)
  const teams = [...new Set(state.players.map((q) => q.team))];
  for (const team of teams) {
    const mates = state.players.filter((q) => q.team === team);
    const allHome = mates.length > 0 && mates.every((q) => q.marbles.every((s) => s >= HOME_FIRST));
    if (allHome) {
      state.winnerTeam = team;
      state.phase = "over";
      return { events: [{ type: "over" }] };
    }
  }
  advanceTurn(state);
  // أعد التوزيع لو نفدت كل الأيدي
  if (state.players.every((q) => q.hand.length === 0)) dealRound(state);
  return { events: [{ type: state.lastEvent?.type || "move" }] };
}

function advanceTurn(state) {
  state.turn = (state.turn + 1) % state.players.length;
}

// ===== تقييم البوت =====
function scoreMove(state, p, move) {
  let s = 0;
  if (move.capture) s += 60;
  if (move.kind === "home") s += 80;
  if (move.kind === "exit") s += 25;
  if (move.kind === "move") s += move.to / 8; // الأقرب لبيت النهاية أفضل
  if (move.kind === "back") s += 2;
  return s;
}

function worstCardIndex(p) {
  // تخلّص من ورقة منخفضة القيمة (احتفظ بـ A/K/JK للخروج)
  let idx = 0;
  let low = Infinity;
  p.hand.forEach((c, i) => {
    const v = c.rank === "JK" ? 99 : CAN_EXIT.has(c.rank) ? 50 : FWD[c.rank] || 5;
    if (v < low) { low = v; idx = i; }
  });
  return idx;
}
