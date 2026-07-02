import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";

// ===== هندسة مسار جاكارو الدائري (مطابق للطاولة الحقيقية، 64 خانة حول الدائرة) =====
const LOOP = 64;
const HOME_FIRST = 65;
const RING_R = 43; // نصف قطر مسار الدائرة (٪)

// موضع خانة رقم i (0..63) على الدائرة — تبدأ من الأعلى وتدور مع عقارب الساعة
function perimeter(i) {
  const a = ((i % LOOP) / LOOP) * 2 * Math.PI - Math.PI / 2;
  return { x: 50 + RING_R * Math.cos(a), y: 50 + RING_R * Math.sin(a) };
}

// بداية كل لاعب على محيط الدائرة (0=أعلى، 16=يمين، 32=أسفل، 48=يسار)
const START_INDEX = [0, 16, 32, 48];
function startAngle(seat) {
  return (START_INDEX[seat] / LOOP) * 2 * Math.PI - Math.PI / 2;
}

// قواعد (بيوت) اللاعبين: زهرة من 4 ثقوب في الأركان القُطرية داخل الدائرة (مزاحة 45° عن البداية)
const YARD_R = 27; // بُعد مركز القاعدة عن مركز اللوحة
const CORNERS = [0, 1, 2, 3].map((seat) => {
  const a = startAngle(seat) + Math.PI / 4;
  return { x: 50 + YARD_R * Math.cos(a), y: 50 + YARD_R * Math.sin(a) };
});

// ممرّات بيت النهاية: خطّ شعاعي من المحيط نحو المركز باتجاه بداية اللاعب
const HOME_R = [36, 29, 22, 15];
function homeCells(seat) {
  const a = startAngle(seat);
  return HOME_R.map((r) => ({ x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) }));
}

