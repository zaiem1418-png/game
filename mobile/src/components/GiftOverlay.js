import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, StyleSheet, Animated, Dimensions, Easing, Pressable } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";

const { width: SW, height: SH } = Dimensions.get("window");

// أصول MP4 مفقودة على الـCDN (404) → نتجاوز الفيديو ونعرض سيناريو الإيموجي مباشرةً.
const BROKEN_ASSETS = new Set(["crown.mp4", "whale.mp4"]);
function assetOk(url) {
  if (!url) return false;
  const name = String(url).split("/").pop();
  return !BROKEN_ASSETS.has(name);
}

// عرض هدية واحدة (فيديو سينمائي عالي الدقة أو سيناريو إيموجي متحرّك) ثم onDone.
export default function GiftOverlay({ event, onDone }) {
  const def = event?.gift || {};
  const combo = event?.combo || 1;
  const fromName = event?.from?.name || "";
  const duration = Math.max(2500, Math.min(9000, Number(def.duration) || 3500));
  const useVideo = def.renderer === "video" && assetOk(def.asset);

  const [videoFailed, setVideoFailed] = useState(false);
  const showVideo = useVideo && !videoFailed;

  // مشغّل الفيديو (يُستدعى دائماً حفاظاً على قواعد الـhooks؛ بلا مصدر للسيناريو)
  const player = useVideoPlayer(useVideo ? def.asset : null, (p) => {
    try {
      p.loop = false;
      p.muted = false;
      p.play();
    } catch {}
  });

  // مؤثرات الدخول/الخروج
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.7)).current;

  const finish = useCallback(() => {
    Animated.timing(fade, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => onDone?.());
  }, [fade, onDone]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(finish, duration);
    return () => clearTimeout(timer);
  }, [duration, finish, fade, scale]);

  // أحداث الفيديو: النهاية → إنهاء مبكر، الخطأ → تراجع للسيناريو
  useEffect(() => {
    if (!useVideo || !player) return;
    let subEnd, subStatus;
    try {
      subEnd = player.addListener("playToEnd", () => finish());
      subStatus = player.addListener("statusChange", (s) => {
        if (s?.status === "error" || s?.error) setVideoFailed(true);
      });
    } catch {}
    return () => {
      try { subEnd?.remove?.(); subStatus?.remove?.(); } catch {}
    };
  }, [useVideo, player, finish]);

  const rarityColor =
    def.rarity === "legendary" ? "#ffce5a" :
    def.rarity === "epic" ? "#b06bff" :
    def.rarity === "rare" ? "#3fd3ac" : "#ffffff";

  return (
    <Animated.View style={[styles.overlay, { opacity: fade }]} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={finish} />

      {showVideo ? (
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls={false}
          allowsFullscreen={false}
        />
      ) : (
        <EmojiScenario emoji={def.emoji || "🎁"} />
      )}

      {/* شريط معلومات الهدية أسفل الشاشة */}
      <Animated.View style={[styles.info, { transform: [{ scale }] }]} pointerEvents="none">
        <Text style={styles.giftEmoji}>{def.emoji || "🎁"}</Text>
        <View style={{ alignItems: "center" }}>
          <Text style={[styles.giftName, { color: rarityColor }]} numberOfLines={1}>
            {def.name || "هدية"}{combo > 1 ? `  ×${combo}` : ""}
          </Text>
          {fromName ? <Text style={styles.fromTxt}>من {fromName}</Text> : null}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

// سيناريو إيموجي متحرّك: إيموجي كبير ينبض + جسيمات تطفو للأعلى (تراجع مضمون بلا ملفات).
function EmojiScenario({ emoji }) {
  const particles = useRef(
    Array.from({ length: 14 }, (_, i) => ({
      x: (Math.random() - 0.5) * SW * 0.8,
      delay: Math.random() * 500,
      dur: 1600 + Math.random() * 1400,
      size: 22 + Math.random() * 26,
      v: new Animated.Value(0),
    }))
  ).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
    particles.forEach((p) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.timing(p.v, { toValue: 1, duration: p.dur, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(p.v, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  const bigScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] });

  return (
    <View style={styles.scenario} pointerEvents="none">
      {particles.map((p, i) => {
        const ty = p.v.interpolate({ inputRange: [0, 1], outputRange: [SH * 0.28, -SH * 0.32] });
        const op = p.v.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] });
        return (
          <Animated.Text
            key={i}
            style={{ position: "absolute", fontSize: p.size, opacity: op, transform: [{ translateX: p.x }, { translateY: ty }] }}
          >
            {emoji}
          </Animated.Text>
        );
      })}
      <Animated.Text style={{ fontSize: 120, transform: [{ scale: bigScale }] }}>{emoji}</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(4,10,14,0.72)",
  },
  video: { width: SW, height: SH },
  scenario: { flex: 1, alignItems: "center", justifyContent: "center", ...StyleSheet.absoluteFillObject },
  info: {
    position: "absolute",
    bottom: 90,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  giftEmoji: { fontSize: 40 },
  giftName: { fontWeight: "900", fontSize: 20, textAlign: "center" },
  fromTxt: { color: "#cfe6df", fontSize: 13, marginTop: 2 },
});
