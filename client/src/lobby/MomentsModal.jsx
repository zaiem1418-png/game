import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { moments } from "./social.js";

// اللحظات 🌀 — منشورات اجتماعية قصيرة مع الإعجاب.
export default function MomentsModal({ onClose }) {
  const [list, setList] = useState(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = () => moments.list().then((d) => setList(d.moments)).catch(() => setList([]));
  useEffect(() => { load(); }, []);

  async function post() {
    if (!text.trim()) return;
    setBusy(true); setErr("");
    try { await moments.post(text.trim()); setText(""); await load(); }
    catch (e) { setErr(e.message || "تعذّر النشر"); }
    finally { setBusy(false); }
  }

  // إعجاب متفائل (يحدّث محلياً ثم يزامن مع الخادم)
  async function like(m) {
    setList((l) => l.map((x) => x.id === m.id
      ? { ...x, likedByMe: !x.likedByMe, likeCount: x.likeCount + (x.likedByMe ? -1 : 1) }
      : x));
    try { await moments.like(m.id); } catch { load(); }
  }

  function when(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return "الآن";
    if (s < 3600) return `${Math.floor(s / 60)} د`;
    if (s < 86400) return `${Math.floor(s / 3600)} س`;
    return `${Math.floor(s / 86400)} ي`;
  }

  return (
    <div className="soc-backdrop" onClick={onClose}>
      <motion.div className="soc-sheet" onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
        <header className="soc-head">
          <button className="soc-close" onClick={onClose}>✕</button>
          <h2>🌀 اللحظات</h2>
        </header>

        <div className="soc-body">
          {err && <div className="soc-alert err">{err}</div>}

          <div className="moment-compose">
            <textarea className="moment-input" placeholder="بماذا تفكّر؟ شارك لحظتك…" maxLength={280}
              value={text} onChange={(e) => setText(e.target.value)} rows={2} />
            <button className="soc-btn ok" disabled={busy || !text.trim()} onClick={post}>نشر</button>
          </div>

          {!list && <div className="soc-empty">جارٍ التحميل…</div>}
          {list && list.length === 0 && <p className="soc-hint">لا لحظات بعد — كن أول من يشارك!</p>}

          {list?.map((m) => (
            <div key={m.id} className="moment-card">
              <div className="moment-top">
                <span className="soc-ava">{m.author?.avatar || "🧑🏻"}</span>
                <span className="moment-author">{m.author?.name || "لاعب"}<span className="soc-sub">{when(m.ts)}</span></span>
              </div>
              <p className="moment-text">{m.text}</p>
              <button className={`moment-like ${m.likedByMe ? "on" : ""}`} onClick={() => like(m)}>
                {m.likedByMe ? "❤️" : "🤍"} {m.likeCount || 0}
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
