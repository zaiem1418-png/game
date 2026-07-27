import React, { useState, useMemo, useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions, ScrollView, Modal } from "react-native";

// ===== هندسة مسار جاكارو — منقولة حرفياً من client/src/games/JackarooBoard.jsx =====
const LOOP = 64;
const OUTLINE = [
  [50, 9], [57, 9], [57, 27], [64, 31], [75, 39], [82, 46], [83, 50], [82, 54],
  [75, 61], [64, 69], [57, 73], [57, 91], [50, 91], [43, 91], [43, 73], [36, 69],
  [25, 61], [18, 54], [17, 50], [18, 46], [25, 39], [36, 31], [43, 27], [43, 9],
];
const ANCHORS = [0, 6, 12, 18];
const CELLS = (() => {
  const out = new Array(LOOP);
  for (let q = 0; q < 4; q++) {
    const a = ANCHORS[q], b = ANCHORS[(q + 1) % 4];
    const seg = [];
    for (let idx = a; ; idx++) {
      seg.push(OUTLINE[idx % OUTLINE.length]);
      if (idx % OUTLINE.length === b) break;
    }
    const cum = [0];
    for (let k = 1; k < seg.length; k++) cum.push(cum[k - 1] + Math.hypot(seg[k][0] - seg[k - 1][0], seg[k][1] - seg[k - 1][1]));
    const total = cum[cum.length - 1] || 1;
    for (let j = 0; j < 16; j++) {
      const t = (j / 16) * total;
      let k = 1;
      while (k < seg.length && cum[k] < t) k++;
      const s = cum[k] - cum[k - 1] || 1;
      const f = (t - cum[k - 1]) / s;
      out[q * 16 + j] = { x: seg[k - 1][0] + (seg[k][0] - seg[k - 1][0]) * f, y: seg[k - 1][1] + (seg[k][1] - seg[k - 1][1]) * f };
    }
  }
  return out;
})();
const perimeter = (i) => CELLS[((i % LOOP) + LOOP) % LOOP];
const HEAD_INDEX = [0, 16, 32, 48];
const START_OFFSET = 2;
const START_INDEX = HEAD_INDEX.map((h) => (h + START_OFFSET) % LOOP);
const TRACK = LOOP - START_OFFSET;
const HOME_FIRST = TRACK + 1;
const HOME_LAST = TRACK + 4;
const startAngle = (seat) => (HEAD_INDEX[seat] / LOOP) * 2 * Math.PI - Math.PI / 2;
const YARD_R = 36;
const CORNERS = [0, 1, 2, 3].map((seat) => {
  const a = startAngle(seat) + Math.PI / 4;
  return { x: 50 + YARD_R * Math.cos(a), y: 50 + YARD_R * Math.sin(a) };
});
const HOME_R = [36, 29, 22, 15];
const homeCells = (seat) => HOME_R.map((r) => ({ x: 50 + r * Math.cos(startAngle(seat)), y: 50 + r * Math.sin(startAngle(seat)) }));
const CROSS_CELLS = [16, 48];
function yardSlots(seat) {
  const c = CORNERS[seat];
  return [{ x: c.x, y: c.y - 5 }, { x: c.x - 5, y: c.y }, { x: c.x + 5, y: c.y }, { x: c.x, y: c.y + 5 }];
}
function marblePos(seat, step, mi) {
  if (step === 0) return yardSlots(seat)[mi];
  if (step >= 1 && step <= TRACK) return perimeter((START_INDEX[seat] + step - 1) % LOOP);
  return homeCells(seat)[step - HOME_FIRST];
}
const SUIT_COLOR = { "♥": "#e3405a", "♦": "#e3405a", "♠": "#1b2440", "♣": "#1b2440", "🃏": "#7a3aa6" };

function hexA(hex, a) {
  const m = (hex || "#555555").replace("#", "");
  return `rgba(${parseInt(m.slice(0, 2), 16)},${parseInt(m.slice(2, 4), 16)},${parseInt(m.slice(4, 6), 16)},${a})`;
}