// مواضع البيادق الأربعة داخل قاعدة اللاعب — على هيئة زهرة (clover) مثل زوايا الصورة
function yardSlots(seat) {
  const c = CORNERS[seat];
  return [
    { x: c.x, y: c.y - 5 }, // أعلى
    { x: c.x - 5, y: c.y }, // يسار
    { x: c.x + 5, y: c.y }, // يمين
    { x: c.x, y: c.y + 5 }, // أسفل
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
  const [showRules, setShowRules] = useState(false);
  // لا نُفعّل صورة الطاولة إلا بعد التأكد من تحميلها (وإلا يبقى اللوح الخشبي)
  const [tableReady, setTableReady] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setTableReady(true);
    img.src = TABLE_IMG;
  }, []);
  if (!st) return <div className="grm-loading">جاري التحميل…</div>;

  const players = st.players;
  // فهرسة اللاعبين حسب المقعد (في 1ضد1 المقاعد 0 و2 وليست 0 و1)
  const bySeat = {};
  players.forEach((p) => { bySeat[p.seat] = p; });
  const me = players.find((p) => p.id === you);
  const myTurn = game.turn === you && st.phase === "play";
  const turnPlayer = players.find((p) => p.id === game.turn);
  const legal = st.myLegal || [];
  const mustDiscard = myTurn && legal.length === 0 && (me?.hand?.length || 0) > 0;

  // الخانات الثابتة للمسار (تُحسب مرّة)
  const ring = useMemo(() => Array.from({ length: LOOP }, (_, i) => ({ i, ...perimeter(i) })), []);

  // خيارات الورقة المختارة (قد تحمل الورقة الواحدة عدة خيارات)
  const cardOpts = useMemo(
    () => (selCard == null ? [] : legal.filter((m) => m.card === selCard)),
    [selCard, legal]
  );
  // نعرض لوحة خيارات عندما يحتاج اللاعب لاختيار (تبديل/تقسيم/إيقاف) أو عند تعدّد الخيارات لنفس البيدق (إيس 1/11)
  const needsPanel = useMemo(() => {
    if (cardOpts.some((o) => ["swap", "split", "stop"].includes(o.kind))) return true;
    const seen = new Set();
    for (const o of cardOpts) {
      if (o.marble < 0) continue;
      if (seen.has(o.marble)) return true;
      seen.add(o.marble);
    }
    return false;
  }, [cardOpts]);

  // البيادق القابلة للتحريك مباشرةً (المسار البسيط بدون لوحة خيارات)
  const movableMarbles = useMemo(
    () => (needsPanel ? [] : cardOpts.filter((o) => o.marble >= 0).map((o) => o.marble)),
    [cardOpts, needsPanel]
  );

  function onMarbleClick(p, mi) {
    if (!myTurn || selCard == null || p.id !== you || needsPanel) return;
    const opt = cardOpts.find((o) => o.marble === mi);
    if (!opt) return;
    action({ type: "play", card: selCard, opt: opt.opt });
    setSelCard(null);
  }

  function onOptClick(o) {
    action({ type: "play", card: selCard, opt: o.opt });
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
        {/* قواعد بهيئة زهرة في زوايا اللاعبين الموجودين فقط */}
        {players.map((p) => {
          const c = CORNERS[p.seat] || CORNERS[0];
          return (
            <div
              key={`base${p.seat}`}
              className="jak-base"
              style={{
                left: `${c.x}%`, top: `${c.y}%`,
                background: hexA(p.color, 0.14),
                borderColor: p.color,
              }}
            />
          );
        })}
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
          const startP = startSeat >= 0 ? bySeat[startSeat] : null;
          return (
            <span
              key={cell.i}
              className="jak-cell"
              style={{
                left: `${cell.x}%`, top: `${cell.y}%`,
                ...(startP ? { background: startP.color, borderColor: "#fff" } : {}),
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

        {/* المركز — كومة الأوراق (دون كلمات) */}
        <div className="jak-center">
          <span className="jak-pile-card c1" />
          <span className="jak-pile-card c2" />
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

      {/* حالة الدور + زر القواعد */}
      <div className="jak-turn">
        <button className="jak-rules-btn" onClick={() => setShowRules(true)} title="قواعد جاكارو">؟ القواعد</button>
        {st.phase === "over"
          ? null
          : myTurn
            ? mustDiscard
              ? "لا حركة متاحة — اختر ورقة للتخلّص منها"
              : selCard == null
                ? "دورك — اختر ورقة"
                : needsPanel
                  ? "اختر الحركة من الأسفل"
                  : "اختر بيدقاً متوهّجاً لتحريكه"
            : `دور ${turnPlayer?.name || "…"}`}
        {ev && ev.type === "capture" && <span className="jak-ev"> 💥 أكل!</span>}
        {ev && ev.type === "home" && <span className="jak-ev"> 🏁 بيدق وصل!</span>}
        {ev && ev.type === "swap" && <span className="jak-ev"> 🔄 تبديل!</span>}
        {ev && ev.type === "stop" && <span className="jak-ev"> ⛔ إيقاف!</span>}
      </div>

      {/* لوحة خيارات الورقة (تبديل/تقسيم/إيقاف/إيس 1-11) */}
      {myTurn && needsPanel && cardOpts.length > 0 && (
        <div className="jak-opts">
          {cardOpts.map((o) => (
            <button key={o.opt} className={`jak-opt ${o.cap ? "cap" : ""}`} onClick={() => onOptClick(o)}>
              {o.label}{o.cap ? " 💥" : ""}
            </button>
          ))}
        </div>
      )}

      {showRules && <JakRules onClose={() => setShowRules(false)} />}

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

// ===== ورقة القواعد: كم حركة لكل كرت + الكروت الخاصة =====
const RULE_CARDS = [
  { c: "A", t: "إخراج بيدق من البيت، أو التقدّم 1 أو 11 (اختيارك)", tag: "متعدد" },
  { c: "K", t: "إخراج بيدق من البيت، أو التقدّم 13 ويأكل ما يمرّ عليه", tag: "متعدد" },
  { c: "Q", t: "التقدّم 12 خطوة", tag: "" },
  { c: "J", t: "كرت التبديل — بدّل بيدقك مع بيدق خصم على المسار", tag: "تبديل" },
  { c: "10", t: "التقدّم 10، أو كرت الإيقاف — يُفقد اللاعب التالي دوره", tag: "إيقاف" },
  { c: "9", t: "التقدّم 9 خطوات", tag: "" },
  { c: "8", t: "التقدّم 8 خطوات", tag: "" },
  { c: "7", t: "كرت التقسيم — وزّع 7 خطوات على بيدق واحد أو بيدقين", tag: "تقسيم" },
  { c: "6", t: "التقدّم 6 خطوات", tag: "" },
  { c: "5", t: "التقدّم 5 خطوات", tag: "" },
  { c: "4", t: "التحرّك 4 خطوات للخلف", tag: "خلف" },
  { c: "3", t: "التقدّم 3 خطوات", tag: "" },
  { c: "2", t: "التقدّم خطوتين", tag: "" },
  { c: "🃏", t: "إخراج بيدق، أو التقدّم 18 ويأكل ما يمرّ عليه", tag: "متعدد" },
];

function JakRules({ onClose }) {
  return (
    <div className="jak-rules-overlay" onClick={onClose}>
      <div className="jak-rules" onClick={(e) => e.stopPropagation()}>
        <div className="jak-rules-head">
          <b>قواعد جاكارو</b>
          <button className="jak-rules-x" onClick={onClose}>✕</button>
        </div>
        <p className="jak-rules-intro">
          4 لاعبين، فريقان (المتقابلان شركاء). لكل لاعب 4 بيادق و4 أوراق. أخرِج البيادق من البيت ودُر حول المسار
          (64 خانة) حتى بيت النهاية (4 خانات) — ويجب الوصول بالعدد بالضبط. الهبوط على بيدق خصم يعيده للبيت،
          والبيدق على خانة بدايته «آمن» لا يُؤكل ولا يُبدّل. يفوز الفريق الذي تصل كل بيادقه لبيت النهاية.
        </p>
        <div className="jak-rules-list">
          {RULE_CARDS.map((r) => (
            <div key={r.c} className="jak-rule-row">
              <span className="jak-rule-card">{r.c}</span>
              <span className="jak-rule-txt">{r.t}</span>
              {r.tag && <span className="jak-rule-tag">{r.tag}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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
