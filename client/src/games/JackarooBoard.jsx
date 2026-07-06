import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ===== هندسة مسار جاكارو: شكل «القناتين والانتفاخين» كما في الطاولة الحقيقية =====
// قناتان ضيّقتان طويلتان (أعلى/أسفل) لممرّي البيت، وجسم عريض بانتفاخين جانبيّين
// (نقطتا العبور) — مطابق للخط الأحمر. 64 خانة: 16 لكل ربع بين المراسي.
const LOOP = 64;
const HOME_FIRST = 65;
const HOME_LAST = 68;
const PER_CELL = 0.13; // ثانية لكل خانة أثناء مشي البيدق

// محيط المسار (٪، المركز 50,50) مع عقارب الساعة من منتصف الأعلى.
// المراسي (بدايات اللاعبين): أعلى=فهرس 0، يمين=6، أسفل=12، يسار=18.
const OUTLINE = [
  [50, 9],   // 0  رأس أعلى (منتصف القناة العليا)
  [57, 9],
  [57, 27],
  [64, 31],
  [75, 39],
  [82, 46],
  [83, 50],  // 6  انتفاخ اليمين
  [82, 54],
  [75, 61],
  [64, 69],
  [57, 73],
  [57, 91],
  [50, 91],  // 12 رأس أسفل (منتصف القناة السفلى)
  [43, 91],
  [43, 73],
  [36, 69],
  [25, 61],
  [18, 54],
  [17, 50],  // 18 انتفاخ اليسار
  [18, 46],
  [25, 39],
  [36, 31],
  [43, 27],
  [43, 9],
];
const ANCHORS = [0, 6, 12, 18];

// وزّع 16 خانة على كل ربع (بين مرساتين) حسب طول القوس، فتقع البدايات على المراسي
const CELLS = (() => {
  const out = new Array(LOOP);
  for (let q = 0; q < 4; q++) {
    const a = ANCHORS[q], b = ANCHORS[(q + 1) % 4];
    const seg = [];
    for (let idx = a; ; idx++) {
      seg.push(OUTLINE[idx % OUTLINE.length]);
      if (idx % OUTLINE.length === b) break;
    }
    const cum = [0];
    for (let k = 1; k < seg.length; k++) {
      cum.push(cum[k - 1] + Math.hypot(seg[k][0] - seg[k - 1][0], seg[k][1] - seg[k - 1][1]));
    }
    const total = cum[cum.length - 1] || 1;
    for (let j = 0; j < 16; j++) {
      const t = (j / 16) * total;
      let k = 1;
      while (k < seg.length && cum[k] < t) k++;
      const s = cum[k] - cum[k - 1] || 1;
      const f = (t - cum[k - 1]) / s;
      out[q * 16 + j] = {
        x: seg[k - 1][0] + (seg[k][0] - seg[k - 1][0]) * f,
        y: seg[k - 1][1] + (seg[k][1] - seg[k - 1][1]) * f,
      };
    }
  }
  return out;
})();

// موضع خانة رقم i (0..63) على محيط المسار
function perimeter(i) {
  return CELLS[((i % LOOP) + LOOP) % LOOP];
}

// رؤوس الجهات (0=أعلى، 16=يمين، 32=أسفل، 48=يسار) — اتجاه بيت النهاية والقاعدة
const HEAD_INDEX = [0, 16, 32, 48];
// خانة خروج الحجر (البداية الآمنة) بعد الرأس بخانتين — يجب أن تطابق offsetOf في الخادم
const START_OFFSET = 2;
const START_INDEX = HEAD_INDEX.map((h) => (h + START_OFFSET) % LOOP);
// زاوية بيت النهاية/القاعدة تبقى عند رأس الجهة (لا تتأثّر بإزاحة البداية)
function startAngle(seat) {
  return (HEAD_INDEX[seat] / LOOP) * 2 * Math.PI - Math.PI / 2;
}

// قواعد (بيوت) اللاعبين: زهرة من 4 ثقوب في الأركان القُطرية (مزاحة 45° عن الرأس)
const YARD_R = 36; // بُعد مركز القاعدة عن مركز اللوحة (أبعدناها نحو الركن بعيداً عن المسار)
const CORNERS = [0, 1, 2, 3].map((seat) => {
  const a = startAngle(seat) + Math.PI / 4;
  return { x: 50 + YARD_R * Math.cos(a), y: 50 + YARD_R * Math.sin(a) };
});

// ممرّات بيت النهاية: خطّ شعاعي من الرأس نحو المركز باتجاه بداية اللاعب
const HOME_R = [36, 29, 22, 15];
function homeCells(seat) {
  const a = startAngle(seat);
  return HOME_R.map((r) => ({ x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) }));
}

