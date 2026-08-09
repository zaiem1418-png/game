import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GAMES } from "../data/games";
import { ICONS } from "../data/icons";
import GameModals from "./modals/GameModals";

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
    <View style={styles.wrap}>
      {/* ===== لافتة الترحيب ===== */}
      <LinearGradient
        colors={["rgba(30,90,86,0.5)", "rgba(18,55,54,0.5)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.welcome}
      >
        <LinearGradient colors={game.accentGrad} style={styles.welcomeAv}>
          <Text style={styles.welcomeAvTxt}>{initial}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.welcomeT}>
            <Text style={{ color: game.accent }}>👑</Text> أهلاً, <Text style={{ color: "#5fe0bd" }}>{name}</Text>!
          </Text>
          <Text style={styles.welcomeSub}>جاهز للعب والفوز؟ اختر نمط اللعب المفضّل</Text>
        </View>
      </LinearGradient>

      {/* ===== بطاقات الترتيب ===== */}
      <View style={styles.ranks}>
        <Pressable style={{ flex: 1 }} onPress={open("ranking")}>
          <LinearGradient colors={["rgba(30,90,86,0.45)", "rgba(18,55,54,0.45)"]} style={styles.rank}>
            <LinearGradient colors={game.accentGrad} style={styles.rankIco}>
              <Text style={{ fontSize: 13 }}>★</Text>
            </LinearGradient>
            <View>
              <Text style={styles.rankMain}>الترتيب 16</Text>
              <Text style={styles.rankSub}>سلسلة تصنيف</Text>
            </View>
          </LinearGradient>
        </Pressable>
        <Pressable style={{ flex: 1 }} onPress={open("ranking")}>
          <LinearGradient colors={["rgba(30,90,86,0.45)", "rgba(18,55,54,0.45)"]} style={styles.rank}>
            <LinearGradient colors={["#ffce5a", "#d99a2a"]} style={styles.rankIco}>
              <Text style={{ fontSize: 13 }}>🏆</Text>
            </LinearGradient>
            <View>
              <Text style={styles.rankMain}>+100</Text>
              <Text style={styles.rankSub}>الترتيب العام</Text>
            </View>
          </LinearGradient>
        </Pressable>
      </View>

      {/* ===== المشهد + السكك الجانبية ===== */}
      <View style={styles.stage}>
        <View style={styles.rail}>
          <RailItem icon="play" emoji="🎮" label="العب" onPress={() => onPlay?.(bigMode.id)} />
          <RailItem emoji="🏛" label="نادي الشباب" onPress={rooms} />
          <RailItem emoji="⚔" label="العصبة" hot onPress={open("tribe")} />
        </View>

        {/* مساحة شفّافة تُظهر صورة الخلفية (الطاولة والأشخاص) بين السكتين */}
        <View style={styles.heroGap} />

        <View style={styles.rail}>
          <RailItem icon="friends" emoji="👥" label="الأصدقاء" onPress={open("friends")} />
          <RailItem emoji="🔊" label="الصوت" onPress={rooms} />
          <RailItem emoji="⏱" label={countdown} onPress={open("tasks")} />
        </View>
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

      {/* ===== مضيف النوافذ (كل الأزرار أعلاه تفتح نظامها الخاص) ===== */}
      <GameModals
        modal={modal}
        onClose={() => setModal(null)}
        identity={identity}
        wallet={wallet}
        onWalletUpdate={onWalletUpdate}
      />

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
                <Ico name={g.icon} size={40} fallback={g.cast.find((c) => c.on)?.emoji || "🎲"} />
                <Text style={styles.gameName}>{g.tab}</Text>
              </LinearGradient>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },

  welcome: {
    flexDirection: "row-reverse", alignItems: "center", gap: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 16, padding: 12,
  },
  welcomeAv: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  welcomeAvTxt: { fontWeight: "800", fontSize: 20, color: "#04211b" },
  welcomeT: { fontWeight: "800", fontSize: 16, color: "#eaf6f3", textAlign: "right" },
  welcomeSub: { fontSize: 11, color: "#a9ccc4", marginTop: 2, textAlign: "right" },

  ranks: { flexDirection: "row-reverse", gap: 10 },
  rank: {
    flex: 1, flexDirection: "row-reverse", alignItems: "center", gap: 10,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 14, paddingHorizontal: 13, paddingVertical: 11,
  },
  rankIco: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  rankMain: { fontWeight: "700", fontSize: 14, color: "#eaf6f3", textAlign: "right" },
  rankSub: { fontSize: 10, color: "#9dc0b8", textAlign: "right" },

  stage: { flexDirection: "row-reverse", gap: 8, alignItems: "stretch", height: 190 },
  rail: { width: 52, gap: 8, justifyContent: "center" },
  railItem: { alignItems: "center", gap: 2 },
  railBtn: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(18,55,54,0.75)" },
  railBtnBorder: { borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  railEmoji: { fontSize: 15 },
  railLbl: { fontSize: 8, color: "#9dc0b8" },
  heroGap: { flex: 1 },

  modes: { flexDirection: "row-reverse", gap: 10 },
  modeBig: { borderRadius: 16, padding: 16, minHeight: 166, alignItems: "center", justifyContent: "center", gap: 12 },
  vs: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  vsFace: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  vsTxt: { fontWeight: "800", fontStyle: "italic", fontSize: 14, color: "#fff" },
  modeBigTitle: { fontWeight: "800", fontSize: 17, color: "#fff" },
  modeBigSub: { fontSize: 11, color: "#fff", opacity: 0.85, marginTop: 3 },
  modeStack: { flex: 1, gap: 10 },
  modeSm: { flex: 1, borderRadius: 16, padding: 16, minHeight: 78, alignItems: "flex-start", justifyContent: "space-between" },
  modeSmIcoLight: { width: 30, height: 30, borderRadius: 9, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  modeSmIcoDark: { width: 30, height: 30, borderRadius: 9, backgroundColor: "rgba(0,0,0,0.15)", alignItems: "center", justifyContent: "center" },
  modeSmLbl: { fontWeight: "800", fontSize: 16 },

  quick: { flexDirection: "row-reverse", gap: 10 },
  quickBtn: { borderRadius: 14, paddingHorizontal: 8, paddingVertical: 13, alignItems: "center", gap: 6 },
  quickBorder: { borderWidth: 1, borderColor: "rgba(255,255,255,0.09)" },
  quickBorderGold: { borderWidth: 1, borderColor: "rgba(255,206,90,0.35)" },
  quickLbl: { fontWeight: "700", fontSize: 12, color: "#eaf6f3", textAlign: "center" },

  games: { flexDirection: "row-reverse", gap: 10 },
  game: { borderRadius: 14, paddingHorizontal: 4, paddingVertical: 12, alignItems: "center", gap: 6 },
  gameBorderGold: { borderWidth: 1, borderColor: "rgba(255,206,90,0.35)" },
  gameName: { fontWeight: "600", fontSize: 9, color: "#eaf6f3", textAlign: "center" },
});
