import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { packages } from "./tasks.js";

// محتوى الباقة كنص (كوينز/ألماس + عنصر حصري)
function grantLabel(p) {
  const parts = [];
  if (p.grant?.coins) parts.push(`🪙 ${p.grant.coins.toLocaleString("en-US")}`);
  if (p.grant?.diamonds) parts.push(`💎 ${p.grant.diamonds.toLocaleString("en-US")}`);
  if (p.grantItem) parts.push("🎁 عنصر حصري");
  return parts.join(" + ");
}

// الحزم الحصرية 🎁 — باقات قيمة تُشترى بالألماس وتمنح كوينز وعناصر حصرية.
export default function PackagesModal({ wallet, onWalletUpdate, onRecharge, onClose }) {
  const [list, setList] = useState(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => packages.list().then((d) => setList(d.packages)).catch((e) => setErr(e.message || ""));
  useEffect(() => { load(); }, []);

  const diamonds = wallet?.infinite ? "∞" : (wallet?.diamonds ?? 0).toLocaleString("en-US");

  async function buy(p) {
    setBusy(p.id); setErr(""); setMsg("");
    try {
      const r = await packages.buy(p.id);
      onWalletUpdate?.(r.wallet);
      setMsg(`🎉 اشتريت ${p.name}`);
    } catch (e) {
      setErr(e.message || "تعذّر الشراء");
      if (/ألماس/.test(e.message || "")) onRecharge?.("diamonds");
    } finally { setBusy(""); }
  }

  return (
    <div className="soc-backdrop" onClick={onClose}>
      <motion.div className="soc-sheet" onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
        <header className="soc-head">
          <button className="soc-close" onClick={onClose}>✕</button>
          <h2>🎁 الحزم الحصرية</h2>
          <span className="soc-myid">💎 {diamonds}</span>
        </header>

        <div className="soc-body">
          {err && <div className="soc-alert err">{err}</div>}
          {msg && <div className="soc-alert ok">{msg}</div>}
          {!list && !err && <div className="soc-empty">جارٍ التحميل…</div>}

          {list?.map((p) => (
            <div key={p.id} className="pkg-card">
              <span className="pkg-emoji">{p.emoji}</span>
              <div className="pkg-mid">
                <span className="pkg-name">{p.name}</span>
                <span className="pkg-grant">{grantLabel(p)}</span>
              </div>
              <button className="soc-btn ok sm" disabled={busy === p.id} onClick={() => buy(p)}>
                {busy === p.id ? "…" : `💎 ${p.priceDiamonds.toLocaleString("en-US")}`}
              </button>
            </div>
          ))}

          <p className="soc-hint">باقات لفترة محدودة — ادفع بالألماس واحصل على كوينز وعناصر حصرية بقيمة أكبر.</p>
        </div>
      </motion.div>
    </div>
  );
}
