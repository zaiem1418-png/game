import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Animated, Dimensions, Easing, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { useVideoPlayer, VideoView } from "expo-video";

const { width: SW, height: SH } = Dimensions.get("window");
const rnd = (a, b) => a + Math.random() * (b - a);

const BROKEN = new Set(["crown.mp4", "whale.mp4"]);
const assetOk = (url) => !!url && !BROKEN.has(String(url).split("/").pop());

// أصوات مضمّنة محلياً (تعمل فوراً وبلا إنترنت)
const SND = {
  rose: require("../../assets/sounds/pop.wav"), kiss: require("../../assets/sounds/pop.wav"),
  hookah: require("../../assets/sounds/whoosh.wav"), kafu: require("../../assets/sounds/fanfare.wav"),
  icecream: require("../../assets/sounds/chime.wav"), chocolate: require("../../assets/sounds/chime.wav"),
  baymax: require("../../assets/sounds/chime.wav"), crown: require("../../assets/sounds/fanfare.wav"),
  heart: require("../../assets/sounds/chime.wav"), loveletter: require("../../assets/sounds/chime.wav"),
  kissyou: require("../../assets/sounds/chime.wav"), steak: require("../../assets/sounds/pop.wav"),
  fireworks: require("../../assets/sounds/fireworks_long.wav"), oud: require("../../assets/sounds/oud.wav"),
  moneybouquet: require("../../assets/sounds/cash.wav"), balloons: require("../../assets/sounds/party.wav"),
  rocket: require("../../assets/sounds/rocket.mp3"), plane: require("../../assets/sounds/jet.mp3"),
  helicopter: require("../../assets/sounds/helicopter.mp3"), lion: require("../../assets/sounds/roar_big.wav"),
  tiger: require("../../assets/sounds/tiger_roar.mp3"), ferrari: require("../../assets/sounds/supercar_engine.mp3"),
  goldencar: require("../../assets/sounds/supercar_engine.mp3"), castle: require("../../assets/sounds/build.wav"),
  diamond: require("../../assets/sounds/sparkle.wav"), dragon: require("../../assets/sounds/dragon_roar.mp3"),
  phoenix: require("../../assets/sounds/phoenix.wav"), yacht: require("../../assets/sounds/yacht_horn.wav"),
  whale: require("../../assets/sounds/whale.wav"), galaxy: require("../../assets/sounds/cosmic.wav"),
};

const PALETTE = {
  legendary: ["#2a1150", "#7b2ff7", "#ffb300"],
  epic: ["#2a1150", "#b06bff", "#ff5a9e"],
  rare: ["#08313a", "#12a89a", "#3fd3ac"],
  common: ["#0e1b34", "#2a5a9e", "#46a6ff"],
};
const CONFETTI_COLORS = ["#ff5a7a", "#ffce5a", "#5ad1ff", "#b06bff", "#5be08a", "#ff9f43"];

function sceneFor(def) {
  const id = def.id || "", s = def.scenario || "";
  if (id === "helicopter") return "heli";
  if (id === "rocket") return "up";
  if (["plane", "ferrari", "goldencar", "yacht"].includes(id)) return "cross";
  if (["lion", "tiger", "dragon", "phoenix", "whale"].includes(id)) return "roar";
  if (id === "fireworks" || s === "fireworksShow") return "fireworks";
  if (id === "moneybouquet" || s === "moneyRain") return "rain";
  if (["heart", "kiss", "loveletter", "kissyou"].includes(id) || s.indexOf("heart") >= 0) return "hearts";
  if (["crown", "diamond", "castle", "galaxy", "balloons", "oud"].includes(id)) return "sparkle";
  return "burst";
}

