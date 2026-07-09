// ===== بيانات الألعاب + ثيم لكل لعبة =====
// كل لعبة تحمل: الشعار، تدرّج الخلفية، ألوان الثيم، الشخصيات (emoji كبديل للرسومات)،
// أنماط اللعب (الأزرار) والإجراءات الثانوية. السحب لليسار/اليمين يبدّل اللعبة.

export const GAMES = [
  {
    id: "jackaroo",
    logo: "JACKAROO",
    tab: "جاكارو",
    // صورة المشهد الجاهزة (تُعرض بدل الرسم المتحرك SVG). الملف في client/public/games.
    photo: "/games/jackaroo.png",
    // تدرّج خلفية المشهد + ألوان الثيم
    bg: "radial-gradient(120% 90% at 50% 0%, #6a2f8f 0%, #3a1850 45%, #1f0e2e 100%)",
    glow: "#b06bff",
    accent: "#f5c451",
    // شخصيات المشهد (تقريب بصري للرسومات الأصلية)
    cast: ["🦁", "🧔🏻", "🧕🏻", "🧑🏽"],
    // قِطع طائرة فوق الطاولة
    pieces: ["🎴", "🔴", "🔵", "🟢", "🟡"],
    table: "linear-gradient(160deg, #7a3aa6, #3c1a55)",
    // أنماط اللعب: عمود يسار صغير + بطاقة يمين كبيرة
    modes: [
      { id: "complex", label: "كمبلكس", iconId: "cards", size: "sm", tint: "#2bbf9e" },
      { id: "normal", label: "عادي", iconId: "dice", size: "sm", tint: "#f0a93a" },
      { id: "1v1", label: "ا ضد ا", iconId: "swords", size: "lg", tint: "#3aa3ff" },
    ],
    secondary: [
      { id: "tournaments", label: "منافسات", iconId: "trophy", tint: "#caa23a" },
      { id: "vip", label: "غرفة VIP", iconId: "crown", tint: "#3a86c8" },
      { id: "friends", label: "العب مع الأصدقاء", iconId: "friends", tint: "#5a5f8a" },
    ],
  },
  {
    id: "ludo",
    logo: "LUDO",
    tab: "لودو",
    bg: "radial-gradient(120% 90% at 50% 0%, #8a4a22 0%, #5a2e16 45%, #2a160b 100%)",
    glow: "#ffb347",
    accent: "#ffd24a",
    cast: ["🦁", "🧔🏻", "🧑🏽", "🧕🏻"],
    pieces: ["🎲", "🔴", "🔵", "🟢", "🟡"],
    table: "linear-gradient(160deg, #b5651d, #5a2e16)",
    modes: [
      { id: "classic", label: "كلاسيكي", iconId: "dice", size: "lg", tint: "#f0a93a" },
      { id: "arrow", label: "سهم", iconId: "bow", size: "lg", tint: "#8a6bff" },
    ],
    secondary: [
      { id: "tournaments", label: "منافسات", iconId: "trophy", tint: "#caa23a" },
      { id: "friends", label: "العب مع الأصدقاء", iconId: "friends", tint: "#5a5f8a" },
    ],
  },
  {
    id: "baloot",
    logo: "BALOOT",
    tab: "بلوت",
    bg: "radial-gradient(120% 90% at 50% 0%, #a8451c 0%, #6a2c12 45%, #2a1208 100%)",
    glow: "#ff8a3d",
    accent: "#ffce5a",
    cast: ["🦁", "🧔🏻", "🧑🏽", "🧕🏻"],
    pieces: ["🂡", "🂱", "🃁", "🃑"],
    table: "linear-gradient(160deg, #1f8a4a, #0f5a2e)",
    modes: [
      { id: "baloot", label: "بلوت", iconId: "cards", size: "wide", tint: "#ff7a3a" },
    ],
    secondary: [
      { id: "tournaments", label: "منافسات", iconId: "trophy", tint: "#caa23a" },
      { id: "vip", label: "غرفة VIP", iconId: "crown", tint: "#3a86c8" },
      { id: "friends", label: "العب مع الأصدقاء", iconId: "friends", tint: "#5a5f8a" },
    ],
  },
  {
    id: "snake",
    logo: "SNAKE",
    tab: "السلم و الثعبان",
    bg: "radial-gradient(120% 90% at 50% 0%, #1f6a8a 0%, #134a5a 45%, #0b2a2a 100%)",
    glow: "#3ad6c4",
    accent: "#7fffd4",
    cast: ["🦁", "🐍", "🧑🏽", "🧕🏻"],
    pieces: ["🪜", "🐍", "🎲", "🔴", "🟢"],
    table: "linear-gradient(160deg, #1f8a8a, #0f4a5a)",
    modes: [
      { id: "classic", label: "كلاسيكي", iconId: "dice", size: "lg", tint: "#2bbf9e" },
      { id: "fast", label: "سريع", iconId: "bolt", size: "lg", tint: "#f0a93a" },
    ],
    secondary: [
      { id: "tournaments", label: "منافسات", iconId: "trophy", tint: "#caa23a" },
      { id: "friends", label: "العب مع الأصدقاء", iconId: "friends", tint: "#5a5f8a" },
    ],
  },
];

// شريط التنقّل السفلي
export const NAV = [
  { id: "me", label: "أنا", icon: "🧑" },
  { id: "messages", label: "الرسائل", icon: "💬" },
  { id: "rooms", label: "الغرف الصوتية", icon: "🎙️" },
  { id: "home", label: "الرئيسية", icon: "⬢" },
];
