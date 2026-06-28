import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { achievements } from "./profile.js";

// إنجازات اللعب 🏆 — أوسمة تُفتح بنشاطك (مباريات، فوز، اجتماعيات، مقتنيات، VIP).
export default function AchievementsModal({ onClose }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    achievements.list().then(setData).catch((e) => setErr(e.message || "تعذّر التحميل"));
  }, []);

  return (
    <div className="soc-backdrop" onClick={onClose}>
      <motion.div className="soc-sheet" onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
        <header className="soc-head">
          <button className="soc-close" onClick={onClose}>✕</button>
          <h2>🏆 إنجازات اللعب</h2>
          {data && <span className="soc-myid">{data.unlocked}/{data.total}</span>}
        </header>

        <div className="soc-body">
          {err && <div className="soc-alert err">{err}</div>}
          {!data && !err && <div className="soc-empty">جارٍ التحميل…</div>}

          {data && (
            <div className="ach-list">
              {data.achievements.map((a) => {
                const pct = Math.round((a.progress / a.goal) * 100);
                return (
                  <div key={a.id} className={`ach-card ${a.done ? "done" : ""}`}>
                    <span className="ach-ico">{a.done ? a.icon : "🔒"}</span>
                    <div className="ach-info">
                      <div className="ach-title">
                        {a.title}
                        {a.done && <span className="ach-tag">مكتمل</span>}
                      </div>
                      <div className="ach-desc">{a.desc}</div>
                      <div className="ach-bar"><div className="ach-bar-fill" style={{ width: `${pct}%` }} /></div>
                    </div>
                    <span className="ach-prog">{a.progress}/{a.goal}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
