import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getMyShortId } from "./social.js";
import { vip as vipApi, shop as shopApi, guestbook as guestbookApi } from "./profile.js";
import VipIdModal from "./VipIdModal.jsx";
import VisitorsModal from "./VisitorsModal.jsx";
import SongsModal from "./SongsModal.jsx";
import InviteModal from "./InviteModal.jsx";
import BadgeModal from "./BadgeModal.jsx";
import BagModal from "./BagModal.jsx";
import HomeModal from "./HomeModal.jsx";
import MomentsModal from "./MomentsModal.jsx";
import AchievementsModal from "./AchievementsModal.jsx";
import ShopModal from "./ShopModal.jsx";
import VipModal from "./VipModal.jsx";

// أيقونات الوصول السريع في الملف الشخصي — كل واحدة تفتح نظامها
const QUICK = [
  { id: "visitors", label: "الزوار", icon: "🔷", tint: "#2bb3e0" },
  { id: "home", label: "المنزل", icon: "🏠", tint: "#e0563a" },
  { id: "store", label: "المتجر", icon: "🏪", tint: "#2bbf8e", action: "store" },
  { id: "vip", label: "مركز VIP", icon: "💎", tint: "#f5c451" },
];

const ROWS = [
  { id: "moments", label: "لحظاتي", icon: "📖" },
  { id: "achievements", label: "إنجازات اللعب", icon: "🏆" },
  { id: "shop", label: "الإطارات والخواتم", icon: "🛍️" },
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
  const [isVip, setIsVip] = useState(false);
  const [worn, setWorn] = useState({ frame: null, ring: null }); // emoji المُجهَّز
  const [gbActive, setGbActive] = useState(true); // هل دفتر الزوّار مفعّل؟ (لإظهار علامة القفل)

  // اجلب حالة VIP والمقتنيات المُجهَّزة (إطار/خاتم) لعرضها في رأس الملف
  function refresh() {
    vipApi.status().then((s) => setIsVip(!!s.vip)).catch(() => {});
    guestbookApi.status().then((g) => setGbActive(!!g.active)).catch(() => {});
    shopApi.list().then((d) => {
      const byId = Object.fromEntries((d.items || []).map((it) => [it.id, it.emoji]));
      setWorn({ frame: byId[d.inventory?.frame] || null, ring: byId[d.inventory?.ring] || null });
    }).catch(() => {});
  }
  useEffect(() => { refresh(); }, []);

  function handleQuick(q) {
    if (q.action === "store") return onRecharge?.("coins");
    setOpen(q.id); // visitors | home | vip
  }

  // عند إغلاق أي نظام، أعد تحميل الحالة (قد يكون اشترك VIP أو جهّز إطاراً)
  const close = () => { setOpen(null); refresh(); };

  return (
    <div className="pf">
      <div className="pf-bg" />

      {/* رأس الملف */}
      <header className="pf-head">
        <button className="pf-back">‹</button>
        <div className="pf-id-block">
          <div className="pf-name">
            <span className="pf-spark">✨</span>
            {worn.ring && <span className="pf-ring-ico">{worn.ring}</span>}
            <span className="pf-frame-ico">{worn.frame || "🦌"}</span>
            <span className="pf-name-text">{name}</span>
            {isVip && <span className="vip-badge">VIP</span>}
          </div>
          <div className="pf-id">🆔 ID: {id}</div>
        </div>
        <motion.button
          className={`pf-avatar ${worn.frame ? "framed" : ""}`}
          whileTap={{ scale: 0.93 }}
          onClick={(e) => { if (e.detail >= 2) onOwnerTap?.(); }}
        >
          <span>{wallet?.infinite ? "👑" : user?.avatar || "🧑🏻"}</span>
          {worn.frame && <span className="pf-avatar-frame">{worn.frame}</span>}
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
            <span className="pf-quick-ico" style={{ color: q.tint }}>
              {q.icon}
              {q.id === "visitors" && !gbActive && <span className="pf-quick-lock">🔒</span>}
            </span>
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
            onRecharge={onRecharge} onClose={close} />
        )}
        {open === "visitors" && (
          <VisitorsModal key="visitors" user={user} wallet={wallet} onWalletUpdate={onWalletUpdate}
            onRecharge={onRecharge} onClose={close} />
        )}
        {open === "home" && <HomeModal key="home" user={user} onRecharge={onRecharge} onClose={close} />}
        {open === "songs" && <SongsModal key="songs" onClose={close} />}
        {open === "invite" && <InviteModal key="invite" onClose={close} />}
        {open === "badge" && <BadgeModal key="badge" wallet={wallet} onClose={close} />}
        {open === "bag" && <BagModal key="bag" wallet={wallet} onClose={close} />}
        {open === "moments" && <MomentsModal key="moments" onClose={close} />}
        {open === "achievements" && <AchievementsModal key="ach" onClose={close} />}
        {open === "shop" && (
          <ShopModal key="shop" wallet={wallet} onWalletUpdate={onWalletUpdate}
            onRecharge={onRecharge} onClose={close} />
        )}
        {open === "vip" && (
          <VipModal key="vip" wallet={wallet} onWalletUpdate={onWalletUpdate}
            onRecharge={onRecharge} onClose={close} />
        )}
      </AnimatePresence>
    </div>
  );
}
