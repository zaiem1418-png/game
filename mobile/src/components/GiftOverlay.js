import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Animated, Dimensions, Easing, Pressable } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";

const { width: SW, height: SH } = Dimensions.get("window");

// أصول MP4 مفقودة على الـCDN → نتجاهلها ونعرض المشهد المتحرّك مباشرةً.
const BROKEN = new Set(["crown.mp4", "whale.mp4"]);
const assetOk = (url) => !!url && !BROKEN.has(String(url).split("/").pop());

const rnd = (a, b) => a + Math.random() * (b - a);

// ===== عرض هدية واحدة: مشهد متحرّك قوي دائماً + طبقة فيديو MP4 فوقه إن نجح تحميله =====
export default function GiftOverlay({ event, onDone }) {
  const def = event?.gift || {};
  const combo = event?.combo || 1;
  const fromName = event?.from?.name || "";
  const duration = Math.max(3500, Math.min(9000, Number(def.duration) || 4500));
  const wantVideo = def.renderer === "video" && assetOk(def.asset);

  const [videoFailed, setVideoFailed] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const videoOp = useRef(new Animated.Value(0)).current;

  // مشغّل الفيديو (يُستدعى دائماً؛ بلا مصدر لغير الفيديو حفاظاً على قواعد hooks)
  const player = useVideoPlayer(wantVideo ? def.asset : null, (p) => {
    try { p.loop = false; p.muted = false; p.play(); } catch {}
  });

  const finish = useCallback(() => {
    Animated.timing(fade, { toValue: 0, duration: 320, useNativeDriver: true }).start(() => onDone?.());
  }, [fade, onDone]);

  // دخول + اهتزاز الشاشة (للهدايا القوية) + مؤقّت الإنهاء
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    if (def.shake) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shakeX, { toValue: 1, duration: 55, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: -1, duration: 55, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: 0, duration: 55, useNativeDriver: true }),
          Animated.delay(700),
        ])
      ).start();
    }
    const t = setTimeout(finish, duration);
    return () => clearTimeout(t);
  }, [duration, finish, def.shake, fade, shakeX]);

  // أحداث الفيديو: يظهر فقط عند بدء التشغيل الفعلي (وإلا يبقى المشهد ظاهراً)
  useEffect(() => {
    if (!wantVideo || !player) return;
    const subs = [];
    try {
      subs.push(player.addListener("playingChange", (e) => {
        if (e?.isPlaying) Animated.timing(videoOp, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      }));
      subs.push(player.addListener("statusChange", (e) => {
        if (e?.status === "error" || e?.error) setVideoFailed(true);
      }));
      subs.push(player.addListener("playToEnd", () => finish()));
    } catch {}
    return () => subs.forEach((s) => { try { s?.remove?.(); } catch {} });
  }, [wantVideo, player, videoOp, finish]);

  const shakeTx = shakeX.interpolate({ inputRange: [-1, 1], outputRange: [-9, 9] });
  const showVideoLayer = wantVideo && !videoFailed;

  return (
    <Animated.View style={[styles.overlay, { opacity: fade }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={finish} />
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: shakeTx }] }]} pointerEvents="none">
        {/* المشهد المتحرّك القوي — يظهر دائماً */}
        <CinematicScene def={def} />
        {/* طبقة الفيديو الحقيقي فوق المشهد عند نجاح التحميل */}
        {showVideoLayer && (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: videoOp }]}>
            <VideoView player={player} style={styles.video} contentFit="cover" nativeControls={false} allowsFullscreen={false} />
          </Animated.View>
        )}
      </Animated.View>

      {/* شريط الاسم/الكمية */}
      <View style={styles.info} pointerEvents="none">
        <Text style={styles.giftEmoji}>{def.emoji || "🎁"}</Text>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.giftName} numberOfLines={1}>
            {def.name || "هدية"}{combo > 1 ? `  ×${combo}` : ""}
          </Text>
          {fromName ? <Text style={styles.fromTxt}>من {fromName}</Text> : null}
        </View>
      </View>
    </Animated.View>
  );
}

