// عنوان السيرفر الموحّد لكل نداءات REST/Socket.
// 1) لو VITE_SERVER_URL مضبوط وقت البناء → نستخدمه (الأفضل عند النشر على Vercel).
// 2) وإلا: إن كنا نعمل محلياً (localhost) → سيرفر التطوير على 3001.
// 3) وإلا (موقع منشور بلا متغيّر بيئة) → سيرفر Render الحقيقي بدل localhost
//    حتى لا تفشل العمليات (إنشاء غرفة/محفظة...) بصمت لدى الزوّار.
const PROD_SERVER = "https://voice-room-server.onrender.com";

function resolveServerUrl() {
  const env = import.meta.env.VITE_SERVER_URL;
  if (env) return env.replace(/\/$/, "");
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  if (host === "localhost" || host === "127.0.0.1") return "http://localhost:3001";
  return PROD_SERVER;
}

export const SERVER_URL = resolveServerUrl();
