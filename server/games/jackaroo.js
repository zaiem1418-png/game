// ===== لعبة جاكارو (Jackaroo) — منطق القواعد الكامل على الخادم =====
// 4 لاعبين، فريقان (المتقابلان شركاء): 0&2 ضد 1&3. (1ضد1: مقعدان متقابلان = خصمان)
// لكل لاعب 4 بيادق و4 أوراق باليد. الأوراق تحرّك البيادق حول مسار 64 خانة ثم لبيت النهاية (4 خانات).
//
// ===== قيمة كل ورقة (كم حركة) + وظائفها الخاصة =====
//   A  (إيس)  : إخراج بيدق من البيت، أو التقدّم 1 أو 11 (متعدد الخيارات).
//   K  (ملك)  : إخراج بيدق من البيت، أو التقدّم 13 ويأكل كل بيدق خصم يمرّ عليه.
//   Q  (بنت)  : التقدّم 12.
//   J  (ولد)  : «كرت التبديل» — يبدّل أحد بيادقك مع بيدق خصم على المسار (ليس في البيت/البداية الآمنة).
//   10        : التقدّم 10، أو «كرت الإيقاف» — يفقد اللاعب التالي دوره (متعدد الخيارات).
//   9،8،6،5،3،2 : التقدّم بقيمة الورقة.
//   7         : «كرت التقسيم» — توزيع 7 خطوات على بيدق واحد أو بيدقين (متعدد الخيارات).
//   4         : التحرّك 4 خطوات للخلف.
//   جوكر JK   : إخراج بيدق، أو التقدّم 18 ويأكل كل بيدق خصم يمرّ عليه (متعدد الخيارات).
//
// الأكل: الهبوط على بيدق خصم (أو المرور عليه بـ K/JK) يعيده للبيت. لا يُؤكل الشريك.
// الخانة الآمنة: بيدق على «خانة بدايته» لا يُؤكل ولا يُبدّل ولا يُهبط عليه من الفريق نفسه.
// بيت النهاية يتطلّب وصولاً بالعدد بالضبط — لا يجوز التجاوز.

const COLORS = ["#e94f4f", "#37c26a", "#f5c451", "#3aa3ff"];
const LOOP = 64; // خانات المسار
const SEG = 16; // المسافة بين بدايات اللاعبين
const HOME_FIRST = 65; // أول خانة في بيت النهاية
const HOME_LAST = 68; // آخر خانة (4 خانات: 65..68)

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

// الأوراق العادية: تقدّم بقيمة ثابتة وخيار واحد لكل بيدق
// (الورقة 5 لها معالجة خاصة: تحرّك أي حجر على المسار، حتى حجر الخصم)
const STEP = { Q: 12, "9": 9, "8": 8, "6": 6, "3": 3, "2": 2 };
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

// ===== خانتا العبور: منتصفا الجانبين (يسار/يمين) — اختصار للطرف المقابل =====
// تُفعّل في 1ضد1 فقط؛ في 4 لاعبين تتطابق هاتان الخليّتان مع بدايات لاعبَي اليسار/اليمين.
const CROSS_CELLS = [16, 48];
function relStep(seat, abs) {
  return ((abs - offsetOf(seat)) % LOOP + LOOP) % LOOP + 1;
}
function crossEnabled(state) {
  return state.players.length <= 2;
}
// إن هبط البيدق (خطوة نسبية 1..64) على خانة عبور، يُرجع خطوة الوصول للخانة المقابلة
// (للأمام فقط، حتى لا يرجع البيدق) — وإلا يُرجع الخطوة كما هي.
function crossStep(state, seat, to) {
  if (!crossEnabled(state) || !(to >= 1 && to <= LOOP)) return to;
  const c = absCell(seat, to);
  const other = c === CROSS_CELLS[0] ? CROSS_CELLS[1] : c === CROSS_CELLS[1] ? CROSS_CELLS[0] : -1;
  if (other < 0) return to;
  const s = relStep(seat, other);
  return s > to ? s : to;
}

