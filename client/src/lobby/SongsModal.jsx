import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { songs } from "./profile.js";

// مساهمة الأغاني 🎵 — اقترح أغنية تُضاف لمكتبة الغرف الصوتية وصوّت للأكثر طلباً.
export default function SongsModal({ onClose }) {
  const [list, setList] = useState(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => songs.list().then((d) => setList(d.songs || [])).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  async function submit() {
    setBusy(true); setErr(""); setMsg("");
    try {
      const r = await songs.add(title, artist);
      setList(r.songs || []);
      setTitle(""); setArtist("");
      setMsg("✅ شكراً! أُضيفت أغنيتك لقائمة المساهمات");
    } catch (e) { setErr(e.message || "تعذّرت الإضافة"); }
    finally { setBusy(false); }
  }

  async function toggleVote(id) {
    try { await songs.vote(id); await load(); } catch (e) { setErr(e.message); }
  }

  return (
    <div className="soc-backdrop" onClick={onClose}>
      <motion.div className="soc-sheet" onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
        <header className="soc-head">
          <button className="soc-close" onClick={onClose}>✕</button>
          <h2>🎵 مساهمة الأغاني</h2>
        </header>
        <div className="soc-body">
          {err && <div className="soc-alert err">{err}</div>}
          {msg && <div className="soc-alert ok">{msg}</div>}

          <div className="soc-section">
            <h3>اقترح أغنية</h3>
            <input className="soc-input" placeholder="اسم الأغنية" maxLength={80}
              value={title} onChange={(e) => setTitle(e.target.value)} style={{ marginBottom: 8, width: "100%" }} />
            <div className="soc-form">
              <input className="soc-input" placeholder="الفنان (اختياري)" maxLength={60}
                value={artist} onChange={(e) => setArtist(e.target.value)} />
              <button className="soc-btn ok" disabled={busy || !title.trim()} onClick={submit}>إضافة</button>
            </div>
          </div>

          <div className="soc-section">
            <h3>الأكثر طلباً {list?.length ? `(${list.length})` : ""}</h3>
            {!list && <div className="soc-empty">جارٍ التحميل…</div>}
            {list && list.length === 0 && <p className="soc-hint">لا اقتراحات بعد — كن أول من يساهم 🎶</p>}
            {list?.map((s) => (
              <div key={s.id} className="soc-friend">
                <span className="soc-ava">🎵</span>
                <span className="soc-friend-name">
                  {s.title}
                  <span className="soc-friend-id">{s.artist || "—"}{s.mine ? " · أنت" : ""}</span>
                </span>
                <button className={`soc-btn sm ${s.votedByMe ? "ok" : "ghost"}`} onClick={() => toggleVote(s.id)}>
                  ▲ {s.votes}
                </button>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
