// ===== لعبة بلوت (Baloot) — محرك مرجعي على الخادم (v2) =====
// 4 لاعبين، فريقان (0&2 ضد 1&3). مجموعة 32 ورقة (7..A).
// مزايدة: تُقلب ورقة، ثم حكم (طرنيب = لون الورقة) أو صن (بلا طرنيب).
// مباراة كاملة حتى 152 «بنط» عبر جولات متعددة، مع:
//   • المشاريع (سرا 20 / خمسين 50 / مية 100) بقاعدة المقارنة + بلوت 20.
//   • تحويل نقاط الجولة إلى أبناط (الصن يُضاعف)، وتطبيق القَهر.
//   • تدوير الموزّع وانتقال الجولات تلقائياً.

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "10", "K", "Q", "J", "9", "8", "7"];

// ترتيب القوة (الأكبر يفوز) + النقاط
const SUN_ORDER = { A: 8, "10": 7, K: 6, Q: 5, J: 4, "9": 3, "8": 2, "7": 1 };
const SUN_PTS = { A: 11, "10": 10, K: 4, Q: 3, J: 2, "9": 0, "8": 0, "7": 0 };
const TRUMP_ORDER = { J: 8, "9": 7, A: 6, "10": 5, K: 4, Q: 3, "8": 2, "7": 1 };
const TRUMP_PTS = { J: 20, "9": 14, A: 11, "10": 10, K: 4, Q: 3, "8": 0, "7": 0 };

// ترتيب الأوراق للمشاريع (التسلسل الطبيعي للورق): A أعلى … 7 أدنى
const SEQ_ORDER = ["A", "K", "Q", "J", "10", "9", "8", "7"];
const SEQ_INDEX = Object.fromEntries(SEQ_ORDER.map((r, i) => [r, i]));

const MATCH_TARGET = 152; // أبناط الفوز بالمباراة
const LAST_TRICK_BONUS = 10; // «آخِر»
const BALOOT_VALUE = 20; // شايب+بنت الطرنيب

