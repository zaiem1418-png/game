import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { competitions } from "./competitions.js";

// عدّاد حيّ (مللي ثانية → نص) يتناقص كل ثانية. يُعاد ضبطه عند تغيّر الهدف.
function useTicker(targetMs) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return Math.max(0, targetMs - now);
}

// تنسيق المدّة المتبقّية للموسم (Nي Nس) أو (Nس Nد)
function fmtLeft(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}ي ${h}س`;
  if (h > 0) return `${h}س ${m}د`;
  return `${m}د ${s % 60}ث`;
}

const medal = (rank) => (rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null);

// المنافسات 🏆 — لوحتا صدارة موسميّتان: الأفراد والقبائل.
export default function CompetitionsModal({ onClose }) {
  const [tab, setTab] = useState("players"); // players | tribes
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [pop, setPop] = useState(null); // آخر مكافأة مباراة (للنبضة)
  const playEndsRef = useRef(0);        // لحظة انتهاء مهلة المباراة

  const load = () => competitions.overview().then(setData).catch((e) => setErr(e.message || ""));
  useEffect(() => { load(); }, []);

  // مزامنة هدف المهلة مع الخادم عند كل تحميل
  useEffect(() => {
    if (data?.me) playEndsRef.current = Date.now() + (data.me.cooldownLeft || 0);
  }, [data]);

  const seasonLeft = useTicker(data?.endsAt || 0);
  const cooldownLeft = useTicker(playEndsRef.current);

  async function play() {
    setBusy(true); setErr("");
    try {
      const r = await competitions.play();
      setData(r.overview);
      setPop({ gained: r.gained, won: r.won });
      setTimeout(() => setPop(null), 1800);
    } catch (e) {
      setErr(e.message || "تعذّرت المباراة");
    } finally {
      setBusy(false);
    }
  }

  const me = data?.me;
  const canPlay = !busy && cooldownLeft <= 0;

  return (
    <div className="soc-backdrop" onClick={onClose}>
      <motion.div className="soc-sheet" onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
        <header className="soc-head">
          <button className="soc-close" onClick={onClose}>✕</button>
          <h2>🏆 المنافسات</h2>
          {data && <span className="soc-myid">⏳ {fmtLeft(seasonLeft)}</span>}
        </header>

        {/* مبدّل التبويبات */}
        <div className="comp-tabs">
          <button className={`comp-tab ${tab === "players" ? "on" : ""}`} onClick={() => setTab("players")}>
            👤 منافسة الأفراد
          </button>
          <button className={`comp-tab ${tab === "tribes" ? "on" : ""}`} onClick={() => setTab("tribes")}>
            🛡️ منافسة القبائل
          </button>
        </div>

        <div className="soc-body">
          {err && <div className="soc-alert err">{err}</div>}
          {!data && <div className="soc-empty">جارٍ التحميل…</div>}

          {/* ===== منافسة الأفراد ===== */}
          {data && tab === "players" && (
            <>
              <p className="soc-hint">اخض المباريات واجمع النقاط — يتجدّد الموسم كل أسبوع.</p>

              {/* بطاقتي + زر المباراة */}
              {me && (
                <div className="comp-me">
                  <div className="comp-me-stats">
                    <span className="comp-me-rank">{me.rank ? `#${me.rank}` : "—"}</span>
                    <span className="soc-sub">
                      {me.points} نقطة · {me.wins} فوز / {me.matches} مباراة
                    </span>
                  </div>
                  <button className="soc-btn ok" disabled={!canPlay} onClick={play}>
                    {busy ? "…" : cooldownLeft > 0 ? `⏳ ${fmtLeft(cooldownLeft)}` : "⚔️ خض مباراة"}
                  </button>
                  {pop && (
                    <motion.span className={`comp-pop ${pop.won ? "win" : "lose"}`}
                      initial={{ opacity: 0, y: 0, scale: 0.6 }}
                      animate={{ opacity: 1, y: -30, scale: 1 }} exit={{ opacity: 0 }}>
                      {pop.won ? "🏆 فوز " : ""}+{pop.gained}
                    </motion.span>
                  )}
                </div>
              )}

              <div className="soc-section">
                <h3>أبطال الأسبوع</h3>
                {data.players.length === 0 && <p className="soc-hint">لا منافسين بعد — كن أول من يبدأ!</p>}
                {data.players.map((p, i) => (
                  <div key={p.uid} className={`comp-row ${me && me.rank === i + 1 ? "mine" : ""}`}>
                    <span className="comp-rank">{medal(i + 1) || i + 1}</span>
                    <span className="soc-ava">{p.avatar}</span>
                    <span className="comp-row-info">
                      <b>{p.name}</b>
                      <span className="soc-sub">{p.wins} فوز / {p.matches} مباراة</span>
                    </span>
                    <span className="comp-pts">{p.points}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ===== منافسة القبائل ===== */}
          {data && tab === "tribes" && (
            <>
              <p className="soc-hint">
                ترتيب القبائل بمجموع نقاط أعضائها. نقاطك تُضاف لقبيلتك تلقائياً.
              </p>

              {me && !me.clanId && (
                <div className="soc-alert ok">
                  لست في قبيلة — انضم لواحدة من تبويب «الرسائل ← القبيلة» لتنافس باسمها.
                </div>
              )}
              {me && me.clanId && (
                <div className="comp-me">
                  <div className="comp-me-stats">
                    <span className="comp-me-rank">{me.tribeRank ? `#${me.tribeRank}` : "—"}</span>
                    <span className="soc-sub">ترتيب قبيلتك هذا الأسبوع</span>
                  </div>
                </div>
              )}

              <div className="soc-section">
                <h3>أقوى القبائل</h3>
                {data.tribes.length === 0 && <p className="soc-hint">لا توجد قبائل بعد.</p>}
                {data.tribes.map((c, i) => (
                  <div key={c.id} className={`comp-row ${me && c.id === me.clanId ? "mine" : ""}`}>
                    <span className="comp-rank">{medal(i + 1) || i + 1}</span>
                    <span className="tribe-emblem sm">{c.emblem}</span>
                    <span className="comp-row-info">
                      <b>{c.name}</b>
                      <span className="soc-sub">{c.memberCount} عضو</span>
                    </span>
                    <span className="comp-pts">{c.points}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
