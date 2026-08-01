// ===== بيانات الألعاب + ثيم لكل لعبة (نسخة الموبايل) =====
// منقولة من نسخة الويب (client/src/lobby/games.js) ومكيّفة لـ React Native:
// التدرّجات هنا مصفوفات ألوان تُمرَّر لمكوّن LinearGradient بدل نصوص CSS.
//
// الصور (اختيارية): ضعها في mobile/assets/games/<id>.png ثم فعّل السطر hero
// في كل لعبة. راجع mobile/assets/games/README.md لطريقة الوضع.

export const GAMES = [
  {
    id: "jackaroo",
    tab: "جاكارو",
    heroTitle: "جاكارو",
    icon: "jackaroo",
    hero: "jackaroo-hero",
    // خلفية بطاقة اللعبة (بنفسجي)
    card: ["#2a1440", "#231038", "#1a0c2b", "#12081f", "#0c0518"],
    accent: "#f5c451",
    accentGrad: ["#c77dff", "#8a4bd0"],
    heroGrad: ["#6a2f8f", "#3a1850"],
    cast: [
      { emoji: "🦊", name: "جاكارو", on: true },
      { emoji: "🐯", name: "لودو", on: false },
      { emoji: "🦁", name: "بلوت", on: false },
      { emoji: "🐆", name: "السلم والثعابين", on: false },
    ],
    modes: [
      { id: "complex", label: "كمبلكس", emoji: "🗂", icon: "cards", tint: ["#2aa878", "#1f8560"], dark: false },
      { id: "1v1", label: "واحد ضد واحد", emoji: "👤", icon: "vs", tint: ["#2f9fe0", "#1f74b8"], big: true },
      { id: "normal", label: "عادي", emoji: "🎲", icon: "ludo-dice", tint: ["#e0b24a", "#b0832f"], dark: true },
    ],
  },
  {
    id: "ludo",
    tab: "لودو",
    heroTitle: "لودو",
    icon: "ludo-dice",
    hero: "ludo-hero",
    card: ["#123840", "#0f2d34", "#0c242a", "#091a20", "#061216"],
    accent: "#ffd24a",
    accentGrad: ["#3fd3ac", "#1f9a7c"],
    heroGrad: ["#2a6b63", "#235a54"],
    cast: [
      { emoji: "🦊", name: "جاكارو", on: false },
      { emoji: "🐯", name: "لودو", on: true },
      { emoji: "🦁", name: "بلوت", on: false },
      { emoji: "🐆", name: "السلم والثعابين", on: false },
    ],
    modes: [
      { id: "arrow", label: "سهم", emoji: "🏹", icon: "board", tint: ["#2aa878", "#1f8560"], dark: false },
      { id: "classic", label: "كلاسيكي", emoji: "🎲", icon: "ludo-dice", tint: ["#2f9fe0", "#1f74b8"], big: true },
      { id: "1v1", label: "واحد ضد واحد", emoji: "🎯", icon: "vs", tint: ["#e0b24a", "#b0832f"], dark: true },
    ],
  },
  {
    id: "baloot",
    tab: "بلوت",
    heroTitle: "بلوت",
    icon: "baloot",
    hero: "baloot-hero",
    card: ["#3a1810", "#2e130c", "#231009", "#180b06", "#0f0704"],
    accent: "#ffce5a",
    accentGrad: ["#ff8a3d", "#d0632a"],
    heroGrad: ["#1f8a4a", "#0f5a2e"],
    cast: [
      { emoji: "🦊", name: "جاكارو", on: false },
      { emoji: "🐯", name: "لودو", on: false },
      { emoji: "🦁", name: "بلوت", on: true },
      { emoji: "🐆", name: "السلم والثعابين", on: false },
    ],
    modes: [
      { id: "baloot", label: "بلوت", emoji: "🃏", icon: "baloot-play", tint: ["#2f9fe0", "#1f74b8"], big: true },
      { id: "friends", label: "مع الأصدقاء", emoji: "👥", icon: "friends", tint: ["#2aa878", "#1f8560"], dark: false },
      { id: "vip", label: "غرفة VIP", emoji: "👑", icon: "vip", tint: ["#e0b24a", "#b0832f"], dark: true },
    ],
  },
  {
    id: "snake",
    tab: "السلم والثعابين",
    heroTitle: "السلم والثعابين",
    icon: "snake",
    hero: "snake-hero",
    card: ["#0e3a34", "#0b302c", "#082824", "#05201d", "#031715"],
    accent: "#e8c874",
    accentGrad: ["#3ad6c4", "#1f9a8c"],
    heroGrad: ["#1f8a8a", "#0f4a5a"],
    cast: [
      { emoji: "🦊", name: "جاكارو", on: false },
      { emoji: "🐯", name: "لودو", on: false },
      { emoji: "🦁", name: "بلوت", on: false },
      { emoji: "🐆", name: "السلم والثعابين", on: true },
    ],
    modes: [
      { id: "fast", label: "سريع", emoji: "⚡", icon: "bolt", tint: ["#2aa878", "#1f8560"], dark: false },
      { id: "classic", label: "كلاسيكي", emoji: "🎲", icon: "board", tint: ["#2f9fe0", "#1f74b8"], big: true },
      { id: "1v1", label: "واحد ضد واحد", emoji: "🎯", icon: "vs", tint: ["#e0b24a", "#b0832f"], dark: true },
    ],
  },
];

// شريط التنقّل السفلي المشترك (مطابق لـ NAV في الويب)
// icon = إيموجي احتياطي، img = مفتاح أيقونة 3D في ../data/icons.js
export const NAV = [
  { id: "me", label: "أنا", icon: "👤", img: "profile" },
  { id: "messages", label: "الرسائل", icon: "💬", img: "messages" },
  { id: "rooms", label: "غرف صوتية", icon: "🎙", img: "voice" },
  { id: "home", label: "الرئيسية", icon: "🏠", img: "home" },
];