// ===== تخطيط المقاعد/الفرق حسب عدد اللاعبين =====
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
      skipNext: false, // تفعّله ورقة الإيقاف (10)
      lastEvent: null,
      winnerTeam: null,
    };
    dealRound(st);
    return st;
  },

  // عرض خاص لكل لاعب: يخفي أوراق الآخرين (يبقي عددها)،
  // ويرفق الحركات القانونية لصاحب الدور (مع وسومها) ليعرضها العميل.
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
      // نطابق بالخيار (opt) لأن الورقة الواحدة قد تحمل عدة خيارات
      const move = legal.find((m) => m.card === ci && m.opt === action.opt);
      if (!move) return { error: "حركة غير مسموحة بهذه الورقة" };
      applyMove(state, p, move);
      // أرفِق الورقة الملعوبة بالحدث ليعرضها كل اللاعبين (أنميشن رمي الكرت)
      if (state.lastEvent) state.lastEvent.card = { rank: card.rank, suit: card.suit };
      p.hand.splice(ci, 1);
      return finishTurn(state, p);
    }

    if (action.type === "discard") {
      if (legal.length > 0) return { error: "لديك حركة متاحة — يجب اللعب" };
      const ci = action.card;
      const dcard = p.hand[ci];
      if (!dcard) return { error: "ورقة غير موجودة" };
      p.hand.splice(ci, 1);
      state.lastEvent = { type: "discard", player: p.id, card: { rank: dcard.rank, suit: dcard.suit } };
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
      if (p.hand.length === 0) return { type: "discard", card: 0 };
      return { type: "discard", card: worstCardIndex(p) };
    }
    legal.sort((a, b) => scoreMove(state, p, b) - scoreMove(state, p, a));
    const best = legal[0];
    return { type: "play", card: best.card, opt: best.opt };
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
    for (const e of entriesForCard(state, p, card)) out.push({ card: ci, ...e });
  });
  return out;
}

// كل الخيارات القانونية لورقة واحدة (قد تكون عدة خيارات للورقة الواحدة)
function entriesForCard(state, p, card) {
  const r = card.rank;
  const E = [];
  const add = (e) => { if (e) E.push(e); };

  // إخراج بيدق من البيت (A / K / جوكر)
  if (CAN_EXIT.has(r)) {
    p.marbles.forEach((step, mi) => {
      if (step === 0) add(exitEntry(state, p, mi));
    });
  }

  if (r === "A") {
    onPath(p, (mi, step) => {
      add(fwd(state, p, mi, step, 1, `a1:${mi}`, "تقدّم 1"));
      add(fwd(state, p, mi, step, 11, `a11:${mi}`, "تقدّم 11"));
    });
  } else if (r === "K") {
    onPath(p, (mi, step) => add(fwd(state, p, mi, step, 13, `m:${mi}`, "تقدّم 13", { through: true })));
  } else if (r === "JK") {
    onPath(p, (mi, step) => add(fwd(state, p, mi, step, 18, `m:${mi}`, "تقدّم 18", { through: true })));
  } else if (r === "10") {
    onPath(p, (mi, step) => add(fwd(state, p, mi, step, 10, `m:${mi}`, "تقدّم 10")));
    add({ marble: -1, kind: "stop", to: null, caps: [], cap: false, opt: "stop", label: "⛔ إيقاف اللاعب التالي" });
  } else if (r === "7") {
    for (const e of splitEntries(state, p)) add(e);
  } else if (r === "J") {
    for (const e of swapEntries(state, p)) add(e);
  } else if (r === "5") {
    // 5: تحرّك أي حجر على المسار (حجرك أو حجر خصم) 5 خطوات
    for (const e of shoveEntries(state, p)) add(e);
  } else if (r === "4") {
    onPath(p, (mi, step) => add(backEntry(state, p, mi, step)));
  } else if (r in STEP) {
    const d = STEP[r];
    onPath(p, (mi, step) => add(fwd(state, p, mi, step, d, `m:${mi}`, `تقدّم ${d}`)));
  }

  return E;
}

// مرّ على بيادق اللاعب الموجودة على المسار (1..64)
function onPath(p, fn) {
  p.marbles.forEach((step, mi) => {
    if (step >= 1 && step <= LOOP) fn(mi, step);
  });
}

// إخراج بيدق من البيت إلى خانة البداية (step 1)
function exitEntry(state, p, mi) {
  const to = 1;
  if (occupiedByAlly(state, p, p.seat, to)) return null;
  if (isWallAt(state, p, absCell(p.seat, to))) return null; // سدّ خصم على قاعدتي
  return { marble: mi, kind: "exit", to, ...capData(state, p, p.seat, to), opt: `exit:${mi}`, label: "🚀 إخراج للقاعدة" };
}