function teamOf(seat) {
  return seat % 2;
}
function buildDeck() {
  const d = [];
  let id = 0;
  for (const s of SUITS) for (const r of RANKS) d.push({ id: id++, rank: r, suit: s });
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// قوة ورقة ضمن الحيلة الحالية
function cardStrength(card, leadSuit, mode, trump) {
  if (mode === "hokom" && card.suit === trump) return 200 + TRUMP_ORDER[card.rank];
  if (card.suit === leadSuit) return 100 + SUN_ORDER[card.rank];
  return SUN_ORDER[card.rank]; // ورقة خارج اللون/الطرنيب لا تفوز
}
function cardPoints(card, mode, trump) {
  if (mode === "hokom" && card.suit === trump) return TRUMP_PTS[card.rank];
  return SUN_PTS[card.rank];
}

// ===== المشاريع =====
// يكتشف التسلسلات (سرا/خمسين/مية) داخل يد لاعب، حسب الترتيب الطبيعي للورق.
function detectSequences(hand) {
  const out = [];
  for (const suit of SUITS) {
    const idxs = hand
      .filter((c) => c.suit === suit)
      .map((c) => SEQ_INDEX[c.rank])
      .sort((a, b) => a - b);
    let run = [];
    for (let i = 0; i < idxs.length; i++) {
      if (run.length === 0 || idxs[i] === run[run.length - 1] + 1) {
        run.push(idxs[i]);
      } else {
        pushRun(out, suit, run);
        run = [idxs[i]];
      }
    }
    pushRun(out, suit, run);
  }
  return out;
}
function pushRun(out, suit, run) {
  if (run.length < 3) return;
  let type, value, label;
  if (run.length === 3) [type, value, label] = ["sira", 20, "سرا"];
  else if (run.length === 4) [type, value, label] = ["fifty", 50, "خمسين"];
  else [type, value, label] = ["hundred", 100, "مية"];
  out.push({ suit, value, type, label, len: run.length, topRank: SEQ_ORDER[run[0]] });
}

// قاعدة المقارنة: الفريق صاحب أعلى مشروع يحتسب كل مشاريعه؛ الآخر لا شيء.
// (تعادل تامّ في القيمة وأعلى ورقة → يُلغى الطرفان.)
function resolveProjects(state) {
  const perPlayer = state._projects || []; // [{seat, seqs:[...]}]
  const teamSeqs = [[], []];
  for (const pp of perPlayer) {
    for (const s of pp.seqs) teamSeqs[teamOf(pp.seat)].push({ ...s, seat: pp.seat });
  }
  const best = (arr) =>
    arr.reduce(
      (m, s) =>
        !m || s.value > m.value || (s.value === m.value && SEQ_INDEX[s.topRank] < SEQ_INDEX[m.topRank])
          ? s
          : m,
      null
    );
  const b0 = best(teamSeqs[0]);
  const b1 = best(teamSeqs[1]);

  let winTeam = null;
  if (b0 && !b1) winTeam = 0;
  else if (b1 && !b0) winTeam = 1;
  else if (b0 && b1) {
    if (b0.value !== b1.value) winTeam = b0.value > b1.value ? 0 : 1;
    else if (SEQ_INDEX[b0.topRank] !== SEQ_INDEX[b1.topRank])
      winTeam = SEQ_INDEX[b0.topRank] < SEQ_INDEX[b1.topRank] ? 0 : 1;
    else winTeam = null; // تعادل تامّ → يُلغى
  }

  const points = [0, 0];
  const shown = [];
  if (winTeam != null) {
    for (const s of teamSeqs[winTeam]) {
      points[winTeam] += s.value;
      shown.push({ team: winTeam, seat: s.seat, type: s.type, label: s.label, value: s.value, suit: s.suit });
    }
  }
  return { points, shown };
}

// تحويل نقاط الجولة الخام إلى أبناط: الصن يُضاعف ثم ÷10، الحكم ÷10 (تقريب لأقرب).
function toAbnat(raw, mode) {
  return mode === "sun" ? Math.round((raw * 2) / 10) : Math.round(raw / 10);
}

// ===== توزيع جولة جديدة =====
function dealRound(st) {
  const deck = buildDeck();
  for (const p of st.players) p.hand = [];
  for (let k = 0; k < 5; k++) for (const p of st.players) p.hand.push(deck.pop());
  st.deck = deck;
  st.flipped = deck.pop();
  st.phase = "bid";
  st.bidRound = 1;
  st.bidTurn = (st.dealer + 1) % 4; // يسار الموزّع يبدأ المزايدة
  st.passes = 0;
  st.mode = null;
  st.trump = null;
  st.buyerSeat = null;
  st.buyerTeam = null;
  st.turn = (st.dealer + 1) % 4;
  st.leadSuit = null;
  st.trick = [];
  st.trickCount = 0;
  st.teamPoints = [0, 0];
  st.lastTrickTeam = null;
  st._projects = null;
  st._baloot = null;
  st.lastEvent = { type: "deal", roundNo: st.roundNo };
}

export default {
  id: "baloot",
  title: "بلوت",
  minHumans: 1,
  maxSeats: 4,
  defaultSeats: 4,

  create({ players }) {
    const st = {
      game: "baloot",
      players: players.map((p, i) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar || "🧑",
        bot: !!p.bot,
        seat: i,
        team: teamOf(i),
        hand: [],
      })),
      dealer: 0,
      roundNo: 1,
      matchTarget: MATCH_TARGET,
      matchPoints: [0, 0], // أبناط الفريقين عبر الجولات
      roundSummary: null,
      winnerTeam: null,
      deck: [],
      flipped: null,
    };
    dealRound(st);
    return st;
  },

  playerView(state, viewerId) {
    const cur = state.phase === "play" ? state.players[state.turn] : null;
    const myPlayTurn = cur && cur.id === viewerId;
    const bidder = state.phase === "bid" ? state.players[state.bidTurn] : null;
    const myBidTurn = bidder && bidder.id === viewerId;
    const me = state.players.find((p) => p.id === viewerId);
    return {
      ...state,
      deck: undefined,
      _projects: undefined,
      _baloot: undefined,
      deckCount: state.deck.length,
      myLegal: myPlayTurn ? legalCards(state, cur) : null,
      myBid: myBidTurn ? bidOptions(state) : null,
      // مشاريعي أنا فقط (تظهر لي خلال الجولة كتلميح)
      myProjects: me && state._projects ? (state._projects.find((x) => x.seat === me.seat)?.seqs || []) : [],
      players: state.players.map((p) => ({
        ...p,
        hand: p.id === viewerId ? p.hand : null,
        handCount: p.hand.length,
      })),
    };
  },

  currentTurn(state) {
    if (state.phase === "bid") return state.players[state.bidTurn]?.id ?? null;
    if (state.phase === "play") return state.players[state.turn]?.id ?? null;
    // بين الجولات: يتقدّم بوت (بمهلة لطيفة) أو ينتظر زر البشري
    if (state.phase === "roundOver") {
      const bot = state.players.find((p) => p.bot);
      return bot ? bot.id : null;
    }
    return null;
  },
  isOver(state) {
    return state.phase === "over";
  },

  applyAction(state, playerId, action) {
    if (state.phase === "bid") return applyBid(state, playerId, action);
    if (state.phase === "play") return applyPlay(state, playerId, action);
    if (state.phase === "roundOver") {
      if (action.type !== "next") return { error: "غير متاح الآن" };
      if (!state.players.some((p) => p.id === playerId)) return { error: "لست في الطاولة" };
      return startNextRound(state);
    }
    return { error: "غير متاح الآن" };
  },

  botAction(state, playerId) {
    if (state.phase === "bid") {
      const p = state.players[state.bidTurn];
      if (!p || p.id !== playerId) return null;
      return botBid(state, p);
    }
    if (state.phase === "play") {
      const p = state.players[state.turn];
      if (!p || p.id !== playerId) return null;
      const legal = legalCards(state, p);
      const card = botPlay(state, p, legal);
      return { type: "play", card: card.id };
    }
    if (state.phase === "roundOver") {
      return { type: "next" }; // البوت يتقدّم للجولة التالية
    }
    return null;
  },
};

