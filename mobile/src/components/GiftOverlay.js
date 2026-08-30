import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Animated, Dimensions, Easing, Pressable } from "react-native";
import LottieView from "lottie-react-native";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { useVideoPlayer, VideoView } from "expo-video";

const { width: SW, height: SH } = Dimensions.get("window");

// أصوات الهدايا تُقدَّم من أصل الويب (Vercel) لا خادم اللعبة.
const CLIENT_ORIGIN = "https://game-hcsc.vercel.app";
// الأصوات الموجودة فعلاً (البقية تُتجاهَل بلا 404).
const SOUNDS = new Set(["helicopter.mp3", "fireworks.mp3", "rocket.mp3", "lion_roar.mp3", "tiger_roar.mp3", "dragon_roar.mp3", "jet.mp3", "supercar_engine.mp3"]);
// أصول MP4 مفقودة على الـCDN.
const BROKEN = new Set(["crown.mp4", "whale.mp4"]);
const assetOk = (url) => !!url && !BROKEN.has(String(url).split("/").pop());

// رسوم Lottie الاحترافية المضمّنة (تعمل دون شبكة، متجهية عالية الدقة)
const L = {
  bg: require("../../assets/lottie/bg.json"),
  rays: require("../../assets/lottie/rays.json"),
  fireworks: require("../../assets/lottie/fireworks.json"),
  rocket: require("../../assets/lottie/rocket.json"),
  coins: require("../../assets/lottie/coins.json"),
  money: require("../../assets/lottie/money.json"),
  heart: require("../../assets/lottie/heart.json"),
  trophy: require("../../assets/lottie/trophy.json"),
  stars: require("../../assets/lottie/stars.json"),
};

// يختار المشهد البصري لكل هدية
function pickVisual(def) {
  const id = def.id || "";
  const s = def.scenario || "";
  if (id === "helicopter") return { custom: "heli" };
  if (id === "plane") return { custom: "fly" };
  if (id === "fireworks" || s === "fireworksShow") return { lottie: L.fireworks, fill: true, loop: true };
  if (id === "rocket" || s === "rocket") return { lottie: L.rocket, fill: true, loop: false };
  if (id === "moneybouquet" || s === "moneyRain") return { lottie: L.coins, fill: true, loop: true };
  if (s === "heartBurst" || s === "heartStorm" || id === "heart") return { lottie: L.heart, size: 320, loop: true };
  if (["lion", "tiger", "dragon", "phoenix"].includes(id)) return { custom: "roar" };
  if (def.rarity === "legendary") return { lottie: L.trophy, size: 300, loop: true };
  return { lottie: L.stars, size: 320, loop: true };
}

function soundUrl(def) {
  const map = def.sounds || {};
  for (const p of Object.values(map)) {
    const name = String(p).split("/").pop();
    if (SOUNDS.has(name)) return CLIENT_ORIGIN + p;
  }
  return null;
}

