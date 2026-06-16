// ===== لعبة السلم والثعبان (Snakes & Ladders) — منطق مرجعي على الخادم =====
// لوحة 1..100 على شكل ثعبان (boustrophedon). كل لاعب له بيدق واحد يسابق إلى 100.
// رمي 6 يمنح رمية إضافية. يجب الوصول إلى 100 بالضبط؛ الزيادة تبقى مكانها.

const COLORS = ["#e94f4f", "#3aa3ff", "#37c26a", "#f5c451"];

// رأس الثعبان -> ذيله (ينزلق للأسفل)
const SNAKES = { 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 };
// أسفل السلّم -> أعلاه (يصعد)
const LADDERS = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100 };

function rollDie() {
  return 1 + Math.floor(Math.random() * 6);
}

export default {
  id: "snake",
  title: "السلم والثعبان",
  minHumans: 1,
  maxSeats: 4,
  defaultSeats: 4, // يُملأ الباقي ببوتات

  create({ players }) {
    return {
      game: "snake",
      snakes: SNAKES,
      ladders: LADDERS,
      players: players.map((p, i) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar || "🧑",
        bot: !!p.bot,
        color: COLORS[i % COLORS.length],
        pos: 0, // 0 = خارج اللوحة (البداية)
        finished: false,
        rank: null,
      })),
      turn: 0,
      dice: null,
      phase: "roll", // roll | over
      lastMove: null, // { id, from, to, via: "snake"|"ladder"|null }
      log: [],
      winners: [],
    };
  },

  // لا أسرار في هذه اللعبة — الحالة العامة = الحالة كاملة
  publicState(state) {
    return state;
  },

  currentTurn(state) {
    return state.players[state.turn]?.id ?? null;
  },

  isOver(state) {
    return state.phase === "over";
  },

  // اللاعب البشري: الإجراء الوحيد هو "رمي النرد"
  applyAction(state, playerId, action) {
    if (state.phase !== "roll") return { error: "ليس وقت الرمي" };
    const p = state.players[state.turn];
    if (!p || p.id !== playerId) return { error: "ليس دورك" };
    if (action.type !== "roll") return { error: "إجراء غير معروف" };

    const dice = rollDie();
    state.dice = dice;
    const from = p.pos;
    let to = from + dice;
    let via = null;

    if (to > 100) {
      to = from; // زيادة — يبقى مكانه
    } else {
      if (SNAKES[to] != null) {
        to = SNAKES[to];
        via = "snake";
      } else if (LADDERS[to] != null) {
        to = LADDERS[to];
        via = "ladder";
      }
    }
    p.pos = to;
    state.lastMove = { id: p.id, from, to, dice, via };

    let finishedNow = false;
    if (to === 100) {
      p.finished = true;
      p.rank = state.winners.length + 1;
      state.winners.push(p.id);
      finishedNow = true;
    }

    // انتهت اللعبة إذا بقي لاعب واحد فقط لم ينهِ
    const remaining = state.players.filter((x) => !x.finished);
    if (remaining.length <= 1) {
      if (remaining.length === 1) {
        const last = remaining[0];
        last.rank = state.winners.length + 1;
        state.winners.push(last.id);
      }
      state.phase = "over";
      return { events: [{ type: "move", via, finishedNow }, { type: "over" }] };
    }

    // رمي 6 (ولم ينهِ) = رمية إضافية لنفس اللاعب؛ غير ذلك ننتقل للتالي
    if (dice !== 6 || finishedNow) {
      advanceTurn(state);
    }
    return { events: [{ type: "move", via, finishedNow }] };
  },

  // قرار البوت: ببساطة يرمي
  botAction() {
    return { type: "roll" };
  },
};

function advanceTurn(state) {
  const n = state.players.length;
  let t = state.turn;
  for (let i = 0; i < n; i++) {
    t = (t + 1) % n;
    if (!state.players[t].finished) {
      state.turn = t;
      return;
    }
  }
}