// ===== المزايدة =====
function bidOptions(state) {
  if (state.bidRound === 1) {
    return { round: 1, flipped: state.flipped, actions: ["hokom", "pass"] };
  }
  return { round: 2, actions: ["sun", "hokom_suit", "pass"], suits: SUITS };
}

function applyBid(state, playerId, action) {
  const p = state.players[state.bidTurn];
  if (!p || p.id !== playerId) return { error: "ليس دورك" };

  if (action.type === "pass") {
    state.passes++;
    state.lastEvent = { type: "pass", seat: p.seat };
    if (state.passes >= 4) {
      if (state.bidRound === 1) {
        state.bidRound = 2;
        state.passes = 0;
        state.bidTurn = (state.dealer + 1) % 4;
        return { events: [{ type: "round2" }] };
      }
      // الجولة الثانية وكلهم مرّروا — يُجبر الموزّع على صن (تفادي التوقف)
      return settleBid(state, state.dealer, "sun", null);
    }
    state.bidTurn = (state.bidTurn + 1) % 4;
    return { events: [{ type: "pass" }] };
  }

  if (action.type === "hokom" && state.bidRound === 1) {
    return settleBid(state, p.seat, "hokom", state.flipped.suit);
  }
  if (action.type === "sun" && state.bidRound === 2) {
    return settleBid(state, p.seat, "sun", null);
  }
  if (action.type === "hokom_suit" && state.bidRound === 2) {
    if (!SUITS.includes(action.suit)) return { error: "لون غير صالح" };
    return settleBid(state, p.seat, "hokom", action.suit);
  }
  return { error: "مزايدة غير صالحة" };
}

function settleBid(state, buyerSeat, mode, trump) {
  state.mode = mode;
  state.trump = trump;
  state.buyerSeat = buyerSeat;
  state.buyerTeam = teamOf(buyerSeat);

  // المشتري في الحكم يأخذ الورقة المقلوبة، وإلا تُعاد للمجموعة
  if (mode === "hokom") {
    state.players[buyerSeat].hand.push(state.flipped);
  } else {
    state.deck.push(state.flipped);
  }
  state.flipped = null;

  // وزّع الباقي حتى يصبح لكل لاعب 8
  for (const p of state.players) {
    while (p.hand.length < 8 && state.deck.length > 0) p.hand.push(state.deck.pop());
  }

  // اكتشف المشاريع والبلوت من الأيدي النهائية (مخفية حتى نهاية الجولة)
  state._projects = state.players.map((p) => ({ seat: p.seat, seqs: detectSequences(p.hand) }));
  state._baloot = null;
  if (mode === "hokom") {
    for (const p of state.players) {
      const hasK = p.hand.some((c) => c.suit === trump && c.rank === "K");
      const hasQ = p.hand.some((c) => c.suit === trump && c.rank === "Q");
      if (hasK && hasQ) {
        state._baloot = { seat: p.seat, team: teamOf(p.seat) };
        break;
      }
    }
  }

  state.phase = "play";
  state.turn = (state.dealer + 1) % 4; // يسار الموزّع يبدأ أول حيلة
  state.leadSuit = null;
  state.trick = [];
  state.lastEvent = { type: "bid", mode, trump, buyerSeat };
  return { events: [{ type: "bidDone" }] };
}

