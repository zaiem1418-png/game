// تعريف التفاعلات السريعة (Room Reactions) — تظهر فوق صورة المستخدم على المقعد.
// لكل تفاعل: الإيموجي، التسمية، المدة، نوع الجسيمات، وصوت اختياري.

export const REACTIONS = [
  { type: "laugh",     emoji: "😂", label: "ضحك",    dur: 2800, particle: "bubble",   count: 5, sound: "laugh" },
  { type: "cry",       emoji: "😭", label: "بكاء",   dur: 3000, particle: "tear",     count: 6, sound: "cry" },
  { type: "angry",     emoji: "😡", label: "غضب",    dur: 2600, particle: "ember",    count: 7, sound: "angry" },
  { type: "clap",      emoji: "👏", label: "تصفيق",  dur: 2600, particle: "clap",     count: 6, sound: "clap" },
  { type: "fire",      emoji: "🔥", label: "حماس",   dur: 3000, particle: "flame",    count: 6, sound: "whoosh" },
  { type: "love",      emoji: "❤️", label: "حب",     dur: 3000, particle: "heart",    count: 6, sound: "chime" },
  { type: "celebrate", emoji: "🎉", label: "احتفال", dur: 3200, particle: "confetti", count: 10, sound: "party" },
  { type: "dance",     emoji: "💃", label: "رقص",    dur: 3200, particle: "note",     count: 6, sound: "party" },
  { type: "like",      emoji: "👍", label: "إعجاب",  dur: 2400, particle: "thumb",    count: 3, sound: "pop" },
  { type: "respect",   emoji: "👑", label: "احترام", dur: 3000, particle: "shine",    count: 6, sound: "sparkle" },
];

export const REACTION_MAP = Object.fromEntries(REACTIONS.map((r) => [r.type, r]));

// إيموجي الجسيمات الصغيرة لكل نوع
export const PARTICLE_EMOJI = {
  bubble: "😄",
  tear: "💧",
  ember: "✦",
  clap: "👏",
  flame: "🔥",
  heart: "❤️",
  confetti: "▪",
  note: "🎵",
  thumb: "👍",
  shine: "✨",
};
