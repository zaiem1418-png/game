import { useMemo } from "react";
import { motion } from "framer-motion";
import { getProfile } from "../wallet.js";
import { SYSTEMS } from "./rankings.js";

const medal = (r) => (r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : null);
const trendIco = (t) => (t === "up" ? "▲" : t === "down" ? "▼" : "–");

function fmt(n) {
  if (n == null) return "";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

// نافذة الترتيب العامّة — تعرض أي نظام من أنظمة الأربعة (SYSTEMS).
// system: مفتاح ("vip" | "popular" | "players" | "ranked") أو كائن نظام.
// rooms: تُمرَّر لأنظمة الغرف (vip/popular).
export default function RankingModal({ system, rooms = [], onClose }) {
  const sys = typeof system === "string" ? SYSTEMS[system] : system;
  const profile = getProfile();

  const data = useMemo(
    () => sys.build({ rooms, name: profile.name, avatar: profile.avatar }),
    [sys, rooms, profile.name, profile.avatar]
  );

  const podium = data.rows.slice(0, 3);
  const rest = data.rows.slice(3);

  return (
    <div className="soc-backdrop" onClick={onClose}>
      <motion.div
        className="soc-sheet rank-sheet"
        style={{ "--rk": sys.accent }}
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
      >
        <header className="soc-head rank-head">
          <button className="soc-close" onClick={onClose}>✕</button>
          <h2>{sys.emoji} {sys.title}</h2>
        </header>

        <div className="soc-body">
          <p className="soc-hint">{sys.blurb}</p>

          {/* درجة التصنيف (نظام ranked فقط) */}
          {data.tier && (
            <div className="rk-tier" style={{ "--tc": data.tier.color }}>
              <span className="rk-tier-ico">{data.tier.icon}</span>
              <div className="rk-tier-info">
                <b>درجتك: {data.tier.name}</b>
                <span className="soc-sub">
                  {data.next
                    ? `${fmt(data.me.value)} / ${fmt(data.next.min)} للترقية إلى ${data.next.name}`
                    : "أعلى درجة — أنت في القمّة!"}
                </span>
                <div className="rk-bar">
                  <span className="rk-bar-fill" style={{ width: `${Math.round(data.progress * 100)}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* منصّة التتويج (أول 3) */}
          <div className="rk-podium">
            {[1, 0, 2].map((slot) => {
              const row = podium[slot];
              if (!row) return <div key={slot} className="rk-pod rk-pod-empty" />;
              const rank = slot + 1;
              return (
                <motion.div
                  key={row.id}
                  className={`rk-pod rk-pod-${rank} ${row.isMe ? "mine" : ""}`}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * rank }}
                >
                  <span className="rk-pod-medal">{medal(rank)}</span>
                  <span className="rk-pod-ava">
                    {data.kind === "room" ? (
                      <span className="rk-cover" style={{ background: `linear-gradient(135deg, ${row.cover}, #15101f)` }} />
                    ) : (
                      row.avatar
                    )}
                  </span>
                  <span className="rk-pod-name">{row.name}</span>
                  <span className="rk-pod-val">{fmt(row.value)}</span>
                </motion.div>
              );
            })}
          </div>

          {/* بطاقة "أنا" للأنظمة التي تتضمّن المستخدم */}
          {data.me && (
            <div className="rk-me" style={{ "--rk": sys.accent }}>
              <span className="rk-me-rank">#{data.me.rank}</span>
              <span className="soc-ava">{data.me.avatar}</span>
              <span className="rk-me-info">
                <b>{data.me.name}</b>
                <span className="soc-sub">رتبتك الحالية</span>
              </span>
              <span className="rk-me-val">{fmt(data.me.value)} <small>{sys.unit}</small></span>
            </div>
          )}

          {/* بقيّة القائمة */}
          <div className="soc-section">
            <h3>الترتيب الكامل</h3>
            {rest.map((row, i) => {
              const rank = i + 4;
              return (
                <div key={row.id} className={`rk-row ${row.isMe ? "mine" : ""}`}>
                  <span className="rk-rank">{rank}</span>
                  <span className="rk-ava">
                    {data.kind === "room" ? (
                      <span className="rk-cover sm" style={{ background: `linear-gradient(135deg, ${row.cover}, #15101f)` }}>
                        {row.flag}
                      </span>
                    ) : (
                      <span className="soc-ava">{row.avatar}</span>
                    )}
                  </span>
                  <span className="rk-row-info">
                    <b>{row.name} {row.flag && data.kind === "player" ? <span className="rk-flag">{row.flag}</span> : null}</b>
                    <span className="soc-sub">
                      {row.vip != null && `VIP ${row.vip} · `}
                      {row.live != null && `${fmt(row.live)} الآن · `}
                      {fmt(row.value)} {sys.unit}
                    </span>
                  </span>
                  {row.trend && <span className={`rk-trend ${row.trend}`}>{trendIco(row.trend)}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
