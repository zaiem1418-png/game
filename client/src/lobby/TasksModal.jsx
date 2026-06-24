import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { tasks } from "./tasks.js";

// نص التقدّم: مهام الوقت تُعرض بالدقائق، وغيرها كعدّاد عادي
function progressLabel(t) {
  if (t.unit === "seconds") {
    const cur = Math.floor(t.progress / 60);
    const goal = Math.floor(t.goal / 60);
    return `${cur} / ${goal} دقيقة`;
  }
  return `${t.progress} / ${t.goal}`;
}

// المهام اليومية ✅ — أكمل المهام واستلم الألماس. تتجدّد كل يوم.
export default function TasksModal({ onClose, onWallet }) {
  const [st, setSt] = useState(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [reward, setReward] = useState(null); // مكافأة استُلمت للتوّ (للنبضة)

  const load = () => tasks.status().then(setSt).catch((e) => setErr(e.message || ""));
  useEffect(() => { load(); }, []);

  async function claim(id) {
    setBusy(id); setErr("");
    try {
      const r = await tasks.claim(id);
      setSt(r.status);
      if (r.wallet) onWallet?.(r.wallet); // حدّث الرصيد المعروض فوراً
      setReward({ id, amount: r.reward });
      setTimeout(() => setReward(null), 1600);
    } catch (e) {
      setErr(e.message || "تعذّر الاستلام");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="soc-backdrop" onClick={onClose}>
      <motion.div className="soc-sheet" onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
        <header className="soc-head">
          <button className="soc-close" onClick={onClose}>✕</button>
          <h2>✅ المهام اليومية</h2>
          {st?.claimable > 0 && <span className="soc-myid">جاهز للاستلام: {st.claimable}</span>}
        </header>

        <div className="soc-body">
          {err && <div className="soc-alert err">{err}</div>}
          <p className="soc-hint">أكمل المهام واستلم الألماس 💎 — تتجدّد كل يوم.</p>

          {!st && <div className="soc-empty">جارٍ التحميل…</div>}

          {st?.tasks.map((t) => {
            const pct = Math.min(100, Math.round((t.progress / t.goal) * 100));
            return (
              <div key={t.id} className={`task-row ${t.claimed ? "done" : ""}`}>
                <span className="task-ico">{t.icon}</span>
                <div className="task-mid">
                  <span className="task-title">{t.title}</span>
                  <span className="task-desc">{t.desc}</span>
                  <div className="task-bar"><span className="task-bar-fill" style={{ width: `${pct}%` }} /></div>
                  <span className="task-prog">{progressLabel(t)}</span>
                </div>
                <div className="task-end">
                  <span className="task-reward">💎 {t.reward}</span>
                  {t.claimed ? (
                    <span className="task-claimed">✓ استُلمت</span>
                  ) : t.done ? (
                    <button className="soc-btn ok sm" disabled={busy === t.id}
                      onClick={() => claim(t.id)}>
                      {busy === t.id ? "…" : "استلام"}
                    </button>
                  ) : (
                    <button className="soc-btn ghost sm" disabled>قيد التنفيذ</button>
                  )}
                </div>
                {reward?.id === t.id && (
                  <motion.span className="task-pop"
                    initial={{ opacity: 0, y: 0, scale: 0.6 }}
                    animate={{ opacity: 1, y: -28, scale: 1 }}
                    exit={{ opacity: 0 }}>
                    +💎 {reward.amount}
                  </motion.span>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
