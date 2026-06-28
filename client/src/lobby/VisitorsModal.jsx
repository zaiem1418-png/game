import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { visitors, guestbook } from "./profile.js";

// الزوّار 🔷 — من بحث عن معرّفك ودخل ملفك (الأحدث أولاً).
// القائمة مقفلة حتى يشتري المستخدم «دفتر الزوّار» (1000 ماسة/شهر). قبل الشراء
// تظهر شاشة فتح الدفتر بدل القائمة، ولا تُكشف أي بيانات للزوّار.
export default function VisitorsModal({ wallet, onWalletUpdate, onRecharge, onClose }) {
  const [list, setList] = useState(null);
  const [locked, setLocked] = useState(false);
  const [gb, setGb] = useState(null);   // حالة دفتر الزوّار { active, daysLeft, price }
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = () =>
    visitors.list()
      .then((d) => {
        setLocked(!!d.locked);
        setGb(d.guestbook || null);
        setList(d.visitors || []);
      })
      .catch((e) => setErr(e.message));

  useEffect(() => { load(); }, []);

  async function unlock() {
    setBusy(true); setErr("");
    try {
      const r = await guestbook.buy();
      onWalletUpdate?.(r.wallet);
      await load();
    } catch (e) {
      setErr(e.message || "تعذّر الشراء");
      if (/ألماس/.test(e.message || "")) onRecharge?.("diamonds");
    } finally { setBusy(false); }
  }

  const ago = (ts) => {
    const m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return "الآن";
    if (m < 60) return `قبل ${m} د`;
    const h = Math.floor(m / 60);
    if (h < 24) return `قبل ${h} س`;
    return `قبل ${Math.floor(h / 24)} ي`;
  };

  const price = gb?.price ?? 1000;

  return (
    <div className="soc-backdrop" onClick={onClose}>
      <motion.div className="soc-sheet" onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
        <header className="soc-head">
          <button className="soc-close" onClick={onClose}>✕</button>
          <h2>📒 الزوّار</h2>
          {gb?.active && gb.daysLeft != null && (
            <span className="soc-myid">باقٍ {gb.daysLeft} يوم</span>
          )}
        </header>
        <div className="soc-body">
          {err && <div className="soc-alert err">{err}</div>}
          {!list && !err && <div className="soc-empty">جارٍ التحميل…</div>}

          {/* مقفل: اعرض شاشة فتح دفتر الزوّار */}
          {list && locked && (
            <div className="gb-lock">
              <span className="gb-lock-ico">📒🔒</span>
              <h3 className="gb-lock-title">دفتر الزوّار مقفل</h3>
              <p className="gb-lock-desc">
                اشترِ دفتر الزوّار لتكشف عن كل من زار ملفك الشخصي. الاشتراك شهري
                ({price.toLocaleString("en-US")} ماسة) ويتجدّد بإرادتك.
              </p>
              <button className="soc-btn ok gb-buy" disabled={busy} onClick={unlock}>
                {busy ? "جارٍ الشراء…" : `💎 ${price.toLocaleString("en-US")} — افتح الدفتر`}
              </button>
            </div>
          )}

          {/* مفتوح: اعرض قائمة الزوّار */}
          {list && !locked && list.length === 0 && (
            <p className="soc-hint">لا زوّار بعد — شارك معرّفك مع أصدقائك ليزوروا ملفك ويظهروا هنا.</p>
          )}
          {list && !locked && list.map((v) => (
            <div key={v.uid} className="soc-friend">
              <span className="soc-ava">{v.avatar || "🧑🏻"}</span>
              <span className="soc-friend-name">
                {v.name}{v.vip && <span className="vip-badge sm">VIP</span>}
                <span className="soc-friend-id">ID {v.shortId}</span>
              </span>
              <span className="soc-friend-id">{ago(v.ts)}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
