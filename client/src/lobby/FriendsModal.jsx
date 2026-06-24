import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { friends, getMyShortId } from "./social.js";

// صديق اللعب 👥 — طلبات الصداقة وقائمة الأصدقاء.
export default function FriendsModal({ onClose }) {
  const [st, setSt] = useState(null);
  const [toId, setToId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const myId = getMyShortId();

  const load = () => friends.status().then(setSt).catch(() => {});
  useEffect(() => { load(); }, []);

  async function run(fn, okMsg) {
    setBusy(true); setErr(""); setMsg("");
    try { await fn(); if (okMsg) setMsg(okMsg); await load(); }
    catch (e) { setErr(e.message || "تعذّرت العملية"); }
    finally { setBusy(false); }
  }

  return (
    <div className="soc-backdrop" onClick={onClose}>
      <motion.div className="soc-sheet" onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
        <header className="soc-head">
          <button className="soc-close" onClick={onClose}>✕</button>
          <h2>👥 صديق اللعب</h2>
          <span className="soc-myid">معرّفي: {myId || "…"}</span>
        </header>

        <div className="soc-body">
          {err && <div className="soc-alert err">{err}</div>}
          {msg && <div className="soc-alert ok">{msg}</div>}

          <div className="soc-form">
            <input className="soc-input" placeholder="رقم الصديق (ID)" inputMode="numeric"
              value={toId} onChange={(e) => setToId(e.target.value.replace(/\D/g, ""))} />
            <button className="soc-btn ok" disabled={busy || !toId}
              onClick={() => run(() => friends.request(toId).then(() => setToId("")), "أُرسل طلب الصداقة")}>
              إضافة
            </button>
          </div>

          {!st && <div className="soc-empty">جارٍ التحميل…</div>}

          {st?.incoming?.length > 0 && (
            <div className="soc-section">
              <h3>طلبات واردة</h3>
              {st.incoming.map((r) => (
                <div key={r.id} className="soc-req">
                  <span><span className="soc-ava">{r.from?.avatar || "🧑🏻"}</span> <b>{r.from?.name}</b> ({r.from?.shortId})</span>
                  <div className="soc-req-actions">
                    <button className="soc-btn ok" disabled={busy} onClick={() => run(() => friends.accept(r.id), "تمت الإضافة")}>قبول</button>
                    <button className="soc-btn ghost" disabled={busy} onClick={() => run(() => friends.reject(r.id))}>رفض</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="soc-section">
            <h3>أصدقائي {st?.friends?.length ? `(${st.friends.length})` : ""}</h3>
            {st && st.friends.length === 0 && <p className="soc-hint">لا أصدقاء بعد — شارك معرّفك ({myId || "…"}) أو أضف صديقاً برقمه.</p>}
            {st?.friends.map((f) => (
              <div key={f.uid} className="soc-friend">
                <span className="soc-ava">{f.avatar || "🧑🏻"}</span>
                <span className="soc-friend-name">{f.name}<span className="soc-friend-id">ID {f.shortId}</span></span>
                <button className="soc-btn ghost sm" disabled={busy} onClick={() => run(() => friends.remove(f.uid))}>حذف</button>
              </div>
            ))}
          </div>

          {st?.outgoing?.length > 0 && (
            <div className="soc-section">
              <h3>طلبات أرسلتها</h3>
              {st.outgoing.map((r) => (
                <div key={r.id} className="soc-req">
                  <span>⏳ بانتظار رد <b>{r.to?.name}</b> ({r.to?.shortId})</span>
                  <button className="soc-btn ghost" disabled={busy} onClick={() => run(() => friends.reject(r.id))}>إلغاء</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
