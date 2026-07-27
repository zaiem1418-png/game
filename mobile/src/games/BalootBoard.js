import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions, Modal, ScrollView } from "react-native";

const SUIT_COLOR = { "♥": "#e3405a", "♦": "#e3405a", "♠": "#10182b", "♣": "#10182b" };

// موضع لاعب نسبةً لي: أنا أسفل، الشريك أعلى، الخصمان يمين/يسار
function relPos(mySeat, seat) {
  const d = (seat - mySeat + 4) % 4;
  return ["bottom", "right", "top", "left"][d];
}

function Card({ card, onPress, disabled, dim, small }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      style={[small ? styles.cardSm : styles.card, dim && styles.cardDim]}
    >
      <Text style={[small ? styles.cardSmRank : styles.cardRank, { color: SUIT_COLOR[card.suit] }]}>{card.rank}</Text>
      <Text style={[small ? styles.cardSmSuit : styles.cardSuit, { color: SUIT_COLOR[card.suit] }]}>{card.suit}</Text>
    </Pressable>
  );
}

const SEAT_POS = {
  bottom: { bottom: 4, alignSelf: "center" },
  top: { top: 4, alignSelf: "center" },
  right: { right: 4, top: "42%" },
  left: { left: 4, top: "42%" },
};
const TRICK_POS = {
  bottom: { bottom: 6, alignSelf: "center" },
  top: { top: 6, alignSelf: "center" },
  right: { right: 10, top: "38%" },
  left: { left: 10, top: "38%" },
};

export default function BalootBoard({ game, you, action, onExit }) {
  const [showRules, setShowRules] = useState(false);
  const st = game?.state;
  const W = Dimensions.get("window").width;
  const B = Math.min(W - 16, 380);

  if (!st) return <View style={styles.loading}><Text style={styles.loadingTxt}>جاري التحميل…</Text></View>;

  const me = st.players.find((p) => p.id === you);
  const mySeat = me?.seat ?? 0;
  const turnPlayer = st.players[st.phase === "bid" ? st.bidTurn : st.turn];
  const myTurn = turnPlayer?.id === you;
  const myTeam = me?.team ?? 0;
  const other = myTeam === 0 ? 1 : 0;
  const matchPts = st.matchPoints || [0, 0];
  const target = st.matchTarget || 152;

  return (
    <View style={styles.wrap}>
      {/* شريط علوي: قواعد + لوحة النقاط */}
      <View style={styles.topbar}>
        <Pressable style={styles.rulesBtn} onPress={() => setShowRules(true)}><Text style={styles.rulesBtnTxt}>📖 القواعد</Text></Pressable>
        <View style={styles.scoreboard}>
          <Text style={styles.sbTarget}>السباق إلى {target}</Text>
          <View style={styles.sbRow}>
            <Text style={styles.sbUs}>لنا {matchPts[myTeam]}</Text>
            <Text style={styles.sbSep}>:</Text>
            <Text style={styles.sbThem}>{matchPts[other]} لهم</Text>
          </View>
          <Text style={styles.sbSub}>جولة {st.roundNo || 1} · هذه اليد {st.teamPoints[myTeam]}-{st.teamPoints[other]}</Text>
          {st.mode ? <Text style={styles.sbMode}>{st.mode === "sun" ? "☀️ صن" : `🃏 حكم ${st.trump}`}</Text> : null}
        </View>
      </View>

      {/* الطاولة */}
      <View style={[styles.table, { height: B }]}>
        {st.players.map((p) => {
          const pos = relPos(mySeat, p.seat);
          const active = turnPlayer?.id === p.id;
          const c = p.team === 0 ? "#3aa3ff" : "#f5c451";
          return (
            <View key={p.id} style={[styles.seat, SEAT_POS[pos], active && { borderColor: c, backgroundColor: `${c}22` }]}>
              <View style={[styles.seatAv, active && { borderColor: c, borderWidth: 2 }]}><Text style={{ fontSize: 16 }}>{p.avatar}</Text></View>
              <Text style={styles.seatName} numberOfLines={1}>{p.name}{p.id === you ? " (أنت)" : ""}</Text>
              <Text style={styles.seatCards}>🂠 {p.id === you ? me.hand.length : p.handCount}</Text>
              {st.buyerSeat === p.seat && <Text style={styles.buyer}>مشتري</Text>}
            </View>
          );
        })}

        {/* الحيلة في الوسط */}
        {st.trick.map((t) => (
          <View key={t.card.id} style={[styles.trickCard, TRICK_POS[relPos(mySeat, t.seat)]]}>
            <Card card={t.card} small disabled />
          </View>
        ))}
        {st.flipped && st.phase === "bid" && (
          <View style={styles.flipped}>
            <Text style={styles.flipLbl}>المقلوبة</Text>
            <Card card={st.flipped} small disabled />
          </View>
        )}
      </View>

      {/* منطقة الإجراء */}
      {st.phase === "over" ? (
        <BlOver st={st} you={you} onExit={onExit} />
      ) : st.phase === "bid" ? (
        <BidBar st={st} myTurn={myTurn} action={action} turnName={turnPlayer?.name} />
      ) : (
        <PlayHand st={st} me={me} myTurn={myTurn} action={action} turnName={turnPlayer?.name} />
      )}

      {/* نافذة نتيجة الجولة */}
      {st.phase === "roundOver" && st.roundSummary && (
        <BlRoundOver st={st} you={you} action={action} />
      )}

      <BalootRules visible={showRules} onClose={() => setShowRules(false)} />
    </View>
  );
}

