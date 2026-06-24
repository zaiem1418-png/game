import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { marriage, getMyShortId } from "./social.js";

// المحكمة 🏛️ — نظام الزواج والطلاق:
//  • طلب زواج: أدخل رقم الطرف الآخر القصير ثم أرسِل؛ بقبوله تصبحان متزوجَين.
//  • طلاق إجباري (خلع): يفسخ الزواج فوراً.
//  • طلاق بالتراضي: يُرسل طلب للشريك، ولا يقع إلا بقبوله.
export default function CourtModal({ onClose }) {
  const [st, setSt] = useState(null);      // حالة المحكمة من الخادم
  const [partnerId, setPartnerId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [confirmKhul, setConfirmKhul] = useState(false); // تأكيد الخلع الفوري
  const myId = getMyShortId();

  const load = () => marriage.status().then(setSt).catch(() => {});
  useEffect(() => { load(); }, []);

  // غلاف موحّد لتنفيذ عملية ثم إعادة تحميل الحالة وإظهار رسالة
  async function run(fn, okMsg) {
    setBusy(true); setErr(""); setMsg("");
    try {
      await fn();
      if (okMsg) setMsg(okMsg);
      await load();
    } catch (e) {
      setErr(e.message || "تعذّرت العملية");
    } finally {
      setBusy(false);
    }
  }

  const married = !!st?.partner;
  const divIncoming = st?.divorceIncoming?.[0] || null; // طلب طلاق وارد من الشريك
  const divOutgoing = st?.divorceOutgoing?.[0] || null; // طلب طلاق أرسلته أنا

  return (
    <div className="soc-backdrop" onClick={onClose}>
      <motion.div
        className="soc-sheet court"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
      >
        <header className="soc-head">
          <button className="soc-close" onClick={onClose}>✕</button>
          <h2>🏛️ المحكمة</h2>
          <span className="soc-myid">معرّفي: {myId || "…"}</span>
        </header>

        <div className="soc-body">
          {err && <div className="soc-alert err">{err}</div>}
          {msg && <div className="soc-alert ok">{msg}</div>}

          {!st && <div className="soc-empty">جارٍ التحميل…</div>}

          {/* ===== متزوّج ===== */}
          {st && married && (
            <>
              <div className="court-couple">
                <div className="court-ava">{st.me?.avatar || "🧑🏻"}</div>
                <div className="court-heart">💞</div>
                <div className="court-ava">{st.partner.avatar || "🧑🏻"}</div>
              </div>
              <div className="court-status">
                متزوّج من <b>{st.partner.name}</b>
                <span className="court-sub">معرّفه: {st.partner.shortId}</span>
                {st.since && (
                  <span className="court-sub">منذ {new Date(st.since).toLocaleDateString("ar")}</span>
                )}
              </div>

              {/* طلب طلاق وارد من الشريك (بالتراضي) */}
              {divIncoming && (
                <div className="soc-req hot">
                  <span>💔 طلب شريكك الطلاق بالتراضي</span>
                  <div className="soc-req-actions">
                    <button className="soc-btn ok" disabled={busy}
                      onClick={() => run(() => marriage.acceptDivorce(divIncoming.id), "تم الطلاق بالتراضي")}>
                      موافقة وطلاق
                    </button>
                    <button className="soc-btn ghost" disabled={busy}
                      onClick={() => run(() => marriage.rejectDivorce(divIncoming.id), "رفضت الطلب")}>
                      رفض
                    </button>
                  </div>
                </div>
              )}

              {/* طلب طلاق أرسلته أنا (بانتظار الموافقة) */}
              {divOutgoing && !divIncoming && (
                <div className="soc-req">
                  ⏳ أرسلت طلب طلاق بالتراضي — بانتظار موافقة الشريك
                </div>
              )}

              {/* أزرار الطلاق */}
              {!confirmKhul ? (
                <div className="court-divorce">
                  {!divOutgoing && (
                    <button className="soc-btn warn" disabled={busy}
                      onClick={() => run(() => marriage.proposeDivorce(), "أُرسل طلب الطلاق بالتراضي")}>
                      💌 طلب طلاق بالتراضي
                    </button>
                  )}
                  <button className="soc-btn danger" disabled={busy}
                    onClick={() => setConfirmKhul(true)}>
                    ⚡ طلاق إجباري (خلع فوري)
                  </button>
                </div>
              ) : (
                <div className="court-confirm">
                  <p>الخلع يفسخ الزواج فوراً دون موافقة الشريك. متأكد؟</p>
                  <div className="soc-req-actions">
                    <button className="soc-btn danger" disabled={busy}
                      onClick={() => run(() => marriage.forceDivorce(), "تم الطلاق (خلع)").then(() => setConfirmKhul(false))}>
                      نعم، خلع فوري
                    </button>
                    <button className="soc-btn ghost" disabled={busy} onClick={() => setConfirmKhul(false)}>
                      تراجع
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ===== أعزب ===== */}
          {st && !married && (
            <>
              <div className="court-single">💍 اطلب الزواج</div>
              <div className="soc-form">
                <input
                  className="soc-input"
                  placeholder="رقم الطرف الآخر (ID)"
                  inputMode="numeric"
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value.replace(/\D/g, ""))}
                />
                <button className="soc-btn ok" disabled={busy || !partnerId}
                  onClick={() => run(() => marriage.propose(partnerId).then(() => setPartnerId("")), "أُرسل طلب الزواج 💍")}>
                  اطلب الزواج
                </button>
              </div>

              {/* طلبات زواج واردة */}
              {st.incoming?.length > 0 && (
                <div className="soc-section">
                  <h3>طلبات زواج واردة</h3>
                  {st.incoming.map((r) => (
                    <div key={r.id} className="soc-req">
                      <span>💌 <b>{r.from?.name || "لاعب"}</b> ({r.from?.shortId}) يطلب الزواج منك</span>
                      <div className="soc-req-actions">
                        <button className="soc-btn ok" disabled={busy}
                          onClick={() => run(() => marriage.accept(r.id), "مبارك الزواج 💑")}>
                          قبول
                        </button>
                        <button className="soc-btn ghost" disabled={busy}
                          onClick={() => run(() => marriage.reject(r.id))}>
                          رفض
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* طلبات أرسلتها */}
              {st.outgoing?.length > 0 && (
                <div className="soc-section">
                  <h3>طلبات أرسلتها</h3>
                  {st.outgoing.map((r) => (
                    <div key={r.id} className="soc-req">
                      <span>⏳ بانتظار رد <b>{r.to?.name || "لاعب"}</b> ({r.to?.shortId})</span>
                      <button className="soc-btn ghost" disabled={busy}
                        onClick={() => run(() => marriage.reject(r.id))}>
                        إلغاء
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!st.incoming?.length && !st.outgoing?.length && (
                <p className="soc-hint">شارك معرّفك ({myId || "…"}) مع من تريد الزواج منه، أو أدخل معرّفه أعلاه.</p>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