// حركة للأمام بمقدار dist (مع أكل ما يمرّ عليه إن كانت through مثل K/JK)
function fwd(state, p, mi, step, dist, opt, label, o = {}) {
  const to = step + dist;
  if (to > HOME_LAST) return null; // تجاوز بيت النهاية ممنوع
  const walkEnd = Math.min(to, LOOP);
  let caps = [];
  if (o.through) {
    // K/JK: يخترقان السدّ ويأكلان كل حجر خصم في الطريق (حتى المحميّ)
    for (let s = step + 1; s <= walkEnd; s++) {
      const v = captureAt(state, p, p.seat, s, true);
      if (v) caps.push(v);
    }
  } else {
    // الأوراق العادية: السدّ يمنع التجاوز والهبوط على خانة محميّة لخصم
    for (let s = step + 1; s <= walkEnd; s++) {
      if (isWallAt(state, p, absCell(p.seat, s))) return null;
    }
  }
  if (to >= HOME_FIRST) {
    if (occupiedOwnHome(p, to, mi)) return null; // خانة بيت مشغولة ببيدق آخر لي
    return { marble: mi, kind: "home", to, caps, cap: caps.length > 0, opt, label };
  }
  // هبوط على المسار — إن كان على خانة عبور انتقل للخانة المقابلة (الطرف الآخر)
  const landing = crossStep(state, p.seat, to);
  const crossed = landing !== to;
  if (crossed && isWallAt(state, p, absCell(p.seat, landing))) return null; // سدّ على خانة العبور
  if (occupiedByAlly(state, p, p.seat, landing)) return null; // لا هبوط على بيدق من فريقي
  if (!o.through || crossed) {
    // للأوراق العادية: أكل خانة الوصول. وللأوراق التي تمرّ وتأكل (K/JK): أضِف أكل خانة الوصول بعد العبور.
    const v = captureAt(state, p, p.seat, landing);
    if (v) { if (o.through) caps.push(v); else caps = [v]; }
  }
  return {
    marble: mi, kind: "move", to: landing, crossed,
    caps, cap: caps.length > 0,
    opt, label: crossed ? `${label} ⇄ عبور` : label,
  };
}

// الورقة 4 — للخلف
function backEntry(state, p, mi, step) {
  let to = step - 4;
  if (to < 1) to += LOOP; // التفاف على المسار
  if (isWallAt(state, p, absCell(p.seat, to))) return null; // سدّ خصم على خانة الوصول
  if (occupiedByAlly(state, p, p.seat, to)) return null;
  return { marble: mi, kind: "back", to, ...capData(state, p, p.seat, to), opt: `b:${mi}`, label: "↩ للخلف 4" };
}

// ===== ورقة 5: دفع أي حجر على المسار 5 خطوات (حجرك أو حجر خصم) =====
function shoveEntries(state, p) {
  const out = [];
  for (const owner of state.players) {
    owner.marbles.forEach((s, mi) => {
      if (!(s >= 1 && s <= LOOP)) return; // على المسار فقط
      if (isProtected(owner, mi)) return; // الحجر المحميّ (السدّ) لا يُحرَّك
      const e = shoveOne(state, owner, mi, 5);
      if (!e) return;
      const who = owner.id === p.id ? "حجرك" : owner.name;
      out.push({
        ...e,
        opt: `sh:${owner.seat}:${mi}`,
        label: `▶ 5 ${who} (حجر ${mi + 1})${e.cap ? " 💥" : ""}`,
      });
    });
  }
  return out;
}

// دفع حجر يملكه owner بمقدار dist على المسار (لا يدخل بيت نهايته)
function shoveOne(state, owner, mi, dist) {
  const step = owner.marbles[mi];
  const to = step + dist;
  if (to > LOOP) return null; // لا يُدفَع الحجر إلى بيت نهايته
  for (let s = step + 1; s <= to; s++) {
    if (isWallAt(state, owner, absCell(owner.seat, s))) return null; // سدّ يمنع المرور
  }
  const landing = crossStep(state, owner.seat, to);
  if (landing !== to && isWallAt(state, owner, absCell(owner.seat, landing))) return null;
  if (occupiedByAlly(state, owner, owner.seat, landing)) return null;
  const v = captureAt(state, owner, owner.seat, landing);
  return { marble: mi, ownerSeat: owner.seat, kind: "shove", to: landing, caps: v ? [v] : [], cap: !!v };
}

// كرت التبديل (J): بدّل أحد بيادقك مع أي بيدق آخر في اللعب (شريك أو خصم) على المسار
// المستثنى: بيادقك أنت، وما هو في البيت/على قاعدته/في الحارة/محميّ بالسدّ.
function swapEntries(state, p) {
  const out = [];
  const mine = [];
  p.marbles.forEach((step, mi) => { if (step >= 2 && step <= LOOP) mine.push(mi); }); // ليس على بدايتي الآمنة
  for (const mi of mine) {
    for (const q of state.players) {
      if (q.id === p.id) continue; // لا تبديل مع بيادقك أنت
      const mate = q.team === p.team; // شريك أم خصم؟
      q.marbles.forEach((qs, qmi) => {
        if (!(qs >= 1 && qs <= LOOP)) return; // الهدف على المسار
        if (isProtected(q, qmi)) return; // الهدف محميّ (سدّ/قاعدة) لا يُبدّل
        out.push({
          marble: mi, kind: "swap",
          target: { seat: q.seat, marble: qmi },
          targetName: q.name, mate,
          to: null, caps: [], cap: false,
          opt: `sw:${mi}:${q.seat}:${qmi}`,
          label: `🔄 تبديل ↔ ${q.name}${mate ? " (شريك)" : ""}`,
        });
      });
    }
  }
  return out;
}