function BidBar({ st, myTurn, action, turnName }) {
  const bid = st.myBid;
  if (!myTurn || !bid) return <Text style={styles.status}>المزايدة — دور {turnName || "…"}…</Text>;
  return (
    <View style={styles.actionArea}>
      <Text style={styles.status}>{bid.round === 1 ? `حكم على ${st.flipped.suit}؟` : "الجولة الثانية: اختر"}</Text>
      <View style={styles.bidBtns}>
        {bid.round === 1 && (
          <Pressable style={[styles.blBtn, styles.hokom]} onPress={() => action({ type: "hokom" })}><Text style={styles.blBtnTxt}>🃏 حكم {st.flipped.suit}</Text></Pressable>
        )}
        {bid.round === 2 && (
          <>
            <Pressable style={[styles.blBtn, styles.sun]} onPress={() => action({ type: "sun" })}><Text style={styles.blBtnTxt}>☀️ صن</Text></Pressable>
            {bid.suits.map((s) => (
              <Pressable key={s} style={[styles.blBtn, styles.hokom]} onPress={() => action({ type: "hokom_suit", suit: s })}>
                <Text style={[styles.blBtnTxt, { color: SUIT_COLOR[s] }]}>حكم {s}</Text>
              </Pressable>
            ))}
          </>
        )}
        <Pressable style={[styles.blBtn, styles.pass]} onPress={() => action({ type: "pass" })}><Text style={styles.blBtnTxt}>تمرير</Text></Pressable>
      </View>
    </View>
  );
}

function PlayHand({ st, me, myTurn, action, turnName }) {
  const legalIds = new Set((st.myLegal || []).map((c) => c.id));
  const myProjects = st.myProjects || [];
  return (
    <View style={styles.actionArea}>
      <Text style={styles.status}>{myTurn ? "دورك — العب ورقة" : `دور ${turnName || "…"}`}</Text>
      {myProjects.length > 0 && (
        <View style={styles.projRow}>
          <Text style={styles.projLbl}>مشاريعك:</Text>
          {myProjects.map((p, i) => (
            <Text key={i} style={styles.projChip}>{p.label} {p.suit} ({p.value})</Text>
          ))}
        </View>
      )}
      <View style={styles.hand}>
        {me.hand.map((card) => {
          const playable = myTurn && legalIds.has(card.id);
          return <Card key={card.id} card={card} dim={myTurn && !playable} disabled={!playable} onPress={() => action({ type: "play", card: card.id })} />;
        })}
      </View>
    </View>
  );
}

