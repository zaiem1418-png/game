import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { vipId } from "./profile.js";

// أي دي مميّز 🆔 — اشترِ معرّفاً قصيراً مميّزاً بالألماس (كلما كان أندر كان أغلى).
export default function VipIdModal({ wallet, onClose, onWalletUpdate, onRecharge }) {
  const [info, setInfo] = useState(null);   // { current, vip, suggestions }
  const [typed, setTyped] = useState("");
  const [quote, setQuote] = useState(null);  // { id, price, tier, available }
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const diamonds = wallet?.infinite ? "∞" : (wallet?.diamonds ?? 0).toLocaleString("en-US");

  const load = () => vipId.info().then(setInfo).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  // سعّر المعرّف المكتوب (مع تأخير بسيط)
  useEffect(() => {
    setQuote(null);
    if (!/^\d{4,8}$/.test(typed)) return;
    const t = setTimeout(() => {
      vipId.quote(typed).then(setQuote).catch(() => setQuote(null));
    }, 350);
    return () => clearTimeout(t);
  }, [typed]);

  async function buy(id) {
    setBusy(true); setErr(""); setMsg("");
    try {
      const r = await vipId.buy(id);
      onWalletUpdate?.(r.wallet);
      setMsg(`🎉 أصبح معرّفك المميّز ${r.id}`);
      setTyped("");
      setQuote(null);
      await load();
    } catch (e) {
      setErr(e.message || "تعذّر الشراء");
      // رصيد غير كافٍ → افتح المتجر على الألماس
      if (/ألماسة|تحتاج/.test(e.message || "")) onRecharge?.("diamonds");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="soc-backdrop" onClick={onClose}>
      <motion.div className="soc-sheet" onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
        <header className="soc-head">
          <button className="soc-close" onClick={onClose}>✕</button>
          <h2>🆔 أي دي مميّز</h2>
          <span className="soc-myid">💎 {diamonds}</span>
        </header>

        <div className="soc-body">
          {err && <div className="soc-alert err">{err}</div>}
          {msg && <div className="soc-alert ok">{msg}</div>}

          {/* المعرّف الحالي */}
          <div className="vip-current">
            <span className="vip-current-lbl">معرّفك الحالي</span>
            <span className="vip-current-id">
              {info?.current || "…"}
              {info?.vip && <span className="vip-badge">VIP</span>}
            </span>
          </div>

          {/* اكتب معرّفاً مخصّصاً */}
          <div className="soc-section">
            <h3>اختر معرّفك (4 إلى 8 أرقام)</h3>
            <div className="soc-form">
              <input className="soc-input" placeholder="مثال: 888888" inputMode="numeric"
                maxLength={8} value={typed}
                onChange={(e) => setTyped(e.target.value.replace(/\D/g, "").slice(0, 8))} />
              <button className="soc-btn ok" disabled={busy || !quote?.available}
                onClick={() => buy(typed)}>
                شراء
              </button>
            </div>
            {typed && !/^\d{4,8}$/.test(typed) && (
              <p className="soc-hint">المعرّف يجب أن يكون من 4 إلى 8 أرقام</p>
            )}
            {quote && (
              <div className={`vip-quote ${quote.available ? "" : "taken"}`}>
                <span className="vip-quote-id">{quote.id}</span>
                <span className="vip-quote-tier" style={{ color: quote.tier.color }}>{quote.tier.label}</span>
                {quote.available ? (
                  <span className="vip-quote-price">💎 {quote.price.toLocaleString("en-US")}</span>
                ) : (
                  <span className="vip-quote-taken">محجوز</span>
                )}
              </div>
            )}
          </div>

          {/* اقتراحات جاهزة */}
          <div className="soc-section">
            <h3>معرّفات مميّزة متاحة</h3>
            {!info && <div className="soc-empty">جارٍ التحميل…</div>}
            <div className="vip-grid">
              {info?.suggestions?.map((s) => (
                <motion.button key={s.id} className="vip-card" whileTap={{ scale: 0.96 }}
                  disabled={busy} onClick={() => buy(s.id)}>
                  <span className="vip-card-id">{s.id}</span>
                  <span className="vip-card-tier" style={{ color: s.tier.color }}>{s.tier.label}</span>
                  <span className="vip-card-price">💎 {s.price.toLocaleString("en-US")}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <p className="soc-hint">المعرّف المميّز يظهر للجميع ويستخدمه الأصدقاء لإيجادك. الأقصر والأندر = أغلى.</p>
        </div>
      </motion.div>
    </div>
  );
}
