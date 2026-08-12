import React from "react";
import { View, Text, Image, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { ICONS } from "../data/icons";

// شاشة البداية (Splash) — تظهر عند فتح التطبيق ريثما تُحمّل الهوية/الخطوط.
// التصميم على نمط مرجع «ملوك الألعاب»: صورة كاملة كخلفية + شعار + الشخصية + مؤشّر تحميل.
//
// 🦅 لإضافة الصقر (الشخصية الرئيسية) وصورة البداية النهائية لاحقاً:
//   1) ضع الملفّين في mobile/assets/games/  (مثلاً splash.png و falcon.png)
//   2) سجّلهما في mobile/src/data/icons.js:
//        "splash-hero": require("../../assets/games/splash.png"),
//        "falcon":      require("../../assets/games/falcon.png"),
//   3) بدّل HERO_KEY إلى "splash-hero"، وفعّل كتلة <Image> للصقر أدناه.
const HERO_KEY = "jackaroo-hero"; // مؤقّت — بدّله إلى "splash-hero" عند توفّر الصورة
const HAS_FALCON = !!ICONS["falcon"];

const SCRIM = ["rgba(20,8,30,0.30)", "transparent", "rgba(20,8,30,0.82)"];

export default function SplashScreen() {
  return (
    <View style={styles.fill}>
      <StatusBar style="light" />
      <Image source={ICONS[HERO_KEY]} style={styles.bg} resizeMode="cover" />
      <LinearGradient colors={SCRIM} locations={[0, 0.5, 1]} style={styles.bg} />

      <View style={styles.center}>
        {/* الشخصية الرئيسية (الصقر) — تظهر تلقائياً عند إضافة الأصل */}
        {HAS_FALCON ? (
          <Image source={ICONS["falcon"]} style={styles.mascot} resizeMode="contain" />
        ) : null}

        {/* الشعار */}
        <Text style={styles.brand}>جاكارو</Text>
        <View style={styles.plate}>
          <Text style={styles.tagline}>تحدَّ الأصدقاء والعائلة</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <ActivityIndicator color="#ffce5a" size="large" />
        <Text style={styles.loading}>جارٍ التحميل…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#140a1e" },
  bg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingHorizontal: 24 },
  mascot: { width: 200, height: 200, marginBottom: 6 },
  brand: {
    fontSize: 52, fontWeight: "900", color: "#ffd766", letterSpacing: 2,
    textShadowColor: "rgba(0,0,0,0.6)", textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 10,
  },
  plate: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999,
    backgroundColor: "rgba(6,26,20,0.6)", borderWidth: 1, borderColor: "rgba(255,206,90,0.35)",
  },
  tagline: { fontSize: 13, color: "#f3e3c9" },
  footer: { position: "absolute", bottom: 54, left: 0, right: 0, alignItems: "center", gap: 10 },
  loading: { color: "#e7d6c2", fontSize: 13 },
});
