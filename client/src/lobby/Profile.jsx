import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getMyShortId } from "./social.js";
import VipIdModal from "./VipIdModal.jsx";
import VisitorsModal from "./VisitorsModal.jsx";
import SongsModal from "./SongsModal.jsx";
import InviteModal from "./InviteModal.jsx";
import BadgeModal from "./BadgeModal.jsx";
import BagModal from "./BagModal.jsx";
import HomeModal from "./HomeModal.jsx";
import MomentsModal from "./MomentsModal.jsx";
import CompetitionsModal from "./CompetitionsModal.jsx";

// أيقونات الوصول السريع في الملف الشخصي — كل واحدة تفتح نظامها
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

export default function Profile({ user, wallet, onRecharge, onOwnerTap, onWalletUpdate }) {
  const name = user?.name || "Mohammad";
  const id = getMyShortId() || "52117491";
  const [open, setOpen] = useState(null); // أي نظام مفتوح

  function handleQuick(q) {
    if (q.action === "store") return onRecharge?.("coins");
    if (q.action === "vip") return onRecharge?.("diamonds");
    setOpen(q.id); // visitors | home
  }

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
            onClick={() => handleQuick(q)}
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
              <button key={r.id} className="pf-row" onClick={() => setOpen(r.id)}>
                <span className="pf-row-go">‹</span>
                <span className="pf-row-label">{r.label}</span>
                <span className="pf-row-ico">{r.icon}</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* أنظمة الملف الشخصي */}
      <AnimatePresence>
        {open === "vipid" && (
          <VipIdModal key="vipid" wallet={wallet} onWalletUpdate={onWalletUpdate}
            onRecharge={onRecharge} onClose={() => setOpen(null)} />
        )}
        {open === "visitors" && <VisitorsModal key="visitors" onClose={() => setOpen(null)} />}
        {open === "home" && <HomeModal key="home" user={user} onRecharge={onRecharge} onClose={() => setOpen(null)} />}
        {open === "songs" && <SongsModal key="songs" onClose={() => setOpen(null)} />}
        {open === "invite" && <InviteModal key="invite" onClose={() => setOpen(null)} />}
        {open === "badge" && <BadgeModal key="badge" wallet={wallet} onClose={() => setOpen(null)} />}
        {open === "bag" && <BagModal key="bag" wallet={wallet} onClose={() => setOpen(null)} />}
        {open === "moments" && <MomentsModal key="moments" onClose={() => setOpen(null)} />}
        {open === "achievements" && <CompetitionsModal key="ach" onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </div>
  );
}
