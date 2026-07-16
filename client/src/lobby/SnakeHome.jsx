import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./snakeHome.css";

/* عدّاد تنازلي حيّ HH:MM:SS — يبدأ من ~23:25 ويلتفّ إلى 24 ساعة عند الصفر */
function useCountdown(start = 23 * 3600 + 25 * 60 + 48) {
  const [rem, setRem] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setRem((s) => (s > 0 ? s - 1 : 24 * 3600)), 1000);
    return () => clearInterval(t);
  }, []);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(Math.floor(rem / 3600))}:${p(Math.floor((rem % 3600) / 60))}:${p(rem % 60)}`;
}

/* ===== أيقونات SVG (مطابقة للتصميم) ===== */
const I = {
  bell: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3a6 6 0 0 0-6 6c0 4-2 5-2 5h16s-2-1-2-5a6 6 0 0 0-6-6z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.4l6-.9z" />
    </svg>
  ),
  trophy: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M7 4h10v4a5 5 0 0 1-10 0z" />
      <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 13v4M9 20h6" />
    </svg>
  ),
  dice: (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="9" width="18" height="12" rx="2" />
      <path d="M3 13h18M12 9v12" />
      <path d="M12 9S9 4 7 5s1 4 5 4zM12 9s3-5 5-4-1 4-5 4z" />
    </svg>
  ),
  crown: (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 3v6a6 6 0 0 0 12 0V3zM4 21h16M9 21v-3h6v3" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="10" width="4" height="10" rx="1" />
      <rect x="10" y="5" width="4" height="15" rx="1" />
      <rect x="16" y="13" width="4" height="7" rx="1" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      {[
        [8, 8], [16, 8], [12, 12], [8, 16], [16, 16],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.5" fill="currentColor" />
      ))}
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" width="27" height="27" fill="currentColor">
      <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  ),
  friends: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.6a3 3 0 0 1 0 5.8M18 20a5.2 5.2 0 0 0-3-4.7" />
    </svg>
  ),
  controller: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="9" width="18" height="12" rx="2" />
      <path d="M3 13h18M12 9v12" />
      <path d="M12 9S9 4 7 5s1 4 5 4zM12 9s3-5 5-4-1 4-5 4z" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 11 12 4l8 7M6 10v9h12v-9" />
    </svg>
  ),
  mic: (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v3" />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 5h16v11H9l-4 4z" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  ),
};

export default function SnakeHome({ user, onPlay, onBack, embedded }) {
  const countdown = useCountdown();
  const name = user?.name || "بك";
  const initial = (user?.name || "S").trim().charAt(0).toUpperCase();

  return (
    <div className={`sh ${embedded ? "sh-embedded" : ""}`}>
      <span className="sh-spark" style={{ top: "18%", right: "12%", animationDelay: "0s" }} />
      <span className="sh-spark sh-spark-teal" style={{ top: "56%", left: "10%", animationDelay: ".8s" }} />
      <span className="sh-spark" style={{ top: "72%", right: "18%", animationDelay: "1.6s" }} />

      <div className="sh-content">
        {/* ===== الترحيب ===== */}
        <header className="sh-header">
          <div className="sh-avatar">{user?.avatar && user.avatar.length <= 2 ? user.avatar : initial}</div>
          <div className="sh-hi">
            <div className="sh-hi-name">أهلاً، {name}! 👋</div>
            <div className="sh-hi-sub">جاهز للفوز؟ اختر نمط اللعب المفضّل</div>
          </div>
          <span className="sh-bell" aria-hidden>{I.bell}</span>
        </header>

        {/* ===== بطاقات الإحصاء ===== */}
        <div className="sh-stats">
          <div className="sh-stat">
            <span className="sh-stat-ico gold">{I.star}</span>
            <div>
              <div className="sh-stat-main">المركز 16</div>
              <div className="sh-stat-sub">سلسلة نشطة</div>
            </div>
          </div>
          <div className="sh-stat">
            <span className="sh-stat-ico green">{I.trophy}</span>
            <div>
              <div className="sh-stat-main">+100</div>
              <div className="sh-stat-sub">الترتيب العام</div>
            </div>
          </div>
        </div>

        {/* ===== المشهد (الصورة الجاهزة) ===== */}
        <div className="sh-hero">
          <img className="sh-hero-img" src="/games/snake.png" alt="السلم والثعابين" />
          <div className="sh-hero-overlay" />
          <div className="sh-timer">
            <span className="sh-timer-ico">{I.dice}</span>
            <span className="sh-timer-val">{countdown}</span>
          </div>
          <div className="sh-hero-cap">
            <div className="sh-hero-title">السلم والثعابين</div>
            <div className="sh-hero-sub">تحدَّ الأصدقاء والعائلة في مباراة واحدة</div>
          </div>
        </div>

        {/* ===== بلاطات سريعة ===== */}
        <div className="sh-quick">
          <button className="sh-qtile" onClick={onBack}>
            <span className="sh-qico gold">{I.crown}</span>
            <span className="sh-qlbl">البطولة</span>
          </button>
          <button className="sh-qtile" onClick={onBack}>
            <span className="sh-qico teal">{I.chart}</span>
            <span className="sh-qlbl">كأس شهري</span>
          </button>
          <button className="sh-qtile" onClick={onBack}>
            <span className="sh-qico gold">{I.clock}</span>
            <span className="sh-qlbl">الأنشطة</span>
          </button>
        </div>

        {/* ===== الأزرار الأساسية ===== */}
        <motion.button className="sh-play sh-play-green" whileTap={{ scale: 0.97 }} onClick={() => onPlay("classic")}>
          <span className="sh-shine" />
          <span className="sh-play-ico">{I.grid}</span>
          <span className="sh-play-txt">
            <span className="sh-play-title">كلاسيكي</span>
            <span className="sh-play-sub">اللعبة التقليدية الكاملة</span>
          </span>
          <span className="sh-play-chevron">{I.chevron}</span>
        </motion.button>

        <motion.button className="sh-play sh-play-gold" whileTap={{ scale: 0.97 }} onClick={() => onPlay("fast")}>
          <span className="sh-shine sh-shine-late" />
          <span className="sh-play-ico">{I.bolt}</span>
          <span className="sh-play-txt">
            <span className="sh-play-title">سريع</span>
            <span className="sh-play-sub">مباراة خاطفة في دقائق</span>
          </span>
          <span className="sh-play-chevron">{I.chevron}</span>
        </motion.button>

        {/* ===== صفّ ثانوي ===== */}
        <div className="sh-secondary">
          <button className="sh-sec" onClick={() => onPlay("classic")}>
            <span className="sh-sec-ico teal">{I.friends}</span>
            <span className="sh-sec-lbl">مع الأصدقاء</span>
          </button>
          <button className="sh-sec" onClick={onBack}>
            <span className="sh-sec-ico gold">{I.controller}</span>
            <span className="sh-sec-lbl">المنافسات</span>
          </button>
        </div>
      </div>

      {/* ===== شريط التنقّل (في الوضع المستقل فقط) ===== */}
      {!embedded && (
      <nav className="sh-nav">
        <button className="sh-nav-item active">
          <span className="sh-nav-ico">{I.home}</span>
          <span className="sh-nav-lbl">الرئيسية</span>
        </button>
        <button className="sh-nav-item" onClick={onBack}>
          <span className="sh-nav-ico">{I.mic}</span>
          <span className="sh-nav-lbl">دردشة</span>
        </button>
        <button className="sh-nav-item" onClick={onBack}>
          <span className="sh-nav-ico">{I.chat}</span>
          <span className="sh-nav-lbl">الرسائل</span>
        </button>
        <button className="sh-nav-item" onClick={onBack}>
          <span className="sh-nav-ico">{I.user}</span>
          <span className="sh-nav-lbl">أنا</span>
        </button>
      </nav>
      )}
    </div>
  );
}
