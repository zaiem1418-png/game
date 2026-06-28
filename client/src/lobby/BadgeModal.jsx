import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { friends, marriage, clans } from "./social.js";
import { vipId } from "./profile.js";

// الشارة 🎖️ — شارات تُفتح بإنجازاتك (معرّف مميّز، زواج، قبيلة، أصدقاء…).
export default function BadgeModal({ wallet, onClose }) {
  const [st, setSt] = useState(null); // { vip, married, clan, friendCount }

  useEffect(() => {
    Promise.all([
      vipId.info().catch(() => ({})),
      marriage.status().catch(() => ({})),
      clans.list().catch(() => ({})),
      friends.status().catch(() => ({})),
    ]).then(([v, m, c, f]) => {
      setSt({
        vip: !!v?.vip,
        married: !!m?.partner,
        clan: !!c?.mine,
        friendCount: f?.friends?.length || 0,
      });
    });
  }, []);

  const owner = !!wallet?.infinite;
  const BADGES = [
    { icon: "👑", label: "المالك", desc: "مالك اللعبة", got: owner },
    { icon: "🆔", label: "معرّف مميّز", desc: "امتلك أي دي مميّزاً", got: st?.vip },
    { icon: "💍", label: "مرتبط", desc: "تزوّج في المحكمة", got: st?.married },
    { icon: "🏅", label: "ابن القبيلة", desc: "انضم لقبيلة", got: st?.clan },
    { icon: "🤝", label: "أول صديق", desc: "أضف صديقاً واحداً", got: (st?.friendCount || 0) >= 1 },
    { icon: "👥", label: "اجتماعي", desc: "اجمع 3 أصدقاء", got: (st?.friendCount || 0) >= 3 },
    { icon: "🌟", label: "شبكة واسعة", desc: "اجمع 10 أصدقاء", got: (st?.friendCount || 0) >= 10 },
  ];

  return (
    <div className="soc-backdrop" onClick={onClose}>
      <motion.div className="soc-sheet" onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
        <header className="soc-head">
          <button className="soc-close" onClick={onClose}>✕</button>
          <h2>🎖️ الشارة</h2>
          {st && <span className="soc-myid">{BADGES.filter((b) => b.got).length}/{BADGES.length}</span>}
        </header>
        <div className="soc-body">
          {!st && <div className="soc-empty">جارٍ التحميل…</div>}
          <div className="vip-grid">
            {st && BADGES.map((b) => (
              <div key={b.label} className={`badge-card ${b.got ? "got" : "locked"}`}>
                <span className="badge-ico">{b.got ? b.icon : "🔒"}</span>
                <span className="badge-lbl">{b.label}</span>
                <span className="badge-desc">{b.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
