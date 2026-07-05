import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getProfile } from "../wallet.js";
import { vipId, shop } from "./profile.js";

const KIND_LABEL = {
  frame: "🖼️ إطار", ring: "💍 خاتم", entrance: "🚪 دخولية",
  bubble: "💬 فقاعة", mic: "🎤 مايك", background: "🖼 خلفية",
};

// الحقيبة 🎒 — مقتنياتك: المعرّف المميّز، الصورة، الإطار، والرصيد.
export default function BagModal({ wallet, onClose }) {
  const [vip, setVip] = useState(null); // { current, vip }
  const [shopData, setShopData] = useState(null); // { items, inventory }
  const [busy, setBusy] = useState("");
  const profile = getProfile();

  const loadShop = () => shop.list().then(setShopData).catch(() => {});
  useEffect(() => { vipId.info().then(setVip).catch(() => setVip({})); loadShop(); }, []);

  // العناصر المملوكة (بما فيها المُهداة) مع حالة التجهيز
  const owned = (shopData?.items || []).filter((i) => i.owned);

  async function toggleEquip(it) {
    setBusy(it.id);
    try {
      if (it.equipped) await shop.unequip(it.kind);
      else await shop.equip(it.id);
      await loadShop();
    } catch { /* تجاهل */ }
    finally { setBusy(""); }
  }

  const items = [];
  if (vip?.vip) items.push({ icon: "🆔", label: "معرّف مميّز", value: vip.current });
  items.push({ icon: profile.avatar || "🧑🏻", label: "الصورة الرمزية", value: "مملوكة" });
  if (profile.frame) items.push({ icon: "🖼️", label: "إطار", value: profile.frame });
  if (wallet?.infinite) items.push({ icon: "👑", label: "تاج المالك", value: "خاص" });

  return (
    <div className="soc-backdrop" onClick={onClose}>
      <motion.div className="soc-sheet" onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
        <header className="soc-head">
          <button className="soc-close" onClick={onClose}>✕</button>
          <h2>🎒 الحقيبة</h2>
        </header>
        <div className="soc-body">
          {/* الرصيد */}
          <div className="bag-wallet">
            <div className="bag-bal diamonds">💎 {wallet?.infinite ? "∞" : (wallet?.diamonds ?? 0).toLocaleString("en-US")}</div>
            <div className="bag-bal coins">🪙 {wallet?.infinite ? "∞" : (wallet?.coins ?? 0).toLocaleString("en-US")}</div>
          </div>

          <div className="soc-section">
            <h3>مقتنياتي</h3>
            <div className="vip-grid">
              {items.map((it, i) => (
                <div key={i} className="bag-item">
                  <span className="bag-item-ico">{it.icon}</span>
                  <span className="bag-item-lbl">{it.label}</span>
                  <span className="bag-item-val">{it.value}</span>
                </div>
              ))}
            </div>
            {!vip?.vip && (
              <p className="soc-hint">احصل على معرّف مميّز من «أي دي مميّز» ليظهر هنا ✨</p>
            )}
          </div>

          {/* مقتنيات المتجر (المشتراة والمُهداة) */}
          <div className="soc-section">
            <h3>مقتنيات المتجر</h3>
            {!shopData ? (
              <div className="soc-empty">جارٍ التحميل…</div>
            ) : owned.length === 0 ? (
              <p className="soc-hint">لا تملك مقتنيات بعد — تسوّق من المتجر 🛍️ أو استلم هدية من صديق 🎁</p>
            ) : (
              <div className="bag-owned-grid">
                {owned.map((it) => (
                  <div key={it.id} className={`bag-owned ${it.equipped ? "on" : ""}`}>
                    <span className="bag-owned-em" style={{ "--glow": it.glow }}>{it.emoji}</span>
                    <span className="bag-owned-name">{it.name}</span>
                    <span className="bag-owned-kind">{KIND_LABEL[it.kind] || it.kind}</span>
                    <button
                      className={`soc-btn sm ${it.equipped ? "ghost" : "ok"}`}
                      disabled={busy === it.id}
                      onClick={() => toggleEquip(it)}
                    >
                      {it.equipped ? "إلغاء" : "تجهيز"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
