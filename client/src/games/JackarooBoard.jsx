import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";

// ===== هندسة مسار جاكارو (لوحة على شكل صليب/زائد، 64 خانة حول المحيط) =====
const LOOP = 64;
const HOME_FIRST = 65;

// رؤوس مضلّع الصليب (٪) — حافة خارجية 7/93، تجويف داخلي 35/65
const OUT_LO = 7, OUT_HI = 93, IN_LO = 35, IN_HI = 65;
const CROSS = [
  [IN_LO, OUT_LO], [IN_HI, OUT_LO], // حافّة ذراع أعلى
  [IN_HI, IN_LO], [OUT_HI, IN_LO], // الانتقال لذراع اليمين
  [OUT_HI, IN_HI], [IN_HI, IN_HI], // حافّة ذراع اليمين
  [IN_HI, OUT_HI], [IN_LO, OUT_HI], // ذراع أسفل
  [IN_LO, IN_HI], [OUT_LO, IN_HI], // الانتقال لذراع اليسار
  [OUT_LO, IN_LO], [IN_LO, IN_LO], // حافّة ذراع اليسار + إغلاق
];

// أطوال الأضلاع التراكمية على محيط الصليب
const SEGLEN = [];
const CUM = [0];
for (let k = 0; k < CROSS.length; k++) {
  const a = CROSS[k], b = CROSS[(k + 1) % CROSS.length];
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
  SEGLEN.push(d);
  CUM.push(CUM[k] + d);
}
const PERIM = CUM[CUM.length - 1];

// موضع خانة رقم i (0..63) موزّعة بالتساوي حول محيط الصليب
function perimeter(i) {
  const target = ((i % LOOP) / LOOP) * PERIM;
  for (let k = 0; k < CROSS.length; k++) {
    if (target <= CUM[k + 1] || k === CROSS.length - 1) {
      const a = CROSS[k], b = CROSS[(k + 1) % CROSS.length];
      const t = SEGLEN[k] ? (target - CUM[k]) / SEGLEN[k] : 0;
      return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t };
    }
  }
  return { x: 50, y: 50 };
}

// بداية كل لاعب تقع على رأس ذراعه (0=أعلى، 16=يمين، 32=أسفل، 48=يسار)
const START_INDEX = [0, 16, 32, 48];

// قواعد (بيوت) اللاعبين في الزوايا القُطرية بجوار مقاعدهم
const CORNERS = [
  { x: 16, y: 16 }, // 0 أعلى-يسار
  { x: 84, y: 16 }, // 1 أعلى-يمين
  { x: 84, y: 84 }, // 2 أسفل-يمين
  { x: 16, y: 84 }, // 3 أسفل-يسار
];

// ممرّات بيت النهاية: خط ملوّن داخل ذراع كل لاعب يتجه للمركز
const HOME_LANES = [
  [[50, 17], [50, 25], [50, 33], [50, 41]], // 0 ذراع أعلى ↓
  [[83, 50], [75, 50], [67, 50], [59, 50]], // 1 ذراع يمين ←
  [[50, 83], [50, 75], [50, 67], [50, 59]], // 2 ذراع أسفل ↑
  [[17, 50], [25, 50], [33, 50], [41, 50]], // 3 ذراع يسار →
];
function homeCells(seat) {
  return (HOME_LANES[seat] || HOME_LANES[0]).map(([x, y]) => ({ x, y }));
}

// مواضع البيادق الأربعة داخل قاعدة اللاعب — على هيئة زهرة (clover) مثل زوايا الصورة
function yardSlots(seat) {
  const c = CORNERS[seat];
  return [
    { x: c.x, y: c.y - 6 }, // أعلى
    { x: c.x - 6, y: c.y }, // يسار
    { x: c.x + 6, y: c.y }, // يمين
    { x: c.x, y: c.y + 6 }, // أسفل
  ];
}

function marblePos(seat, step, mi) {
  if (step === 0) return yardSlots(seat)[mi];
  if (step >= 1 && step <= LOOP) return perimeter((START_INDEX[seat] + step - 1) % LOOP);
  return homeCells(seat)[step - HOME_FIRST];
}

const SUIT_COLOR = { "♥": "#e3405a", "♦": "#e3405a", "♠": "#1b2440", "♣": "#1b2440", "🃏": "#7a3aa6" };

// صورة طاولة جاكارو (ضع الملف في client/public/games/jackaroo-table.png)
const TABLE_IMG = "/games/jackaroo-table.png";

export default function JackarooBoard({ game, you, action, onExit }) {
  const st = game?.state;
  const [selCard, setSelCard] = useState(null);
  // لا نُفعّل صورة الطاولة إلا بعد التأكد من تحميلها (وإلا يبقى اللوح الخشبي)
  const [tableReady, setTableReady] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setTableReady(true);
    img.src = TABLE_IMG;
  }, []);
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
  // موضع مقعد كل لاعب حول اللوحة حسب زاويته
  const POD_POS = ["tl", "tr", "br", "bl"];

  return (
    <div className="jak">
      {/* اللوحة الخشبية + مقاعد اللاعبين حول الحواف */}
      <div className="jak-stage">
        {players.map((p) => (
          <div
            key={p.id}
            className={`jak-pod ${POD_POS[p.seat] || "tl"} ${game.turn === p.id ? "active" : ""}`}
            style={{ "--c": p.color }}
          >
            <div className="jak-pod-av">
              {game.turn === p.id && <span className="jak-pod-ring" aria-hidden />}
              <span className="jak-pod-em">{p.avatar}</span>
              <span className={`jak-pod-team t${p.team}`}>{p.team === 0 ? "A" : "B"}</span>
            </div>
            <div className="jak-pod-info">
              <span className="jak-pod-name">{p.name}{p.id === you ? " (أنت)" : ""}</span>
              <span className="jak-pod-meta">🏠{p.homeCount}/4 · 🂠{p.handCount ?? p.hand?.length ?? 0}</span>
            </div>
          </div>
        ))}

      {/* اللوحة */}
      <div
        className={`jak-board ${tableReady ? "has-photo" : ""}`}
        style={tableReady ? { "--jak-table": `url(${TABLE_IMG})` } : undefined}
      >
        {/* قواعد بهيئة زهرة في الزوايا: قرص خافت + 4 ثقوب ملوّنة */}
        {CORNERS.map((c, seat) => (
          <div
            key={seat}
            className="jak-base"
            style={{
              left: `${c.x}%`, top: `${c.y}%`,
              background: hexA(players[seat]?.color || "#555", 0.14),
              borderColor: players[seat]?.color || "#555",
            }}
          />
        ))}
        {players.map((p) =>
          yardSlots(p.seat).map((s, k) => (
            <span
              key={`y${p.seat}-${k}`}
              className="jak-cell yard"
              style={{ left: `${s.x}%`, top: `${s.y}%`, background: hexA(p.color, 0.6), borderColor: p.color }}
            />
          ))
        )}

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

        {/* المركز — كومة التخلّص */}
        <div className="jak-center">
          <span className="jak-pile-card c1" />
          <span className="jak-pile-card c2" />
          <span className="jak-pile-lbl">تخلّص</span>
        </div>

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