function RoundSummaryBody({ s, myTeam }) {
  if (!s) return null;
  const us = myTeam, them = myTeam === 0 ? 1 : 0;
  const teamLabel = (t) => (t === myTeam ? "فريقك" : "الخصم");
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.sumMode}>
        {s.mode === "sun" ? "☀️ صن" : `🃏 حكم ${s.trump || ""}`} · اشترى {teamLabel(s.buyerTeam)}
        {s.qahar ? " — قُهر! 💥" : ""}
      </Text>
      <View style={styles.sumRow}><Text style={styles.sumTxt}>نقاط اليد</Text><Text style={styles.sumVal}>{s.cardPoints[us]} ↔ {s.cardPoints[them]}</Text></View>
      {s.baloot && <Text style={styles.projChip}>بلوت 🂮🂭 (20) — {teamLabel(s.baloot.team)}</Text>}
      <View style={styles.sumRow}><Text style={styles.sumTxt}>أبناط الجولة</Text><Text style={styles.sumVal}>+{s.abnatGained[us]} ↔ +{s.abnatGained[them]}</Text></View>
      <View style={styles.sumRow}><Text style={[styles.sumTxt, { fontWeight: "800" }]}>إجمالي المباراة</Text><Text style={[styles.sumVal, { color: "#ffce5a" }]}>{s.matchPoints[us]} ↔ {s.matchPoints[them]}</Text></View>
    </View>
  );
}

