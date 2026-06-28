import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { visitors } from "./profile.js";

// الزوّار 🔷 — من بحث عن معرّفك ودخل ملفك (الأحدث أولاً).
export default function VisitorsModal({ onClose }) {
  const [list, setList] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    visitors.list().then((d) => setList(d.visitors || [])).catch((e) => setErr(e.message));
  }, []);

  const ago = (ts) => {
    const m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return "الآن";
    if (m < 60) return `قبل ${m} د`;
    const h = Math.floor(m / 60);
    if (h < 24) return `قبل ${h} س`;
    return `قبل ${Math.floor(h / 24)} ي`;
  };

  return (
    <div className="soc-backdrop" onClick={onClose}>
      <motion.div className="soc-sheet" onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
        <header className="soc-head">
          <button className="soc-close" onClick={onClose}>✕</button>
          <h2>🔷 الزوّار</h2>
        </header>
        <div className="soc-body">
          {err && <div className="soc-alert err">{err}</div>}
          {!list && !err && <div className="soc-empty">جارٍ التحميل…</div>}
          {list && list.length === 0 && (
            <p className="soc-hint">لا زوّار بعد — شارك معرّفك مع أصدقائك ليزوروا ملفك ويظهروا هنا.</p>
          )}
          {list?.map((v) => (
            <div key={v.uid} className="soc-friend">
              <span className="soc-ava">{v.avatar || "🧑🏻"}</span>
              <span className="soc-friend-name">
                {v.name}{v.vip && <span className="vip-badge sm">VIP</span>}
                <span className="soc-friend-id">ID {v.shortId}</span>
              </span>
              <span className="soc-friend-id">{ago(v.ts)}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
