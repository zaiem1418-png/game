import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Image, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GAMES } from "../data/games";
import { ICONS } from "../data/icons";
import GameModals from "./modals/GameModals";

const DARK = "#08161a";
const SCREEN_W = Dimensions.get("window").width;

/* أيقونة PNG بحجم قابل للتمرير مع إيموجي احتياطي */
const Ico = ({ name, size = 22, fallback }) =>
  ICONS[name] ? (
    <Image source={ICONS[name]} style={{ width: size, height: size }} resizeMode="contain" />
  ) : (
    <Text style={{ fontSize: size * 0.8 }}>{fallback}</Text>
  );

/* عدّاد تنازلي حيّ HH:MM:SS — يلتفّ إلى 24 ساعة عند الصفر */
function useCountdown(start = 22 * 3600 + 1) {
  const [rem, setRem] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setRem((s) => (s > 0 ? s - 1 : 24 * 3600)), 1000);
    return () => clearInterval(t);
  }, []);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(Math.floor(rem / 3600))}:${p(Math.floor((rem % 3600) / 60))}:${p(rem % 60)}`;
}

const RailItem = ({ emoji, icon, label, hot, onPress }) => {
  const inner = icon ? (
    <Ico name={icon} size={22} fallback={emoji} />
  ) : (
    <Text style={styles.railEmoji}>{emoji}</Text>
  );
  return (
    <Pressable style={styles.railItem} onPress={onPress}>
      {hot ? (
        <LinearGradient colors={["#e0603a", "#a83f28"]} style={styles.railBtn}>
          {inner}
        </LinearGradient>
      ) : (
        <View style={[styles.railBtn, styles.railBtnBorder]}>{inner}</View>
      )}
      <Text style={[styles.railLbl, hot && { color: "#f0a083" }]}>{label}</Text>
    </Pressable>
  );
};

/* بلاطة نمط لعب صغيرة (خضراء/ذهبية) */
const ModeSmall = ({ mode, onPress }) => (
  <Pressable style={{ flex: 1 }} onPress={onPress}>
    <LinearGradient colors={mode.tint} style={styles.modeSm}>
      <View style={mode.dark ? styles.modeSmIcoDark : styles.modeSmIcoLight}>
        <Ico name={mode.icon} size={22} fallback={mode.emoji} />
      </View>
      <Text style={[styles.modeSmLbl, { color: mode.dark ? "#3a2708" : "#fff" }]}>{mode.label}</Text>
    </LinearGradient>
  </Pressable>
);

export default function GameHomeScreen({ game, identity, wallet, onWalletUpdate, onPlay, onOpenRooms, onSelectGame }) {
  const countdown = useCountdown();
  const name = identity?.name || "Mohammad";
  const initial = (identity?.name || "M").trim().slice(0, 1).toUpperCase();
  const rooms = () => onOpenRooms?.();
  const [modal, setModal] = useState(null);
  const open = (key) => () => setModal(key);

  const bigMode = game.modes.find((m) => m.big) || game.modes[0];
  const smallModes = game.modes.filter((m) => m !== bigMode);

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
        <RailItem icon="play" emoji="🎮" label="العب" onPress={() => onPlay?.(bigMode.id)} />
        <RailItem emoji="🏛" label="نادي الشباب" onPress={rooms} />
        <RailItem emoji="⚔" label="العصبة" hot onPress={open("tribe")} />
        <RailItem icon="friends" emoji="👥" label="الأصدقاء" onPress={open("friends")} />
        <RailItem emoji="🔊" label="الصوت" onPress={rooms} />
        <RailItem emoji="⏱" label={countdown} onPress={open("tasks")} />
      </View>

      {/* ===== أنماط اللعب ===== */}
      <View style={styles.modes}>
        <Pressable style={{ flex: 1 }} onPress={() => onPlay?.(bigMode.id)}>
          <LinearGradient colors={bigMode.tint} style={styles.modeBig}>
            <View style={styles.vs}>
              <View style={styles.vsFace}><Ico name={bigMode.icon} size={26} fallback={bigMode.emoji} /></View>
              <Text style={styles.vsTxt}>VS</Text>
              <View style={styles.vsFace}><Ico name={bigMode.icon} size={26} fallback={bigMode.emoji} /></View>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={styles.modeBigTitle}>{bigMode.label}</Text>
              <Text style={styles.modeBigSub}>اللعبة التقليدية الكاملة</Text>
            </View>
          </LinearGradient>
        </Pressable>

        <View style={styles.modeStack}>
          {smallModes.map((m) => (
            <ModeSmall key={m.id} mode={m} onPress={() => onPlay?.(m.id)} />
          ))}
        </View>
      </View>

      {/* ===== أنماط سريعة ===== */}
      <View style={styles.quick}>
        <Pressable style={{ flex: 1 }} onPress={open("ranking")}>
          <LinearGradient colors={["rgba(30,90,86,0.5)", "rgba(18,55,54,0.5)"]} style={[styles.quickBtn, styles.quickBorder]}>
            <Ico name="trophy" size={22} fallback="🏆" />
            <Text style={styles.quickLbl}>مسابقات</Text>
          </LinearGradient>
        </Pressable>
        <Pressable style={{ flex: 1 }} onPress={open("vip")}>
          <LinearGradient colors={["rgba(90,70,20,0.5)", "rgba(55,42,14,0.5)"]} style={[styles.quickBtn, styles.quickBorderGold]}>
            <Ico name="vip" size={22} fallback="👑" />
            <Text style={styles.quickLbl}>غرفة VIP</Text>
          </LinearGradient>
        </Pressable>
        <Pressable style={{ flex: 1 }} onPress={open("friends")}>
          <LinearGradient colors={["rgba(30,90,86,0.5)", "rgba(18,55,54,0.5)"]} style={[styles.quickBtn, styles.quickBorder]}>
            <Ico name="friends" size={22} fallback="👥" />
            <Text style={[styles.quickLbl, { fontSize: 11 }]}>العب مع الأصدقاء</Text>
          </LinearGradient>
        </Pressable>
      </View>

        {/* ===== بلاطات الألعاب الـ3D (وسيلة التنقّل بين الألعاب) ===== */}
        <View style={styles.games}>
        {GAMES.map((g, i) => {
          const active = g.id === game.id;
          return (
            <Pressable key={g.id} style={{ flex: 1 }} onPress={() => onSelectGame?.(i)}>
              <LinearGradient
                colors={active ? ["rgba(90,70,20,0.5)", "rgba(55,42,14,0.5)"] : ["rgba(30,90,86,0.5)", "rgba(18,55,54,0.5)"]}
                style={[styles.game, active ? styles.gameBorderGold : styles.quickBorder]}
              >
                <Ico name={g.icon} size={30} fallback={g.cast.find((c) => c.on)?.emoji || "🎲"} />
                <Text style={styles.gameName}>{g.tab}</Text>
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
  railBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(18,55,54,0.85)" },
  railBtnBorder: { borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  railEmoji: { fontSize: 16 },
  railLbl: { fontSize: 8, color: "#9dc0b8", textAlign: "center" },

  modes: { flexDirection: "row-reverse", gap: 10 },
  modeBig: { borderRadius: 16, padding: 12, minHeight: 104, alignItems: "center", justifyContent: "center", gap: 8 },
  vs: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  vsFace: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  vsTxt: { fontWeight: "800", fontStyle: "italic", fontSize: 14, color: "#fff" },
  modeBigTitle: { fontWeight: "800", fontSize: 17, color: "#fff" },
  modeBigSub: { fontSize: 11, color: "#fff", opacity: 0.85, marginTop: 3 },
  modeStack: { flex: 1, gap: 10 },
  modeSm: { flex: 1, borderRadius: 14, padding: 11, minHeight: 47, alignItems: "flex-start", justifyContent: "space-between" },
  modeSmIcoLight: { width: 30, height: 30, borderRadius: 9, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  modeSmIcoDark: { width: 30, height: 30, borderRadius: 9, backgroundColor: "rgba(0,0,0,0.15)", alignItems: "center", justifyContent: "center" },
  modeSmLbl: { fontWeight: "800", fontSize: 16 },

  quick: { flexDirection: "row-reverse", gap: 10 },
  quickBtn: { borderRadius: 14, paddingHorizontal: 8, paddingVertical: 9, alignItems: "center", gap: 5 },
  quickBorder: { borderWidth: 1, borderColor: "rgba(255,255,255,0.09)" },
  quickBorderGold: { borderWidth: 1, borderColor: "rgba(255,206,90,0.35)" },
  quickLbl: { fontWeight: "700", fontSize: 12, color: "#eaf6f3", textAlign: "center" },

  games: { flexDirection: "row-reverse", gap: 10 },
  game: { borderRadius: 14, paddingHorizontal: 4, paddingVertical: 7, alignItems: "center", gap: 4 },
  gameBorderGold: { borderWidth: 1, borderColor: "rgba(255,206,90,0.35)" },
  gameName: { fontWeight: "600", fontSize: 9, color: "#eaf6f3", textAlign: "center" },
});
