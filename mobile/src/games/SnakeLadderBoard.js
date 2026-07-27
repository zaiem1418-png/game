import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";

// يبني صفوف اللوحة مرئياً (الأعلى = 100، الأسفل = 1) بنمط الثعبان —
// منقول حرفياً من client/src/games/SnakeLadderBoard.jsx
function buildRows() {
  const rows = [];
  for (let visual = 0; visual < 10; visual++) {
    const boardRow = 9 - visual;
    const base = boardRow * 10;
    let nums = Array.from({ length: 10 }, (_, c) => base + c + 1);
    if (boardRow % 2 === 1) nums = nums.reverse();
    rows.push(nums);
  }
  return rows;
}

const DICE = { 1: "⚀", 2: "⚁", 3: "⚂", 4: "⚃", 5: "⚄", 6: "⚅" };

export default function SnakeLadderBoard({ game, you, action }) {
  const rows = useMemo(buildRows, []);
  const st = game?.state;

  const W = Dimensions.get("window").width;
  const board = Math.min(W - 24, 380);

  if (!st) return <View style={styles.loading}><Text style={styles.loadingTxt}>جاري التحميل…</Text></View>;

  const players = st.players;
  const myTurn = game.turn === you && st.phase === "roll";
  const turnPlayer = players.find((p) => p.id === game.turn);

  const byCell = {};
  players.forEach((p) => {
    if (p.pos >= 1) (byCell[p.pos] ||= []).push(p);
  });
  const atStart = players.filter((p) => p.pos === 0);
  const lm = st.lastMove;

  return (
    <View style={styles.wrap}>
      {/* شريط اللاعبين */}
      <View style={styles.players}>
        {players.map((p) => {
          const active = game.turn === p.id;
          return (
            <View key={p.id} style={[styles.pl, active && { borderColor: p.color, backgroundColor: `${p.color}22` }]}>
              <View style={[styles.plAv, { backgroundColor: p.color }]}><Text style={{ fontSize: 13 }}>{p.avatar}</Text></View>
              <Text style={styles.plName} numberOfLines={1}>{p.name}{p.id === you ? " (أنت)" : ""}</Text>
              <Text style={styles.plPos}>{p.finished ? `#${p.rank} 🏁` : p.pos}</Text>
            </View>
          );
        })}
      </View>

      {/* اللوحة */}
      <View style={[styles.board, { width: board, height: board }]}>
        {rows.map((nums, r) => (
          <View key={r} style={styles.row}>
            {nums.map((n) => {
              const isLadder = st.ladders[n] != null;
              const isSnakeHead = st.snakes[n] != null;
              const here = byCell[n] || [];
              return (
                <View key={n} style={[styles.cell, isLadder && styles.ladder, isSnakeHead && styles.snake]}>
                  <Text style={styles.num}>{n}</Text>
                  {isLadder && <Text style={styles.mark}>🪜</Text>}
                  {isSnakeHead && <Text style={styles.mark}>🐍</Text>}
                  <View style={styles.tokens}>
                    {here.map((p) => (
                      <View key={p.id} style={[styles.token, { backgroundColor: p.color }]}>
                        <Text style={{ fontSize: 9 }}>{p.avatar}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* صينية البداية */}
      {atStart.length > 0 && (
        <View style={styles.startTray}>
          <Text style={styles.startTxt}>البداية:</Text>
          {atStart.map((p) => (
            <View key={p.id} style={[styles.token, { backgroundColor: p.color }]}>
              <Text style={{ fontSize: 9 }}>{p.avatar}</Text>
            </View>
          ))}
        </View>
      )}

      {/* لوحة التحكم */}
      <View style={styles.ctrl}>
        {st.phase === "over" ? (
          <Over players={players} />
        ) : (
          <>
            <Text style={styles.turn}>{myTurn ? "دورك! ارمِ النرد" : `دور ${turnPlayer?.name || "…"}`}</Text>
            <Pressable disabled={!myTurn} onPress={() => myTurn && action({ type: "roll" })} style={[styles.die, myTurn && styles.dieLit]}>
              <Text style={styles.dieTxt}>{st.dice ? DICE[st.dice] : "🎲"}</Text>
            </Pressable>
            {lm?.via && (
              <Text style={[styles.note, { color: lm.via === "ladder" ? "#3ad6c4" : "#ff6b6b" }]}>
                {lm.via === "ladder" ? `🪜 سلّم! صعد إلى ${lm.to}` : `🐍 ثعبان! نزل إلى ${lm.to}`}
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}

function Over({ players }) {
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

  players: { flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "center", gap: 6, paddingHorizontal: 8 },
  pl: {
    flexDirection: "row-reverse", alignItems: "center", gap: 5,
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.1)", borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 5, backgroundColor: "rgba(255,255,255,0.04)",
  },
  plAv: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  plName: { color: "#eaf6f3", fontSize: 11, fontWeight: "700", maxWidth: 70 },
  plPos: { color: "#e8c874", fontSize: 12, fontWeight: "800" },

  board: { flexDirection: "column", backgroundColor: "#0d3a38", borderRadius: 10, overflow: "hidden", borderWidth: 2, borderColor: "#1f8a8a" },
  row: { flex: 1, flexDirection: "row" },
  cell: { flex: 1, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.03)" },
  ladder: { backgroundColor: "rgba(58,214,196,0.18)" },
  snake: { backgroundColor: "rgba(255,107,107,0.18)" },
  num: { position: "absolute", top: 1, right: 2, fontSize: 7, color: "rgba(255,255,255,0.45)" },
  mark: { position: "absolute", fontSize: 12, opacity: 0.55 },
  tokens: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 1 },
  token: { width: 15, height: 15, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.85)" },

  startTray: { flexDirection: "row-reverse", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center" },
  startTxt: { color: "#9dc0b8", fontSize: 12 },

  ctrl: { alignItems: "center", gap: 10 },
  turn: { color: "#eaf6f3", fontSize: 15, fontWeight: "700" },
  die: { width: 64, height: 64, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  dieLit: { backgroundColor: "#3ad6c4", borderColor: "#3ad6c4" },
  dieTxt: { fontSize: 38 },
  note: { fontSize: 13, fontWeight: "700" },

  over: { alignItems: "center", gap: 8 },
  overTitle: { color: "#eaf6f3", fontSize: 18, fontWeight: "800" },
  overRow: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  overName: { color: "#eaf6f3", fontSize: 14 },
});