// كرت التقسيم (7): 7 على بيدق واحد، أو توزيعها على بيدقين
function splitEntries(state, p) {
  const out = [];
  const seen = new Set();
  const path = [];
  p.marbles.forEach((step, mi) => { if (step >= 1 && step <= LOOP) path.push({ mi, step }); });

  // كامل الـ7 على بيدق واحد
  for (const { mi, step } of path) {
    const e = fwd(state, p, mi, step, 7, `m:${mi}`, "تقدّم 7");
    if (e) out.push(e);
  }
  // تقسيم على بيدقين مختلفين
  for (let i = 0; i < path.length; i++) {
    for (let j = 0; j < path.length; j++) {
      if (i === j) continue;
      const A = path[i], B = path[j];
      for (let a = 1; a <= 6; a++) {
        const b = 7 - a;
        const key = [`${A.mi}:${a}`, `${B.mi}:${b}`].sort().join("|");
        if (seen.has(key)) continue;
        const ea = fwd(state, p, A.mi, A.step, a, "", "");
        const eb = fwd(state, p, B.mi, B.step, b, "", "");
        if (!ea || !eb) continue;
        seen.add(key);
        out.push({
          marble: A.mi, kind: "split",
          parts: [{ marble: A.mi, to: ea.to, caps: ea.caps }, { marble: B.mi, to: eb.to, caps: eb.caps }],
          to: null,
          caps: [...ea.caps, ...eb.caps], cap: ea.caps.length + eb.caps.length > 0,
          opt: `sp:${A.mi}+${a}_${B.mi}+${b}`,
          label: `✂ تقسيم: بيدق${A.mi + 1}+${a} و بيدق${B.mi + 1}+${b}`,
        });
      }
    }
  }
  return out;
}

// بيانات الأكل عند الهبوط على خانة (لخانة واحدة)
function capData(state, p, seat, step) {
  const v = captureAt(state, p, seat, step);
  return { caps: v ? [v] : [], cap: !!v };
}

// ===== السدّ (التسنيد) =====
// حجر «محميّ» إذا كان على خانة بدايته (القاعدة)، أو ملاصقاً لحجر آخر لنفس اللاعب (زوج = سدّ).
// المحميّ لا يُؤكل ولا يُبدّل ولا يُتجاوز ولا يُحرَّك بورقة الغير (5).
function isProtected(q, i) {
  const s = q.marbles[i];
  if (!(s >= 1 && s <= LOOP)) return false;
  if (s === 1) return true; // على قاعدته (خانة البداية الآمنة)
  return q.marbles.some(
    (s2, j) => j !== i && (s2 === s - 1 || s2 === s + 1) && s2 >= 1 && s2 <= LOOP
  );
}