export default function GiftOverlay({ event, onDone }) {
  const def = event?.gift || {};
  const combo = event?.combo || 1;
  const fromName = event?.from?.name || "";
  const duration = Math.max(4200, Math.min(9000, Number(def.duration) || 5000));
  const scene = useMemo(() => sceneFor(def), [def.id, def.scenario]);
  const pal = PALETTE[def.rarity] || PALETTE.common;
  const wantVideo = def.renderer === "video" && assetOk(def.asset);

  const [videoFailed, setVideoFailed] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const videoOp = useRef(new Animated.Value(0)).current;

  const player = useVideoPlayer(wantVideo ? def.asset : null, (p) => {
    try { p.loop = false; p.muted = false; p.play(); } catch {}
  });

  const finish = useCallback(() => {
    Animated.timing(fade, { toValue: 0, duration: 350, useNativeDriver: true }).start(() => onDone?.());
  }, [fade, onDone]);

  useEffect(() => {
    let ap = null;
    (async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true });
        const src = SND[def.id];
        if (src) { ap = createAudioPlayer(src); ap.volume = def.volume == null ? 0.9 : Number(def.volume); ap.play(); }
      } catch {}
    })();
    return () => { try { ap?.remove?.(); } catch {} };
  }, [def.id]);

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 240, useNativeDriver: true }).start();
    if (def.shake) {
      Animated.loop(Animated.sequence([
        Animated.timing(shakeX, { toValue: 1, duration: 48, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -1, duration: 48, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 0, duration: 48, useNativeDriver: true }),
        Animated.delay(600),
      ])).start();
    }
    const t = setTimeout(finish, duration);
    return () => clearTimeout(t);
  }, [duration, finish, def.shake, fade, shakeX]);

  useEffect(() => {
    if (!wantVideo || !player) return;
    const subs = [];
    try {
      subs.push(player.addListener("playingChange", (e) => { if (e?.isPlaying) Animated.timing(videoOp, { toValue: 1, duration: 350, useNativeDriver: true }).start(); }));
      subs.push(player.addListener("statusChange", (e) => { if (e?.status === "error" || e?.error) setVideoFailed(true); }));
      subs.push(player.addListener("playToEnd", () => finish()));
    } catch {}
    return () => subs.forEach((s) => { try { s?.remove?.(); } catch {} });
  }, [wantVideo, player, videoOp, finish]);

  const shakeTx = shakeX.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] });
  const showVideo = wantVideo && !videoFailed;

  return (
    <Animated.View style={[styles.overlay, { opacity: fade }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={finish} />

      {/* خلفية متدرّجة + هالات متحرّكة + قصاصات + أشعّة (أجواء لافتة) */}
      <LinearGradient colors={[pal[0], "#05060a", pal[0]]} style={StyleSheet.absoluteFill} />
      <AuroraGlows colors={pal} />
      <LightRays tint={pal[2]} />
      <Confetti />

      <Animated.View style={[StyleSheet.absoluteFill, styles.center, { transform: [{ translateX: shakeTx }] }]} pointerEvents="none">
        <Halo color={pal[2]} />
        <GiftScene scene={scene} def={def} />
      </Animated.View>

      {showVideo && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: videoOp }]} pointerEvents="none">
          <VideoView player={player} style={styles.video} contentFit="cover" nativeControls={false} allowsFullscreen={false} />
        </Animated.View>
      )}

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

// ===== الخلفية =====
function AuroraGlows({ colors }) {
  const blobs = useMemo(() => Array.from({ length: 5 }, (_, i) => ({
    size: rnd(220, 380), x: rnd(-SW * 0.3, SW * 0.3), y: rnd(-SH * 0.35, SH * 0.35),
    c: colors[1 + (i % 2)], dur: rnd(3500, 6000), v: new Animated.Value(0),
  })), []);
  useEffect(() => { blobs.forEach((b) => Animated.loop(Animated.sequence([
    Animated.timing(b.v, { toValue: 1, duration: b.dur, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    Animated.timing(b.v, { toValue: 0, duration: b.dur, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
  ])).start()); }, []);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {blobs.map((b, i) => {
        const ty = b.v.interpolate({ inputRange: [0, 1], outputRange: [b.y, b.y + rnd(-40, 40)] });
        const sc = b.v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] });
        return <Animated.View key={i} style={{ position: "absolute", left: SW / 2 + b.x - b.size / 2, top: SH / 2 - b.size / 2, width: b.size, height: b.size, borderRadius: b.size / 2, backgroundColor: b.c, opacity: 0.22, transform: [{ translateY: ty }, { scale: sc }] }} />;
      })}
    </View>
  );
}