// ===== اللعب =====
function legalCards(state, p) {
  const hand = p.hand;
  if (state.trick.length === 0) return hand.slice(); // قائد الحيلة: أي ورقة

  const lead = state.leadSuit;
  const inLead = hand.filter((c) => c.suit === lead);
  const trumps = hand.filter((c) => state.mode === "hokom" && c.suit === state.trump);
  const { winnerSeat, bestTrumpStr } = currentWinner(state);
  const partnerWinning = winnerSeat != null && teamOf(winnerSeat) === teamOf(p.seat);

  if (state.mode === "sun") {
    return inLead.length ? inLead : hand.slice();
  }

  // حكم
  if (lead === state.trump) {
    if (inLead.length) {
      const higher = inLead.filter((c) => 200 + TRUMP_ORDER[c.rank] > bestTrumpStr);
      return higher.length ? higher : inLead;
    }
    return hand.slice();
  }

  if (inLead.length) return inLead;

  if (trumps.length && !partnerWinning) {
    const higher = trumps.filter((c) => 200 + TRUMP_ORDER[c.rank] > bestTrumpStr);
    return higher.length ? higher : trumps;
  }
  return hand.slice();
}

function currentWinner(state) {
  let winnerSeat = null;
  let bestStr = -1;
  let bestTrumpStr = -1;
  for (const t of state.trick) {
    const str = cardStrength(t.card, state.leadSuit, state.mode, state.trump);
    if (str > bestStr) {
      bestStr = str;
      winnerSeat = t.seat;
    }
    if (state.mode === "hokom" && t.card.suit === state.trump) {
      bestTrumpStr = Math.max(bestTrumpStr, 200 + TRUMP_ORDER[t.card.rank]);
    }
  }
  return { winnerSeat, bestTrumpStr };
}

function applyPlay(state, playerId, action) {
  const p = state.players[state.turn];
  if (!p || p.id !== playerId) return { error: "ليس دورك" };
  if (action.type !== "play") return { error: "العب ورقة" };

  const ci = p.hand.findIndex((c) => c.id === action.card);
  if (ci === -1) return { error: "ورقة غير موجودة" };
  const card = p.hand[ci];

  const legal = legalCards(state, p);
  if (!legal.some((c) => c.id === card.id)) return { error: "يجب اتباع اللون/الطرنيب" };

  if (state.trick.length === 0) state.leadSuit = card.suit;
  p.hand.splice(ci, 1);
  state.trick.push({ seat: p.seat, card });
  state.lastEvent = { type: "play", seat: p.seat, card };

  if (state.trick.length < 4) {
    state.turn = (state.turn + 1) % 4;
    return { events: [{ type: "play" }] };
  }

  // اكتملت الحيلة — احسب الفائز والنقاط
  const { winnerSeat } = currentWinner(state);
  const wTeam = teamOf(winnerSeat);
  const pts = state.trick.reduce((s, t) => s + cardPoints(t.card, state.mode, state.trump), 0);
  state.teamPoints[wTeam] += pts;
  state.lastTrickTeam = wTeam;
  state.trickCount++;
  state.lastEvent = { type: "trick", winnerSeat, pts, cards: state.trick.map((t) => t.card) };

  const finished = state.players.every((q) => q.hand.length === 0);
  state.trick = [];
  state.leadSuit = null;
  state.turn = winnerSeat;

  if (finished) {
    state.teamPoints[wTeam] += LAST_TRICK_BONUS; // آخِر
    return finishRound(state);
  }
  return { events: [{ type: "trick", winnerSeat }] };
}

