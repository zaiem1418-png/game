import { motion } from "framer-motion";

// أيقونات الوصول السريع في الملف الشخصي
const QUICK = [
  { id: "visitors", label: "الزوار", icon: "🔷", tint: "#2bb3e0" },
  { id: "home", label: "المنزل", icon: "🏠", tint: "#e0563a" },
  { id: "store", label: "المتجر", icon: "🏪", tint: "#2bbf8e", action: "store" },
  { id: "vip", label: "مركز VIP", icon: "💎", tint: "#f5c451", action: "vip" },
];

const ROWS = [
  { id: "moments", label: "لحظاتي", icon: "📖" },
  { id: "achievements", label: "إنجازات اللعب", icon: "🏆" },
  { id: "bag", label: "الحقيبة", icon: "🎒" },
  { sep: true },
  { id: "vipid", label: "أي دي مميز", icon: "🆔" },
  { id: "badge", label: "الشارة", icon: "🎖️" },
  { id: "invite", label: "دعوة الأصدقاء", icon: "🧑‍🤝‍🧑" },
  { id: "songs", label: "مساهمة الأغاني", icon: "🎵" },
];

export default function Profile({ user, wallet, onRecharge, onOwnerTap }) {
  const name = user?.name || "Mohammad";
  const id = "52117491";

  return (
    <div className="pf">
      <div className="pf-bg" />

      {/* رأس الملف */}
      <header className="pf-head">
        <button className="pf-back">‹</button>
        <div className="pf-id-block">
          <div className="pf-name">
            <span className="pf-spark">✨</span>
            <span className="pf-frame-ico">🦌</span>
            <span className="pf-name-text">{name}</span>
          </div>
          <div className="pf-id">🆔 ID: {id}</div>
        </div>
        <motion.button
          className="pf-avatar"
          whileTap={{ scale: 0.93 }}
          onClick={(e) => { if (e.detail >= 2) onOwnerTap?.(); }}
        >
          <span>{wallet?.infinite ? "👑" : user?.avatar || "🧑🏻"}</span>
        </motion.button>
      </header>

      {/* أيقونات سريعة */}
      <div className="pf-quick">
        {QUICK.map((q) => (
          <motion.button
            key={q.id}
            className="pf-quick-btn"
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              if (q.action === "store") onRecharge?.("coins");
              if (q.action === "vip") onRecharge?.("diamonds");
            }}
          >
            <span className="pf-quick-ico" style={{ color: q.tint }}>{q.icon}</span>
            <span className="pf-quick-lbl">{q.label}</span>
          </motion.button>
        ))}
      </div>

      <div className="vr-scroll">
        <div className="pf-rows">
          {ROWS.map((r, i) =>
            r.sep ? (
              <div key={`sep${i}`} className="pf-sep" />
            ) : (
              <button key={r.id} className="pf-row">
                <span className="pf-row-go">‹</span>
                <span className="pf-row-label">{r.label}</span>
                <span className="pf-row-ico">{r.icon}</span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
