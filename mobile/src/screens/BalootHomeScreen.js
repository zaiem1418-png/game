import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GAMES } from "../data/games";
import { ICONS } from "../data/icons";

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
export default function BalootHomeScreen({ game, identity, onPlay, onOpenRooms, onTournaments, onSelectGame }) {
  const countdown = useCountdown();
  const name = identity?.name || "Mohammad";
  const initial = (identity?.name || "M").trim().slice(0, 1).toUpperCase();
  const rooms = () => onOpenRooms?.();

  return (
    <View style={styles.wrap}>
      {/* ===== لافتة الترحيب ===== */}
      <LinearGradient
        colors={["rgba(26,74,60,0.9)", "rgba(12,44,36,0.85)"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.welcome}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.welcomeT} numberOfLines={1}>
            أهلاً، <Text style={{ color: "#ffce5a" }}>{name}</Text> 👋
          </Text>
          <Text style={styles.welcomeSub} numberOfLines={1}>جاهز للّعب والفوز؟ اختر لعبتك المفضّلة</Text>
        </View>
        <LinearGradient colors={["#ffe08a", "#e2a532"]} style={styles.welcomeAv}>
          <Text style={styles.welcomeAvTxt}>{initial}</Text>
        </LinearGradient>
      </LinearGradient>

      {/* ===== بطاقات الترتيب ===== */}
      <View style={styles.ranks}>
        <Pressable style={{ flex: 1 }} onPress={onTournaments}>
          <View style={styles.rank}>
            <LinearGradient colors={["#ffe08a", "#e2a532"]} style={styles.rankIco}>
              <Text style={{ fontSize: 15 }}>🏆</Text>
            </LinearGradient>
            <View>
              <Text style={styles.rankMain}>+100</Text>
              <Text style={styles.rankSub}>الترتيب العام</Text>
            </View>
          </View>
        </Pressable>
        <Pressable style={{ flex: 1 }} onPress={onTournaments}>
          <View style={styles.rank}>
            <LinearGradient colors={["#b58cf0", "#7d4fd6"]} style={styles.rankIco}>
              <Text style={{ fontSize: 14, color: "#fff" }}>★</Text>
            </LinearGradient>
            <View>
              <Text style={styles.rankMain}>16</Text>
              <Text style={styles.rankSub}>سلسلة التصنيف</Text>
            </View>
          </View>
        </Pressable>
      </View>

      {/* ===== المشهد + السكك الجانبية (يملأ المساحة المتبقّية) ===== */}
      <View style={styles.stage}>
        <View style={styles.rail}>
          <Rail colors={["#5b6fd6", "#3a49a8"]} emoji="🌙" label="رأس السنة" onPress={onTournaments} />
          <Rail colors={["#4bb06a", "#2f8149"]} emoji="🌍" label="كأس العالم" onPress={onTournaments} />
          <Rail colors={["#d766a8", "#a83d81"]} emoji="✨" label={countdown} timer onPress={onTournaments} />
        </View>

        <View style={styles.hero}>
          <Image source={ICONS["baloot-hero"]} style={styles.heroImg} resizeMode="cover" />
          <View style={styles.heroCap}>
            <View style={styles.heroPlate}>
              <Text style={styles.heroPlateTxt}>بلوت</Text>
            </View>
            <View style={styles.heroSubWrap}>
              <Text style={styles.heroSub}>تحدَّ الأصدقاء والعائلة</Text>
            </View>
          </View>
        </View>

        <View style={styles.rail}>
          <Rail colors={["#3fb6c4", "#2a8a97"]} emoji="👥" label="الأصدقاء" onPress={rooms} />
          <Rail colors={["#5aba5f", "#3c8c40"]} emoji="🗓️" label="اليومي" onPress={onTournaments} />
          <Rail colors={["#e0a94a", "#b87a24"]} emoji="🏅" label="44د 22س" timer onPress={onTournaments} />
        </View>
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
        <Pressable style={{ flex: 1 }} onPress={rooms}>
          <LinearGradient colors={["rgba(58,72,140,0.85)", "rgba(38,48,98,0.9)"]} style={[styles.mode, styles.modeBlue]}>
            <Text style={styles.modeEmoji}>🧑‍🤝‍🧑</Text>
            <Text style={styles.modeLbl}>العب مع الأصدقاء</Text>
          </LinearGradient>
        </Pressable>
        <Pressable style={{ flex: 1.15 }} onPress={rooms}>
          <LinearGradient colors={["#7d5cc8", "#59379e"]} style={[styles.mode, styles.modeVip]}>
            <Text style={styles.modeEmoji}>👑</Text>
            <Text style={[styles.modeLbl, { fontSize: 13 }]}>غرفة VIP</Text>
          </LinearGradient>
        </Pressable>
        <Pressable style={{ flex: 1 }} onPress={onTournaments}>
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
                <Ico name={g.icon} size={40} fallback="🎲" />
                <Text style={[styles.gameName, active && { color: "#fff", fontWeight: "700" }]} numberOfLines={1}>
                  {g.tab}
                </Text>
              </LinearGradient>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: 10 },

  welcome: {
    flexDirection: "row-reverse", alignItems: "center", gap: 12,
    borderWidth: 1, borderColor: "rgba(240,200,140,0.14)", borderRadius: 18, padding: 12,
  },
  welcomeAv: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  welcomeAvTxt: { fontWeight: "800", fontSize: 20, color: "#7a4310" },
  welcomeT: { fontWeight: "800", fontSize: 17, color: "#fbf1e2", textAlign: "right" },
  welcomeSub: { fontSize: 11.5, color: "#d3b89b", marginTop: 2, textAlign: "right" },

  ranks: { flexDirection: "row-reverse", gap: 10 },
  rank: {
    flexDirection: "row-reverse", alignItems: "center", gap: 10,
    borderWidth: 1, borderColor: "rgba(240,200,140,0.12)", borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: "rgba(22,64,52,0.85)",
  },
  rankIco: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  rankMain: { fontWeight: "700", fontSize: 15, color: "#f6e8d3", textAlign: "right" },
  rankSub: { fontSize: 10, color: "#bfa588", textAlign: "right" },

  stage: { flex: 1, flexDirection: "row-reverse", gap: 8, alignItems: "stretch" },
  rail: { width: 52, gap: 10, justifyContent: "center" },
  railItem: { alignItems: "center", gap: 3 },
  railBtn: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  railEmoji: { fontSize: 20 },
  railLbl: { fontSize: 8, color: "#cbb193", textAlign: "center" },
  railTimer: { color: "#f0c46a", fontWeight: "700" },

  hero: {
    flex: 1, borderRadius: 20, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(240,200,140,0.18)",
    backgroundColor: "#0f5a2e",
  },
  heroImg: { width: "100%", height: "100%" },
  heroCap: { position: "absolute", top: 10, left: 0, right: 0, alignItems: "center" },
  heroPlate: {
    paddingHorizontal: 30, paddingVertical: 5, borderRadius: 8,
    backgroundColor: "#f6dfa5", borderWidth: 2, borderColor: "#c99a4e",
  },
  heroPlateTxt: { fontSize: 24, fontWeight: "800", color: "#7a4310", letterSpacing: 1 },
  heroSubWrap: { marginTop: 5, paddingHorizontal: 12, paddingVertical: 3, borderRadius: 999, backgroundColor: "rgba(6,26,20,0.72)" },
  heroSub: { fontSize: 10, color: "#f3e3c9" },

  play: {
    flexDirection: "row-reverse", alignItems: "center", gap: 12,
    borderRadius: 20, paddingHorizontal: 16, height: 66,
  },
  playIco: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  playTitle: { fontSize: 22, fontWeight: "800", color: "#fff", textAlign: "right" },
  playSub: { fontSize: 11, color: "#ffe9d2", textAlign: "right" },

  modes: { flexDirection: "row-reverse", gap: 10 },
  mode: { borderRadius: 16, paddingVertical: 12, paddingHorizontal: 4, alignItems: "center", gap: 6 },
  modeBlue: { borderWidth: 1, borderColor: "rgba(140,160,240,0.2)" },
  modeVip: { borderWidth: 1, borderColor: "rgba(210,180,255,0.3)" },
  modeGold: { borderWidth: 1, borderColor: "rgba(240,210,120,0.2)" },
  modeEmoji: { fontSize: 20 },
  modeLbl: { fontSize: 11, fontWeight: "700", color: "#eef1ff", textAlign: "center" },

  games: { flexDirection: "row-reverse", gap: 10 },
  game: { borderRadius: 14, paddingHorizontal: 4, paddingVertical: 10, alignItems: "center", gap: 6 },
  gameBorder: { borderWidth: 1, borderColor: "rgba(240,200,140,0.12)" },
  gameActive: { borderWidth: 1.5, borderColor: "#f3c469" },
  gameName: { fontWeight: "600", fontSize: 9, color: "#d8c0a2", textAlign: "center" },
});
