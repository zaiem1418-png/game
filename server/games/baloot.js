// ===== لعبة بلوت (Baloot) — منطق مرجعي على الخادم =====
// 4 لاعبين، فريقان (0&2 ضد 1&3). مجموعة 32 ورقة (7..A).
// مزايدة مبسّطة: تُقلب ورقة، ثم حكم (طرنيب = لون الورقة) أو صن (بلا طرنيب).
// قواعد اتباع اللون والطرنيب الإلزامية، وحساب نقاط جولة واحدة.
// تبسيط مقصود (v1): جولة واحدة، بدون مشاريع (سرا/بلوت/مية)، الفائز صاحب النقاط الأكثر.

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "10", "K", "Q", "J", "9", "8", "7"];

// ترتيب القوة (الأكبر يفوز) + النقاط
const SUN_ORDER = { A: 8, "10": 7, K: 6, Q: 5, J: 4, "9": 3, "8": 2, "7": 1 };
const SUN_PTS = { A: 11, "10": 10, K: 4, Q: 3, J: 2, "9": 0, "8": 0, "7": 0 };
const TRUMP_ORDER = { J: 8, "9": 7, A: 6, "10": 5, K: 4, Q: 3, "8": 2, "7": 1 };
const TRUMP_PTS = { J: 20, "9": 14, A: 11, "10": 10, K: 4, Q: 3, "8": 0, "7": 0 };

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