// خانتا العبور (منتصفا الجانبين) — تُعرَضان في 1ضد1 فقط، اختصار للطرف المقابل
const CROSS_CELLS = [16, 48];

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

// المواضع التي يمرّ بها البيدق من الخطوة prev إلى next (يشمل نقطتي البداية والنهاية)،
// حتى «يمشي» خانةً خانة بدل القفز. الحالات الخاصة (خروج/أكل/عبور/تبديل) تُرجع موضعاً واحداً (قفزة).
function walkPath(seat, mi, prev, next) {
  if (prev === next || prev === 0 || next === 0) return [marblePos(seat, next, mi)];
  const fwd = next - prev; // الترقيم خطّي للأمام على المسار ثم الحارة (1..68)
  if (fwd >= 1 && fwd <= 18 && next <= HOME_LAST) {
    const out = [];
    for (let s = prev; s <= next; s++) out.push(marblePos(seat, s, mi));
    return out;
  }
  // مشي للخلف (ورقة 4) مع الالتفاف على حدّ 1/64
  const back = ((prev - next) % LOOP + LOOP) % LOOP;
  if (back >= 1 && back <= 4 && prev <= LOOP && next <= LOOP) {
    const out = [marblePos(seat, prev, mi)];
    let cur = prev;
    for (let k = 0; k < back; k++) { cur = cur - 1 < 1 ? LOOP : cur - 1; out.push(marblePos(seat, cur, mi)); }
    return out;
  }
  return [marblePos(seat, next, mi)]; // عبور/تبديل/التفاف بعيد → قفزة مباشرة
}

const SUIT_COLOR = { "♥": "#e3405a", "♦": "#e3405a", "♠": "#1b2440", "♣": "#1b2440", "🃏": "#7a3aa6" };

// صورة طاولة جاكارو (ضع الملف في client/public/games/jackaroo-table.png)
const TABLE_IMG = "/games/jackaroo-table.png";