function BlRoundOver({ st, you, action }) {
  const me = st.players.find((p) => p.id === you);
  const myTeam = me?.team ?? 0;
  return (
    <Modal transparent animationType="fade" onRequestClose={() => action({ type: "next" })}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>📋 نتيجة الجولة {st.roundSummary.roundNo}</Text>
          <RoundSummaryBody s={st.roundSummary} myTeam={myTeam} />
          <Pressable style={styles.sheetBtn} onPress={() => action({ type: "next" })}><Text style={styles.sheetBtnTxt}>الجولة التالية ▶</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

function BlOver({ st, you, onExit }) {
  const me = st.players.find((p) => p.id === you);
  const myTeam = me?.team ?? 0;
  const won = me && me.team === st.winnerTeam;
  return (
    <View style={styles.over}>
      <Text style={styles.overTitle}>{won ? "🎉 فاز فريقك!" : "فاز الخصم"}</Text>
      {st.roundSummary && <RoundSummaryBody s={st.roundSummary} myTeam={myTeam} />}
      <Pressable style={styles.overBtn} onPress={onExit}><Text style={styles.overBtnTxt}>رجوع للقائمة</Text></Pressable>
    </View>
  );
}

function BalootRules({ visible, onClose }) {
  const S = ({ h, children }) => (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.ruleH}>{h}</Text>
      {children}
    </View>
  );
  const P = ({ children }) => <Text style={styles.ruleP}>{children}</Text>;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { maxHeight: "82%" }]} onPress={(e) => e.stopPropagation?.()}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>📖 قواعد البلوت</Text>
            <Pressable onPress={onClose}><Text style={styles.rulesX}>✕</Text></Pressable>
          </View>
          <ScrollView>
            <S h="🎯 الأساسيات"><P>٤ لاعبين في فريقين (المتقابلان شركاء)، ٣٢ ورقة (٧ حتى الإكّة). لكل لاعب ٨ أوراق بعد المزايدة.</P></S>
            <S h="🗂️ الصن والحُكم"><P>☀️ الصن: لا يوجد طرنيب. 🃏 الحُكم: لون واحد رابح يتقدّم على الباقي.</P></S>
            <S h="🔢 الترتيب"><P>الصن: A ← 10 ← K ← Q ← J ← 9 ← 8 ← 7</P><P>طرنيب الحُكم: J ← 9 ← A ← 10 ← K ← Q ← 8 ← 7</P></S>
            <S h="💯 النقاط"><P>الصن: A=11، 10=10، K=4، Q=3، J=2. الحُكم: J=20، 9=14، A=11، 10=10. الأكلة الأخيرة +10.</P></S>
            <S h="🏆 القَهر"><P>على المشتري تجاوز نقاط الخصم وإلا «قُهر» وذهبت النقاط للخصم. تنتهي المباراة ببلوغ 152.</P></S>
          </ScrollView>
          <Pressable style={styles.sheetBtn} onPress={onClose}><Text style={styles.sheetBtnTxt}>فهمت، لنلعب 👍</Text></Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 10, paddingVertical: 8 },
  loading: { padding: 40, alignItems: "center" },
  loadingTxt: { color: "#9dc0b8" },

  topbar: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", width: "100%", paddingHorizontal: 12, gap: 10 },
  rulesBtn: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  rulesBtnTxt: { color: "#5fe0bd", fontSize: 12, fontWeight: "700" },
  scoreboard: { alignItems: "center" },
  sbTarget: { color: "#9dc0b8", fontSize: 10 },
  sbRow: { flexDirection: "row-reverse", alignItems: "center", gap: 6 },
  sbUs: { color: "#3aa3ff", fontWeight: "800", fontSize: 14 },
  sbSep: { color: "#eaf6f3" },
  sbThem: { color: "#f5c451", fontWeight: "800", fontSize: 14 },
  sbSub: { color: "#9dc0b8", fontSize: 10 },
  sbMode: { color: "#eaf6f3", fontSize: 12, fontWeight: "700", marginTop: 2 },

  table: { width: "100%", maxWidth: 380, position: "relative", backgroundColor: "rgba(15,90,46,0.55)", borderRadius: 20, borderWidth: 2, borderColor: "#1f8a4a", marginTop: 4 },
  seat: { position: "absolute", alignItems: "center", gap: 2, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.1)", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: "rgba(0,0,0,0.25)", minWidth: 80 },
  seatAv: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  seatName: { color: "#eaf6f3", fontSize: 11, fontWeight: "700", maxWidth: 80 },
  seatCards: { color: "#c9dad5", fontSize: 10 },
  buyer: { position: "absolute", top: -8, backgroundColor: "#f5c451", color: "#3a2708", fontSize: 9, fontWeight: "800", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },

  trickCard: { position: "absolute" },
  flipped: { position: "absolute", top: "44%", left: "38%", alignItems: "center", gap: 2 },
  flipLbl: { color: "#eaf6f3", fontSize: 9 },

  card: { width: 46, height: 64, borderRadius: 8, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(0,0,0,0.15)" },
  cardRank: { fontSize: 20, fontWeight: "800" },
  cardSuit: { fontSize: 16 },
  cardSm: { width: 34, height: 48, borderRadius: 6, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(0,0,0,0.15)" },
  cardSmRank: { fontSize: 15, fontWeight: "800" },
  cardSmSuit: { fontSize: 12 },
  cardDim: { opacity: 0.4 },

  status: { color: "#eaf6f3", fontSize: 14, fontWeight: "700", textAlign: "center" },
  actionArea: { alignItems: "center", gap: 10, width: "100%", paddingHorizontal: 10 },
  bidBtns: { flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  blBtn: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 9, borderWidth: 1 },
  hokom: { backgroundColor: "#fff", borderColor: "#ddd" },
  sun: { backgroundColor: "#ffd23f", borderColor: "#e0b000" },
  pass: { backgroundColor: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.2)" },
  blBtnTxt: { fontWeight: "800", fontSize: 14, color: "#10182b" },

  projRow: { flexDirection: "row-reverse", flexWrap: "wrap", alignItems: "center", gap: 6, justifyContent: "center" },
  projLbl: { color: "#9dc0b8", fontSize: 12 },
  projChip: { backgroundColor: "rgba(255,206,90,0.2)", color: "#ffce5a", fontSize: 11, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, overflow: "hidden" },
  hand: { flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "center", gap: 6 },

  over: { alignItems: "center", gap: 10, padding: 10, width: "100%" },
  overTitle: { color: "#eaf6f3", fontSize: 18, fontWeight: "800" },
  overBtn: { backgroundColor: "#3fd3ac", borderRadius: 20, paddingHorizontal: 26, paddingVertical: 11 },
  overBtnTxt: { color: "#04211b", fontWeight: "800" },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 20 },
  sheet: { width: "100%", backgroundColor: "#12212a", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", gap: 10 },
  sheetHead: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  sheetTitle: { color: "#eaf6f3", fontSize: 16, fontWeight: "800", textAlign: "center" },
  rulesX: { color: "#9dc0b8", fontSize: 18 },
  sheetBtn: { backgroundColor: "#3fd3ac", borderRadius: 16, paddingVertical: 12, alignItems: "center", marginTop: 4 },
  sheetBtnTxt: { color: "#04211b", fontWeight: "800", fontSize: 15 },
  sumMode: { color: "#eaf6f3", fontSize: 13, fontWeight: "700", textAlign: "center" },
  sumRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  sumTxt: { color: "#c9dad5", fontSize: 13 },
  sumVal: { color: "#eaf6f3", fontSize: 14, fontWeight: "700" },
  ruleH: { color: "#ffce5a", fontSize: 14, fontWeight: "800", textAlign: "right", marginBottom: 4 },
  ruleP: { color: "#eaf6f3", fontSize: 12, lineHeight: 20, textAlign: "right" },
});
