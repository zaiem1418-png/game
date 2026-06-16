import { useState, useMemo } from "react";
import { motion } from "framer-motion";

// ===== هندسة مسار جاكارو (حلقة مربّعة 64 خانة) =====
const LOOP = 64;
const SEG = 16;
const HOME_FIRST = 65;

// موضع خانة على محيط المربّع (نسبة مئوية)
function perimeter(i) {
  const side = Math.floor(i / SEG); // 0 أعلى، 1 يمين، 2 أسفل، 3 يسار
  const t = (i % SEG) / SEG; // 0..1 على طول الضلع
  const lo = 7, hi = 93, span = hi - lo;
  switch (side) {
    case 0: return { x: lo + t * span, y: lo }; // أعلى ←→
    case 1: return { x: hi, y: lo + t * span }; // يمين ↓
    case 2: return { x: hi - t * span, y: hi }; // أسفل →←
    default: return { x: lo, y: hi - t * span }; // يسار ↑
  }
}

// نقطة البداية لكل لاعب على المحيط
const START_INDEX = [0, 16, 32, 48];
// زاوية كل لاعب (للبيت/القاعدة) ولون
const CORNERS = [
  { x: 7, y: 7 }, // 0 أعلى-يسار
  { x: 93, y: 7 }, // 1 أعلى-يمين
  { x: 93, y: 93 }, // 2 أسفل-يمين
  { x: 7, y: 93 }, // 3 أسفل-يسار
];

// خانات بيت النهاية (4) تتجه للداخل من زاوية اللاعب نحو المركز
function homeCells(seat) {
  const c = CORNERS[seat];
  const cx = 50, cy = 50;
  return [0.22, 0.36, 0.5, 0.64].map((f) => ({ x: c.x + (cx - c.x) * f, y: c.y + (cy - c.y) * f }));
}
// مواضع البيادق في القاعدة (داخل الزاوية)
function yardSlots(seat) {
  const c = CORNERS[seat];
  const dx = c.x < 50 ? 1 : -1;
  const dy = c.y < 50 ? 1 : -1;
  return [
    { x: c.x + dx * 2, y: c.y + dy * 2 },
    { x: c.x + dx * 7, y: c.y + dy * 2 },
    { x: c.x + dx * 2, y: c.y + dy * 7 },
    { x: c.x + dx * 7, y: c.y + dy * 7 },
  ];
}

function marblePos(seat, step, mi) {
  if (step === 0) return yardSlots(seat)[mi];
  if (step >= 1 && step <= LOOP) return perimeter((START_INDEX[seat] + step - 1) % LOOP);
  return homeCells(seat)[step - HOME_FIRST];
}

const SUIT_COLOR = { "♥": "#e3405a", "♦": "#e3405a", "♠": "#1b2440", "♣": "#1b2440", "🃏": "#7a3aa6" };

