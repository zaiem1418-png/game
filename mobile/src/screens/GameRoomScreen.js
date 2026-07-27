import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useGameTable } from "../games/useGameTable";
import LudoBoard from "../games/LudoBoard";
import SnakeLadderBoard from "../games/SnakeLadderBoard";
import JackarooBoard from "../games/JackarooBoard";
import BalootBoard from "../games/BalootBoard";
import { GAMES } from "../data/games";

// خريطة معرّف اللعبة -> لوحتها — كل الألعاب الأربع منقولة
const BOARDS = { ludo: LudoBoard, snake: SnakeLadderBoard, jackaroo: JackarooBoard, baloot: BalootBoard };
const TITLES = { snake: "السلم والثعبان", ludo: "لودو", jackaroo: "جاكارو", baloot: "بلوت" };

export default function GameRoomScreen({ gameId, mode, user, onExit }) {
  const table = useGameTable({ gameId, mode, user });
  const { phase, lobby, game, you, error } = table;
  const Board = BOARDS[gameId];
  const theme = GAMES.find((g) => g.id === gameId) || GAMES[0];

  return (
    <LinearGradient colors={theme.card} style={styles.fill}>
      {/* رأس */}
      <View style={styles.head}>
        <Pressable style={styles.back} onPress={onExit}>
          <Text style={styles.backTxt}>‹ خروج</Text>
        </Pressable>
        <Text style={styles.title}>{TITLES[gameId] || gameId}</Text>
        <View style={{ width: 56 }} />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {!Board ? (
        <View style={styles.soon}>
          <Text style={{ fontSize: 40 }}>🛠️</Text>
          <Text style={styles.soonTxt}>لعبة «{TITLES[gameId] || gameId}» قيد التجهيز على الموبايل.</Text>
          <Pressable style={styles.btn} onPress={onExit}><Text style={styles.btnTxt}>رجوع</Text></Pressable>
        </View>
      ) : phase !== "playing" ? (
        <Lobby lobby={lobby} you={you} onStart={table.start} onExit={onExit} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <Board game={game} you={you} action={table.action} onExit={onExit} />
        </ScrollView>
      )}
    </LinearGradient>
  );
}

function Lobby({ lobby, you, onStart, onExit }) {
  if (!lobby) {
    return (
      <View style={styles.soon}>
        <ActivityIndicator color="#3fd3ac" />
        <Text style={styles.soonTxt}>جاري الاتصال بالطاولة…</Text>
      </View>
    );
  }
  const isHost = lobby.hostId === you;
  const seats = Array.from({ length: lobby.maxSeats }, (_, i) => lobby.players[i] || null);

  return (
    <View style={styles.lobby}>
      <Text style={styles.hint}>في انتظار اللاعبين — المقاعد الفارغة تُملأ بلاعبين آليين عند البدء.</Text>
      <View style={styles.seats}>
        {seats.map((p, i) => (
          <View key={i} style={[styles.seat, p && styles.seatFilled]}>
            <Text style={styles.seatAv}>{p ? p.avatar : "＋"}</Text>
            <Text style={styles.seatName} numberOfLines={1}>
              {p ? p.name : "بانتظار…"}
              {p && p.id === lobby.hostId ? " ★" : ""}
              {p && p.id === you ? " (أنت)" : ""}
            </Text>
          </View>
        ))}
      </View>

      {isHost ? (
        <Pressable style={styles.start} onPress={onStart}><Text style={styles.startTxt}>ابدأ اللعب ▶</Text></Pressable>
      ) : (
        <Text style={styles.wait}>بانتظار أن يبدأ المضيف…</Text>
      )}
      <Pressable style={styles.ghost} onPress={onExit}><Text style={styles.ghostTxt}>إلغاء</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  head: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingTop: 52, paddingHorizontal: 14, paddingBottom: 10 },
  back: { paddingVertical: 6, paddingHorizontal: 10 },
  backTxt: { color: "#5fe0bd", fontWeight: "800", fontSize: 15 },
  title: { color: "#eaf6f3", fontWeight: "800", fontSize: 18 },
  error: { color: "#ff8a3d", textAlign: "center", paddingVertical: 6 },

  soon: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 30 },
  soonTxt: { color: "#eaf6f3", fontSize: 15, textAlign: "center" },
  btn: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 18, paddingHorizontal: 22, paddingVertical: 10 },
  btnTxt: { color: "#5fe0bd", fontWeight: "800" },

  lobby: { flex: 1, alignItems: "center", padding: 20, gap: 16 },
  hint: { color: "#9dc0b8", fontSize: 13, textAlign: "center" },
  seats: { flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "center", gap: 12 },
  seat: {
    width: 120, alignItems: "center", gap: 6, paddingVertical: 16,
    backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 14,
  },
  seatFilled: { backgroundColor: "rgba(63,211,172,0.12)", borderColor: "rgba(63,211,172,0.4)" },
  seatAv: { fontSize: 28 },
  seatName: { color: "#eaf6f3", fontSize: 12, fontWeight: "600", maxWidth: 108 },
  start: { backgroundColor: "#3fd3ac", borderRadius: 24, paddingHorizontal: 40, paddingVertical: 14 },
  startTxt: { color: "#04211b", fontWeight: "800", fontSize: 16 },
  wait: { color: "#9dc0b8", fontSize: 14 },
  ghost: { paddingVertical: 8 },
  ghostTxt: { color: "#9dc0b8", fontSize: 14 },
});
