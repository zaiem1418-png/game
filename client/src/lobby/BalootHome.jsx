import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./balootHome.css";

/* عدّاد تنازلي حيّ HH:MM:SS — يلتفّ إلى 24 ساعة عند الصفر */
function useCountdown(start = 23 * 3600 + 18 * 60 + 37) {
  const [rem, setRem] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setRem((s) => (s > 0 ? s - 1 : 24 * 3600)), 1000);
    return () => clearInterval(t);
  }, []);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(Math.floor(rem / 3600))}:${p(Math.floor((rem % 3600) / 60))}:${p(rem % 60)}`;
}

/* بلاطات «أنواع اللعب» — الترتيب مطابق لقائمة GAMES */
const GAME_TILES = [
  { img: "/games/icons/jackaroo.png", name: "جاكارو", id: "jackaroo", target: 0 },
  { img: "/games/icons/ludo-dice.png", name: "لودو", id: "ludo", target: 1 },
  { img: "/games/icons/baloot.png", name: "بلوت", id: "baloot", target: 2 },
  { img: "/games/icons/snake.png", name: "السلم والثعابين", id: "snake", target: 3 },
];

export default function BalootHome({
  user,
  onPlay,
  onOpenRooms,
  onTournaments,
  onSelectGame,
  embedded,
}) {
  const countdown = useCountdown();
  const name = user?.name || "Mohammad";
  const initial = (user?.name || "M").trim().charAt(0).toUpperCase();
  const play = (m) => onPlay?.(m);
  const rooms = () => onOpenRooms?.();

  return (
    <div className={`bh ${embedded ? "bh-embedded" : ""}`} dir="rtl">
      <div className="bh-scroll">
        {/* ===== شريط الحالة العلوي (الوضع المستقل فقط) ===== */}
        {!embedded && (
          <div className="bh-top">
            <div className="bh-top-user">
              <div className="bh-top-av">
                <span>{user?.avatar && user.avatar.length <= 2 ? user.avatar : "🧑‍🚀"}</span>
                <span className="bh-top-lvl">48</span>
              </div>
              <div className="bh-top-meta">
                <span className="bh-top-role">اللاعب</span>
                <span className="bh-top-tier">الكأس الذهبي</span>
              </div>
            </div>
            <div className="bh-top-chips">
              <div className="bh-chip">
                <b>10K</b><span className="bh-chip-ico gold">🪙</span>
              </div>
              <div className="bh-chip">
                <b>515</b><span className="bh-chip-ico blue">💎</span>
              </div>
              <button className="bh-chip-plus">＋</button>
            </div>
          </div>
        )}

        {/* ===== لافتة الترحيب ===== */}
        <div className="bh-welcome">
          <div className="bh-welcome-glow" />
          <div className="bh-welcome-txt">
            <span className="bh-welcome-t">
              أهلاً، <span className="name">{name}</span> <span className="wave">👋</span>
            </span>
            <span className="bh-welcome-sub">جاهز للّعب والفوز؟ اختر لعبتك المفضّلة</span>
          </div>
          <div className="bh-welcome-av">{initial}</div>
        </div>

        {/* ===== بطاقات الترتيب ===== */}
        <div className="bh-ranks">
          <button className="bh-rank" onClick={onTournaments}>
            <span className="bh-rank-ico gold">🏆</span>
            <div>
              <div className="bh-rank-main">+100</div>
              <div className="bh-rank-sub">الترتيب العام</div>
            </div>
          </button>
          <button className="bh-rank" onClick={onTournaments}>
            <span className="bh-rank-ico purple">★</span>
            <div>
              <div className="bh-rank-main">16</div>
              <div className="bh-rank-sub">سلسلة التصنيف</div>
            </div>
          </button>
        </div>

        {/* ===== المشهد + السكك الجانبية ===== */}
        <div className="bh-stage">
          {/* السكة اليمنى */}
          <div className="bh-rail">
            <button className="bh-rail-item" onClick={onTournaments}>
              <span className="bh-rail-ico indigo">🌙</span>
              <span className="bh-rail-lbl">رأس السنة</span>
            </button>
            <button className="bh-rail-item" onClick={onTournaments}>
              <span className="bh-rail-ico green">🌍</span>
              <span className="bh-rail-lbl">كأس العالم</span>
            </button>
            <button className="bh-rail-item" onClick={onTournaments}>
              <span className="bh-rail-ico pink">✨</span>
              <span className="bh-rail-lbl timer">{countdown}</span>
            </button>
          </div>

          {/* الرسمة */}
          <div className="bh-hero">
            <img className="bh-hero-img" src="/games/baloot.png" alt="بلوت" />
            <div className="bh-hero-cap">
              <div className="bh-hero-plate"><span className="disp">بلوت</span></div>
              <div className="bh-hero-sub">تحدَّ الأصدقاء والعائلة</div>
            </div>
          </div>

          {/* السكة اليسرى */}
          <div className="bh-rail">
            <button className="bh-rail-item" onClick={rooms}>
              <span className="bh-rail-ico teal">👥</span>
              <span className="bh-rail-lbl">الأصدقاء</span>
            </button>
            <button className="bh-rail-item" onClick={onTournaments}>
              <span className="bh-rail-ico grass">🗓️</span>
              <span className="bh-rail-lbl">اليومي</span>
            </button>
            <button className="bh-rail-item" onClick={onTournaments}>
              <span className="bh-rail-ico amber">🏅</span>
              <span className="bh-rail-lbl timer">44د 22س</span>
            </button>
          </div>
        </div>

        {/* ===== زر اللعب الرئيسي ===== */}
        <motion.button className="bh-play" whileTap={{ scale: 0.98 }} onClick={() => play("baloot")}>
          <span className="bh-play-shine" />
          <img className="bh-play-ico-img" src="/games/icons/baloot-play.png" alt="بلوت" />
          <span className="bh-play-txt">
            <span className="bh-play-t disp">إلعب بلوت</span>
            <span className="bh-play-sub">مباراة سريعة الآن</span>
          </span>
        </motion.button>

        {/* ===== أزرار الأنماط ===== */}
        <div className="bh-modes">
          <motion.button className="bh-mode blue" whileTap={{ scale: 0.96 }} onClick={rooms}>
            <img className="bh-mode-ico-img" src="/games/icons/friends.png" alt="الأصدقاء" />
            <span className="bh-mode-lbl">العب مع الأصدقاء</span>
          </motion.button>
          <motion.button className="bh-mode vip" whileTap={{ scale: 0.96 }} onClick={rooms}>
            <span className="bh-mode-shine" />
            <img className="bh-mode-ico-img" src="/games/icons/vip.png" alt="VIP" />
            <span className="bh-mode-lbl disp">غرفة VIP</span>
          </motion.button>
          <motion.button className="bh-mode gold" whileTap={{ scale: 0.96 }} onClick={onTournaments}>
            <img className="bh-mode-ico-img" src="/games/icons/trophy.png" alt="المنافسات" />
            <span className="bh-mode-lbl">المنافسات</span>
          </motion.button>
        </div>

        {/* ===== أنواع اللعب ===== */}
        <div className="bh-games">
          <span className="bh-games-title">أنواع اللعب</span>
          <div className="bh-games-row">
            {GAME_TILES.map((g) => (
              <button
                key={g.id}
                className={`bh-game ${g.id === "baloot" ? "active" : ""}`}
                onClick={() => (g.id === "baloot" ? play("baloot") : onSelectGame?.(g.target))}
              >
                <img className="bh-game-ico" src={g.img} alt={g.name} />
                <span className="bh-game-name">{g.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== شريط التنقّل (الوضع المستقل فقط) ===== */}
      {!embedded && (
        <div className="bh-nav">
          <button className="bh-nav-btn active">
            <span className="bh-nav-line" />
            <span className="bh-nav-ico">🏠</span><span className="bh-nav-lbl">الرئيسية</span>
          </button>
          <button className="bh-nav-btn" onClick={rooms}><span className="bh-nav-ico">🎙️</span><span className="bh-nav-lbl">دائرة صوتية</span></button>
          <button className="bh-nav-btn" onClick={rooms}><span className="bh-nav-dot" /><span className="bh-nav-ico">💬</span><span className="bh-nav-lbl">الرسائل</span></button>
          <button className="bh-nav-btn" onClick={rooms}><span className="bh-nav-ico">👤</span><span className="bh-nav-lbl">أنا</span></button>
        </div>
      )}
    </div>
  );
}