export default function JackarooBoard({ game, you, action, onExit }) {
  const st = game?.state;
  const [selCard, setSelCard] = useState(null);
  const [swapFrom, setSwapFrom] = useState(null);
  const [showRules, setShowRules] = useState(false);

  const W = Dimensions.get("window").width;
  const B = Math.min(W - 16, 380);
  const CELL = B * 0.05;
  const MARBLE = B * 0.062;

  const players = st?.players || [];
  const bySeat = {};
  players.forEach((p) => { bySeat[p.seat] = p; });
  const me = players.find((p) => p.id === you);
  const myTurn = game?.turn === you && st?.phase === "play";
  const turnPlayer = players.find((p) => p.id === game?.turn);
  const legal = st?.myLegal || [];
  const mustDiscard = myTurn && legal.length === 0 && (me?.hand?.length || 0) > 0;

  const ring = useMemo(() => Array.from({ length: LOOP }, (_, i) => ({ i, ...perimeter(i) })), []);
  const cardOpts = useMemo(() => (selCard == null ? [] : legal.filter((m) => m.card === selCard)), [selCard, legal]);
  const swapMode = useMemo(() => cardOpts.length > 0 && cardOpts.every((o) => o.kind === "swap"), [cardOpts]);
  const swapSrc = useMemo(() => (swapMode ? [...new Set(cardOpts.map((o) => o.marble))] : []), [swapMode, cardOpts]);
  const swapTargets = useMemo(
    () =>
      swapMode && swapFrom != null
        ? cardOpts.filter((o) => o.marble === swapFrom).map((o) => ({ seat: o.target.seat, marble: o.target.marble, mate: o.mate, opt: o.opt }))
        : [],
    [swapMode, swapFrom, cardOpts]
  );
  useEffect(() => { setSwapFrom(null); }, [selCard, game?.turn]);

  const needsPanel = useMemo(() => {
    if (swapMode) return false;
    if (cardOpts.some((o) => ["split", "stop", "shove"].includes(o.kind))) return true;
    const seen = new Set();
    for (const o of cardOpts) {
      if (o.marble < 0) continue;
      if (seen.has(o.marble)) return true;
      seen.add(o.marble);
    }
    return false;
  }, [cardOpts, swapMode]);
  const movableMarbles = useMemo(
    () => (needsPanel || swapMode ? [] : cardOpts.filter((o) => o.marble >= 0).map((o) => o.marble)),
    [cardOpts, needsPanel, swapMode]
  );

  function onMarbleClick(p, mi) {
    if (!myTurn || selCard == null) return;
    if (swapMode) {
      if (p.id === you) {
        if (!swapSrc.includes(mi)) return;
        setSwapFrom((f) => (f === mi ? null : mi));
        return;
      }
      if (swapFrom == null) return;
      const t = swapTargets.find((x) => x.seat === p.seat && x.marble === mi);
      if (!t) return;
      action({ type: "play", card: selCard, opt: t.opt });
      setSelCard(null);
      setSwapFrom(null);
      return;
    }
    if (p.id !== you || needsPanel) return;
    const opt = cardOpts.find((o) => o.marble === mi);
    if (!opt) return;
    action({ type: "play", card: selCard, opt: opt.opt });
    setSelCard(null);
  }
  function onOptClick(o) {
    action({ type: "play", card: selCard, opt: o.opt });
    setSelCard(null);
  }
  function onCardClick(ci) {
    if (!myTurn) return;
    if (mustDiscard) {
      action({ type: "discard", card: ci });
      setSelCard(null);
      return;
    }
    if (!legal.some((m) => m.card === ci)) return;
    setSelCard((c) => (c === ci ? null : ci));
  }

  if (!st) return <View style={styles.loading}><Text style={styles.loadingTxt}>جاري التحميل…</Text></View>;

  const ev = st.lastEvent;
  const crossOn = players.length <= 2;

  const dot = (x, y, size, extra) => ({
    position: "absolute", left: `${x}%`, top: `${y}%`,
    width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, borderRadius: size / 2,
    ...extra,
  });

  const status = st.phase === "over" ? "" : myTurn
    ? mustDiscard ? "لا حركة متاحة — اختر ورقة للتخلّص منها"
      : selCard == null ? "دورك — اختر ورقة"
        : swapMode ? (swapFrom == null ? "🔄 اختر بيدقك المتوهّج" : "🔄 اختر بيدق الخصم/الشريك")
          : needsPanel ? "اختر الحركة من الأسفل" : "اختر بيدقاً متوهّجاً لتحريكه"
    : `دور ${turnPlayer?.name || "…"}`;

  return (
    <View style={styles.wrap}>
      {/* مقاعد اللاعبين */}
      <View style={styles.pods}>
        {players.map((p) => {
          const active = game.turn === p.id;
          return (
            <View key={p.id} style={[styles.pod, active && { borderColor: p.color, backgroundColor: hexA(p.color, 0.18) }]}>
              <View style={[styles.podAv, { backgroundColor: p.color }]}><Text style={{ fontSize: 13 }}>{p.avatar}</Text></View>
              <Text style={styles.podName} numberOfLines={1}>{p.name}{p.id === you ? " (أنت)" : ""}</Text>
              <Text style={styles.podMeta}>🏠{p.homeCount}/4 · 🂠{p.handCount ?? p.hand?.length ?? 0}</Text>
            </View>
          );
        })}
      </View>

      {/* اللوحة */}
      <View style={[styles.board, { width: B, height: B }]}>
        {/* قواعد + جيوب */}
        {players.map((p) => {
          const c = CORNERS[p.seat] || CORNERS[0];
          return <View key={`base${p.seat}`} style={dot(c.x, c.y, B * 0.22, { backgroundColor: hexA(p.color, 0.14), borderWidth: 1.5, borderColor: p.color })} />;
        })}
        {players.map((p) =>
          yardSlots(p.seat).map((s, k) => (
            <View key={`y${p.seat}-${k}`} style={dot(s.x, s.y, CELL, { backgroundColor: hexA(p.color, 0.6), borderWidth: 1, borderColor: p.color })} />
          ))
        )}

        {/* خانات المسار */}
        {ring.map((cell) => {
          const startSeat = START_INDEX.indexOf(cell.i);
          const startP = startSeat >= 0 ? bySeat[startSeat] : null;
          const isCross = crossOn && CROSS_CELLS.includes(cell.i) && !startP;
          return (
            <View
              key={cell.i}
              style={dot(cell.x, cell.y, CELL, {
                backgroundColor: startP ? startP.color : isCross ? "#e0b24a" : "rgba(255,255,255,0.9)",
                borderWidth: 1, borderColor: startP ? "#fff" : "rgba(0,0,0,0.25)",
                alignItems: "center", justifyContent: "center",
              })}
            >
              {isCross && <Text style={{ fontSize: CELL * 0.6, color: "#3a2708" }}>⇄</Text>}
            </View>
          );
        })}

        {/* بيوت النهاية */}
        {players.map((p) =>
          homeCells(p.seat).map((h, k) => (
            <View key={`h${p.seat}-${k}`} style={dot(h.x, h.y, CELL, { backgroundColor: hexA(p.color, 0.5), borderWidth: 1, borderColor: hexA(p.color, 0.8) })} />
          ))
        )}

        {/* كومة المركز */}
        <View style={dot(50, 50, B * 0.11, { backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" })} />

        {/* البيادق */}
        {players.map((p) =>
          p.marbles.map((step, mi) => {
            const pos = marblePos(p.seat, step, mi);
            let clickable = false, ring2 = null;
            if (myTurn) {
              if (swapMode) {
                if (p.id === you && swapSrc.includes(mi)) { clickable = true; ring2 = swapFrom === mi ? "#fff700" : "#8fe0ff"; }
                else if (swapFrom != null) {
                  const t = swapTargets.find((x) => x.seat === p.seat && x.marble === mi);
                  if (t) { clickable = true; ring2 = t.mate ? "#5fe0bd" : "#ff8a3d"; }
                }
              } else if (p.id === you && movableMarbles.includes(mi)) { clickable = true; ring2 = "#fff700"; }
            }
            return (
              <Pressable
                key={`${p.id}-${mi}`}
                disabled={!clickable}
                onPress={() => onMarbleClick(p, mi)}
                style={dot(pos.x, pos.y, MARBLE, {
                  backgroundColor: p.color, borderWidth: ring2 ? 3 : 2,
                  borderColor: ring2 || "rgba(255,255,255,0.85)",
                  alignItems: "center", justifyContent: "center", zIndex: 5,
                })}
              >
                <Text style={{ fontSize: MARBLE * 0.5 }}>{p.avatar}</Text>
              </Pressable>
            );
          })
        )}
      </View>

      {/* حالة الدور */}
      <View style={styles.turnRow}>
        <Pressable style={styles.rulesBtn} onPress={() => setShowRules(true)}><Text style={styles.rulesBtnTxt}>؟ القواعد</Text></Pressable>
        <Text style={styles.turnTxt}>{status}</Text>
      </View>
      {ev?.type === "capture" && <Text style={styles.ev}>💥 أكل!</Text>}
      {ev?.type === "swap" && <Text style={styles.ev}>🔄 تبديل!</Text>}
      {ev?.type === "home" && <Text style={styles.ev}>🏁 بيدق وصل!</Text>}

      {/* لوحة الخيارات */}
      {myTurn && needsPanel && cardOpts.length > 0 && (
        <View style={styles.opts}>
          {cardOpts.map((o) => (
            <Pressable key={o.opt} style={[styles.opt, o.cap && styles.optCap]} onPress={() => onOptClick(o)}>
              <Text style={styles.optTxt}>{o.label}{o.cap ? " 💥" : ""}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* اليد أو النهاية */}
      {st.phase === "over" ? (
        <JakOver st={st} you={you} onExit={onExit} />
      ) : (
        <View style={styles.hand}>
          {(me?.hand || []).map((card, ci) => {
            const playable = myTurn && (mustDiscard || legal.some((m) => m.card === ci));
            const sel = selCard === ci;
            return (
              <Pressable
                key={card.id}
                onPress={() => onCardClick(ci)}
                style={[styles.card, sel && styles.cardSel, !playable && styles.cardDim]}
              >
                <Text style={[styles.cardRank, { color: SUIT_COLOR[card.suit] || "#1b2440" }]}>{card.rank}</Text>
                <Text style={[styles.cardSuit, { color: SUIT_COLOR[card.suit] || "#1b2440" }]}>{card.suit}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <JakRules visible={showRules} onClose={() => setShowRules(false)} />
    </View>
  );
}

const RULE_CARDS = [
  { c: "A", t: "إخراج بيدق، أو التقدّم 1 أو 11" },
  { c: "K", t: "إخراج بيدق، أو التقدّم 13 ويخترق السدّ" },
  { c: "Q", t: "التقدّم 12 خطوة" },
  { c: "J", t: "التبديل — بدّل موقع بيدقك مع أي بيدق آخر" },
  { c: "10", t: "التقدّم 10، أو الإيقاف — يفقد التالي دوره" },
  { c: "9", t: "التقدّم 9" }, { c: "8", t: "التقدّم 8" },
  { c: "7", t: "التقسيم — وزّع 7 على بيدق أو بيدقين" },
  { c: "6", t: "التقدّم 6" }, { c: "5", t: "حرّك أي حجر 5 خطوات" },
  { c: "4", t: "التحرّك 4 للخلف" }, { c: "3", t: "التقدّم 3" }, { c: "2", t: "التقدّم خطوتين" },
  { c: "🃏", t: "إخراج بيدق، أو التقدّم 18 ويأكل" },
];

function JakRules({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.rulesOverlay} onPress={onClose}>
        <Pressable style={styles.rules} onPress={(e) => e.stopPropagation?.()}>
          <View style={styles.rulesHead}>
            <Text style={styles.rulesTitle}>قواعد جاكارو</Text>
            <Pressable onPress={onClose}><Text style={styles.rulesX}>✕</Text></Pressable>
          </View>
          <ScrollView>
            <Text style={styles.rulesIntro}>
              4 لاعبين، فريقان (المتقابلان شركاء). لكل لاعب 4 بيادق و4 أوراق. أخرِج بيادقك ودُر حول المسار (64 خانة) حتى بيت النهاية بالعدد المضبوط. الهبوط على بيدق خصم يعيده للبيت. يفوز الفريق الذي تصل كل بيادقه.
            </Text>
            {RULE_CARDS.map((r) => (
              <View key={r.c} style={styles.ruleRow}>
                <Text style={styles.ruleCard}>{r.c}</Text>
                <Text style={styles.ruleTxt}>{r.t}</Text>
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function JakOver({ st, you, onExit }) {
  const me = st.players.find((p) => p.id === you);
  const won = me && me.team === st.winnerTeam;
  return (
    <View style={styles.over}>
      <Text style={styles.overTitle}>{won ? "🎉 فاز فريقك!" : `فاز الفريق ${st.winnerTeam + 1}`}</Text>
      <Text style={styles.overSub}>
        {st.players.filter((p) => p.team === st.winnerTeam).map((p) => p.name).join(" + ")}
      </Text>
      <Pressable style={styles.overBtn} onPress={onExit}><Text style={styles.overBtnTxt}>رجوع للقائمة</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 10, paddingVertical: 8 },
  loading: { padding: 40, alignItems: "center" },
  loadingTxt: { color: "#9dc0b8" },

  pods: { flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "center", gap: 6, paddingHorizontal: 6 },
  pod: {
    flexDirection: "row-reverse", alignItems: "center", gap: 5,
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.1)", borderRadius: 12,
    paddingHorizontal: 7, paddingVertical: 4, backgroundColor: "rgba(255,255,255,0.04)",
  },
  podAv: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  podName: { color: "#eaf6f3", fontSize: 10, fontWeight: "700", maxWidth: 60 },
  podMeta: { color: "#9dc0b8", fontSize: 9 },

  board: { position: "relative", backgroundColor: "#6a3b1a", borderRadius: 16, borderWidth: 3, borderColor: "#4a2810", overflow: "hidden" },

  turnRow: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  rulesBtn: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  rulesBtnTxt: { color: "#5fe0bd", fontSize: 12, fontWeight: "700" },
  turnTxt: { color: "#eaf6f3", fontSize: 14, fontWeight: "700", flexShrink: 1, textAlign: "center" },
  ev: { color: "#ff8a3d", fontSize: 13, fontWeight: "700" },

  opts: { flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "center", gap: 8, paddingHorizontal: 10 },
  opt: { backgroundColor: "rgba(47,159,224,0.25)", borderWidth: 1, borderColor: "#2f9fe0", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  optCap: { backgroundColor: "rgba(255,210,63,0.25)", borderColor: "#ffd23f" },
  optTxt: { color: "#eaf6f3", fontSize: 13, fontWeight: "700" },

  hand: { flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "center", gap: 8, paddingHorizontal: 10, paddingTop: 4 },
  card: { width: 46, height: 64, borderRadius: 8, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(0,0,0,0.15)" },
  cardSel: { borderColor: "#ffd23f", borderWidth: 2, transform: [{ translateY: -8 }] },
  cardDim: { opacity: 0.45 },
  cardRank: { fontSize: 20, fontWeight: "800" },
  cardSuit: { fontSize: 16 },

  over: { alignItems: "center", gap: 8, padding: 10 },
  overTitle: { color: "#eaf6f3", fontSize: 18, fontWeight: "800" },
  overSub: { color: "#9dc0b8", fontSize: 13 },
  overBtn: { backgroundColor: "#3fd3ac", borderRadius: 20, paddingHorizontal: 26, paddingVertical: 11, marginTop: 4 },
  overBtnTxt: { color: "#04211b", fontWeight: "800" },

  rulesOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 20 },
  rules: { width: "100%", maxHeight: "80%", backgroundColor: "#12212a", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  rulesHead: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  rulesTitle: { color: "#eaf6f3", fontSize: 17, fontWeight: "800" },
  rulesX: { color: "#9dc0b8", fontSize: 18 },
  rulesIntro: { color: "#c9dad5", fontSize: 12, lineHeight: 20, textAlign: "right", marginBottom: 10 },
  ruleRow: { flexDirection: "row-reverse", alignItems: "center", gap: 10, paddingVertical: 5, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.08)" },
  ruleCard: { width: 32, textAlign: "center", color: "#ffce5a", fontWeight: "800", fontSize: 14 },
  ruleTxt: { color: "#eaf6f3", fontSize: 12, flex: 1, textAlign: "right" },
});