export default function GiftOverlay({ event, onDone }) {
  const def = event?.gift || {};
  const combo = event?.combo || 1;
  const fromName = event?.from?.name || "";
  const duration = Math.max(3800, Math.min(9000, Number(def.duration) || 4800));
  const visual = useMemo(() => pickVisual(def), [def.id, def.scenario]);
  const sUrl = useMemo(() => soundUrl(def), [def.id]);
  const wantVideo = def.renderer === "video" && assetOk(def.asset);

  const [videoFailed, setVideoFailed] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const videoOp = useRef(new Animated.Value(0)).current;

  const player = useVideoPlayer(wantVideo ? def.asset : null, (p) => {
    try { p.loop = false; p.muted = false; p.play(); } catch {}
  });

  const finish = useCallback(() => {
    Animated.timing(fade, { toValue: 0, duration: 340, useNativeDriver: true }).start(() => onDone?.());
  }, [fade, onDone]);

  // الصوت الحقيقي (يعمل حتى مع صامت الجهاز)
  useEffect(() => {
    let ap = null;
    (async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true });
        if (sUrl) {
          ap = createAudioPlayer({ uri: sUrl });
          ap.volume = def.volume == null ? 0.9 : Number(def.volume);
          ap.play();
        }
      } catch {}
    })();
    return () => { try { ap?.remove?.(); } catch {} };
  }, [sUrl]);

  // الدخول + النبض + الاهتزاز + مؤقّت الإنهاء
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
    ]).start();
    if (def.shake) {
      Animated.loop(Animated.sequence([
        Animated.timing(shakeX, { toValue: 1, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -1, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 0, duration: 50, useNativeDriver: true }),
        Animated.delay(650),
      ])).start();
    }
    const t = setTimeout(finish, duration);
    return () => clearTimeout(t);
  }, [duration, finish, def.shake, fade, pop, shakeX]);

  useEffect(() => {
    if (!wantVideo || !player) return;
    const subs = [];
    try {
      subs.push(player.addListener("playingChange", (e) => {
        if (e?.isPlaying) Animated.timing(videoOp, { toValue: 1, duration: 350, useNativeDriver: true }).start();
      }));
      subs.push(player.addListener("statusChange", (e) => { if (e?.status === "error" || e?.error) setVideoFailed(true); }));
      subs.push(player.addListener("playToEnd", () => finish()));
    } catch {}
    return () => subs.forEach((s) => { try { s?.remove?.(); } catch {} });
  }, [wantVideo, player, videoOp, finish]);

  const shakeTx = shakeX.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] });
  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const showVideo = wantVideo && !videoFailed;

  return (
    <Animated.View style={[styles.overlay, { opacity: fade }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={finish} />

      {/* خلفية متدرّجة متحرّكة (Lottie) ملء الشاشة */}
      <LottieView source={L.bg} autoPlay loop resizeMode="cover" style={styles.bg} speed={0.8} />
      {/* أشعّة ضوء خلف الهدية */}
      <LottieView source={L.rays} autoPlay loop resizeMode="cover" style={styles.rays} speed={0.6} />

      <Animated.View style={[StyleSheet.absoluteFill, styles.center, { transform: [{ translateX: shakeTx }] }]} pointerEvents="none">
        <Animated.View style={{ transform: [{ scale: popScale }], alignItems: "center", justifyContent: "center" }}>
          {visual.lottie ? (
            <LottieView
              source={visual.lottie}
              autoPlay
              loop={visual.loop !== false}
              resizeMode="contain"
              style={visual.fill ? styles.giftFill : { width: visual.size || 300, height: visual.size || 300 }}
              speed={1}
            />
          ) : (
            <CustomScene kind={visual.custom} def={def} />
          )}
        </Animated.View>
      </Animated.View>

      {/* طبقة الفيديو الحقيقي فوق الكل عند نجاح تشغيله */}
      {showVideo && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: videoOp }]} pointerEvents="none">
          <VideoView player={player} style={styles.video} contentFit="cover" nativeControls={false} allowsFullscreen={false} />
        </Animated.View>
      )}

      {/* شريط الاسم/الكمية */}
      <View style={styles.info} pointerEvents="none">
        <Text style={styles.giftEmoji}>{def.emoji || "🎁"}</Text>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.giftName} numberOfLines={1}>{def.name || "هدية"}{combo > 1 ? `  ×${combo}` : ""}</Text>
          {fromName ? <Text style={styles.fromTxt}>من {fromName}</Text> : null}
        </View>
      </View>
    </Animated.View>
  );
}

// مشاهد مخصّصة (هليكوبتر/طائرة تطير، أو كائن يزأر) فوق خلفية Lottie الاحترافية
function CustomScene({ kind, def }) {
  if (kind === "roar") return <RoarScene emoji={def.emoji || "🦁"} />;
  return <FlyScene emoji={def.emoji || "🚁"} heli={kind === "heli"} />;
}

