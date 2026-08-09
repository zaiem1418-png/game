import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GAMES } from "../data/games";
import { ICONS } from "../data/icons";
import GameHomeScreen from "./GameHomeScreen";
import BalootHomeScreen from "./BalootHomeScreen";

// طبقة التعتيم فوق صورة الخلفية: غامقة أعلى/أسفل (لتوضّح الأزرار)
// وفاتحة في الوسط (حيث الطاولة والأشخاص) ليبقوا واضحين.
const SCRIM = ["rgba(6,18,20,0.82)", "rgba(6,18,20,0.30)", "rgba(6,18,20,0.40)", "rgba(6,18,20,0.90)"];

// تنسيق الأرقام الكبيرة (مطابق لـ fmtNum في نسخة الويب)
function fmtNum(n) {
  if (n == null) return null;
  if (n === "∞") return n;
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export default function GameLobbyScreen({ identity, wallet, onWalletUpdate, onOpenRooms, onPlay }) {
  const [idx, setIdx] = useState(0); // يبدأ عند «جاكارو» (الصفحة الرئيسية)
  const game = GAMES[idx];

  return (
    <View style={styles.fill}>
      {/* ===== صورة اللعبة كخلفية كاملة للشاشة (باك-إند) ===== */}
      <Image source={ICONS[game.hero]} style={styles.bg} resizeMode="cover" />
      <LinearGradient colors={SCRIM} locations={[0, 0.3, 0.62, 1]} style={styles.bg} />

      {/* ===== شريط الحالة العلوي ===== */}
      <View style={styles.top}>
        <LinearGradient colors={game.accentGrad} style={styles.topAv}>
          <Text style={{ fontSize: 16 }}>👑</Text>
        </LinearGradient>
        <View style={styles.chips}>
          <View style={styles.chip}>
            <LinearGradient colors={["#5fe0bd", "#2ba585"]} style={styles.dot} />
            <Text style={styles.chipVal}>48</Text>
            <Text style={styles.star}>★</Text>
          </View>
          <View style={styles.chip}>
            <LinearGradient colors={["#ffce5a", "#d99a2a"]} style={styles.dot} />
            <Text style={styles.chipVal}>{wallet?.infinite ? "∞" : fmtNum(wallet?.coins) ?? "10K"}</Text>
          </View>
          <View style={styles.chip}>
            <View style={styles.diamond} />
            <Text style={styles.chipVal}>{wallet?.infinite ? "∞" : fmtNum(wallet?.diamonds) ?? "515"}</Text>
          </View>
        </View>
        <LinearGradient colors={["#f08a4a", "#d0632a"]} style={styles.reward}>
          <Text style={{ fontSize: 11 }}>🎁</Text>
          <Text style={styles.rewardLbl}>المكافأة</Text>
          <View style={styles.rewardBadge}>
            <Text style={styles.rewardBadgeTxt}>1</Text>
          </View>
        </LinearGradient>
      </View>

      {/* ===== شريط تبويبات الألعاب ===== */}
      <View style={styles.tabs}>
        {GAMES.map((g, i) => {
          const active = i === idx;
          return (
            <Pressable key={g.id} style={styles.tab} onPress={() => setIdx(i)}>
              <Text style={[styles.tabTxt, active && { color: game.accent, fontWeight: "800" }]} numberOfLines={1}>
                {g.tab}
              </Text>
              {active && <View style={[styles.tabUnderline, { backgroundColor: game.accent }]} />}
            </Pressable>
          );
        })}
      </View>

      {/* ===== محتوى اللعبة الحالية ===== */}
      {game.id === "baloot" ? (
        /* بلوت: لوحة كاملة تملأ الشاشة دون تمرير */
        <View style={styles.board}>
          <BalootHomeScreen
            game={game}
            identity={identity}
            wallet={wallet}
            onWalletUpdate={onWalletUpdate}
            onPlay={(modeId) => onPlay?.(game, modeId)}
            onOpenRooms={onOpenRooms}
            onSelectGame={setIdx}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <GameHomeScreen
            game={game}
            identity={identity}
            wallet={wallet}
            onWalletUpdate={onWalletUpdate}
            onPlay={(modeId) => onPlay?.(game, modeId)}
            onOpenRooms={onOpenRooms}
            onSelectGame={setIdx}
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#08161a" },
  bg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  scroll: { padding: 14, paddingBottom: 30 },
  board: { flex: 1, paddingHorizontal: 14, paddingTop: 6, paddingBottom: 12 },

  top: { flexDirection: "row-reverse", alignItems: "center", gap: 8, paddingTop: 52, paddingHorizontal: 14, paddingBottom: 8 },
  topAv: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  chips: { flex: 1, flexDirection: "row-reverse", alignItems: "center", gap: 6 },
  chip: {
    flexDirection: "row-reverse", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4,
  },
  chipVal: { color: "#eaf6f3", fontWeight: "700", fontSize: 13 },
  dot: { width: 16, height: 16, borderRadius: 8 },
  diamond: { width: 14, height: 14, transform: [{ rotate: "45deg" }], backgroundColor: "#4aa8dd" },
  star: { color: "#ffce5a", fontSize: 11 },
  reward: { width: 38, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rewardLbl: { fontSize: 7, fontWeight: "700", color: "#fff" },
  rewardBadge: {
    position: "absolute", top: -4, left: -4, width: 14, height: 14, borderRadius: 7,
    backgroundColor: "#e0483d", alignItems: "center", justifyContent: "center",
  },
  rewardBadgeTxt: { fontSize: 9, fontWeight: "700", color: "#fff" },

  tabs: { flexDirection: "row-reverse", paddingHorizontal: 8, marginBottom: 4 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 8 },
  tabTxt: { color: "#9dc0b8", fontSize: 12 },
  tabUnderline: { width: 22, height: 3, borderRadius: 2, marginTop: 5 },
});