function finishRound(state) {
  const buyer = state.buyerTeam;
  const opp = 1 - buyer;

  // المشاريع (تسلسلات) — قاعدة المقارنة
  const proj = resolveProjects(state);
  // البلوت (شايب+بنت الطرنيب) يُحتسب دائماً لصاحبه
  const balootTeam = state._baloot ? state._baloot.team : null;

  // النقاط الخام لكل فريق = أوراق + مشاريع تسلسلية
  const cardRaw = [state.teamPoints[0], state.teamPoints[1]];
  const rawWithProj = [cardRaw[0] + proj.points[0], cardRaw[1] + proj.points[1]];

  // نجاح المشتري: لا بد أن يتجاوز الخصم، وإلا قُهر (كل النقاط للخصم)
  const success = rawWithProj[buyer] > rawWithProj[opp];

  const abnat = [0, 0];
  if (success) {
    abnat[0] = toAbnat(rawWithProj[0], state.mode);
    abnat[1] = toAbnat(rawWithProj[1], state.mode);
  } else {
    const pot = rawWithProj[buyer] + rawWithProj[opp];
    abnat[opp] = toAbnat(pot, state.mode);
    abnat[buyer] = 0;
  }
  // البلوت يُضاف دائماً لصاحبه (حتى في القَهر)
  if (balootTeam != null) abnat[balootTeam] += toAbnat(BALOOT_VALUE, state.mode);

  state.matchPoints[0] += abnat[0];
  state.matchPoints[1] += abnat[1];

  const summary = {
    roundNo: state.roundNo,
    mode: state.mode,
    trump: state.trump,
    buyerTeam: buyer,
    cardPoints: cardRaw,
    projects: proj.shown,
    baloot: balootTeam != null ? { team: balootTeam, value: BALOOT_VALUE } : null,
    qahar: !success,
    abnatGained: abnat,
    matchPoints: [state.matchPoints[0], state.matchPoints[1]],
  };

  // انتهت المباراة؟ (تجاوز الهدف، مع حسم التعادل بمواصلة جولة أخرى)
  const m0 = state.matchPoints[0];
  const m1 = state.matchPoints[1];
  const reached = m0 >= state.matchTarget || m1 >= state.matchTarget;
  if (reached && m0 !== m1) {
    state.winnerTeam = m0 > m1 ? 0 : 1;
    summary.winnerTeam = state.winnerTeam;
    state.roundSummary = summary;
    state.phase = "over";
    state.lastEvent = { type: "matchOver", winnerTeam: state.winnerTeam };
    return { events: [{ type: "over" }] };
  }

  state.roundSummary = summary;
  state.phase = "roundOver";
  state.lastEvent = { type: "roundOver", roundNo: state.roundNo };
  return { events: [{ type: "roundOver" }] };
}

function startNextRound(state) {
  state.dealer = (state.dealer + 1) % 4; // تدوير الموزّع
  state.roundNo += 1;
  state.roundSummary = null;
  dealRound(state);
  return { events: [{ type: "deal", roundNo: state.roundNo }] };
}

// ===== بوت المزايدة =====
function botBid(state, p) {
  if (state.bidRound === 1) {
    const suit = state.flipped.suit;
    const inSuit = p.hand.filter((c) => c.suit === suit);
    const strong = inSuit.some((c) => c.rank === "J") || inSuit.some((c) => c.rank === "9") || inSuit.length >= 3;
    return strong ? { type: "hokom" } : { type: "pass" };
  }
  const aces = p.hand.filter((c) => c.rank === "A").length;
  const tens = p.hand.filter((c) => c.rank === "10").length;
  if (aces + tens >= 3) return { type: "sun" };
  let best = null,
    bestScore = 0;
  for (const s of SUITS) {
    const inS = p.hand.filter((c) => c.suit === s);
    let sc = inS.length;
    if (inS.some((c) => c.rank === "J")) sc += 3;
    if (inS.some((c) => c.rank === "9")) sc += 2;
    if (sc > bestScore) {
      bestScore = sc;
      best = s;
    }
  }
  if (bestScore >= 5) return { type: "hokom_suit", suit: best };
  if (p.seat === state.dealer) return { type: "sun" };
  return { type: "pass" };
}

// ===== بوت اللعب =====
function botPlay(state, p, legal) {
  if (state.trick.length === 0) {
    return legal.reduce((a, b) =>
      cardPoints(b, state.mode, state.trump) > cardPoints(a, state.mode, state.trump) ? b : a
    );
  }
  const { winnerSeat } = currentWinner(state);
  const partnerWinning = winnerSeat != null && teamOf(winnerSeat) === teamOf(p.seat);

  const winning = legal.filter((c) => beats(state, c));
  if (winning.length && !partnerWinning) {
    return winning.reduce((a, b) => (strengthOf(state, b) < strengthOf(state, a) ? b : a));
  }
  return legal.reduce((a, b) =>
    cardPoints(b, state.mode, state.trump) < cardPoints(a, state.mode, state.trump) ? b : a
  );
}

function strengthOf(state, card) {
  return cardStrength(card, state.leadSuit, state.mode, state.trump);
}
function beats(state, card) {
  const { winnerSeat } = currentWinner(state);
  if (winnerSeat == null) return true;
  const best = state.trick.reduce(
    (m, t) => Math.max(m, cardStrength(t.card, state.leadSuit, state.mode, state.trump)),
    -1
  );
  return cardStrength(card, state.leadSuit, state.mode, state.trump) > best;
}
