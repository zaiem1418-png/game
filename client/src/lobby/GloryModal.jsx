import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { glory } from "./tasks.js";

// نص مكافأة المستوى (ألماس و/أو كوينز)
function rewardLabel(r) {
  const parts = [];
  if (r.diamonds) parts.push(`💎 ${r.diamonds.toLocaleString("en-US")}`);
  if (r.coins) parts.push(`🪙 ${r.coins.toLocaleString("en-US")}`);
  return parts.join(" + ");
}

// بطاقة المجد 🏅 — اكسب نقاط المجد من نشاطك اليومي وافتح مكافآت المستويات.
export default function GloryModal({ onClose, onWallet }) {
  const [st, setSt] = useState(null);
  const [busy, setBusy] = useState(0);
  const [err, setErr] = useState("");

  const load = () => glory.status().then(setSt).catch((e) => setErr(e.message || ""));
  useEffect(() => { load(); }, []);

  async function claim(level) {
    setBusy(level); setErr("");
    try {
      const r = await glory.claim(level);
      setSt(r.status);
      if (r.wallet) onWallet?.(r.wallet);
    } catch (e) { setErr(e.message || "تعذّر الاستلام"); }
    finally { setBusy(0); }
  }

  const pct = st?.nextNeed ? Math.min(100, Math.round((st.points / st.nextNeed) * 100)) : 100;

  return (
    <div className="soc-backdrop" onClick={onClose}>
      <motion.div className="soc-sheet" onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
        <header className="soc-head">
          <button className="soc-close" onClick={onClose}>✕</button>
          <h2>🏅 بطاقة المجد</h2>
          {st && <span className="soc-myid">المجد: {st.points.toLocaleString("en-US")}</span>}
        </header>

        <div className="soc-body">
          {err && <div className="soc-alert err">{err}</div>}

          <div className="glory-hero">
            <span className="glory-points">🏅 {st ? st.points.toLocaleString("en-US") : "…"}</span>
            <div className="glory-bar"><span className="glory-bar-fill" style={{ width: `${pct}%` }} /></div>
            <span className="glory-next">
              {st?.nextNeed ? `المستوى التالي عند ${st.nextNeed.toLocaleString("en-US")} نقطة` : "بلغت أعلى المستويات 🎉"}
            </span>
          </div>

          <p className="soc-hint">اكسب نقاط المجد من تسجيل الدخول اليومي واستلام المهام، ثم افتح مكافآت المستويات.</p>

          {!st && <div className="soc-empty">جارٍ التحميل…</div>}

          {st?.tiers.map((t) => (
            <div key={t.level} className={`glory-tier ${t.claimed ? "done" : ""} ${t.claimable ? "ready" : ""}`}>
              <span className="glory-tier-lv">{t.level}</span>
              <div className="glory-tier-mid">
                <span className="glory-tier-reward">{rewardLabel(t.reward)}</span>
                <span className="glory-tier-need">يفتح عند {t.need.toLocaleString("en-US")} مجد</span>
              </div>
              {t.claimed ? (
                <span className="task-claimed">✓ استُلمت</span>
              ) : t.claimable ? (
                <button className="soc-btn ok sm" disabled={busy === t.level} onClick={() => claim(t.level)}>
                  {busy === t.level ? "…" : "استلام"}
                </button>
              ) : (
                <span className="task-claimed locked">🔒</span>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
