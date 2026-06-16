import { useState } from "react";
import { ownerLogin } from "../wallet.js";

// دخول مالك اللعبة بكلمة السر — يمنحه رصيداً لانهائياً.
// يُفتح بنقرة مزدوجة على شعار شريط المحفظة (مخفي عن المستخدم العادي).
export default function OwnerLogin({ onClose, onSuccess }) {
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await ownerLogin(key.trim());
      onSuccess?.(res.wallet);
    } catch (err) {
      setError(err.message || "فشل الدخول");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="owner-modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="store-head">
          <h3>👑 دخول المالك</h3>
          <button type="button" className="store-x" onClick={onClose}>✕</button>
        </div>
        <p className="owner-sub">للمالك فقط — رصيد ألماس وكوينز لانهائي</p>
        <input
          className="pay-input"
          type="password"
          placeholder="كلمة سر المالك"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          autoFocus
        />
        {error && <div className="pay-error">{error}</div>}
        <button className="store-pay" disabled={busy || !key.trim()}>
          {busy ? "جارٍ التحقق..." : "دخول"}
        </button>
      </form>
    </div>
  );
}
