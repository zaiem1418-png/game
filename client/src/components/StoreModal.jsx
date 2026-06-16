import { useEffect, useState } from "react";
import { fetchPackages, purchase } from "../wallet.js";

// متجر الشحن — تبويبان (ألماس / كوينز)، شبكة باقات، ثم نموذج دفع فيزا.
// الدفع فيزا فقط (يبدأ رقم البطاقة بـ 4). عند النجاح يُشحن الرصيد فوراً.

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + "M";
  if (n >= 1000) return n.toLocaleString("en-US");
  return String(n);
}

// تنسيق رقم البطاقة بمجموعات من 4
function formatCardNumber(v) {
  return v
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim();
}
function formatExp(v) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  if (d.length <= 2) return d;
  return d.slice(0, 2) + "/" + d.slice(2);
}

export default function StoreModal({ initialTab = "diamonds", onClose, onPurchased }) {
  const [tab, setTab] = useState(initialTab);
  const [packages, setPackages] = useState({ diamonds: [], coins: [] });
  const [selected, setSelected] = useState(null); // الباقة المختارة
  const [card, setCard] = useState({ number: "", name: "", exp: "", cvc: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null); // نتيجة الشراء الناجح

  useEffect(() => {
    fetchPackages().then(setPackages).catch(() => {});
  }, []);

  const list = packages[tab] || [];
  const unit = tab === "diamonds" ? "💎" : "🪙";
  const amountOf = (p) => (tab === "diamonds" ? p.diamonds : p.coins);

  async function pay() {
    setError("");
    if (!selected) return;
    setBusy(true);
    try {
      const res = await purchase({ kind: tab, packageId: selected.id, card });
      setDone(res);
      onPurchased?.(res.wallet);
    } catch (e) {
      setError(e.message || "فشل الدفع");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="store-modal" onClick={(e) => e.stopPropagation()}>
        <div className="store-head">
          <h3>متجر الشحن</h3>
          <button className="store-x" onClick={onClose}>✕</button>
        </div>

        {done ? (
          // ===== شاشة نجاح الشراء =====
          <div className="store-success">
            <div className="ss-check">✅</div>
            <p className="ss-title">تم الشحن بنجاح!</p>
            <p className="ss-sub">
              أُضيف{" "}
              <b>
                {fmt(done.credited.diamonds || done.credited.coins)}{" "}
                {done.credited.diamonds ? "💎" : "🪙"}
              </b>{" "}
              إلى رصيدك
            </p>
            <p className="ss-tx">رقم العملية: {done.txId}</p>
            <button className="store-pay" onClick={onClose}>تم</button>
          </div>
        ) : (
          <>
            {/* التبويبات */}
            <div className="store-tabs">
              <button
                className={`store-tab ${tab === "diamonds" ? "active" : ""}`}
                onClick={() => { setTab("diamonds"); setSelected(null); }}
              >
                💎 ألماس
              </button>
              <button
                className={`store-tab ${tab === "coins" ? "active" : ""}`}
                onClick={() => { setTab("coins"); setSelected(null); }}
              >
                🪙 كوينز
              </button>
            </div>

            {/* شبكة الباقات */}
            <div className="store-grid">
              {list.map((p) => (
                <button
                  key={p.id}
                  className={`pkg ${selected?.id === p.id ? "active" : ""} ${p.popular ? "popular" : ""}`}
                  onClick={() => setSelected(p)}
                >
                  {p.popular && <span className="pkg-tag">الأكثر مبيعاً</span>}
                  <span className="pkg-icon">{unit}</span>
                  <span className="pkg-amt">{fmt(amountOf(p))}</span>
                  {p.bonus > 0 && <span className="pkg-bonus">+{fmt(p.bonus)} مجاناً</span>}
                  <span className="pkg-price">${p.price.toFixed(2)}</span>
                </button>
              ))}
            </div>

            {/* نموذج الدفع بالفيزا */}
            <div className={`pay-form ${selected ? "" : "disabled"}`}>
              <div className="pay-form-head">
                <span>الدفع بالفيزا</span>
                <span className="visa-badge">VISA</span>
              </div>
              <input
                className="pay-input"
                placeholder="رقم البطاقة (يبدأ بـ 4)"
                inputMode="numeric"
                value={card.number}
                onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
              />
              <input
                className="pay-input"
                placeholder="اسم حامل البطاقة"
                value={card.name}
                onChange={(e) => setCard({ ...card, name: e.target.value })}
              />
              <div className="pay-row">
                <input
                  className="pay-input"
                  placeholder="MM/YY"
                  inputMode="numeric"
                  value={card.exp}
                  onChange={(e) => setCard({ ...card, exp: formatExp(e.target.value) })}
                />
                <input
                  className="pay-input"
                  placeholder="CVC"
                  inputMode="numeric"
                  maxLength={4}
                  value={card.cvc}
                  onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                />
              </div>

              {error && <div className="pay-error">{error}</div>}

              <button className="store-pay" disabled={!selected || busy} onClick={pay}>
                {busy
                  ? "جارٍ الدفع..."
                  : selected
                  ? `ادفع $${selected.price.toFixed(2)}`
                  : "اختر باقة أولاً"}
              </button>
              <p className="pay-note">دفع آمن — تُقبل بطاقات فيزا فقط</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
