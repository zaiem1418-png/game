// ===== خط التطبيق العالمي: Aref Ruqaa Ink =====
// expo-font يسجّل كل ملف باسم عائلة منفصل، لذا نملك عائلتين:
//   "ArefRuqaaInk"      → الوزن العادي
//   "ArefRuqaaInk-Bold" → الوزن العريض
// نرقّع مكوّني Text و TextInput لحقن fontFamily المناسب حسب fontWeight،
// حتى تُطبَّق الخط في كل الشاشات دون تعديل مئات أنماط StyleSheet.
import React from "react";
import { Text as RNText, TextInput as RNTextInput, StyleSheet } from "react-native";

export const FONT_REGULAR = "ArefRuqaaInk";
export const FONT_BOLD = "ArefRuqaaInk-Bold";

// خريطة الملفات لتمريرها إلى useFonts
export const FONT_MAP = {
  [FONT_REGULAR]: require("../assets/fonts/ArefRuqaaInk-Regular.ttf"),
  [FONT_BOLD]: require("../assets/fonts/ArefRuqaaInk-Bold.ttf"),
};

function isBold(style) {
  const flat = StyleSheet.flatten(style) || {};
  const w = flat.fontWeight;
  if (w === "bold") return true;
  const n = typeof w === "string" ? parseInt(w, 10) : w;
  return typeof n === "number" && !Number.isNaN(n) && n >= 600;
}

function patch(Comp) {
  if (!Comp || Comp.__arefPatched) return;
  const orig = Comp.render;
  if (typeof orig !== "function") return;
  Comp.__arefPatched = true;
  Comp.render = function (...args) {
    const el = orig.apply(this, args);
    const fam = isBold(el.props.style) ? FONT_BOLD : FONT_REGULAR;
    // نضع خطّنا أولاً ثم النمط الأصلي (لا شيء في التطبيق يحدّد fontFamily صراحةً)
    return React.cloneElement(el, {
      style: [{ fontFamily: fam }, el.props.style],
    });
  };
}

// يُستدعى مرة واحدة عند تحميل الوحدة — عملية idempotent.
export function applyGlobalFont() {
  patch(RNText);
  patch(RNTextInput);
}

applyGlobalFont();
