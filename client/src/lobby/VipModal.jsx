import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { vip } from "./profile.js";

function fmtLeft(ms) {
  const s = Math.floor(Math.max(0, ms) / 1000);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}ي ${h}س`;
  if (h > 0) return `${h}س ${m}د`;
  return `${m}د ${s % 60}ث`;
}
const medal = (r) => (r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : null);

// مركز VIP 💎 — الاشتراك + مسابقة المشتركين الحصريّة وجوائزها القيّمة.
export default function VipModal({ wallet, onWalletUpdate, onRecharge, onClose }) {
  const [tab, setTab] = useState("plans"); // plans | comp
  const [status, setStatus] = useState(null); // { vip, tier, daysLeft, plans, until }
  const [comp, setComp] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [pop, setPop] = useState(null);
  const [now, setNow] = useState(Date.now());
  const playEndsRef = useRef(0);

  const diamonds = wallet?.infinite ? "∞" : (wallet?.diamonds ?? 0).toLocaleString("en-US");

  const loadStatus = () => vip.status().then(setStatus).catch((e) => setErr(e.message || ""));
  const loadComp = () => vip.competition().then(setComp).catch(() => {});
  useEffect(() => { loadStatus(); loadComp(); }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { if (comp?.me) playEndsRef.current = Date.now() + (comp.me.cooldownLeft || 0); }, [comp]);

  const cooldownLeft = Math.max(0, playEndsRef.current - now);
  const seasonLeft = Math.max(0, (comp?.endsAt || 0) - now);

  async function subscribe(plan) {
    setBusy(true); setErr(""); setMsg("");
    try {
      const r = await vip.subscribe(plan.id);
      onWalletUpdate?.(r.wallet);
      setMsg(`🎉 صرت عضو ${plan.name}! استمتع بالمزايا`);
      await loadStatus(); await loadComp();
    } catch (e) {
      setErr(e.message || "تعذّر الاشتراك");
      if (/ألماسة|تحتاج/.test(e.message || "")) onRecharge?.("diamonds");
    } finally { setBusy(false); }
  }

  async function play() {
    setBusy(true); setErr("");
    try {
      const r = await vip.play();
      setComp(r.overview);
      setPop(`+${r.gained}`);
      setTimeout(() => setPop(null), 1600);
    } catch (e) { setErr(e.message || "تعذّرت الجولة"); }
    finally { setBusy(false); }
  }

  async function claim() {
    setBusy(true); setErr(""); setMsg("");
    try {
      const r = await vip.claim();
      onWalletUpdate?.(r.wallet);
      setComp(r.overview);
      setMsg(`🏅 استلمت جائزة المركز #${r.rank}: ${r.diamonds.toLocaleString("en-US")} 💎`);
    } catch (e) { setErr(e.message || "تعذّر الاستلام"); }
    finally { setBusy(false); }
  }

  const isVip = !!status?.vip;
  const canPlay = isVip && !busy && cooldownLeft <= 0;

  return (
    <div className="soc-backdrop" onClick={onClose}>
      <motion.div className="soc-sheet" onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
        <header className="soc-head">
          <button className="soc-close" onClick={onClose}>✕</button>
          <h2>💎 مركز VIP</h2>
          <span className="soc-myid">💎 {diamonds}</span>
        </header>

        {/* لافتة الحالة */}
        <div className={`vip-status ${isVip ? "on" : ""}`}>
          {isVip ? (
            <>
              <span className="vip-status-badge">VIP {status.tier}</span>
              <span className="vip-status-sub">عضويتك فعّالة — متبقّي {status.daysLeft} يوم</span>
            </>
          ) : (
            <span className="vip-status-sub">لست مشتركاً بعد — اشترك لتفتح المزايا والجوائز ✨</span>
          )}
        </div>

        <div className="comp-tabs">
          <button className={`comp-tab ${tab === "plans" ? "on" : ""}`} onClick={() => setTab("plans")}>👑 الاشتراك</button>
          <button className={`comp-tab ${tab === "comp" ? "on" : ""}`} onClick={() => setTab("comp")}>🏆 مسابقة VIP</button>
        </div>

        <div className="soc-body">
          {err && <div className="soc-alert err">{err}</div>}
          {msg && <div className="soc-alert ok">{msg}</div>}

          {/* ===== الاشتراك ===== */}
          {tab === "plans" && (
            <>
              <div className="soc-section">
                <h3>مزايا VIP</h3>
                <div className="vip-perks">
                  <div className="vip-perk">🏅<span>علامة VIP على ملفك</span></div>
                  <div className="vip-perk">🏆<span>مسابقة حصريّة للمشتركين</span></div>
                  <div className="vip-perk">💎<span>جوائز ألماس أسبوعيّة</span></div>
                  <div className="vip-perk">💍<span>إطارات وخواتم حصريّة</span></div>
                </div>
              </div>

              <div className="soc-section">
                <h3>اختر خطّتك</h3>
                <div className="vip-plans">
                  {status?.plans?.map((p) => (
                    <div key={p.id} className={`vip-plan ${p.popular ? "popular" : ""}`}>
                      {p.popular && <span className="vip-plan-tag">الأفضل قيمة</span>}
                      <span className="vip-plan-name" style={{ color: p.color }}>{p.name}</span>
                      <span className="vip-plan-days">{p.days} يوم</span>
                      <button className="soc-btn ok sm" disabled={busy} onClick={() => subscribe(p)}>
                        💎 {p.price.toLocaleString("en-US")}
                      </button>
                    </div>
                  ))}
                </div>
                {isVip && <p className="soc-hint">الاشتراك مجدّداً يُضاف لمدّتك المتبقّية.</p>}
              </div>
            </>
          )}

          {/* ===== مسابقة VIP ===== */}
          {tab === "comp" && (
            <>
              {!isVip && (
                <div className="soc-alert ok">مسابقة VIP حصريّة للمشتركين — اشترك من تبويب «الاشتراك» للدخول.</div>
              )}

              {comp && (
                <>
                  <p className="soc-hint">العب جولات لتجمع نقاطاً — تتجدّد كل أسبوع ⏳ {fmtLeft(seasonLeft)}</p>

                  {/* بطاقتي + زر اللعب */}
                  <div className="comp-me">
                    <div className="comp-me-stats">
                      <span className="comp-me-rank">{comp.me.rank ? `#${comp.me.rank}` : "—"}</span>
                      <span className="soc-sub">{comp.me.points} نقطة · {comp.me.plays} جولة</span>
                    </div>
                    <button className="soc-btn ok" disabled={!canPlay} onClick={play}>
                      {busy ? "…" : cooldownLeft > 0 ? `⏳ ${fmtLeft(cooldownLeft)}` : "🎯 جولة"}
                    </button>
                    {pop && (
                      <motion.span className="comp-pop win"
                        initial={{ opacity: 0, y: 0, scale: 0.6 }}
                        animate={{ opacity: 1, y: -30, scale: 1 }} exit={{ opacity: 0 }}>
                        {pop}
                      </motion.span>
                    )}
                  </div>

                  {/* استلام الجائزة */}
                  {isVip && (
                    <button className="soc-btn warn" style={{ width: "100%", marginTop: 10 }}
                      disabled={busy || comp.me.claimed || comp.me.plays === 0} onClick={claim}>
                      {comp.me.claimed ? "✓ استلمت جائزة هذا الأسبوع" : "🎁 استلم جائزة أسبوعك"}
                    </button>
                  )}

                  {/* جدول الجوائز */}
                  <div className="soc-section">
                    <h3>جوائز الأسبوع</h3>
                    <div className="vip-prizes">
                      {comp.prizes.map((p) => (
                        <div key={p.rank} className="vip-prize">
                          <span>{medal(p.rank) || `#${p.rank}`}</span>
                          <span className="vip-prize-amt">💎 {p.diamonds.toLocaleString("en-US")}</span>
                        </div>
                      ))}
                      <div className="vip-prize">
                        <span>👥 مشاركة</span>
                        <span className="vip-prize-amt">💎 {comp.participation}</span>
                      </div>
                    </div>
                  </div>

                  {/* لوحة الصدارة */}
                  <div className="soc-section">
                    <h3>متصدّرو VIP</h3>
                    {comp.board.length === 0 && <p className="soc-hint">لا متنافسين بعد — كن الأول!</p>}
                    {comp.board.map((p, i) => (
                      <div key={p.uid} className={`comp-row ${comp.me.rank === i + 1 ? "mine" : ""}`}>
                        <span className="comp-rank">{medal(i + 1) || i + 1}</span>
                        <span className="soc-ava">{p.avatar}</span>
                        <span className="comp-row-info"><b>{p.name}</b><span className="soc-sub">{p.plays} جولة</span></span>
                        <span className="comp-pts">{p.points}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