function LightRays({ tint }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.loop(Animated.timing(spin, { toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: true })).start(); }, []);
  const rot = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const rays = 12;
  return (
    <Animated.View style={[styles.center, StyleSheet.absoluteFill, { transform: [{ rotate: rot }] }]} pointerEvents="none">
      {Array.from({ length: rays }).map((_, i) => (
        <View key={i} style={{ position: "absolute", width: 3, height: SH, backgroundColor: tint, opacity: 0.07, transform: [{ rotate: `${(180 / rays) * i}deg` }] }} />
      ))}
    </Animated.View>
  );
}

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 30 }, () => ({
    x: rnd(-SW / 2, SW / 2), delay: rnd(0, 2500), dur: rnd(2600, 4800), size: rnd(7, 13),
    c: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0], spin: rnd(2, 6), v: new Animated.Value(0),
  })), []);
  useEffect(() => { pieces.forEach((p) => Animated.loop(Animated.sequence([
    Animated.delay(p.delay),
    Animated.timing(p.v, { toValue: 1, duration: p.dur, easing: Easing.linear, useNativeDriver: true }),
    Animated.timing(p.v, { toValue: 0, duration: 0, useNativeDriver: true }),
  ])).start()); }, []);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p, i) => {
        const ty = p.v.interpolate({ inputRange: [0, 1], outputRange: [-60, SH + 60] });
        const tx = p.v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [p.x, p.x + rnd(-30, 30), p.x] });
        const rot = p.v.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${p.spin * 360}deg`] });
        const op = p.v.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 1, 1, 0] });
        return <Animated.View key={i} style={{ position: "absolute", left: SW / 2, top: 0, width: p.size, height: p.size * 1.6, backgroundColor: p.c, borderRadius: 2, opacity: op, transform: [{ translateX: tx }, { translateY: ty }, { rotate: rot }] }} />;
      })}
    </View>
  );
}

function Halo({ color }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.loop(Animated.sequence([
    Animated.timing(v, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    Animated.timing(v, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
  ])).start(); }, []);
  const sc = v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });
  const op = v.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.32] });
  return <Animated.View style={{ position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: color, opacity: op, transform: [{ scale: sc }] }} />;
}

// ===== المشاهد (كلها بإيموجي الهدية نفسها — دائماً ذات صلة) =====
function GiftScene({ scene, def }) {
  const emoji = def.emoji || "🎁";
  if (scene === "heli") return <FlyScene emoji={emoji} kind="heli" />;
  if (scene === "up") return <RocketScene emoji={emoji} />;
  if (scene === "cross") return <FlyScene emoji={emoji} kind="cross" />;
  if (scene === "roar") return <RoarScene emoji={emoji} />;
  if (scene === "fireworks") return <FireworksScene emoji={emoji} />;
  if (scene === "rain") return <RainScene emoji="💵" mid={emoji} />;
  if (scene === "hearts") return <RainScene emoji="❤️" up mid={emoji} />;
  return <BurstScene emoji={emoji} />;
}

function bigStyle() { return { fontSize: 118 }; }

function FlyScene({ emoji, kind }) {
  const fly = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const rotor = useRef(new Animated.Value(0)).current;
  const dust = useMemo(() => Array.from({ length: 10 }, () => ({ x: rnd(-70, 70), delay: rnd(0, 500), dur: rnd(700, 1200), v: new Animated.Value(0) })), []);
  useEffect(() => {
    Animated.timing(fly, { toValue: 1, duration: 5200, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start();
    if (kind === "heli") Animated.loop(Animated.timing(rotor, { toValue: 1, duration: 120, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: 1, duration: 820, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(bob, { toValue: 0, duration: 820, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ])).start();
    dust.forEach((p) => Animated.loop(Animated.sequence([
      Animated.delay(p.delay), Animated.timing(p.v, { toValue: 1, duration: p.dur, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(p.v, { toValue: 0, duration: 0, useNativeDriver: true }),
    ])).start());
  }, []);
  const tx = fly.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [SW * 0.72, 0, 0, -SW * 0.85] });
  const ty = bob.interpolate({ inputRange: [0, 1], outputRange: [-8, 12] });
  const tilt = fly.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: ["14deg", "0deg", "0deg", "-16deg"] });
  const spin = rotor.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  return (
    <Animated.View style={{ transform: [{ translateX: tx }, { translateY: ty }, { rotate: tilt }] }}>
      {kind === "heli" && <Animated.View style={[styles.rotor, { transform: [{ rotate: spin }] }]} />}
      {kind === "heli" && <Animated.View style={[styles.rotor, styles.rotorV, { transform: [{ rotate: spin }] }]} />}
      <Text style={bigStyle()}>{emoji}</Text>
      {kind === "heli" && dust.map((p, i) => {
        const dy = p.v.interpolate({ inputRange: [0, 1], outputRange: [46, 120] });
        const dx = p.v.interpolate({ inputRange: [0, 1], outputRange: [0, p.x] });
        const op = p.v.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.5, 0] });
        return <Animated.View key={i} style={[styles.dust, { opacity: op, transform: [{ translateX: dx }, { translateY: dy }] }]} />;
      })}
    </Animated.View>
  );
}

function RocketScene({ emoji }) {
  const launch = useRef(new Animated.Value(0)).current;
  const flame = useMemo(() => Array.from({ length: 18 }, () => ({ x: rnd(-16, 16), delay: rnd(0, 1800), v: new Animated.Value(0) })), []);
  useEffect(() => {
    Animated.timing(launch, { toValue: 1, duration: 3000, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start();
    flame.forEach((p) => Animated.loop(Animated.sequence([
      Animated.delay(p.delay), Animated.timing(p.v, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(p.v, { toValue: 0, duration: 0, useNativeDriver: true }),
    ])).start());
  }, []);
  const ty = launch.interpolate({ inputRange: [0, 1], outputRange: [SH * 0.4, -SH * 0.42] });
  return (
    <Animated.View style={{ transform: [{ translateY: ty }] }}>
      {flame.map((p, i) => {
        const fy = p.v.interpolate({ inputRange: [0, 1], outputRange: [40, 100] });
        const op = p.v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0] });
        return <Animated.View key={i} style={[styles.flame, { opacity: op, transform: [{ translateX: p.x }, { translateY: fy }] }]} />;
      })}
      <Text style={bigStyle()}>{emoji}</Text>
    </Animated.View>
  );
}

function RoarScene({ emoji }) {
  const zoom = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(zoom, { toValue: 1, friction: 5, tension: 55, useNativeDriver: true }).start();
    Animated.loop(Animated.timing(ring, { toValue: 1, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: true })).start();
  }, []);
  const sc = zoom.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
  const ringSc = ring.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2.4] });
  const ringOp = ring.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });
  return (
    <View style={styles.center}>
      <Animated.View style={{ position: "absolute", width: 200, height: 200, borderRadius: 100, borderWidth: 4, borderColor: "#fff", opacity: ringOp, transform: [{ scale: ringSc }] }} />
      <Animated.Text style={{ fontSize: 168, transform: [{ scale: sc }] }}>{emoji}</Animated.Text>
    </View>
  );
}

function FireworksScene({ emoji }) {
  const bursts = useMemo(() => Array.from({ length: 5 }, (_, b) => ({
    cx: rnd(-SW * 0.32, SW * 0.32), cy: rnd(-SH * 0.24, SH * 0.02), delay: b * 620,
    color: CONFETTI_COLORS[b % CONFETTI_COLORS.length],
    parts: Array.from({ length: 18 }, (_, i) => ({ ang: (i / 18) * Math.PI * 2, v: new Animated.Value(0) })),
  })), []);
  useEffect(() => { bursts.forEach((bu) => bu.parts.forEach((p) => Animated.loop(Animated.sequence([
    Animated.delay(bu.delay), Animated.timing(p.v, { toValue: 1, duration: 1000, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    Animated.timing(p.v, { toValue: 0, duration: 0, useNativeDriver: true }), Animated.delay(1900),
  ])).start())); }, []);
  return (
    <View style={styles.center}>
      {bursts.map((bu, bi) => bu.parts.map((p, i) => {
        const r = 140;
        const dx = p.v.interpolate({ inputRange: [0, 1], outputRange: [bu.cx, bu.cx + Math.cos(p.ang) * r] });
        const dy = p.v.interpolate({ inputRange: [0, 1], outputRange: [bu.cy, bu.cy + Math.sin(p.ang) * r + 30] });
        const op = p.v.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] });
        return <Animated.View key={`${bi}-${i}`} style={{ position: "absolute", width: 9, height: 9, borderRadius: 5, backgroundColor: bu.color, opacity: op, transform: [{ translateX: dx }, { translateY: dy }] }} />;
      }))}
      <Text style={{ fontSize: 80, opacity: 0.9 }}>{emoji}</Text>
    </View>
  );
}

function RainScene({ emoji, up, mid }) {
  const drops = useMemo(() => Array.from({ length: 20 }, () => ({ x: rnd(-SW / 2, SW / 2), delay: rnd(0, 1600), dur: rnd(1500, 2800), size: rnd(24, 42), v: new Animated.Value(0) })), []);
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }).start();
    drops.forEach((p) => Animated.loop(Animated.sequence([
      Animated.delay(p.delay), Animated.timing(p.v, { toValue: 1, duration: p.dur, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(p.v, { toValue: 0, duration: 0, useNativeDriver: true }),
    ])).start());
  }, []);
  const sc = pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  return (
    <View style={styles.center}>
      {drops.map((p, i) => {
        const ty = p.v.interpolate({ inputRange: [0, 1], outputRange: up ? [SH * 0.4, -SH * 0.4] : [-SH * 0.45, SH * 0.45] });
        const op = p.v.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 1, 1, 0] });
        return <Animated.Text key={i} style={{ position: "absolute", fontSize: p.size, opacity: op, transform: [{ translateX: p.x }, { translateY: ty }] }}>{emoji}</Animated.Text>;
      })}
      {mid ? <Animated.Text style={{ fontSize: 130, transform: [{ scale: sc }] }}>{mid}</Animated.Text> : null}
    </View>
  );
}

function BurstScene({ emoji }) {
  const pop = useRef(new Animated.Value(0)).current;
  const parts = useMemo(() => Array.from({ length: 16 }, (_, i) => ({ ang: (i / 16) * Math.PI * 2, size: rnd(18, 30), v: new Animated.Value(0) })), []);
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pop, { toValue: 1, duration: 620, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(pop, { toValue: 0, duration: 620, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ])).start();
    parts.forEach((p) => Animated.loop(Animated.sequence([
      Animated.timing(p.v, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(p.v, { toValue: 0, duration: 0, useNativeDriver: true }), Animated.delay(250),
    ])).start());
  }, []);
  const sc = pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });
  return (
    <View style={styles.center}>
      {parts.map((p, i) => {
        const r = 130;
        const dx = p.v.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(p.ang) * r] });
        const dy = p.v.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(p.ang) * r] });
        const op = p.v.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] });
        return <Animated.Text key={i} style={{ position: "absolute", fontSize: p.size, opacity: op, transform: [{ translateX: dx }, { translateY: dy }] }}>✨</Animated.Text>;
      })}
      <Animated.Text style={{ fontSize: 150, transform: [{ scale: sc }] }}>{emoji}</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 999, alignItems: "center", justifyContent: "center" },
  center: { alignItems: "center", justifyContent: "center" },
  video: { width: SW, height: SH },
  rotor: { position: "absolute", top: 14, alignSelf: "center", width: 155, height: 12, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.32)" },
  rotorV: { width: 12, height: 155, top: -56 },
  dust: { position: "absolute", top: 64, alignSelf: "center", width: 10, height: 10, borderRadius: 5, backgroundColor: "rgba(220,210,190,0.6)" },
  flame: { position: "absolute", alignSelf: "center", width: 16, height: 26, borderRadius: 9, backgroundColor: "#ffae3a" },
  info: { position: "absolute", bottom: 84, flexDirection: "row-reverse", alignItems: "center", gap: 12, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 22, paddingHorizontal: 20, paddingVertical: 11, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  giftEmoji: { fontSize: 40 },
  giftName: { color: "#fff", fontWeight: "900", fontSize: 21, textAlign: "center" },
  fromTxt: { color: "#cfe6df", fontSize: 13, marginTop: 2 },
});
