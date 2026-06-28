import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GAMES } from "./games.js";
import GameArt from "./art/GameArt.jsx";
import TasksModal from "./TasksModal.jsx";
import CompetitionsModal from "./CompetitionsModal.jsx";
import GloryModal from "./GloryModal.jsx";
import PackagesModal from "./PackagesModal.jsx";
import ActivitiesModal from "./ActivitiesModal.jsx";
import { tasks as tasksApi, glory as gloryApi } from "./tasks.js";
import "./gameLobby.css";

/* عدّاد تنازلي حي بصيغة HH:MM:SS أو "Nd Nh" */
function useCountdown(totalSeconds) {
  const [left, setLeft] = useState(totalSeconds);
  useEffect(() => {
    const t = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  return left;
}
function fmtClock(s) {
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}
function fmtDays(s) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  return `${d}d ${h}h`;
}

/* انتقال الشرائح: ينزلق ويتلاشى مع تكبير خفيف */
const slide = {
  enter: (dir) => ({ x: dir > 0 ? "60%" : "-60%", opacity: 0, scale: 0.92 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir) => ({ x: dir > 0 ? "-60%" : "60%", opacity: 0, scale: 0.92 }),
};
const swipeConfidence = (offset, velocity) => Math.abs(offset) * 0.6 + Math.abs(velocity) * 0.2;

function fmtNum(n) {
  if (n == null) return null;
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export default function GameLobby({ onPlay, onOpenRooms, user, wallet, onRecharge, onOwnerTap, onWalletUpdate }) {
  const [tasksOpen, setTasksOpen] = useState(false);       // نافذة المهام اليومية
  const [compOpen, setCompOpen] = useState(false);         // نافذة المنافسات
  const [gloryOpen, setGloryOpen] = useState(false);       // بطاقة المجد
  const [packagesOpen, setPackagesOpen] = useState(false); // الحزم الحصرية
  const [activitiesOpen, setActivitiesOpen] = useState(false); // مركز الأنشطة
  const [badges, setBadges] = useState({ tasks: 0, glory: 0 }); // عدّادات النقطة الحمراء (جاهز للاستلام)

  // يجلب عدد العناصر القابلة للاستلام لإظهار النقطة الحمراء وإخفائها بعد الاستلام
  const loadBadges = () => {
    tasksApi.status().then((s) => setBadges((b) => ({ ...b, tasks: s.claimable || 0 }))).catch(() => {});
    gloryApi.status().then((s) => setBadges((b) => ({ ...b, glory: s.claimable || 0 }))).catch(() => {});
  };
  useEffect(() => { loadBadges(); }, []);

  // فتح نشاط من مركز الأنشطة
  const openActivity = (key) => {
    setActivitiesOpen(false);
    if (key === "tasks") setTasksOpen(true);
    else if (key === "glory") setGloryOpen(true);
    else if (key === "packages") setPackagesOpen(true);
    else if (key === "comp") setCompOpen(true);
  };

  // [page, direction] — صفحة لانهائية (تلتف) مع اتجاه السحب
  const [[page, dir], setPage] = useState([0, 0]);
  const n = GAMES.length;
  const idx = ((page % n) + n) % n;
  const game = GAMES[idx];

  const giftLeft = useCountdown(23 * 3600 + 28 * 60 + 17); // حزمة حصرية
  const gloryLeft = useCountdown(44 * 86400 + 23 * 3600); // بطاقة المجد

  const paginate = (d) => setPage([page + d, d]);
  const goTo = (target) => {
    if (target === idx) return;
    setPage([target, target > idx ? 1 : -1]);
  };

  // ساعة شريط الحالة الوهمي
  const clock = useClock();

  return (
    <div
      className="gl"
      style={{ "--glow": game.glow, "--accent": game.accent }}
    >
      {/* خلفية تتبدّل لونها مع اللعبة */}
      <motion.div
        className="gl-bg"
        animate={{ background: game.bg }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      <Starfield />

      {/* شريط الحالة الوهمي (للمطابقة البصرية) */}
      <div className="gl-status">
        <span className="gl-time">{clock}</span>
        <span className="gl-status-right">
          <span>📶</span><span>5G</span>
          <span className="gl-batt">37</span>
        </span>
      </div>

      <div className="gl-scroll">
        {/* ===== رأس: أنشطة | العملات | البروفايل ===== */}
        <header className="gl-top">
          <button className="gl-activities" onClick={() => setActivitiesOpen(true)}>
            <span className="gl-act-ico">🎁</span>
            <span>الأنشطة</span>
            {(badges.tasks > 0 || badges.glory > 0) && <span className="gl-act-dot" />}
          </button>

          <div className="gl-currencies">
            <Chip
              icon="💎"
              value={wallet?.infinite ? "∞" : fmtNum(wallet?.diamonds) ?? "73"}
              color="#36c5f0"
              badge
              onPlus={() => onRecharge?.("diamonds")}
            />
            <Chip
              icon="🪙"
              value={wallet?.infinite ? "∞" : fmtNum(wallet?.coins) ?? "779.8K"}
              color="#f5c451"
              badge
              onPlus={() => onRecharge?.("coins")}
            />
            <Chip icon="✦" value="48" color="#b06bff" badge />
          </div>

          <motion.button
            className="gl-profile"
            whileTap={{ scale: 0.92 }}
            title={user?.name || "حسابي"}
            onClick={(e) => { if (e.detail >= 2) onOwnerTap?.(); }}
          >
            <span>{wallet?.infinite ? "👑" : user?.avatar || "🧑🏻"}</span>
          </motion.button>
        </header>

        {/* ===== صفّ الترتيب ===== */}
        <div className="gl-rank-row">
          <RankCard icon="🏆" main="الترتيب +100" sub="ترتيب" />
          <RankCard icon="⭐" main="الترتيب 16" sub="مسابقة التصنيف" highlight />
        </div>

        {/* ===== المسرح القابل للسحب ===== */}
        <div className="gl-stage">
          {/* أيقونات يسار */}
          <div className="gl-side gl-side-left">
            <SideIcon icon="🌙" label="رأس السنة الهجرية" />
            <SideIcon icon="🏆" label="كأس العالم" />
            <GiftBox seconds={giftLeft} onClick={() => setPackagesOpen(true)} />
          </div>

          {/* المشهد + الشعار (ينزلق عند السحب) */}
          <div className="gl-hero">
            <AnimatePresence custom={dir} initial={false} mode="popLayout">
              <motion.div
                key={game.id}
                className="gl-hero-card"
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ x: { type: "spring", stiffness: 320, damping: 32 }, opacity: { duration: 0.25 } }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={(e, { offset, velocity }) => {
                  const power = swipeConfidence(offset.x, velocity.x);
                  if (offset.x < -60 && power > 60) paginate(1);
                  else if (offset.x > 60 && power > 60) paginate(-1);
                }}
              >
                <HeroScene game={game} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* أيقونات يمين */}
          <div className="gl-side gl-side-right">
            <SideIcon icon="🧑‍🤝‍🧑" label="الأصدقاء" />
            <SideIcon icon="✅" label="المهام" dot={badges.tasks > 0} onClick={() => setTasksOpen(true)} />
            <SideIcon icon="🏅" label="بطاقة المجد" timer={fmtDays(gloryLeft)} dot={badges.glory > 0}
              onClick={() => setGloryOpen(true)} />
          </div>
        </div>

        {/* ===== أزرار أنماط اللعب (تتبدّل مع اللعبة) ===== */}
        <div className="gl-modes">
          <AnimatePresence mode="wait">
            <motion.div
              key={game.id}
              className="gl-modes-grid"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              {game.modes.map((m, i) => (
                <ModeButton key={m.id} mode={m} i={i} onClick={() => onPlay?.(game, m)} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ===== صفّ ثانوي (منافسات / VIP / أصدقاء) ===== */}
        <div className="gl-secondary">
          {game.secondary.map((s) => (
            <motion.button
              key={s.id}
              className="gl-sec-btn"
              style={{ "--tint": s.tint }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (s.id === "vip" || s.id === "rooms") onOpenRooms?.();
                else if (s.id === "tournaments") setCompOpen(true);
                else onPlay?.(game, s);
              }}
            >
              <span className="gl-sec-ico">{s.icon}</span>
              <span>{s.label}</span>
            </motion.button>
          ))}
        </div>

        {/* ===== تبويبات الألعاب (السحب يبدّلها) ===== */}
        <div className="gl-tabs">
          {GAMES.map((g, i) => (
            <button
              key={g.id}
              className={`gl-tab ${i === idx ? "active" : ""}`}
              onClick={() => goTo(i)}
            >
              <span className="gl-tab-ico">{g.cast[0]}</span>
              <span className="gl-tab-lbl">{g.tab}</span>
              {i === idx && <motion.span layoutId="tab-underline" className="gl-tab-underline" />}
            </button>
          ))}
        </div>

        {/* نقاط الصفحات */}
        <div className="gl-dots">
          {GAMES.map((_, i) => (
            <span key={i} className={`gl-dot ${i === idx ? "active" : ""}`} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activitiesOpen && (
          <ActivitiesModal key="activities" badges={badges}
            onOpen={openActivity} onClose={() => setActivitiesOpen(false)} />
        )}
        {tasksOpen && (
          <TasksModal key="tasks" onWallet={onWalletUpdate}
            onClose={() => { setTasksOpen(false); loadBadges(); }} />
        )}
        {gloryOpen && (
          <GloryModal key="glory" onWallet={onWalletUpdate}
            onClose={() => { setGloryOpen(false); loadBadges(); }} />
        )}
        {packagesOpen && (
          <PackagesModal key="packages" wallet={wallet} onWalletUpdate={onWalletUpdate}
            onRecharge={onRecharge} onClose={() => setPackagesOpen(false)} />
        )}
        {compOpen && (
          <CompetitionsModal key="comp" onClose={() => setCompOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ===================== مكوّنات فرعية ===================== */

function HeroScene({ game }) {
  // يُعرض المشهد ضمن AnimatePresence بمفتاح game.id، لذا تُعاد التهيئة مع كل لعبة
  const [photoOk, setPhotoOk] = useState(Boolean(game.photo));

  return (
    <div className="gl-scene">
      {photoOk ? (
        /* صورة خلفية اللعبة (رسم أصلي كامل) — تسقط للرسم المتحرك إن فشل تحميلها */
        <img
          className="gl-photo"
          src={game.photo}
          alt={game.tab}
          onError={() => setPhotoOk(false)}
        />
      ) : (
        <>
          {/* مشهد SVG أصلي: طاولة + لوحة لعب + شخصيات + قِطع */}
          <GameArt game={game} />

          {/* الشعار اللامع */}
          <motion.div
            className="gl-logo"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="gl-logo-text" data-text={game.logo}>{game.logo}</span>
            <span className="gl-logo-shine" />
          </motion.div>
        </>
      )}
    </div>
  );
}

function Chip({ icon, value, color, badge, onPlus }) {
  return (
    <div className="gl-chip" style={{ "--c": color }}>
      <span className="gl-chip-ico">{icon}</span>
      <span className="gl-chip-val">{value}</span>
      {badge &&
        (onPlus ? (
          <button className="gl-chip-plus" onClick={onPlus} aria-label="شحن">+</button>
        ) : (
          <span className="gl-chip-plus">+</span>
        ))}
    </div>
  );
}

function RankCard({ icon, main, sub, highlight }) {
  return (
    <motion.button className={`gl-rank ${highlight ? "hl" : ""}`} whileTap={{ scale: 0.97 }}>
      <span className="gl-rank-main">{main}</span>
      <span className="gl-rank-sub">{sub}</span>
      <span className="gl-rank-ico">{icon}</span>
    </motion.button>
  );
}

function SideIcon({ icon, label, dot, timer, onClick }) {
  return (
    <motion.button
      className="gl-sideicon"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      animate={{ y: [0, -4, 0] }}
      transition={{ y: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
      onClick={onClick}
    >
      <span className="gl-side-badge">
        {icon}
        {dot && <span className="gl-side-dot" />}
      </span>
      <span className="gl-side-lbl">{label}</span>
      {timer && <span className="gl-side-timer">{timer}</span>}
    </motion.button>
  );
}

function GiftBox({ seconds, onClick }) {
  return (
    <motion.button
      className="gl-sideicon gl-giftbox"
      whileTap={{ scale: 0.92 }}
      animate={{ rotate: [0, -4, 4, -3, 0], scale: [1, 1.06, 1] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      onClick={onClick}
    >
      <span className="gl-side-badge gl-gift-badge">🎁</span>
      <span className="gl-side-lbl">حزمة حصرية</span>
      <span className="gl-side-timer gl-gift-timer">{fmtClock(seconds)}</span>
    </motion.button>
  );
}

function ModeButton({ mode, i, onClick }) {
  return (
    <motion.button
      className={`gl-mode gl-mode-${mode.size}`}
      style={{ "--tint": mode.tint }}
      initial={{ opacity: 0, y: 24, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.06 * i, type: "spring", stiffness: 300, damping: 20 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
    >
      <span className="gl-mode-shine" />
      <motion.span
        className="gl-mode-ico"
        animate={{ rotate: [0, -8, 8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {mode.icon}
      </motion.span>
      <span className="gl-mode-lbl">{mode.label}</span>
    </motion.button>
  );
}

/* حقل النجوم المتلألئة في الخلفية */
function Starfield() {
  const stars = useMemo(
    () =>
      Array.from({ length: 28 }, () => ({
        top: Math.random() * 100,
        left: Math.random() * 100,
        s: 1 + Math.random() * 2,
        d: 1.5 + Math.random() * 3,
        delay: Math.random() * 3,
      })),
    []
  );
  return (
    <div className="gl-stars">
      {stars.map((st, i) => (
        <motion.span
          key={i}
          className="gl-star"
          style={{ top: `${st.top}%`, left: `${st.left}%`, width: st.s, height: st.s }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: st.d, repeat: Infinity, delay: st.delay }}
        />
      ))}
    </div>
  );
}

function useClock() {
  const [t, setT] = useState(() => fmtTime());
  useEffect(() => {
    const id = setInterval(() => setT(fmtTime()), 1000 * 20);
    return () => clearInterval(id);
  }, []);
  return t;
}
function fmtTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