function FlyScene({ emoji, heli }) {
  const fly = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const rotor = useRef(new Animated.Value(0)).current;
  const dust = useMemo(() => Array.from({ length: 10 }, () => ({ x: (Math.random() - 0.5) * 130, delay: Math.random() * 500, dur: 700 + Math.random() * 700, v: new Animated.Value(0) })), []);
  useEffect(() => {
    Animated.timing(fly, { toValue: 1, duration: 5000, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start();
    if (heli) Animated.loop(Animated.timing(rotor, { toValue: 1, duration: 130, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: 1, duration: 850, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(bob, { toValue: 0, duration: 850, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ])).start();
    dust.forEach((p) => Animated.loop(Animated.sequence([
      Animated.delay(p.delay),
      Animated.timing(p.v, { toValue: 1, duration: p.dur, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(p.v, { toValue: 0, duration: 0, useNativeDriver: true }),
    ])).start());
  }, []);
  const tx = fly.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [SW * 0.7, 0, 0, -SW * 0.85] });
  const ty = bob.interpolate({ inputRange: [0, 1], outputRange: [-8, 12] });
  const tilt = fly.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: ["16deg", "0deg", "0deg", "-18deg"] });
  const spin = rotor.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  return (
    <Animated.View style={{ transform: [{ translateX: tx }, { translateY: ty }, { rotate: tilt }] }}>
      {heli && <Animated.View style={[styles.rotor, { transform: [{ rotate: spin }] }]} />}
      {heli && <Animated.View style={[styles.rotor, styles.rotorV, { transform: [{ rotate: spin }] }]} />}
      <Text style={styles.heli}>{emoji}</Text>
      {heli && dust.map((p, i) => {
        const dy = p.v.interpolate({ inputRange: [0, 1], outputRange: [46, 120] });
        const dx = p.v.interpolate({ inputRange: [0, 1], outputRange: [0, p.x] });
        const op = p.v.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.5, 0] });
        return <Animated.View key={i} style={[styles.dust, { opacity: op, transform: [{ translateX: dx }, { translateY: dy }] }]} />;
      })}
    </Animated.View>
  );
}

function RoarScene({ emoji }) {
  const zoom = useRef(new Animated.Value(0)).current;
  const aura = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(zoom, { toValue: 1, friction: 5, tension: 55, useNativeDriver: true }).start();
    Animated.loop(Animated.sequence([
      Animated.timing(aura, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(aura, { toValue: 0, duration: 650, useNativeDriver: true }),
    ])).start();
  }, []);
  const sc = zoom.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
  const pulse = aura.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  return (
    <Animated.Text style={[styles.hugeEmoji, { transform: [{ scale: Animated.multiply(sc, pulse) }] }]}>{emoji}</Animated.Text>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 999, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(4,8,14,0.82)" },
  bg: { ...StyleSheet.absoluteFillObject, width: SW, height: SH, opacity: 0.55 },
  rays: { position: "absolute", width: SW * 1.4, height: SW * 1.4, opacity: 0.5 },
  center: { alignItems: "center", justifyContent: "center" },
  giftFill: { width: SW, height: SH * 0.7 },
  video: { width: SW, height: SH },
  heli: { fontSize: 108 },
  hugeEmoji: { fontSize: 156 },
  rotor: { position: "absolute", top: 16, alignSelf: "center", width: 150, height: 12, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.3)" },
  rotorV: { width: 12, height: 150, top: -52 },
  dust: { position: "absolute", top: 62, alignSelf: "center", width: 10, height: 10, borderRadius: 5, backgroundColor: "rgba(220,210,190,0.6)" },
  info: { position: "absolute", bottom: 84, flexDirection: "row-reverse", alignItems: "center", gap: 12, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 22, paddingHorizontal: 20, paddingVertical: 11, borderWidth: 1, borderColor: "rgba(255,255,255,0.16)" },
  giftEmoji: { fontSize: 40 },
  giftName: { color: "#fff", fontWeight: "900", fontSize: 21, textAlign: "center" },
  fromTxt: { color: "#cfe6df", fontSize: 13, marginTop: 2 },
});