// يوجّه لكل هدية مشهدها القوي حسب scenario/id
function CinematicScene({ def }) {
  const s = def.scenario || "";
  const id = def.id || "";
  if (id === "helicopter" || s === "helicopter") return <HelicopterScene emoji="🚁" />;
  if (id === "plane" || s === "plane") return <FlyByScene emoji="✈️" />;
  if (id === "rocket" || s === "rocket") return <RocketScene emoji="🚀" />;
  if (s === "fireworksShow" || id === "fireworks") return <FireworksScene />;
  if (["lion", "tiger", "dragon", "phoenix"].includes(id) || s === "lion" || s === "dragon" || s === "phoenix")
    return <RoarScene emoji={def.emoji || "🦁"} />;
  if (s === "moneyRain" || id === "moneybouquet") return <RainScene emoji="💵" />;
  if (s === "heartBurst" || s === "heartStorm") return <BurstScene emoji="❤️" tint="#ff5a7a" />;
  return <BurstScene emoji={def.emoji || "🎁"} tint="#ffce5a" />;
}

// ===== هليكوبتر: يطير للداخل، دوّار سريع، كشّاف، غبار، ثم يخرج =====
function HelicopterScene({ emoji }) {
  const fly = useRef(new Animated.Value(0)).current;   // 0 داخل، مسار الطيران
  const bob = useRef(new Animated.Value(0)).current;
  const rotor = useRef(new Animated.Value(0)).current;
  const beam = useRef(new Animated.Value(0)).current;
  const dust = useMemo(() => Array.from({ length: 12 }, () => ({
    x: rnd(-70, 70), delay: rnd(0, 500), dur: rnd(700, 1300), v: new Animated.Value(0),
  })), []);

  useEffect(() => {
    Animated.timing(fly, { toValue: 1, duration: 5200, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start();
    Animated.loop(Animated.timing(rotor, { toValue: 1, duration: 140, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(bob, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(beam, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(beam, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ])).start();
    dust.forEach((p) => Animated.loop(Animated.sequence([
      Animated.delay(p.delay),
      Animated.timing(p.v, { toValue: 1, duration: p.dur, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(p.v, { toValue: 0, duration: 0, useNativeDriver: true }),
    ])).start());
  }, []);

  // مسار: يدخل من اليمين → يحوم بالوسط → يخرج لليسار
  const tx = fly.interpolate({ inputRange: [0, 0.28, 0.72, 1], outputRange: [SW * 0.75, 0, 0, -SW * 0.85] });
  const ty = bob.interpolate({ inputRange: [0, 1], outputRange: [-6, 10] });
  const tilt = fly.interpolate({ inputRange: [0, 0.28, 0.72, 1], outputRange: ["18deg", "0deg", "0deg", "-20deg"] });
  const spin = rotor.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const beamRot = beam.interpolate({ inputRange: [0, 1], outputRange: ["-16deg", "16deg"] });

  return (
    <View style={styles.center} pointerEvents="none">
      <Animated.View style={{ transform: [{ translateX: tx }, { translateY: ty }, { rotate: tilt }] }}>
        {/* الكشّاف */}
        <Animated.View style={[styles.beam, { transform: [{ translateX: -6 }, { rotate: beamRot }] }]} />
        {/* الدوّار (قرص يدور بسرعة فوق الجسم) */}
        <Animated.View style={[styles.rotor, { transform: [{ rotate: spin }] }]} />
        <Animated.View style={[styles.rotor, styles.rotor2, { transform: [{ rotate: spin }] }]} />
        {/* الجسم */}
        <Text style={styles.heli}>{emoji}</Text>
        {/* الغبار أسفل المروحية */}
        {dust.map((p, i) => {
          const dy = p.v.interpolate({ inputRange: [0, 1], outputRange: [40, 120] });
          const dx = p.v.interpolate({ inputRange: [0, 1], outputRange: [0, p.x] });
          const op = p.v.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.5, 0] });
          return <Animated.View key={i} style={[styles.dust, { opacity: op, transform: [{ translateX: dx }, { translateY: dy }] }]} />;
        })}
      </Animated.View>
    </View>
  );
}

// طائرة/عبور أفقي سريع مع أثر
function FlyByScene({ emoji }) {
  const fly = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fly, { toValue: 1, duration: 3600, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start();
  }, []);
  const tx = fly.interpolate({ inputRange: [0, 1], outputRange: [SW * 0.8, -SW * 0.9] });
  const ty = fly.interpolate({ inputRange: [0, 0.5, 1], outputRange: [40, -20, -60] });
  return (
    <View style={styles.center} pointerEvents="none">
      <Animated.Text style={[styles.bigEmoji, { transform: [{ translateX: tx }, { translateY: ty }] }]}>{emoji}</Animated.Text>
    </View>
  );
}

// صاروخ: ينطلق من الأسفل بلهب ودخان ثم انفجار نجوم
function RocketScene({ emoji }) {
  const launch = useRef(new Animated.Value(0)).current;
  const flame = useMemo(() => Array.from({ length: 16 }, () => ({ x: rnd(-14, 14), delay: rnd(0, 1600), v: new Animated.Value(0) })), []);
  useEffect(() => {
    Animated.timing(launch, { toValue: 1, duration: 2600, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start();
    flame.forEach((p) => Animated.loop(Animated.sequence([
      Animated.delay(p.delay), Animated.timing(p.v, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(p.v, { toValue: 0, duration: 0, useNativeDriver: true }),
    ])).start());
  }, []);
  const ty = launch.interpolate({ inputRange: [0, 1], outputRange: [SH * 0.42, -SH * 0.42] });
  return (
    <View style={styles.center} pointerEvents="none">
      <Animated.View style={{ transform: [{ translateY: ty }] }}>
        {flame.map((p, i) => {
          const fy = p.v.interpolate({ inputRange: [0, 1], outputRange: [30, 90] });
          const op = p.v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0] });
          return <Animated.View key={i} style={[styles.flame, { opacity: op, transform: [{ translateX: p.x }, { translateY: fy }] }]} />;
        })}
        <Text style={styles.bigEmoji}>{emoji}</Text>
      </Animated.View>
    </View>
  );
}

// ألعاب نارية: انفجارات متتابعة من جسيمات ملوّنة
function FireworksScene() {
  const bursts = useMemo(() => Array.from({ length: 4 }, (_, b) => ({
    cx: rnd(-SW * 0.3, SW * 0.3), cy: rnd(-SH * 0.22, SH * 0.05), delay: b * 700,
    color: ["#ff5a7a", "#ffce5a", "#5ad1ff", "#b06bff"][b % 4],
    parts: Array.from({ length: 16 }, (_, i) => ({ ang: (i / 16) * Math.PI * 2, v: new Animated.Value(0) })),
  })), []);
  useEffect(() => {
    bursts.forEach((bu) => bu.parts.forEach((p) => Animated.loop(Animated.sequence([
      Animated.delay(bu.delay),
      Animated.timing(p.v, { toValue: 1, duration: 1100, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(p.v, { toValue: 0, duration: 0, useNativeDriver: true }),
      Animated.delay(1600),
    ])).start()));
  }, []);
  return (
    <View style={styles.center} pointerEvents="none">
      {bursts.map((bu, bi) => bu.parts.map((p, i) => {
        const r = 130;
        const dx = p.v.interpolate({ inputRange: [0, 1], outputRange: [bu.cx, bu.cx + Math.cos(p.ang) * r] });
        const dy = p.v.interpolate({ inputRange: [0, 1], outputRange: [bu.cy, bu.cy + Math.sin(p.ang) * r + 40] });
        const op = p.v.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] });
        return <Animated.View key={`${bi}-${i}`} style={{ position: "absolute", width: 8, height: 8, borderRadius: 4, backgroundColor: bu.color, opacity: op, transform: [{ translateX: dx }, { translateY: dy }] }} />;
      }))}
    </View>
  );
}

// زئير: الكائن يدخل مكبّراً مع هالة ونجوم
function RoarScene({ emoji }) {
  const zoom = useRef(new Animated.Value(0)).current;
  const aura = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.spring(zoom, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
    ]).start();
    Animated.loop(Animated.sequence([
      Animated.timing(aura, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(aura, { toValue: 0, duration: 700, useNativeDriver: true }),
    ])).start();
  }, []);
  const sc = zoom.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
  const pulse = aura.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });
  const auraOp = aura.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.4] });
  return (
    <View style={styles.center} pointerEvents="none">
      <Animated.View style={[styles.aura, { opacity: auraOp, transform: [{ scale: pulse }] }]} />
      <Animated.Text style={[styles.hugeEmoji, { transform: [{ scale: sc }] }]}>{emoji}</Animated.Text>
    </View>
  );
}

