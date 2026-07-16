import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./jackarooHome.css";

/* عدّاد تنازلي حيّ HH:MM:SS — يلتفّ إلى 24 ساعة عند الصفر */
function useCountdown(start = 23 * 3600 + 28 * 60 + 49) {
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
  star: (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor">
      <path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.4l6-.9z" />
    </svg>
  ),
  trophy: (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M7 4h10v4a5 5 0 0 1-10 0z" />
      <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 13v4M9 20h6" />
    </svg>
  ),
  moon: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 3a6 6 0 0 0 0 12 6 6 0 1 1 0-12z" />
    </svg>
  ),
  cup: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M7 4h10v4a5 5 0 0 1-10 0z" />
      <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 13v4M9 20h6" />
    </svg>
  ),
  gift: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="4" y="8" width="16" height="12" rx="2" />
      <path d="M4 12h16M12 8v12" />
    </svg>
  ),
  friends: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.6a3 3 0 0 1 0 5.8" />
    </svg>
  ),
  sound: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    </svg>
  ),
  medal: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="9" r="5" />
      <path d="M9 13l-2 8 5-3 5 3-2-8" />
    </svg>
  ),
  cards: (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="5" y="3" width="11" height="15" rx="2" />
      <path d="M9 7h4M9 10h4" />
      <rect x="8" y="6" width="11" height="15" rx="2" fill="rgba(255,255,255,.15)" />
    </svg>
  ),
  dice: (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      {[
        [8, 8], [16, 16], [12, 12], [16, 8], [8, 16],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.4" fill="currentColor" />
      ))}
    </svg>
  ),
  person: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0z" />
    </svg>
  ),
  friends2: (
    <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.6a3 3 0 0 1 0 5.8M18 20a5 5 0 0 0-3-4.6" />
    </svg>
  ),
  crown: (
    <svg viewBox="0 0 24 24" width="21" height="21" fill="currentColor">
      <path d="M3 7l4 4 5-6 5 6 4-4v11H3z" />
    </svg>
  ),
  cats: {
    jack: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M12 3l2.5 5 5.5.8-4 3.9 1 5.5-5-2.7-5 2.7 1-5.5-4-3.9 5.5-.8z" />
      </svg>
    ),
    ludo: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <circle cx="9" cy="9" r="1.4" fill="currentColor" />
        <circle cx="15" cy="15" r="1.4" fill="currentColor" />
      </svg>
    ),
    houses: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="5" y="3" width="10" height="14" rx="2" />
        <rect x="9" y="7" width="10" height="14" rx="2" fill="rgba(201,140,240,.15)" />
      </svg>
    ),
    snake: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M4 20c4-1 5-3 5-6s-2-4-2-7 3-4 3-4M14 4c3 1 5 3 5 6s-3 4-3 7 2 3 2 3" />
      </svg>
    ),
  },
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

