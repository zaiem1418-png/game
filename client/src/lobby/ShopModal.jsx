import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { shop } from "./profile.js";

// متجر الإطارات والخواتم 🛍️ — اشترِ إطاراً حول صورتك أو خاتماً بجانب اسمك،
// بالألماس أو الكوينز. بعض العناصر حصريّة لمشتركي VIP. يُجهّز العنصر فوراً عند الشراء.
const TABS = [
  { id: "frame", label: "🖼️ الإطارات" },
  { id: "ring", label: "💍 الخواتم" },
  { id: "entrance", label: "🚪 الدخوليات" },
  { id: "bubble", label: "💬 الفقاعات" },
];

export default function ShopModal({ wallet, onWalletUpdate, onRecharge, onClose }) {
  const [tab, setTab] = useState("frame"); // frame | ring | entrance | bubble
  const [data, setData] = useState(null);  // { items, inventory, vip }
  const [busy, setBusy] = useState("");     // id قيد المعالجة
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [giftId, setGiftId] = useState(""); // معرّف الصديق للإهداء

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

  async function gift(item) {
    if (!giftId) { setErr("أدخل معرّف الصديق أولاً"); return; }
    setBusy(item.id); setErr(""); setMsg("");
    try {
      const r = await shop.gift(item.id, giftId);
      onWalletUpdate?.(r.wallet);
      setMsg(`🎁 أهديت ${item.name} إلى ${r.to?.name || giftId}`);
    } catch (e) {
      setErr(e.message || "تعذّر الإهداء");
      if (/ألماسة/.test(e.message || "")) onRecharge?.("diamonds");
      else if (/كوين/.test(e.message || "")) onRecharge?.("coins");
    } finally { setBusy(""); }
  }

  const list = (data?.items || []).filter((i) => i.kind === tab);

  // معاينة العنصر حسب نوعه
  function art(it) {
    if (it.kind === "ring") {
      return (
        <span className="ring3d" data-metal={it.metal || "gold"} style={{ "--gem": it.glow || "#bff0ff" }}>
          <i className="ring3d-band" />
          <i className="ring3d-gem">{it.emoji}</i>
        </span>
      );
    }
    if (it.kind === "bubble") {
      return (
        <span className="bubble-preview" style={{ background: it.grad, "--glow": it.glow }}>
          {it.emoji} أهلاً
        </span>
      );
    }
    if (it.kind === "entrance") {
      return (
        <span className="entrance-preview" style={{ "--glow": it.glow }}>
          <i className="entrance-preview-em">{it.emoji}</i>
        </span>
      );
    }
    return (
      <span className="frame3d" style={{ "--c": it.glow || "#ffffff" }}>
        <i className="frame3d-ring" />
        <i className="frame3d-face">{it.emoji}</i>
      </span>
    );
  }

  return (
    <div className="soc-backdrop" onClick={onClose}>
      <motion.div className="soc-sheet" onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
        <header className="soc-head">
          <button className="soc-close" onClick={onClose}>✕</button>
          <h2>🛍️ المتجر</h2>
          <span className="soc-myid">💎 {diamonds} · 🪙 {coins}</span>
        </header>

        <div className="comp-tabs">
          {TABS.map((t) => (
            <button key={t.id} className={`comp-tab ${tab === t.id ? "on" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="soc-body">
          {err && <div className="soc-alert err">{err}</div>}
          {msg && <div className="soc-alert ok">{msg}</div>}
          {!data && !err && <div className="soc-empty">جارٍ التحميل…</div>}

          {/* حقل الإهداء: أدخل معرّف الصديق ثم استخدم زر 🎁 على أي عنصر */}
          <div className="shop-gift-bar">
            <span>🎁 إهداء إلى:</span>
            <input
              className="soc-input sm"
              placeholder="معرّف الصديق (ID)"
              inputMode="numeric"
              value={giftId}
              onChange={(e) => setGiftId(e.target.value.replace(/\D/g, ""))}
            />
          </div>

          <div className="shop-grid">
            {list.map((it) => {
              const locked = it.vipOnly && !data?.vip;
              return (
                <div key={it.id} className={`shop-card ${it.equipped ? "equipped" : ""} ${locked ? "vip-locked" : ""}`}>
                  {it.vipOnly && <span className="shop-vip-tag">VIP</span>}
                  <span className="shop-art">{art(it)}</span>
                  <span className="shop-name">{it.name}</span>
                  {it.owned ? (
                    <button className={`soc-btn sm ${it.equipped ? "ghost" : "ok"}`} disabled={busy === it.id}
                      onClick={() => equip(it, it.equipped)}>
                      {it.equipped ? "إلغاء التجهيز" : "تجهيز"}
                    </button>
                  ) : locked ? (
                    <span className="shop-price locked">🔒 حصري VIP</span>
                  ) : (
                    <div className="shop-actions">
                      <button className="soc-btn sm ok" disabled={busy === it.id} onClick={() => buy(it)}>
                        {it.currency === "diamonds" ? "💎" : "🪙"} {it.price.toLocaleString("en-US")}
                      </button>
                      <button className="soc-btn sm gift" title="إهداء لصديق" disabled={busy === it.id || !giftId}
                        onClick={() => gift(it)}>
                        🎁
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="soc-hint">
            الإطار يحيط بصورتك، الخاتم بجانب اسمك، الدخولية تظهر عند دخولك الغرفة، والفقاعة تلوّن رسائلك في الشات.
            أدخل معرّف صديق واضغط 🎁 لإهدائه أي عنصر. المميّز بـ VIP يُفتح بالاشتراك.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
