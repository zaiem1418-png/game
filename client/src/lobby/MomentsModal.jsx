import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { moments } from "./social.js";

// الحدود القصوى لحجم الملف قبل الترميز (الخادم يقبل ما يعادلها بعد base64)
const MAX_IMAGE = 3 * 1024 * 1024; // 3MB
const MAX_VIDEO = 8 * 1024 * 1024; // 8MB

// اللحظات 🌀 — منشورات اجتماعية قصيرة بالنصّ والصور والفيديو مع الإعجاب.
export default function MomentsModal({ onClose }) {
  const [list, setList] = useState(null);
  const [text, setText] = useState("");
  const [media, setMedia] = useState(null); // { type:"image"|"video", data:dataURL }
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef(null);

  const load = () => moments.list().then((d) => setList(d.moments)).catch(() => setList([]));
  useEffect(() => { load(); }, []);

  function pick(kind) {
    setErr("");
    if (fileRef.current) {
      fileRef.current.accept = kind === "video" ? "video/*" : "image/*";
      fileRef.current.click();
    }
  }

  function onFile(e) {
    const f = e.target.files?.[0];
    e.target.value = ""; // اسمح بإعادة اختيار نفس الملف لاحقاً
    if (!f) return;
    const isVideo = f.type.startsWith("video/");
    const isImage = f.type.startsWith("image/");
    if (!isVideo && !isImage) { setErr("اختر صورة أو فيديو فقط"); return; }
    const max = isVideo ? MAX_VIDEO : MAX_IMAGE;
    if (f.size > max) { setErr(`الحجم كبير — الحدّ ${isVideo ? "8" : "3"}MB`); return; }
    const reader = new FileReader();
    reader.onload = () => setMedia({ type: isVideo ? "video" : "image", data: String(reader.result) });
    reader.onerror = () => setErr("تعذّرت قراءة الملف");
    reader.readAsDataURL(f);
  }

  async function post() {
    if (!text.trim() && !media) return;
    setBusy(true); setErr("");
    try {
      await moments.post(text.trim(), media);
      setText(""); setMedia(null);
      await load();
    } catch (e) { setErr(e.message || "تعذّر النشر"); }
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

            {media && (
              <div className="moment-preview">
                {media.type === "video"
                  ? <video className="moment-preview-media" src={media.data} controls playsInline />
                  : <img className="moment-preview-media" src={media.data} alt="معاينة" />}
                <button className="moment-preview-x" onClick={() => setMedia(null)}>✕</button>
              </div>
            )}

            <input ref={fileRef} type="file" hidden onChange={onFile} />
            <div className="moment-actions">
              <button className="moment-attach" onClick={() => pick("image")}>🖼️ صورة</button>
              <button className="moment-attach" onClick={() => pick("video")}>🎬 فيديو</button>
              <button className="soc-btn ok" disabled={busy || (!text.trim() && !media)} onClick={post}>
                {busy ? "…" : "نشر"}
              </button>
            </div>
          </div>

          {!list && <div className="soc-empty">جارٍ التحميل…</div>}
          {list && list.length === 0 && <p className="soc-hint">لا لحظات بعد — كن أول من يشارك!</p>}

          {list?.map((m) => (
            <div key={m.id} className="moment-card">
              <div className="moment-top">
                <span className="soc-ava">{m.author?.avatar || "🧑🏻"}</span>
                <span className="moment-author">{m.author?.name || "لاعب"}<span className="soc-sub">{when(m.ts)}</span></span>
              </div>
              {m.text && <p className="moment-text">{m.text}</p>}
              {m.media && (
                <div className="moment-media">
                  {m.media.type === "video"
                    ? <video className="moment-media-el" src={m.media.data} controls playsInline preload="metadata" />
                    : <img className="moment-media-el" src={m.media.data} alt="" loading="lazy" />}
                </div>
              )}
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