// مطر (مال/جسيمات) يتساقط من الأعلى
function RainScene({ emoji }) {
  const drops = useMemo(() => Array.from({ length: 22 }, () => ({ x: rnd(-SW / 2, SW / 2), delay: rnd(0, 1400), dur: rnd(1400, 2600), size: rnd(22, 40), v: new Animated.Value(0) })), []);
  useEffect(() => {
    drops.forEach((p) => Animated.loop(Animated.sequence([
      Animated.delay(p.delay),
      Animated.timing(p.v, { toValue: 1, duration: p.dur, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(p.v, { toValue: 0, duration: 0, useNativeDriver: true }),
    ])).start());
  }, []);
  return (
    <View style={styles.center} pointerEvents="none">
      {drops.map((p, i) => {
        const ty = p.v.interpolate({ inputRange: [0, 1], outputRange: [-SH * 0.5, SH * 0.5] });
        const op = p.v.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 1, 1, 0] });
        return <Animated.Text key={i} style={{ position: "absolute", fontSize: p.size, opacity: op, transform: [{ translateX: p.x }, { translateY: ty }] }}>{emoji}</Animated.Text>;
      })}
    </View>
  );
}

// انفجار عام: إيموجي كبير ينبض + جسيمات تتطاير + أشعّة
function BurstScene({ emoji, tint }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const parts = useMemo(() => Array.from({ length: 18 }, (_, i) => ({ ang: (i / 18) * Math.PI * 2, size: rnd(16, 30), v: new Animated.Value(0) })), []);
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ])).start();
    parts.forEach((p) => Animated.loop(Animated.sequence([
      Animated.timing(p.v, { toValue: 1, duration: 1500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(p.v, { toValue: 0, duration: 0, useNativeDriver: true }),
      Animated.delay(300),
    ])).start());
  }, []);
  const sc = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] });
  return (
    <View style={styles.center} pointerEvents="none">
      {parts.map((p, i) => {
        const r = 120;
        const dx = p.v.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(p.ang) * r] });
        const dy = p.v.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(p.ang) * r] });
        const op = p.v.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] });
        return <Animated.Text key={i} style={{ position: "absolute", fontSize: p.size, opacity: op, transform: [{ translateX: dx }, { translateY: dy }] }}>{emoji}</Animated.Text>;
      })}
      <Animated.View style={[styles.glow, { backgroundColor: tint, transform: [{ scale: sc }] }]} />
      <Animated.Text style={[styles.hugeEmoji, { transform: [{ scale: sc }] }]}>{emoji}</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 999, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(4,10,14,0.74)" },
  video: { width: SW, height: SH },
  center: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  bigEmoji: { fontSize: 96 },
  hugeEmoji: { fontSize: 150 },
  heli: { fontSize: 110 },
  rotor: { position: "absolute", top: 18, alignSelf: "center", width: 150, height: 12, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.28)" },
  rotor2: { width: 12, height: 150, top: -50 },
  beam: { position: "absolute", top: 78, alignSelf: "center", width: 120, height: 260, backgroundColor: "rgba(255,240,150,0.16)", borderBottomLeftRadius: 60, borderBottomRightRadius: 60 },
  dust: { position: "absolute", top: 60, alignSelf: "center", width: 10, height: 10, borderRadius: 5, backgroundColor: "rgba(220,210,190,0.6)" },
  flame: { position: "absolute", alignSelf: "center", width: 14, height: 22, borderRadius: 8, backgroundColor: "#ffae3a" },
  aura: { position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: "#ffce5a" },
  glow: { position: "absolute", width: 210, height: 210, borderRadius: 110, opacity: 0.28 },
  info: { position: "absolute", bottom: 84, flexDirection: "row-reverse", alignItems: "center", gap: 12, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 22, paddingHorizontal: 20, paddingVertical: 11, borderWidth: 1, borderColor: "rgba(255,255,255,0.16)" },
  giftEmoji: { fontSize: 40 },
  giftName: { color: "#fff", fontWeight: "900", fontSize: 21, textAlign: "center" },
  fromTxt: { color: "#cfe6df", fontSize: 13, marginTop: 2 },
});
