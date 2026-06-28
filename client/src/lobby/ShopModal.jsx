import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { shop } from "./profile.js";

// متجر الإطارات والخواتم 🛍️ — اشترِ إطاراً حول صورتك أو خاتماً بجانب اسمك،
// بالألماس أو الكوينز. بعض العناصر حصريّة لمشتركي VIP. يُجهّز العنصر فوراً عند الشراء.
export default function ShopModal({ wallet, onWalletUpdate, onRecharge, onClose }) {
  const [tab, setTab] = useState("frame"); // frame | ring
  const [data, setData] = useState(null);  // { items, inventory, vip }
  const [busy, setBusy] = useState("");     // id قيد المعالجة
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => shop.list().then(setData).catch((e) => setErr(e.message || ""));
  useEffect(() => { load(); }, []);

  const diamonds = wallet?.infinite ? "∞" : (wallet?.diamonds ?? 0).toLocaleString("en-US");
  const coins = wallet?.infinite ? "∞" : (wallet?.coins ?? 0).toLocaleString("en-US");

  async function buy(item) {
    setBusy(item.id); setErr(""); setMsg("");
    try {
      const r = await shop.buy(item.id);
      onWalletUpdate?.(r.wallet);
      setMsg(`🎉 اشتريت ${item.name} وجُهِّز لك`);
      await load();
    } catch (e) {
      setErr(e.message || "تعذّر الشراء");
      if (/ألماسة/.test(e.message || "")) onRecharge?.("diamonds");
      else if (/كوين/.test(e.message || "")) onRecharge?.("coins");
    } finally { setBusy(""); }
  }

  async function equip(item, on) {
    setBusy(item.id); setErr(""); setMsg("");
    try {
      if (on) await shop.unequip(item.kind);
      else await shop.equip(item.id);
      await load();
    } catch (e) { setErr(e.message || ""); }
    finally { setBusy(""); }
  }

  const list = (data?.items || []).filter((i) => i.kind === tab);

  return (
    <div className="soc-backdrop" onClick={onClose}>
      <motion.div className="soc-sheet" onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
        <header className="soc-head">
          <button className="soc-close" onClick={onClose}>✕</button>
          <h2>🛍️ الإطارات والخواتم</h2>
          <span className="soc-myid">💎 {diamonds} · 🪙 {coins}</span>
        </header>

        <div className="comp-tabs">
          <button className={`comp-tab ${tab === "frame" ? "on" : ""}`} onClick={() => setTab("frame")}>🖼️ الإطارات</button>
          <button className={`comp-tab ${tab === "ring" ? "on" : ""}`} onClick={() => setTab("ring")}>💍 الخواتم</button>
        </div>

        <div className="soc-body">
          {err && <div className="soc-alert err">{err}</div>}
          {msg && <div className="soc-alert ok">{msg}</div>}
          {!data && !err && <div className="soc-empty">جارٍ التحميل…</div>}

          <div className="shop-grid">
            {list.map((it) => {
              const locked = it.vipOnly && !data?.vip;
              return (
                <div key={it.id} className={`shop-card ${it.equipped ? "equipped" : ""} ${locked ? "vip-locked" : ""}`}>
                  {it.vipOnly && <span className="shop-vip-tag">VIP</span>}
                  <span className="shop-emoji">{it.emoji}</span>
                  <span className="shop-name">{it.name}</span>
                  {it.owned ? (
                    <button className={`soc-btn sm ${it.equipped ? "ghost" : "ok"}`} disabled={busy === it.id}
                      onClick={() => equip(it, it.equipped)}>
                      {it.equipped ? "إلغاء التجهيز" : "تجهيز"}
                    </button>
                  ) : locked ? (
                    <span className="shop-price locked">🔒 حصري VIP</span>
                  ) : (
                    <button className="soc-btn sm ok" disabled={busy === it.id} onClick={() => buy(it)}>
                      {it.currency === "diamonds" ? "💎" : "🪙"} {it.price.toLocaleString("en-US")}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <p className="soc-hint">الإطار يحيط بصورتك والخاتم يظهر بجانب اسمك للجميع. العناصر المميّزة بـ VIP تُفتح بالاشتراك.</p>
        </div>
      </motion.div>
    </div>
  );
}