export default function JackarooBoard({ game, you, action, onExit }) {
  const st = game?.state;
  const [selCard, setSelCard] = useState(null);
  if (!st) return <div className="grm-loading">جاري التحميل…</div>;

  const players = st.players;
  const me = players.find((p) => p.id === you);
  const myTurn = game.turn === you && st.phase === "play";
  const turnPlayer = players.find((p) => p.id === game.turn);
  const legal = st.myLegal || [];
  const mustDiscard = myTurn && legal.length === 0 && (me?.hand?.length || 0) > 0;

  // الخانات الثابتة للمسار (تُحسب مرّة)
  const ring = useMemo(() => Array.from({ length: LOOP }, (_, i) => ({ i, ...perimeter(i) })), []);

  // البيادق القابلة للتحريك بالورقة المختارة
  const movableMarbles = useMemo(() => {
    if (selCard == null) return [];
    return legal.filter((m) => m.card === selCard).map((m) => m.marble);
  }, [selCard, legal]);

  function onMarbleClick(p, mi) {
    if (!myTurn || selCard == null || p.id !== you) return;
    if (!movableMarbles.includes(mi)) return;
    action({ type: "play", card: selCard, marble: mi });
    setSelCard(null);
  }

  function onCardClick(ci) {
    if (!myTurn) return;
    if (mustDiscard) {
      action({ type: "discard", card: ci });
      setSelCard(null);
      return;
    }
    // اختر فقط الأوراق التي لها حركة
    const hasMove = legal.some((m) => m.card === ci);
    if (!hasMove) return;
    setSelCard((c) => (c === ci ? null : ci));
  }

  const ev = st.lastEvent;

  return (
    <div className="jak">
      {/* شريط اللاعبين (فريقان) */}
      <div className="jak-players">
        {players.map((p) => (
          <div
            key={p.id}
            className={`jak-pl ${game.turn === p.id ? "active" : ""}`}
            style={{ "--c": p.color }}
          >
            <span className="snl-pl-av">{p.avatar}</span>
            <span className="snl-pl-name">
              {p.name}{p.id === you ? " (أنت)" : ""} <i className={`jak-team t${p.team}`}>ف{p.team + 1}</i>
            </span>
            <span className="snl-pl-pos">🏠{p.homeCount}/4 · 🂠{p.handCount ?? p.hand?.length ?? 0}</span>
          </div>
        ))}
      </div>

      {/* اللوحة */}
      <div className="jak-board">
        {/* قواعد ملوّنة بالزوايا */}
        {CORNERS.map((c, seat) => (
          <div
            key={seat}
            className="jak-base"
            style={{
              left: `${c.x}%`, top: `${c.y}%`,
              background: hexA(players[seat]?.color || "#555", 0.16),
              borderColor: players[seat]?.color || "#555",
            }}
          />
        ))}

        {/* خانات المسار */}
        {ring.map((cell) => {
          const startSeat = START_INDEX.indexOf(cell.i);
          return (
            <span
              key={cell.i}
              className="jak-cell"
              style={{
                left: `${cell.x}%`, top: `${cell.y}%`,
                ...(startSeat >= 0 ? { background: players[startSeat]?.color, borderColor: "#fff" } : {}),
              }}
            />
          );
        })}

        {/* خانات بيوت النهاية */}
        {players.map((p) =>
          homeCells(p.seat).map((h, k) => (
            <span
              key={`h${p.seat}-${k}`}
              className="jak-cell home"
              style={{ left: `${h.x}%`, top: `${h.y}%`, background: hexA(p.color, 0.5) }}
            />
          ))
        )}

        {/* المركز */}
        <div className="jak-center">🏁</div>

        {/* البيادق */}
        {players.map((p) =>
          p.marbles.map((step, mi) => {
            const pos = marblePos(p.seat, step, mi);
            const movable = myTurn && p.id === you && movableMarbles.includes(mi);
            return (
              <motion.button
                key={`${p.id}-${mi}`}
                className={`jak-marble ${movable ? "movable" : ""}`}
                style={{ background: p.color }}
                animate={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                transition={{ type: "spring", stiffness: 240, damping: 26 }}
                disabled={!movable}
                onClick={() => onMarbleClick(p, mi)}
              />
            );
          })
        )}
      </div>

      {/* حالة الدور */}
      <div className="jak-turn">
        {st.phase === "over"
          ? null
          : myTurn
            ? mustDiscard
              ? "لا حركة متاحة — اختر ورقة للتخلّص منها"
              : selCard == null
                ? "دورك — اختر ورقة"
                : "اختر بيدقاً متوهّجاً لتحريكه"
            : `دور ${turnPlayer?.name || "…"}`}
        {ev && ev.type === "capture" && <span className="jak-ev"> 💥 أكل!</span>}
        {ev && ev.type === "home" && <span className="jak-ev"> 🏁 بيدق وصل!</span>}
      </div>

      {/* اليد + النهاية */}
      {st.phase === "over" ? (
        <JakOver st={st} you={you} onExit={onExit} />
      ) : (
        <div className="jak-hand">
          {(me?.hand || []).map((card, ci) => {
            const playable = myTurn && (mustDiscard || legal.some((m) => m.card === ci));
            return (
              <motion.button
                key={card.id}
                className={`jak-card ${selCard === ci ? "sel" : ""} ${playable ? "" : "dim"}`}
                style={{ color: SUIT_COLOR[card.suit] || "#1b2440" }}
                whileTap={{ scale: 0.94 }}
                animate={{ y: selCard === ci ? -10 : 0 }}
                onClick={() => onCardClick(ci)}
              >
                <b>{card.rank}</b>
                <span>{card.suit}</span>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function hexA(hex, a) {
  const m = (hex || "#555555").replace("#", "");
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function JakOver({ st, you, onExit }) {
  const me = st.players.find((p) => p.id === you);
  const won = me && me.team === st.winnerTeam;
  return (
    <div className="snl-over">
      <h3>{won ? "🎉 فاز فريقك!" : `فاز الفريق ${st.winnerTeam + 1}`}</h3>
      <p>الفريق الفائز: {st.players.filter((p) => p.team === st.winnerTeam).map((p) => p.name).join(" + ")}</p>
      <button className="grm-start" onClick={onExit}>رجوع للقائمة</button>
    </div>
  );
}