// هل الخانة المطلقة c سدٌّ في وجه اللاعب p؟ (حجر خصم محميّ عليها)
function isWallAt(state, p, c) {
  if (c == null) return false;
  for (const q of state.players) {
    if (q.team === p.team) continue; // أسوار الخصوم فقط تصدّنا
    for (let i = 0; i < 4; i++) {
      const s = q.marbles[i];
      if (s >= 1 && s <= LOOP && absCell(q.seat, s) === c && isProtected(q, i)) return true;
    }
  }
  return false;
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

// بيدق خصم على هذه الخانة يُؤكل؟ (المحميّ لا يُؤكل إلا بورقة تخترق: K/JK عبر ignoreProtection)
// يُرجع {seat,marble} أو null
function captureAt(state, p, seat, step, ignoreProtection) {
  const c = absCell(seat, step);
  if (c == null) return null;
  for (const q of state.players) {
    if (q.team === p.team) continue; // لا يُؤكل الفريق نفسه
    for (let i = 0; i < 4; i++) {
      const s = q.marbles[i];
      if (s >= 1 && s <= LOOP && absCell(q.seat, s) === c) {
        if (!ignoreProtection && isProtected(q, i)) continue; // محميّ (سدّ/قاعدة) لا يُؤكل
        return { seat: q.seat, marble: i };
      }
    }
  }
  return null;
}

// ===== تنفيذ الحركة =====
function applyMove(state, p, move) {
  if (move.kind === "stop") {
    state.skipNext = true;
    state.lastEvent = { type: "stop", player: p.id };
    return;
  }

  if (move.kind === "swap") {
    const q = state.players.find((x) => x.seat === move.target.seat);
    if (q) {
      const a = p.marbles[move.marble];
      const b = q.marbles[move.target.marble];
      p.marbles[move.marble] = b;
      q.marbles[move.target.marble] = a;
      recountHome(p);
      recountHome(q);
    }
    state.lastEvent = { type: "swap", player: p.id };
    return;
  }

  if (move.kind === "split") {
    for (const part of move.parts) for (const c of part.caps) sendHome(state, c);
    for (const part of move.parts) p.marbles[part.marble] = part.to;
    recountHome(p);
    state.lastEvent = { type: move.cap ? "capture" : "split", player: p.id };
    return;
  }

  // shove (ورقة 5): تحريك حجر قد لا يكون ملك اللاعب الحالي
  if (move.kind === "shove") {
    for (const c of move.caps || []) sendHome(state, c);
    const owner = state.players.find((x) => x.seat === move.ownerSeat);
    if (owner) { owner.marbles[move.marble] = move.to; recountHome(owner); }
    state.lastEvent = { type: move.cap ? "capture" : "move", player: p.id };
    return;
  }

  // exit / move / back / home
  for (const c of move.caps || []) sendHome(state, c);
  p.marbles[move.marble] = move.to;
  recountHome(p);
  state.lastEvent = {
    type: move.cap ? "capture" : move.kind === "home" ? "home" : move.crossed ? "cross" : "move",
    player: p.id,
    marble: move.marble,
    to: move.to,
  };
}

function sendHome(state, c) {
  const v = state.players.find((x) => x.seat === c.seat);
  if (v) v.marbles[c.marble] = 0; // عودة للبيت
}
function recountHome(p) {
  p.homeCount = p.marbles.filter((s) => s >= HOME_FIRST).length;
}

function finishTurn(state, p) {
  // فوز فريق: كل بيادق أعضائه في بيت النهاية
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
  if (state.players.every((q) => q.hand.length === 0)) dealRound(state);
  return { events: [{ type: state.lastEvent?.type || "move" }] };
}

function advanceTurn(state) {
  const n = state.players.length;
  const steps = state.skipNext ? 2 : 1; // كرت الإيقاف: يُفقد اللاعب التالي دوره
  state.skipNext = false;
  state.turn = (state.turn + steps) % n;
  // إن نفدت كل الأيدي سيُعاد التوزيع لاحقاً في finishTurn
  if (state.players.every((q) => q.hand.length === 0)) return;
  // تخطَّ اللاعبين الذين نفدت أوراقهم (قد تختلّ الأعداد بسبب كرت الإيقاف)
  let guard = 0;
  while (state.players[state.turn].hand.length === 0 && guard < n) {
    state.turn = (state.turn + 1) % n;
    guard++;
  }
}

// ===== تقييم البوت =====
function scoreMove(state, p, move) {
  let s = 0;
  const caps = move.caps?.length || 0;
  if (caps) s += 55 * caps;
  if (move.kind === "home") s += 80;
  if (move.kind === "exit") s += 25;
  if (move.kind === "swap") {
    // تبديل الخصم: خذ موقعه المتقدّم وأرجعه للخلف. تبديل الشريك نادراً ما يفيد.
    const myStep = p.marbles[move.marble];
    const tgt = state.players.find((x) => x.seat === move.target.seat);
    const tStep = tgt ? tgt.marbles[move.target.marble] : myStep;
    s += move.mate ? 2 : 20 + Math.max(0, tStep - myStep) * 1.2;
  }
  if (move.kind === "split") s += 14;
  if (move.kind === "stop") s += 12;
  if (move.kind === "move") s += (move.to || 0) / 8;
  if (move.kind === "back") s += 2;
  if (move.kind === "shove") s += move.cap ? 50 : 5; // ورقة 5: الأكل أفضل، وإلا حركة بسيطة
  return s;
}

function worstCardIndex(p) {
  // تخلّص من ورقة منخفضة القيمة (احتفظ بـ A/K/JK للخروج)
  let idx = 0;
  let low = Infinity;
  p.hand.forEach((c, i) => {
    const v = c.rank === "JK" ? 99 : CAN_EXIT.has(c.rank) ? 50 : STEP[c.rank] || 5;
    if (v < low) { low = v; idx = i; }
  });
  return idx;
}