export default function JackarooBoard({ game, you, action, onExit }) {
  const st = game?.state;
  const [selCard, setSelCard] = useState(null);
  const [swapFrom, setSwapFrom] = useState(null); // كرت التبديل: بيدقك المختار (الخطوة الأولى)
  const [showRules, setShowRules] = useState(false);
  // لا نُفعّل صورة الطاولة إلا بعد التأكد من تحميلها (وإلا يبقى اللوح الخشبي)
  const [tableReady, setTableReady] = useState(false);
  const [playFx, setPlayFx] = useState(null); // كرت يُلعب ويطير نحو الطاولة
  const [burst, setBurst] = useState(null);    // انفجار الأكل/الوصول عند خانة معيّنة
  const fxId = useRef(0);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setTableReady(true);
    img.src = TABLE_IMG;
  }, []);
  // عند كل حدث أكل/وصول: أطلق انفجاراً عند موضع البيدق المتحرّك
  useEffect(() => {
    const e = st?.lastEvent;
    if (!e || (e.type !== "capture" && e.type !== "home")) return;
    const pl = st.players.find((x) => x.id === e.player);
    if (!pl || e.to == null || e.marble == null) return;
    const pos = marblePos(pl.seat, e.to, e.marble);
    const id = ++fxId.current;
    setBurst({ id, type: e.type, x: pos.x, y: pos.y });
    const t = setTimeout(() => setBurst((b) => (b && b.id === id ? null : b)), 900);
    return () => clearTimeout(t);
  }, [st?.lastEvent]);
  // كرت الخصم: عند لعب/رمي لاعب آخر ورقة، اعرضها على الطاولة (ورقتي أُعرض فوراً عند اللعب)
  useEffect(() => {
    const e = st?.lastEvent;
    if (!e || !e.card || e.player === you) return;
    setPlayFx({ card: e.card, id: ++fxId.current, mode: "reveal" });
  }, [st?.lastEvent]);
  if (!st) return <div className="grm-loading">جاري التحميل…</div>;

  // يُطلق أنميشن «رمي الكرت على الطاولة» عند لعب/رمي ورقتي أنا
  const flyCard = (ci) => {
    const card = me?.hand?.[ci];
    if (card) setPlayFx({ card, id: ++fxId.current, mode: "throw" });
  };

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
  // كرت التبديل (J): اختيار من على اللوحة بخطوتين — بيدقك ثم بيدق الخصم
  const swapMode = useMemo(
    () => cardOpts.length > 0 && cardOpts.every((o) => o.kind === "swap"),
    [cardOpts]
  );
  // بيادقك المؤهّلة كمصدر للتبديل (الخطوة الأولى)
  const swapSrc = useMemo(
    () => (swapMode ? [...new Set(cardOpts.map((o) => o.marble))] : []),
    [swapMode, cardOpts]
  );
  // البيادق (شريك أو خصم) المؤهّلة كهدف بعد اختيار بيدقك (الخطوة الثانية)
  const swapTargets = useMemo(
    () =>
      swapMode && swapFrom != null
        ? cardOpts
            .filter((o) => o.marble === swapFrom)
            .map((o) => ({ seat: o.target.seat, marble: o.target.marble, name: o.targetName, mate: o.mate, opt: o.opt }))
        : [],
    [swapMode, swapFrom, cardOpts]
  );
  // أعِد ضبط اختيار التبديل عند تغيير الورقة أو الدور
  useEffect(() => { setSwapFrom(null); }, [selCard, game.turn]);

  // خطوات البيادق السابقة — لنعرف من أين إلى أين يمشي كل بيدق عند تغيّر الحالة
  const prevSteps = useRef({});
  useEffect(() => {
    const m = {};
    for (const p of players) p.marbles.forEach((s, mi) => { m[`${p.id}:${mi}`] = s; });
    prevSteps.current = m;
  }, [st]);

  // معاينة الوجهة: عند اختيار ورقة، أين سيصل كل بيدق لو حُرّك بها
  const previews = useMemo(() => {
    if (selCard == null || swapMode || !me) return [];
    const out = [];
    for (const o of cardOpts) {
      if (o.marble == null || o.marble < 0 || o.to == null) continue;
      if (o.kind === "shove") out.push({ seat: o.ownerSeat, mi: o.marble, to: o.to, cap: o.cap });
      else if (["move", "home", "exit", "back"].includes(o.kind)) out.push({ seat: me.seat, mi: o.marble, to: o.to, cap: o.cap });
    }
    return out;
  }, [selCard, cardOpts, swapMode, me]);

  // نعرض لوحة خيارات عندما يحتاج اللاعب لاختيار (تقسيم/إيقاف/دفع) أو عند تعدّد الخيارات لنفس البيدق (إيس 1/11)
  // (التبديل يُدار على اللوحة بالنقر، فلا لوحة له)
  const needsPanel = useMemo(() => {
    if (swapMode) return false;
    if (cardOpts.some((o) => ["split", "stop", "shove"].includes(o.kind))) return true;
    const seen = new Set();
    for (const o of cardOpts) {
      if (o.marble < 0) continue;
      if (seen.has(o.marble)) return true;
      seen.add(o.marble);
    }
    return false;
  }, [cardOpts, swapMode]);

  // البيادق القابلة للتحريك مباشرةً (المسار البسيط بدون لوحة خيارات)
  const movableMarbles = useMemo(
    () => (needsPanel || swapMode ? [] : cardOpts.filter((o) => o.marble >= 0).map((o) => o.marble)),
    [cardOpts, needsPanel, swapMode]
  );

  function onMarbleClick(p, mi) {
    if (!myTurn || selCard == null) return;
    // كرت التبديل: الخطوة 1 = اختر بيدقك، الخطوة 2 = اختر بيدق الخصم
    if (swapMode) {
      if (p.id === you) {
        if (!swapSrc.includes(mi)) return;
        setSwapFrom((f) => (f === mi ? null : mi)); // النقر مجدداً يلغي الاختيار
        return;
      }
      if (swapFrom == null) return;
      const t = swapTargets.find((x) => x.seat === p.seat && x.marble === mi);
      if (!t) return;
      flyCard(selCard);
      action({ type: "play", card: selCard, opt: t.opt });
      setSelCard(null);
      setSwapFrom(null);
      return;
    }
    if (p.id !== you || needsPanel) return;
    const opt = cardOpts.find((o) => o.marble === mi);
    if (!opt) return;
    flyCard(selCard);
    action({ type: "play", card: selCard, opt: opt.opt });
    setSelCard(null);
  }

  function onOptClick(o) {
    flyCard(selCard);
    action({ type: "play", card: selCard, opt: o.opt });
    setSelCard(null);
  }

  function onCardClick(ci) {
    if (!myTurn) return;
    if (mustDiscard) {
      flyCard(ci);
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
  // العبور مُفعّل في 1ضد1 فقط (خانتا الجانبين ليستا بدايتَي لاعبين)
  const crossOn = players.length <= 2;
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
        className={`jak-board ${tableReady ? "has-photo" : ""} ${burst?.type === "capture" ? "shake" : ""}`}
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
          // خانة عبور: منتصف الجانب في 1ضد1 وليست بداية لاعب موجود
          const isCross = crossOn && CROSS_CELLS.includes(cell.i) && !startP;
          return (
            <span
              key={cell.i}
              className={`jak-cell ${isCross ? "cross" : ""}`}
              style={{
                left: `${cell.x}%`, top: `${cell.y}%`,
                ...(startP ? { background: startP.color, borderColor: "#fff" } : {}),
              }}
            >
              {isCross && <span className="jak-cross-mark">⇄</span>}
            </span>
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

        {/* معاينة الوجهة: خطوط منقّطة من كل بيدق إلى حيث سيصل + قرص شبحي عند الهدف */}
        {previews.length > 0 && (
          <svg className="jak-preview-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
            {previews.map((pv, i) => {
              const owner = bySeat[pv.seat];
              if (!owner) return null;
              const src = marblePos(pv.seat, owner.marbles[pv.mi], pv.mi);
              const dst = marblePos(pv.seat, pv.to, pv.mi);
              return (
                <line
                  key={i}
                  x1={src.x} y1={src.y} x2={dst.x} y2={dst.y}
                  stroke={pv.cap ? "#ffd23f" : owner.color}
                  strokeWidth="0.7" strokeDasharray="1.6 1.4" strokeLinecap="round" opacity="0.8"
                />
              );
            })}
          </svg>
        )}
        {previews.map((pv, i) => {
          const owner = bySeat[pv.seat];
          if (!owner) return null;
          const dst = marblePos(pv.seat, pv.to, pv.mi);
          return (
            <span
              key={`gh${i}`}
              className={`jak-ghost ${pv.cap ? "cap" : ""}`}
              style={{ left: `${dst.x}%`, top: `${dst.y}%`, "--mc": owner.color }}
            >
              {pv.cap ? "💥" : ""}
            </span>
          );
        })}

        {/* البيادق */}
        {players.map((p) =>
          p.marbles.map((step, mi) => {
            const pos = marblePos(p.seat, step, mi);
            let cls = "";
            let clickable = false;
            if (myTurn) {
              if (swapMode) {
                if (p.id === you && swapSrc.includes(mi)) {
                  clickable = true;
                  cls = swapFrom === mi ? "swap-src sel" : "swap-src";
                } else if (swapFrom != null) {
                  const t = swapTargets.find((x) => x.seat === p.seat && x.marble === mi);
                  if (t) {
                    clickable = true;
                    cls = t.mate ? "swap-tgt mate" : "swap-tgt";
                  }
                }
              } else if (p.id === you && movableMarbles.includes(mi)) {
                clickable = true;
                cls = "movable";
              }
            }
            const prevStep = prevSteps.current[`${p.id}:${mi}`];
            const wp = walkPath(p.seat, mi, prevStep == null ? step : prevStep, step);
            const walking = wp.length > 1;
            return (
              <motion.button
                key={`${p.id}-${mi}`}
                className={`jak-marble ${cls} ${walking ? "walking" : ""}`}
                style={{ "--mc": p.color }}
                animate={
                  walking
                    ? { left: wp.map((w) => `${w.x}%`), top: wp.map((w) => `${w.y}%`) }
                    : { left: `${pos.x}%`, top: `${pos.y}%` }
                }
                transition={
                  walking
                    ? { duration: (wp.length - 1) * PER_CELL, ease: "linear" }
                    : { type: "spring", stiffness: 320, damping: 19, mass: 0.7 }
                }
                disabled={!clickable}
                onClick={() => onMarbleClick(p, mi)}
              />
            );
          })
        )}

        {/* انفجار الأكل / وميض الوصول للبيت عند خانة الحدث */}
        <AnimatePresence>
          {burst && (
            <motion.div
              key={burst.id}
              className={`jak-burst ${burst.type}`}
              style={{ left: `${burst.x}%`, top: `${burst.y}%` }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.3 }}
              transition={{ duration: 0.25 }}
            >
              <span className="jak-burst-ring" />
              <span className="jak-burst-core">{burst.type === "capture" ? "💥" : "✨"}</span>
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className="jak-burst-spark" style={{ "--a": `${i * 45}deg` }} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

      {/* كرت يُرمى على الطاولة عند اللعب */}
      <AnimatePresence>
        {playFx && (
          <motion.div
            key={playFx.id}
            className={`jak-fly-card ${playFx.mode || "throw"}`}
            style={{ color: SUIT_COLOR[playFx.card.suit] || "#1b2440" }}
            initial={
              playFx.mode === "reveal"
                ? { opacity: 0, scale: 0.4, x: "-50%", y: -24, rotate: -10 }
                : { opacity: 0.3, scale: 1.15, x: "-50%", y: 30, rotate: -12 }
            }
            animate={
              playFx.mode === "reveal"
                ? { opacity: [0, 1, 1, 0], scale: [0.4, 1.18, 1, 0.9], x: "-50%", y: [-24, 0, 0, 8], rotate: [-10, 0, 0, 4] }
                : { opacity: [1, 1, 0], scale: [1.15, 0.95, 0.5], x: "-50%", y: [30, -170, -230], rotate: [-12, 6, 26] }
            }
            transition={
              playFx.mode === "reveal"
                ? { duration: 0.95, ease: "easeInOut", times: [0, 0.2, 0.72, 1] }
                : { duration: 0.6, ease: "easeInOut", times: [0, 0.6, 1] }
            }
            onAnimationComplete={() => setPlayFx((f) => (f && f.id === playFx.id ? null : f))}
          >
            <b>{playFx.card.rank}</b>
            <span>{playFx.card.suit}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
                : swapMode
                  ? swapFrom == null
                    ? "🔄 كرت التبديل — اختر بيدقك المتوهّج"
                    : "🔄 اختر بيدق الخصم أو الشريك لتبديله (أو انقر بيدقك للإلغاء)"
                  : needsPanel
                    ? "اختر الحركة من الأسفل"
                    : "اختر بيدقاً متوهّجاً لتحريكه"
            : `دور ${turnPlayer?.name || "…"}`}
        {ev && ev.type === "capture" && <span className="jak-ev"> 💥 أكل!</span>}
        {ev && ev.type === "home" && <span className="jak-ev"> 🏁 بيدق وصل!</span>}
        {ev && ev.type === "swap" && <span className="jak-ev"> 🔄 تبديل!</span>}
        {ev && ev.type === "stop" && <span className="jak-ev"> ⛔ إيقاف!</span>}
        {ev && ev.type === "cross" && <span className="jak-ev"> ⇄ عبور للطرف الآخر!</span>}
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
  { c: "K", t: "إخراج بيدق من البيت، أو التقدّم 13 ويأكل ما يمرّ عليه ويخترق السدّ", tag: "متعدد" },
  { c: "Q", t: "التقدّم 12 خطوة", tag: "" },
  { c: "J", t: "كرت التبديل — اختر بيدقاً واحداً لك ثم أي بيدق آخر على المسار (شريك أو خصم) لتبديل موقعيهما (لا يُبدّل ما في البيت/القاعدة/الحارة/المحميّ)", tag: "تبديل" },
  { c: "10", t: "التقدّم 10، أو كرت الإيقاف — يُفقد اللاعب التالي دوره", tag: "إيقاف" },
  { c: "9", t: "التقدّم 9 خطوات", tag: "" },
  { c: "8", t: "التقدّم 8 خطوات", tag: "" },
  { c: "7", t: "كرت التقسيم — وزّع 7 خطوات على بيدق واحد أو بيدقين", tag: "تقسيم" },
  { c: "6", t: "التقدّم 6 خطوات", tag: "" },
  { c: "5", t: "حرّك أي حجر على المسار 5 خطوات — حتى حجر الخصم", tag: "أي حجر" },
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
          4 لاعبين، فريقان (المتقابلان شركاء). لكل لاعب 4 بيادق و4 أوراق. أخرِج البيادق من <b>البيت (المقبرة)</b>
          إلى <b>قاعدتك</b> (خانة البداية) ودُر حول المسار (64 خانة) حتى <b>بيت النهاية «الحارة»</b> (4 خانات) —
          ويجب الوصول بالعدد بالضبط. الهبوط على بيدق خصم يعيده للمقبرة، والبيدق على قاعدته «آمن» لا يُؤكل ولا يُبدّل.
          يفوز الفريق الذي تصل كل بيادقه للحارة.
        </p>
        <p className="jak-rules-intro">
          🧱 <b>السدّ (التسنيد)</b>: بيدقك على قاعدته، أو بيدقان لك متلاصقان على المسار، يشكّلان سدّاً —
          لا يستطيع الخصم تجاوزه ولا الهبوط عليه ولا أكله ولا تبديله، وحتى ورقة 5 لا تحرّكه — إلا الملك K فيخترقه ويأكله.
        </p>
        <p className="jak-rules-intro">
          ⇄ <b>نقطتا العبور</b> (في 1ضد1): الخانتان الذهبيتان على منتصف الجانبين — عند وصول بيدقك
          لإحداهما ينتقل مباشرةً إلى الخانة المقابلة على الطرف الآخر (اختصار للأمام).
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
