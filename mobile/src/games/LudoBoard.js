import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";

// ===== هندسة لوحة لودو 15×15 — منقولة حرفياً من client/src/games/LudoBoard.jsx =====
const PATH = buildPath();
const OFFSETS = [0, 13, 26, 39];
const SAFE = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
const CENTER = [7, 7];
const HOME_COLS = [
  [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
];
const BASE_SLOTS = [
  [[1.5, 1.5], [1.5, 3.5], [3.5, 1.5], [3.5, 3.5]],
  [[1.5, 10.5], [1.5, 12.5], [3.5, 10.5], [3.5, 12.5]],
  [[10.5, 10.5], [10.5, 12.5], [12.5, 10.5], [12.5, 12.5]],
  [[10.5, 1.5], [10.5, 3.5], [12.5, 1.5], [12.5, 3.5]],
];
const CORNERS = [
  { seat: 0, r: 0, c: 0 },
  { seat: 1, r: 0, c: 9 },
  { seat: 2, r: 9, c: 9 },
  { seat: 3, r: 9, c: 0 },
];
const DICE = { 1: "⚀", 2: "⚁", 3: "⚂", 4: "⚃", 5: "⚄", 6: "⚅" };

function buildPath() {
  const p = [];
  const push = (r, c) => p.push([r, c]);
  for (let c = 1; c <= 5; c++) push(6, c);
  for (let r = 5; r >= 0; r--) push(r, 6);
  push(0, 7);
  for (let r = 0; r <= 5; r++) push(r, 8);
  for (let c = 9; c <= 14; c++) push(6, c);
  push(7, 14);
  for (let c = 14; c >= 9; c--) push(8, c);
  for (let r = 9; r <= 14; r++) push(r, 8);
  push(14, 7);
  for (let r = 14; r >= 9; r--) push(r, 6);
  for (let c = 5; c >= 0; c--) push(8, c);
  push(7, 0);
  push(6, 0);
  return p;
}

const pctStr = (n) => `${(n / 15) * 100}%`;
// موضع مركز خانة (للبيادق)
function tokenCenter(seat, steps, tokenIdx) {
  let r, c;
  if (steps === 0) [r, c] = BASE_SLOTS[seat][tokenIdx];
  else if (steps >= 1 && steps <= 51) [r, c] = PATH[(OFFSETS[seat] + steps - 1) % 52];
  else if (steps >= 52 && steps <= 56) [r, c] = HOME_COLS[seat][steps - 52];
  else {
    const dx = [-0.3, 0.3, -0.3, 0.3][tokenIdx];
    const dy = [-0.3, -0.3, 0.3, 0.3][tokenIdx];
    [r, c] = [CENTER[0] + dy, CENTER[1] + dx];
  }
  return { top: `${((r + 0.5) / 15) * 100}%`, left: `${((c + 0.5) / 15) * 100}%` };
}

function hexA(hex, a) {
  const m = hex.replace("#", "");
  return `rgba(${parseInt(m.slice(0, 2), 16)},${parseInt(m.slice(2, 4), 16)},${parseInt(m.slice(4, 6), 16)},${a})`;
}

export default function LudoBoard({ game, you, action }) {
  const st = game?.state;
  const players = st?.players || [];
  const me = players.find((p) => p.id === you);
  const myTurn = game?.turn === you;
  const turnPlayer = players.find((p) => p.id === game?.turn);
  const canRoll = myTurn && st?.phase === "roll";
  const canPick = myTurn && st?.phase === "move";
  const ev = st?.lastEvent;

  const cells = useMemo(
    () => PATH.map(([r, c], i) => ({ r, c, i, safe: SAFE.has(i), startSeat: OFFSETS.indexOf(i) })),
    []
  );

  const W = Dimensions.get("window").width;
  const board = Math.min(W - 24, 380);
  const tokenSize = board / 15 - 3;

  if (!st) return <View style={styles.loading}><Text style={styles.loadingTxt}>جاري التحميل…</Text></View>;

  return (
    <View style={styles.wrap}>
      {/* صفّ اللاعبين */}
      <View style={styles.pods}>
        {players.map((p) => {
          const active = game.turn === p.id;
          return (
            <View key={p.id} style={[styles.pod, active && { borderColor: p.color, backgroundColor: hexA(p.color, 0.18) }]}>
              <View style={[styles.podAv, { backgroundColor: p.color }]}>
                <Text style={{ fontSize: 15 }}>{p.avatar}</Text>
              </View>
              <Text style={styles.podName} numberOfLines={1}>
                {p.name}{p.id === you ? " (أنت)" : ""}
              </Text>
              <Text style={styles.podHome}>🏠 {p.finishedCount}/4</Text>
              <Text style={styles.podDie}>{active && st.dice ? DICE[st.dice] : "🎲"}</Text>
            </View>
          );
        })}
      </View>

      {/* اللوحة */}
      <View style={[styles.board, { width: board, height: board }]}>
        {/* القواعد الملوّنة بالزوايا */}
        {CORNERS.map((co) => {
          const c = players[co.seat]?.color || "#5a6478";
          return (
            <View
              key={co.seat}
              style={{ position: "absolute", top: pctStr(co.r), left: pctStr(co.c), width: "40%", height: "40%", backgroundColor: c, borderRadius: 8, padding: "6%" }}
            >
              <View style={styles.yard}>
                {[0, 1, 2, 3].map((k) => (
                  <View key={k} style={[styles.pocket, { borderColor: c }]} />
                ))}
              </View>
            </View>
          );
        })}

        {/* أعمدة البيت الملوّنة */}
        {HOME_COLS.map((col, seat) =>
          col.map(([r, c], k) => (
            <View
              key={`h${seat}-${k}`}
              style={[styles.cell, cellBox(r, c), { backgroundColor: players[seat]?.color || "#5a6478" }]}
            />
          ))
        )}

        {/* المركز */}
        <View style={[styles.center, cellBox(6, 6, 3, 3)]}>
          {[0, 1, 2, 3].map((seat) => (
            <View key={seat} style={[styles.tri, { backgroundColor: players[seat]?.color || "#5a6478" }]} />
          ))}
        </View>

        {/* خانات المسار */}
        {cells.map((cell) => (
          <View
            key={cell.i}
            style={[
              styles.cell,
              cellBox(cell.r, cell.c),
              cell.startSeat >= 0 && { backgroundColor: hexA(players[cell.startSeat]?.color || "#555", 0.55) },
              cell.safe && styles.safe,
            ]}
          >
            {cell.safe && cell.startSeat < 0 && <Text style={styles.star}>★</Text>}
          </View>
        ))}

        {/* البيادق */}
        {players.map((p) =>
          p.tokens.map((steps, ti) => {
            const pos = tokenCenter(p.seat, steps, ti);
            const movable = canPick && st.movable.includes(ti) && p.id === you;
            return (
              <Pressable
                key={`${p.id}-${ti}`}
                disabled={!movable}
                onPress={() => movable && action({ type: "move", token: ti })}
                style={[
                  styles.token,
                  {
                    top: pos.top,
                    left: pos.left,
                    width: tokenSize,
                    height: tokenSize,
                    borderRadius: tokenSize / 2,
                    marginTop: -tokenSize / 2,
                    marginLeft: -tokenSize / 2,
                    backgroundColor: p.color,
                  },
                  movable && styles.movable,
                ]}
              >
                <Text style={{ fontSize: tokenSize * 0.5 }}>{p.avatar}</Text>
              </Pressable>
            );
          })
        )}
      </View>

      {/* لوحة التحكم */}
      <View style={styles.ctrl}>
        {st.phase === "over" ? (
          <LudoOver players={players} />
        ) : (
          <>
            <Text style={styles.turn}>
              {canRoll ? "دورك! ارمِ النرد" : canPick ? "اختر بيدقاً لتحريكه" : `دور ${turnPlayer?.name || "…"}`}
            </Text>
            <Pressable
              disabled={!canRoll}
              onPress={() => canRoll && action({ type: "roll" })}
              style={[styles.die, canRoll && styles.dieLit]}
            >
              <Text style={styles.dieTxt}>{st.dice ? DICE[st.dice] : "🎲"}</Text>
            </Pressable>
            {ev?.type === "capture" && <Text style={styles.note}>💥 أكلت بيدق خصم!</Text>}
            {ev?.type === "home" && <Text style={[styles.note, { color: "#3ad6c4" }]}>🏠 بيدق وصل البيت!</Text>}
          </>
        )}
      </View>
    </View>
  );
}

function cellBox(r, c, w = 1, h = 1) {
  return { position: "absolute", top: pctStr(r), left: pctStr(c), width: pctStr(w), height: pctStr(h) };
}

function LudoOver({ players }) {
  const ranked = [...players].sort((a, b) => (a.rank || 99) - (b.rank || 99));
  return (
    <View style={styles.over}>
      <Text style={styles.overTitle}>انتهت اللعبة 🏁</Text>
      {ranked.map((p) => (
        <View key={p.id} style={styles.overRow}>
          <Text style={{ fontSize: 16 }}>{["🥇", "🥈", "🥉"][p.rank - 1] || `#${p.rank}`}</Text>
          <Text style={{ fontSize: 18 }}>{p.avatar}</Text>
          <Text style={styles.overName}>{p.name}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 12, paddingVertical: 10 },
  loading: { padding: 40, alignItems: "center" },
  loadingTxt: { color: "#9dc0b8" },

  pods: { flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "center", gap: 6, paddingHorizontal: 8 },
  pod: {
    flexDirection: "row-reverse", alignItems: "center", gap: 5,
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.1)", borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 5, backgroundColor: "rgba(255,255,255,0.04)",
  },
  podAv: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  podName: { color: "#eaf6f3", fontSize: 11, fontWeight: "700", maxWidth: 70 },
  podHome: { color: "#9dc0b8", fontSize: 10 },
  podDie: { fontSize: 15 },

  board: { position: "relative", backgroundColor: "#fff", borderRadius: 10, overflow: "hidden" },
  cell: { borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(0,0,0,0.12)", alignItems: "center", justifyContent: "center" },
  safe: { backgroundColor: "rgba(0,0,0,0.06)" },
  star: { color: "#c9a227", fontSize: 10 },
  yard: { flex: 1, backgroundColor: "#fff", borderRadius: 6, flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-around", padding: 3 },
  pocket: { width: "38%", height: "38%", borderRadius: 100, borderWidth: 3 },
  center: { alignItems: "center", justifyContent: "center", flexDirection: "row", flexWrap: "wrap" },
  tri: { width: "50%", height: "50%" },
  token: { position: "absolute", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.85)" },
  movable: { borderColor: "#fff700", borderWidth: 3 },

  ctrl: { alignItems: "center", gap: 10, margintop: 4 },
  turn: { color: "#eaf6f3", fontSize: 15, fontWeight: "700" },
  die: { width: 64, height: 64, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  dieLit: { backgroundColor: "#ffce5a", borderColor: "#ffce5a" },
  dieTxt: { fontSize: 38 },
  note: { color: "#ff8a3d", fontSize: 13, fontWeight: "700" },

  over: { alignItems: "center", gap: 8 },
  overTitle: { color: "#eaf6f3", fontSize: 18, fontWeight: "800" },
  overRow: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  overName: { color: "#eaf6f3", fontSize: 14 },
});
