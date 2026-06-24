import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { clans } from "./social.js";

const EMBLEMS = ["🛡️", "🦁", "🐉", "🦅", "⚔️", "👑", "🔥", "🌟"];
const CLAN_COST = 2000; // ألماس — يطابق الخادم

// القبيلة 🏅 — إنشاء/الانضمام للقبائل، أعضاؤها ونقاطها.
export default function TribeModal({ onClose, onRecharge }) {
  const [data, setData] = useState(null);   // { mine, clans }
  const [name, setName] = useState("");
  const [emblem, setEmblem] = useState("🛡️");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = () => clans.list().then(setData).catch(() => {});
  useEffect(() => { load(); }, []);

  async function run(fn) {
    setBusy(true); setErr("");
    try { await fn(); await load(); }
    catch (e) { setErr(e.message || "تعذّرت العملية"); }
    finally { setBusy(false); }
  }

  const mine = data?.mine;

  return (
    <div className="soc-backdrop" onClick={onClose}>
      <motion.div className="soc-sheet" onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
        <header className="soc-head">
          <button className="soc-close" onClick={onClose}>✕</button>
          <h2>🏅 القبيلة</h2>
          {!mine && <button className="soc-head-act" onClick={() => setCreating((v) => !v)}>＋ تأسيس</button>}
        </header>

        <div className="soc-body">
          {err && <div className="soc-alert err">{err}</div>}
          {!data && <div className="soc-empty">جارٍ التحميل…</div>}

          {/* قبيلتي */}
          {mine && (
            <div className="tribe-mine">
              <div className="tribe-emblem">{mine.emblem}</div>
              <div className="tribe-mine-info">
                <b>{mine.name}</b>
                <span className="soc-sub">Lv.{mine.level} · {mine.memberCount} عضو · {mine.points} نقطة · ID {mine.id}</span>
              </div>
              <button className="soc-btn ghost sm" disabled={busy} onClick={() => run(() => clans.leave())}>مغادرة</button>
              <div className="tribe-members">
                {mine.members?.map((m) => (
                  <span key={m.uid} className="tribe-member" title={m.name}>
                    <span className="soc-ava">{m.avatar || "🧑🏻"}</span>
                    <span className="tribe-member-name">{m.name}{m.uid === mine.ownerUid ? " 👑" : ""}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* نموذج التأسيس */}
          {!mine && creating && (
            <div className="tribe-create">
              <div className="tribe-emblem-pick">
                {EMBLEMS.map((e) => (
                  <button key={e} className={`tribe-emblem-opt ${emblem === e ? "on" : ""}`} onClick={() => setEmblem(e)}>{e}</button>
                ))}
              </div>
              <input className="soc-input" placeholder="اسم القبيلة" maxLength={24}
                value={name} onChange={(e) => setName(e.target.value)} />
              <button className="soc-btn ok" disabled={busy || name.trim().length < 2}
                onClick={() => run(() => clans.create(name.trim(), emblem).then(() => { setName(""); setCreating(false); }))
                  .catch(() => {})}>
                تأسيس القبيلة (💎 {CLAN_COST})
              </button>
              <p className="soc-hint">تأسيس القبيلة يكلّف {CLAN_COST} ألماسة. {onRecharge && (
                <button className="soc-link" onClick={() => onRecharge("diamonds")}>اشحن</button>
              )}</p>
            </div>
          )}

          {/* دليل القبائل */}
          <div className="soc-section">
            <h3>أقوى القبائل</h3>
            {data && data.clans.length === 0 && <p className="soc-hint">لا توجد قبائل بعد — كن أول من يؤسّس واحدة!</p>}
            {data?.clans.map((c, i) => (
              <div key={c.id} className="tribe-row">
                <span className="tribe-rank">{i + 1}</span>
                <span className="tribe-emblem sm">{c.emblem}</span>
                <span className="tribe-row-info">
                  <b>{c.name}</b>
                  <span className="soc-sub">Lv.{c.level} · {c.memberCount} عضو · {c.points} نقطة</span>
                </span>
                {!mine && (
                  <button className="soc-btn ok sm" disabled={busy} onClick={() => run(() => clans.join(c.id))}>انضمام</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
