import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./ludoHome.css";

/* عدّاد تنازلي حيّ HH:MM:SS — يلتفّ إلى 24 ساعة عند الصفر */
function useCountdown(start = 22 * 3600 + 0 * 60 + 1) {
  const [rem, setRem] = useState(start);
  useEffect(() => {
    const t = setInterval(() => setRem((s) => (s > 0 ? s - 1 : 24 * 3600)), 1000);
    return () => clearInterval(t);
  }, []);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(Math.floor(rem / 3600))}:${p(Math.floor((rem % 3600) / 60))}:${p(rem % 60)}`;
}

/* بلاطات الألعاب الأربع (الترتيب مطابق لقائمة GAMES) — أيقونات 3D */
const GAME_TILES = [
  { img: "/games/icons/jackaroo.png", name: "جاكارو", id: "jackaroo", target: 0 },
  { img: "/games/icons/ludo-dice.png", name: "لودو", id: "ludo", target: 1 },
  { img: "/games/icons/baloot.png", name: "بلوت", id: "baloot", target: 2 },
  { img: "/games/icons/snake.png", name: "السلم والثعابين", id: "snake", target: 3 },
];

export default function LudoHome({
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
    <div className={`lh ${embedded ? "lh-embedded" : ""}`} dir="rtl">
      <div className="lh-stars" aria-hidden />

      <div className="lh-scroll">
        {/* ===== شريط الحالة العلوي (الوضع المستقل فقط) ===== */}
        {!embedded && (
          <div className="lh-top">
            <div className="lh-top-av">{user?.avatar && user.avatar.length <= 2 ? user.avatar : "👑"}</div>
            <div className="lh-chips">
              <div className="lh-chip">
                <span className="lh-dot lh-dot-green" />
                <b>48</b><span className="lh-star">★</span>
              </div>
              <div className="lh-chip">
                <span className="lh-dot lh-dot-gold" />
                <b>10K</b>
              </div>
              <div className="lh-chip">
                <span className="lh-diamond" />
                <b>515</b>
              </div>
            </div>
            <button className="lh-reward" onClick={onTournaments}>
              <span className="lh-reward-ico">🎁</span>
              <span className="lh-reward-lbl">المكافأة</span>
              <span className="lh-reward-badge">1</span>
            </button>
          </div>
        )}

        {/* ===== لافتة الترحيب ===== */}
        <div className="lh-welcome">
          <div className="lh-welcome-av">{initial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="lh-welcome-t">
              <span style={{ color: "#ffce5a" }}>👑</span> أهلاً, <span className="name">{name}</span>!
            </div>
            <div className="lh-welcome-sub">جاهز للعب والفوز؟ اختر نمط اللعب المفضّل</div>
          </div>
        </div>

        {/* ===== بطاقات الترتيب ===== */}
        <div className="lh-ranks">
          <div className="lh-rank">
            <span className="lh-rank-ico teal">★</span>
            <div>
              <div className="lh-rank-main">الترتيب 16</div>
              <div className="lh-rank-sub">سلسلة تصنيف</div>
            </div>
          </div>
          <div className="lh-rank">
            <span className="lh-rank-ico gold">🏆</span>
            <div>
              <div className="lh-rank-main">+100</div>
              <div className="lh-rank-sub">الترتيب العام</div>
            </div>
          </div>
        </div>

        {/* ===== المشهد + السكك الجانبية ===== */}
        <div className="lh-stage">
          <div className="lh-rail">
            <div className="lh-rail-item">
              <button className="lh-rail-btn" onClick={() => play("classic")}>
                <img className="lh-rail-ico-img" src="/games/icons/play.png" alt="العب" />
              </button>
              <span className="lh-rail-lbl">العب</span>
            </div>
            <div className="lh-rail-item">
              <button className="lh-rail-btn" onClick={rooms}>🏛</button>
              <span className="lh-rail-lbl">نادي الشباب</span>
            </div>
            <div className="lh-rail-item hot">
              <button className="lh-rail-btn hot" onClick={onTournaments}>⚔</button>
              <span className="lh-rail-lbl">العصبة</span>
            </div>
          </div>

          <div className="lh-hero">
            <img className="lh-hero-img" src="/games/ludo.png" alt="لودو" />
            <div className="lh-hero-title">لودو</div>
            <div className="lh-hero-cap">العب مع الأصدقاء والعائلة</div>
          </div>

          <div className="lh-rail">
            <div className="lh-rail-item">
              <button className="lh-rail-btn" onClick={rooms}>👥</button>
              <span className="lh-rail-lbl">الأصدقاء</span>
            </div>
            <div className="lh-rail-item">
              <button className="lh-rail-btn" onClick={rooms}>🔊</button>
              <span className="lh-rail-lbl">الصوت</span>
            </div>
            <div className="lh-rail-item">
              <div className="lh-rail-btn" style={{ fontSize: 12 }}>⏱</div>
              <span className="lh-rail-lbl">{countdown}</span>
            </div>
          </div>
        </div>

        {/* ===== أنماط اللعب ===== */}
        <div className="lh-modes">
          <motion.button className="lh-mode-big" whileTap={{ scale: 0.97 }} onClick={() => play("classic")}>
            <div className="lh-vs">
              <span className="lh-vs-face">👤</span>
              <span className="lh-vs-txt">VS</span>
              <span className="lh-vs-face">👤</span>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="lh-mode-big-title">كلاسيكي</div>
              <div className="lh-mode-big-sub">اللعبة التقليدية الكاملة</div>
            </div>
          </motion.button>

          <div className="lh-mode-stack">
            <motion.button className="lh-mode-sm green" whileTap={{ scale: 0.97 }} onClick={() => play("arrow")}>
              <span className="lh-mode-sm-ico">🏹</span>
              <span className="lh-mode-sm-lbl">سهم</span>
            </motion.button>
            <motion.button className="lh-mode-sm gold" whileTap={{ scale: 0.97 }} onClick={() => play("classic")}>
              <img className="lh-mode-sm-ico-img" src="/games/icons/ludo-dice.png" alt="نرد" />
              <span className="lh-mode-sm-lbl">واحد ضد واحد</span>
            </motion.button>
          </div>
        </div>

        {/* ===== أنماط سريعة ===== */}
        <div className="lh-quick">
          <button className="lh-quick-btn" onClick={onTournaments}>
            <span className="lh-quick-ico">🏆</span>
            <span className="lh-quick-lbl">مسابقات</span>
          </button>
          <button className="lh-quick-btn vip" onClick={rooms}>
            <span className="lh-quick-ico gold">👑</span>
            <span className="lh-quick-lbl">غرفة VIP</span>
          </button>
          <button className="lh-quick-btn" onClick={rooms}>
            <span className="lh-quick-ico">👥</span>
            <span className="lh-quick-lbl">العب مع الأصدقاء</span>
          </button>
        </div>

        {/* ===== بلاطات الألعاب ===== */}
        <div className="lh-games">
          {GAME_TILES.map((g) => (
            <button
              key={g.id}
              className={`lh-game ${g.id === "ludo" ? "active" : ""}`}
              onClick={() => (g.id === "ludo" ? play("classic") : onSelectGame?.(g.target))}
            >
              <img className="lh-game-ico-img" src={g.img} alt={g.name} />
              <span className="lh-game-name">{g.name}</span>
            </button>
          ))}
        </div>

      </div>

      {/* ===== شريط التنقّل (الوضع المستقل فقط) ===== */}
      {!embedded && (
        <div className="lh-nav">
          <button className="lh-nav-btn active"><span className="lh-nav-ico">🏠</span><span className="lh-nav-lbl">الرئيسية</span></button>
          <button className="lh-nav-btn" onClick={rooms}><span className="lh-nav-ico">🎙</span><span className="lh-nav-lbl">غرف صوتية</span></button>
          <button className="lh-nav-btn" onClick={rooms}><span className="lh-nav-ico">💬</span><span className="lh-nav-lbl">الرسائل</span></button>
          <button className="lh-nav-btn" onClick={rooms}><span className="lh-nav-ico">👤</span><span className="lh-nav-lbl">أنا</span></button>
        </div>
      )}
    </div>
  );
}