export default function JackarooHome({ user, onPlay, onBack, onOpenRooms, onTournaments, embedded }) {
  const countdown = useCountdown();
  const name = user?.name || "بك";
  const initial = (user?.name || "J").trim().charAt(0).toUpperCase();
  const rooms = () => (onOpenRooms || onBack)?.();
  const comp = () => (onTournaments || onBack)?.();

  return (
    <div className={`jh ${embedded ? "jh-embedded" : ""}`}>
      <span className="jh-spark" style={{ top: "22%", left: "9%", animationDelay: "0s" }} />
      <span className="jh-spark jh-spark-teal" style={{ top: "58%", right: "8%", animationDelay: ".8s" }} />

      <div className="jh-content">
        {/* ===== الترحيب ===== */}
        <header className="jh-welcome">
          <div className="jh-welcome-txt">
            <div className="jh-welcome-name">أهلاً، {name}! 👑</div>
            <div className="jh-welcome-sub">جاهز للّعب والفوز؟ اختر لعبتك المفضّلة</div>
          </div>
          <div className="jh-avatar">{user?.avatar && user.avatar.length <= 2 ? user.avatar : initial}</div>
        </header>

        {/* ===== بطاقات الترتيب ===== */}
        <div className="jh-stats">
          <div className="jh-stat">
            <span className="jh-stat-ico purple">{I.star}</span>
            <div>
              <div className="jh-stat-main">الترتيب 16</div>
              <div className="jh-stat-sub">سلسلة تصنيف</div>
            </div>
          </div>
          <div className="jh-stat">
            <span className="jh-stat-ico gold">{I.trophy}</span>
            <div>
              <div className="jh-stat-main">+100</div>
              <div className="jh-stat-sub">الترتيب العام</div>
            </div>
          </div>
        </div>

        {/* ===== المشهد مع القضبان الجانبية ===== */}
        <div className="jh-hero-row">
          {/* قضيب يمين */}
          <div className="jh-rail">
            <div className="jh-rail-btn"><span className="jh-rail-ico gold">{I.moon}</span><span>هجري</span></div>
            <div className="jh-rail-btn"><span className="jh-rail-ico gold">{I.cup}</span><span>كأس الشهر</span></div>
            <button className="jh-rail-btn jh-rail-gift" onClick={rooms}>
              <span className="jh-rail-ico pink">{I.gift}</span><span className="jh-rail-timer">الهدية</span>
            </button>
          </div>

          {/* الصورة */}
          <div className="jh-hero">
            <img className="jh-hero-img" src="/games/jackaroo.png" alt="جاكارو" />
            <div className="jh-hero-overlay" />
            <div className="jh-hero-title">جاكارو</div>
            <div className="jh-hero-cap">العب مع الأصدقاء والعائلة</div>
          </div>

          {/* قضيب يسار */}
          <div className="jh-rail">
            <button className="jh-rail-btn" onClick={rooms}><span className="jh-rail-ico teal">{I.friends}</span><span>الأصدقاء</span></button>
            <div className="jh-rail-btn"><span className="jh-rail-ico green">{I.sound}</span><span>الصوت</span></div>
            <div className="jh-rail-btn"><span className="jh-rail-ico gold">{I.medal}</span><span className="jh-rail-timer">{countdown}</span></div>
          </div>
        </div>

        {/* ===== شبكة أزرار اللعب الأساسية ===== */}
        <div className="jh-grid">
          {/* كمبلكس (أخضر) */}
          <motion.button className="jh-play jh-play-green" whileTap={{ scale: 0.97 }} onClick={() => onPlay?.("complex")}>
            <span className="jh-shine" />
            <span className="jh-play-ico">{I.cards}</span>
            <span className="jh-play-title">كمبلكس</span>
          </motion.button>

          {/* واحد ضد واحد (أزرق — يمتد صفّين) */}
          <motion.button className="jh-play jh-play-blue jh-play-tall" whileTap={{ scale: 0.98 }} onClick={() => onPlay?.("1v1")}>
            <span className="jh-shine jh-shine-late" />
            <span className="jh-vs">
              <span className="jh-vs-face blue">{I.person}</span>
              <span className="jh-vs-txt">VS</span>
              <span className="jh-vs-face gold">{I.person}</span>
            </span>
            <span className="jh-play-big">واحد ضد واحد</span>
            <span className="jh-play-note">تحدَّ خصماً الآن</span>
          </motion.button>

          {/* عادي (ذهبي) */}
          <motion.button className="jh-play jh-play-gold" whileTap={{ scale: 0.97 }} onClick={() => onPlay?.("normal")}>
            <span className="jh-shine jh-shine-later" />
            <span className="jh-play-ico">{I.dice}</span>
            <span className="jh-play-title">عادي</span>
          </motion.button>
        </div>

        {/* ===== صفّ ثانوي ===== */}
        <div className="jh-secondary">
          <button className="jh-sec" onClick={rooms}>
            <span className="jh-sec-ico teal">{I.friends2}</span>
            <span className="jh-sec-lbl">العب مع الأصدقاء</span>
          </button>
          <button className="jh-sec jh-sec-vip" onClick={rooms}>
            <span className="jh-sec-ico gold">{I.crown}</span>
            <span className="jh-sec-lbl">غرفة VIP</span>
          </button>
          <button className="jh-sec" onClick={comp}>
            <span className="jh-sec-ico gold">{I.cup}</span>
            <span className="jh-sec-lbl">مسابقات</span>
          </button>
        </div>

        {/* ===== فئات الألعاب ===== */}
        <div className="jh-cats">
          <button className="jh-cat active">
            <span className="jh-cat-ico gold">{I.cats.jack}</span>
            <span className="jh-cat-lbl">جاكارو</span>
          </button>
          <button className="jh-cat" onClick={onBack}>
            <span className="jh-cat-ico blue">{I.cats.ludo}</span>
            <span className="jh-cat-lbl">لودو</span>
          </button>
          <button className="jh-cat" onClick={onBack}>
            <span className="jh-cat-ico purple">{I.cats.houses}</span>
            <span className="jh-cat-lbl">بيوت</span>
          </button>
          <button className="jh-cat" onClick={onBack}>
            <span className="jh-cat-ico teal">{I.cats.snake}</span>
            <span className="jh-cat-lbl">السلم والثعبان</span>
          </button>
        </div>
      </div>

      {/* ===== شريط التنقّل (في الوضع المستقل فقط) ===== */}
      {!embedded && (
        <nav className="jh-nav">
          <button className="jh-nav-item active">
            <span className="jh-nav-ico">{I.home}</span>
            <span className="jh-nav-lbl">الرئيسية</span>
          </button>
          <button className="jh-nav-item" onClick={rooms}>
            <span className="jh-nav-ico">{I.mic}</span>
            <span className="jh-nav-lbl">غرف صوتية</span>
          </button>
          <button className="jh-nav-item" onClick={onBack}>
            <span className="jh-nav-ico">{I.chat}</span>
            <span className="jh-nav-lbl">الرسائل</span>
          </button>
          <button className="jh-nav-item" onClick={onBack}>
            <span className="jh-nav-ico">{I.user}</span>
            <span className="jh-nav-lbl">أنا</span>
          </button>
        </nav>
      )}
    </div>
  );
}
