import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Image, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GAMES } from "../data/games";
import { ICONS } from "../data/icons";
import GameModals from "./modals/GameModals";

const DARK = "#08161a";
const SCREEN_W = Dimensions.get("window").width;

/* أيقونة PNG مع إيموجي احتياطي */
const Ico = ({ name, size = 40, fallback }) =>
  ICONS[name] ? (
    <Image source={ICONS[name]} style={{ width: size, height: size }} resizeMode="contain" />
  ) : (
    <Text style={{ fontSize: size * 0.7 }}>{fallback}</Text>
  );

/* عدّاد تنازلي حيّ HH:MM:SS — يلتفّ إلى 24 ساعة عند الصفر */
function useCountdown(start = 23 * 3600 + 18 * 60 + 37) {
  const [rem, setRem] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setRem((s) => (s > 0 ? s - 1 : 24 * 3600)), 1000);
    return () => clearInterval(t);
  }, []);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(Math.floor(rem / 3600))}:${p(Math.floor((rem % 3600) / 60))}:${p(rem % 60)}`;
}

/* عنصر سكّة جانبية: مربّع متدرّج + إيموجي + وسم */
const Rail = ({ colors, emoji, label, timer, onPress }) => (
  <Pressable style={styles.railItem} onPress={onPress}>
    <LinearGradient colors={colors} style={styles.railBtn}>
      <Text style={styles.railEmoji}>{emoji}</Text>
    </LinearGradient>
    <Text style={[styles.railLbl, timer && styles.railTimer]} numberOfLines={1}>{label}</Text>
  </Pressable>
);

/* لوحة بلوت كاملة تملأ الشاشة دون تمرير (نظير BalootHome في الويب) */
export default function BalootHomeScreen({ game, identity, wallet, onWalletUpdate, onPlay, onOpenRooms, onSelectGame }) {
  const countdown = useCountdown();
  const name = identity?.name || "Mohammad";
  const initial = (identity?.name || "M").trim().slice(0, 1).toUpperCase();
  const rooms = () => onOpenRooms?.();
  const [modal, setModal] = useState(null);
  const open = (key) => () => setModal(key);

  return (
    <View style={styles.root}>
      {/* ===== الصورة كخلفية علوية كاملة (بلا قصّ لأسفلها) ===== */}
      <Image source={ICONS[game.hero]} style={[styles.bg, { aspectRatio: game.aspect }]} resizeMode="cover" />
      <LinearGradient
        colors={["transparent", "rgba(8,22,26,0.22)", "rgba(8,22,26,0.92)"]}
        locations={[0, 0.44, 0.8]}
        style={styles.bgFade}
        pointerEvents="none"
      />

      {/* ===== الأزرار تطفو فوق أسفل الصورة، مثبّتة للأسفل بلا سحب ===== */}
      <View style={styles.body}>
        {/* ===== صفّ الأزرار السريعة ===== */}
        <View style={styles.railsRow}>
        <Rail colors={["#5b6fd6", "#3a49a8"]} emoji="🌙" label="رأس السنة" onPress={open("ranking")} />
        <Rail colors={["#4bb06a", "#2f8149"]} emoji="🌍" label="كأس العالم" onPress={open("ranking")} />
        <Rail colors={["#d766a8", "#a83d81"]} emoji="✨" label={countdown} timer onPress={open("glory")} />
        <Rail colors={["#3fb6c4", "#2a8a97"]} emoji="👥" label="الأصدقاء" onPress={open("friends")} />
        <Rail colors={["#5aba5f", "#3c8c40"]} emoji="🗓️" label="اليومي" onPress={open("tasks")} />
        <Rail colors={["#e0a94a", "#b87a24"]} emoji="🏅" label="44د" timer onPress={open("achievements")} />
      </View>

      {/* ===== زر اللعب الرئيسي ===== */}
      <Pressable onPress={() => onPlay?.("baloot")}>
        <LinearGradient colors={["#f7cf6a", "#e0a532", "#c8861a"]} style={styles.play}>
          <View style={styles.playIco}>
            <Ico name="baloot-play" size={34} fallback="🃏" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.playTitle}>إلعب بلوت</Text>
            <Text style={styles.playSub}>مباراة سريعة الآن</Text>
          </View>
        </LinearGradient>
      </Pressable>

      {/* ===== أزرار الأنماط ===== */}
      <View style={styles.modes}>
        <Pressable style={{ flex: 1 }} onPress={open("friends")}>
          <LinearGradient colors={["rgba(58,72,140,0.85)", "rgba(38,48,98,0.9)"]} style={[styles.mode, styles.modeBlue]}>
            <Text style={styles.modeEmoji}>🧑‍🤝‍🧑</Text>
            <Text style={styles.modeLbl}>العب مع الأصدقاء</Text>
          </LinearGradient>
        </Pressable>
        <Pressable style={{ flex: 1.15 }} onPress={open("vip")}>
          <LinearGradient colors={["#7d5cc8", "#59379e"]} style={[styles.mode, styles.modeVip]}>
            <Text style={styles.modeEmoji}>👑</Text>
            <Text style={[styles.modeLbl, { fontSize: 13 }]}>غرفة VIP</Text>
          </LinearGradient>
        </Pressable>
        <Pressable style={{ flex: 1 }} onPress={open("ranking")}>
          <LinearGradient colors={["rgba(94,84,42,0.9)", "rgba(64,56,26,0.92)"]} style={[styles.mode, styles.modeGold]}>
            <Text style={styles.modeEmoji}>🏆</Text>
            <Text style={styles.modeLbl}>المنافسات</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* ===== أنواع اللعب — بلاطات 3D للتنقّل ===== */}
      <View style={styles.games}>
        {GAMES.map((g, i) => {
          const active = g.id === game.id;
          return (
            <Pressable key={g.id} style={{ flex: 1 }} onPress={() => (active ? onPlay?.("baloot") : onSelectGame?.(i))}>
              <LinearGradient
                colors={active ? ["#8a5a24", "#6b4318"] : ["rgba(20,60,48,0.9)", "rgba(12,40,32,0.92)"]}
                style={[styles.game, active ? styles.gameActive : styles.gameBorder]}
              >
                <Ico name={g.icon} size={30} fallback="🎲" />
                <Text style={[styles.gameName, active && { color: "#fff", fontWeight: "700" }]} numberOfLines={1}>
                  {g.tab}
                </Text>
              </LinearGradient>
            </Pressable>
          );
        })}
        </View>
      </View>

      <GameModals
        modal={modal}
        onClose={() => setModal(null)}
        identity={identity}
        wallet={wallet}
        onWalletUpdate={onWalletUpdate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK },
  bg: { position: "absolute", top: 0, left: 0, right: 0, width: "100%" },
  bgFade: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  body: { flex: 1, justifyContent: "flex-end", paddingHorizontal: 14, paddingBottom: 12, gap: 9 },

  railsRow: { flexDirection: "row-reverse", justifyContent: "space-around", alignItems: "flex-start", marginBottom: 2 },
  railItem: { alignItems: "center", gap: 3, width: 52 },
  railBtn: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  railEmoji: { fontSize: 19 },
  railLbl: { fontSize: 8, color: "#cbb193", textAlign: "center" },
  railTimer: { color: "#f0c46a", fontWeight: "700" },

  play: {
    flexDirection: "row-reverse", alignItems: "center", gap: 12,
    borderRadius: 20, paddingHorizontal: 16, height: 56,
  },
  playIco: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  playTitle: { fontSize: 22, fontWeight: "800", color: "#fff", textAlign: "right" },
  playSub: { fontSize: 11, color: "#ffe9d2", textAlign: "right" },

  modes: { flexDirection: "row-reverse", gap: 10 },
  mode: { borderRadius: 16, paddingVertical: 9, paddingHorizontal: 4, alignItems: "center", gap: 5 },
  modeBlue: { borderWidth: 1, borderColor: "rgba(140,160,240,0.2)" },
  modeVip: { borderWidth: 1, borderColor: "rgba(210,180,255,0.3)" },
  modeGold: { borderWidth: 1, borderColor: "rgba(240,210,120,0.2)" },
  modeEmoji: { fontSize: 20 },
  modeLbl: { fontSize: 11, fontWeight: "700", color: "#eef1ff", textAlign: "center" },

  games: { flexDirection: "row-reverse", gap: 10 },
  game: { borderRadius: 14, paddingHorizontal: 4, paddingVertical: 7, alignItems: "center", gap: 4 },
  gameBorder: { borderWidth: 1, borderColor: "rgba(240,200,140,0.12)" },
  gameActive: { borderWidth: 1.5, borderColor: "#f3c469" },
  gameName: { fontWeight: "600", fontSize: 9, color: "#d8c0a2", textAlign: "center" },
});