export default {
  id: "baloot",
  title: "بلوت",
  minHumans: 1,
  maxSeats: 4,
  defaultSeats: 4,

  create({ players }) {
    const deck = buildDeck();
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
      deck,
      dealer: 0,
      phase: "bid", // bid | play | over
      bidRound: 1,
      bidTurn: 1, // يسار الموزّع يبدأ
      passes: 0,
      flipped: null,
      mode: null, // hokom | sun
      trump: null,
      buyerSeat: null,
      buyerTeam: null,
      turn: 1,
      leadSuit: null,
      trick: [], // [{seat, card}]
      trickCount: 0,
      teamPoints: [0, 0],
      lastTrickTeam: null,
      lastEvent: null,
      winnerTeam: null,
    };
    // وزّع 5 لكل لاعب واقلب ورقة
    for (let k = 0; k < 5; k++) for (const p of st.players) p.hand.push(st.deck.pop());
    st.flipped = st.deck.pop();
    return st;
  },

  playerView(state, viewerId) {
    const cur = state.phase === "play" ? state.players[state.turn] : null;
    const myPlayTurn = cur && cur.id === viewerId;
    const bidder = state.phase === "bid" ? state.players[state.bidTurn] : null;
    const myBidTurn = bidder && bidder.id === viewerId;
    return {
      ...state,
      deck: undefined,
      deckCount: state.deck.length,
      myLegal: myPlayTurn ? legalCards(state, cur) : null,
      myBid: myBidTurn ? bidOptions(state) : null,
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
    return null;
  },
  isOver(state) {
    return state.phase === "over";
  },

  applyAction(state, playerId, action) {
    if (state.phase === "bid") return applyBid(state, playerId, action);
    if (state.phase === "play") return applyPlay(state, playerId, action);
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
    // انتهى الدور بالكامل؟
    if (state.passes >= 4) {
      if (state.bidRound === 1) {
        state.bidRound = 2;
        state.passes = 0;
        state.bidTurn = (state.dealer + 1) % 4;
        return { events: [{ type: "round2" }] };
      }
      // الجولة الثانية وكلهم مرّروا — يُجبر الموزّع على صن (تبسيط لتفادي التوقف)
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
    // قِيد بالطرنيب: يجب الزيادة إن أمكن
    if (inLead.length) {
      const higher = inLead.filter((c) => 200 + TRUMP_ORDER[c.rank] > bestTrumpStr);
      return higher.length ? higher : inLead;
    }
    return hand.slice(); // لا طرنيب — أي ورقة
  }

  // لون عادي مقود
  if (inLead.length) return inLead;

  // فارغ من اللون
  if (trumps.length && !partnerWinning) {
    // يجب القطع بالطرنيب، والزيادة إن أمكن
    const higher = trumps.filter((c) => 200 + TRUMP_ORDER[c.rank] > bestTrumpStr);
    return higher.length ? higher : trumps;
  }
  return hand.slice(); // شريكه فايز أو لا طرنيب — حرّ
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
  let pts = state.trick.reduce((s, t) => s + cardPoints(t.card, state.mode, state.trump), 0);
  state.teamPoints[wTeam] += pts;
  state.lastTrickTeam = wTeam;
  state.trickCount++;

  state.lastEvent = { type: "trick", winnerSeat, pts, cards: state.trick.map((t) => t.card) };

  // الحيلة الأخيرة: +10 «آخر»
  const finished = state.players.every((q) => q.hand.length === 0);
  state.trick = [];
  state.leadSuit = null;
  state.turn = winnerSeat;

  if (finished) {
    state.teamPoints[wTeam] += 10; // آخر
    return finishRound(state);
  }
  return { events: [{ type: "trick", winnerSeat }] };
}

function finishRound(state) {
  const [t0, t1] = state.teamPoints;
  const buyer = state.buyerTeam;
  const buyerPts = state.teamPoints[buyer];
  const oppPts = state.teamPoints[1 - buyer];

  // المشترون يجب أن يتجاوزوا الخصم وإلا «قُهروا» (كل النقاط للخصم)
  let winnerTeam;
  if (buyerPts > oppPts) winnerTeam = buyer;
  else winnerTeam = 1 - buyer;

  state.winnerTeam = winnerTeam;
  state.qahar = buyerPts <= oppPts; // هل قُهر المشترون؟
  state.phase = "over";
  state.lastEvent = { type: "over", t0, t1, winnerTeam };
  return { events: [{ type: "over" }] };
}

// ===== بوت المزايدة =====
function botBid(state, p) {
  if (state.bidRound === 1) {
    const suit = state.flipped.suit;
    const inSuit = p.hand.filter((c) => c.suit === suit);
    const strong = inSuit.some((c) => c.rank === "J") || inSuit.some((c) => c.rank === "9") || inSuit.length >= 3;
    return strong ? { type: "hokom" } : { type: "pass" };
  }
  // الجولة 2
  const aces = p.hand.filter((c) => c.rank === "A").length;
  const tens = p.hand.filter((c) => c.rank === "10").length;
  if (aces + tens >= 3) return { type: "sun" };
  // أفضل لون للحكم
  let best = null, bestScore = 0;
  for (const s of SUITS) {
    const inS = p.hand.filter((c) => c.suit === s);
    let sc = inS.length;
    if (inS.some((c) => c.rank === "J")) sc += 3;
    if (inS.some((c) => c.rank === "9")) sc += 2;
    if (sc > bestScore) { bestScore = sc; best = s; }
  }
  if (bestScore >= 5) return { type: "hokom_suit", suit: best };
  // الموزّع مُجبر على عدم التوقف
  if (p.seat === state.dealer) return { type: "sun" };
  return { type: "pass" };
}

// ===== بوت اللعب =====
function botPlay(state, p, legal) {
  if (state.trick.length === 0) {
    // قُد بأقوى ورقة خارج الطرنيب أو ورقة منخفضة — بسيط: أعلى نقاط آمنة
    return legal.reduce((a, b) => (cardPoints(b, state.mode, state.trump) > cardPoints(a, state.mode, state.trump) ? b : a));
  }
  const { winnerSeat } = currentWinner(state);
  const partnerWinning = winnerSeat != null && teamOf(winnerSeat) === teamOf(p.seat);

  // أوراق تفوز الحيلة حالياً
  const winning = legal.filter((c) => beats(state, c));
  if (winning.length && !partnerWinning) {
    // افز بأرخص ورقة فائزة
    return winning.reduce((a, b) => (strengthOf(state, b) < strengthOf(state, a) ? b : a));
  }
  // لا حاجة/لا قدرة على الفوز — ارمِ أقل نقاط
  return legal.reduce((a, b) => (cardPoints(b, state.mode, state.trump) < cardPoints(a, state.mode, state.trump) ? b : a));
}

function strengthOf(state, card) {
  return cardStrength(card, state.leadSuit, state.mode, state.trump);
}
function beats(state, card) {
  const { winnerSeat } = currentWinner(state);
  if (winnerSeat == null) return true;
  const best = state.trick.reduce((m, t) => Math.max(m, cardStrength(t.card, state.leadSuit, state.mode, state.trump)), -1);
  return cardStrength(card, state.leadSuit, state.mode, state.trump) > best;
}
