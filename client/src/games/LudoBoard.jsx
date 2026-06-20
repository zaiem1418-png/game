import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ===== هندسة لوحة لودو 15×15 (إحداثيات [صف، عمود]) =====
const PATH = buildPath();
const OFFSETS = [0, 13, 26, 39];
const SAFE = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
const CENTER = [7, 7];
const HOME_COLS = [
  [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]], // أحمر
  [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]], // أخضر
  [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]], // أصفر
  [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]], // أزرق
];
// مواضع البيادق داخل القاعدة لكل لاعب (زاوية)
const BASE_SLOTS = [
  [[1.5, 1.5], [1.5, 3.5], [3.5, 1.5], [3.5, 3.5]], // TL أحمر
  [[1.5, 10.5], [1.5, 12.5], [3.5, 10.5], [3.5, 12.5]], // TR أخضر
  [[10.5, 10.5], [10.5, 12.5], [12.5, 10.5], [12.5, 12.5]], // BR أصفر
  [[10.5, 1.5], [10.5, 3.5], [12.5, 1.5], [12.5, 3.5]], // BL أزرق
];
const CORNERS = [
  { seat: 0, r: 0, c: 0 },
  { seat: 1, r: 0, c: 9 },
  { seat: 2, r: 9, c: 9 },
  { seat: 3, r: 9, c: 0 },
];

function buildPath() {
  const p = [];
  const push = (r, c) => p.push([r, c]);
  for (let c = 1; c <= 5; c++) push(6, c); // A
  for (let r = 5; r >= 0; r--) push(r, 6); // B
  push(0, 7); // C
  for (let r = 0; r <= 5; r++) push(r, 8); // D
  for (let c = 9; c <= 14; c++) push(6, c); // E
  push(7, 14); // F
  for (let c = 14; c >= 9; c--) push(8, c); // G
  for (let r = 9; r <= 14; r++) push(r, 8); // H
  push(14, 7); // I
  for (let r = 14; r >= 9; r--) push(r, 6); // J
  for (let c = 5; c >= 0; c--) push(8, c); // K
  push(7, 0); // L
  push(6, 0); // M
  return p;
}

function pct(r, c) {
  return { top: `${((r + 0.5) / 15) * 100}%`, left: `${((c + 0.5) / 15) * 100}%` };
}

// موضع بيدق حسب خطواته
function tokenPos(seat, steps, tokenIdx) {
  if (steps === 0) return pct(...BASE_SLOTS[seat][tokenIdx]);
  if (steps >= 1 && steps <= 51) {
    const [r, c] = PATH[(OFFSETS[seat] + steps - 1) % 52];
    return pct(r, c);
  }
  if (steps >= 52 && steps <= 56) {
    const [r, c] = HOME_COLS[seat][steps - 52];
    return pct(r, c);
  }
  // 57 = البيت (المركز) — إزاحة بسيطة لتجنّب التراكب
  const dx = [-0.3, 0.3, -0.3, 0.3][tokenIdx];
  const dy = [-0.3, -0.3, 0.3, 0.3][tokenIdx];
  return pct(CENTER[0] + dy, CENTER[1] + dx);
}

export default function LudoBoard({ game, you, action, onExit }) {
  const st = game?.state;
  if (!st) return <div className="grm-loading">جاري التحميل…</div>;

  const players = st.players;
  const me = players.find((p) => p.id === you);
  const myTurn = game.turn === you;
  const turnPlayer = players.find((p) => p.id === game.turn);
  const canRoll = myTurn && st.phase === "roll";
  const canPick = myTurn && st.phase === "move";

  // خانات المسار للعرض (مع تمييز الآمنة والبدايات)
  const cells = useMemo(() => {
    return PATH.map(([r, c], i) => {
      const startSeat = OFFSETS.indexOf(i);
      return { r, c, i, safe: SAFE.has(i), startSeat };
    });
  }, []);

  const ev = st.lastEvent;
  // ترتيب الزوايا البصري: 0=أعلى-يسار، 1=أعلى-يمين، 2=أسفل-يمين، 3=أسفل-يسار
  const POD_POS = ["tl", "tr", "br", "bl"];

  return (
    <div className="ludo">
      {/* اللوحة مع مقاعد اللاعبين في الزوايا */}
      <div className="ludo-stage">
        {players.map((p) => (
          <PlayerPod
            key={p.id}
            player={p}
            pos={POD_POS[p.seat] || "tl"}
            active={game.turn === p.id}
            isYou={p.id === you}
            dice={game.turn === p.id ? st.dice : null}
          />
        ))}

        <div className="ludo-board">
          {/* قواعد ملوّنة بالزوايا — ساحة بيضاء بداخلها 4 جيوب */}
          {CORNERS.map((co) => {
            const c = players[co.seat]?.color || "#5a6478";
            return (
              <div
                key={co.seat}
                className="ludo-base"
                style={{
                  top: `${(co.r / 15) * 100}%`,
                  left: `${(co.c / 15) * 100}%`,
                  background: c,
                }}
              >
                <div className="ludo-yard">
                  {[0, 1, 2, 3].map((k) => (
                    <span key={k} className="ludo-pocket" style={{ borderColor: c }} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* عمود البيت الملوّن لكل لاعب */}
          {HOME_COLS.map((col, seat) =>
            col.map(([r, c], k) => (
              <span
                key={`h${seat}-${k}`}
                className="ludo-cell home"
                style={{ ...cellBox(r, c), background: players[seat]?.color || "#5a6478" }}
              />
            ))
          )}

          {/* المركز — أربعة مثلثات بألوان اللاعبين */}
          <div className="ludo-center" style={cellBox(6, 6, 3, 3)}>
            {[0, 1, 2, 3].map((seat) => (
              <span
                key={seat}
                className={`ludo-tri t${seat}`}
                style={{ background: players[seat]?.color || "#5a6478" }}
              />
            ))}
          </div>

        {/* خانات المسار */}
        {cells.map((cell) => (
          <span
            key={cell.i}
            className={`ludo-cell ${cell.safe ? "safe" : ""}`}
            style={{
              ...cellBox(cell.r, cell.c),
              ...(cell.startSeat >= 0
                ? { background: hexA(players[cell.startSeat]?.color || "#555", 0.55) }
                : {}),
            }}
          >
            {cell.safe && cell.startSeat < 0 && <span className="ludo-star">★</span>}
          </span>
        ))}

        {/* البيادق */}
        {players.map((p) =>
          p.tokens.map((steps, ti) => {
            const pos = tokenPos(p.seat, steps, ti);
            const movable = canPick && st.movable.includes(ti) && p.id === you;
            return (
              <motion.button
                key={`${p.id}-${ti}`}
                className={`ludo-token ${movable ? "movable" : ""}`}
                style={{ background: p.color }}
                animate={{ top: pos.top, left: pos.left }}
                transition={{ type: "spring", stiffness: 240, damping: 26 }}
                disabled={!movable}
                onClick={() => movable && action({ type: "move", token: ti })}
              >
                {p.avatar}
              </motion.button>
            );
          })
        )}
        </div>
      </div>

      {/* لوحة التحكم */}
      <div className="snl-ctrl">
        {st.phase === "over" ? (
          <LudoOver players={players} onExit={onExit} />
        ) : (
          <>
            <div className="snl-turn">
              {canRoll ? "دورك! ارمِ النرد" : canPick ? "اختر بيدقاً لتحريكه" : `دور ${turnPlayer?.name || "…"}`}
            </div>
            <AnimatePresence mode="wait">
              <motion.button
                key={st.dice || "die"}
                className="snl-die"
                initial={{ rotate: -180, scale: 0.6, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                disabled={!canRoll}
                onClick={() => canRoll && action({ type: "roll" })}
              >
                {st.dice ? DICE[st.dice] : "🎲"}
              </motion.button>
            </AnimatePresence>
            {ev && ev.type === "capture" && <div className="snl-note snake">💥 أكلت بيدق خصم!</div>}
            {ev && ev.type === "home" && <div className="snl-note ladder">🏠 بيدق وصل البيت!</div>}
          </>
        )}
      </div>
    </div>
  );
}

const DICE = { 1: "⚀", 2: "⚁", 3: "⚂", 4: "⚃", 5: "⚄", 6: "⚅" };

// مقعد لاعب في زاوية اللوحة — صورة بإطار ملوّن + نرده + عدّاد البيت
function PlayerPod({ player, pos, active, isYou, dice }) {
  return (
    <div className={`ludo-pod ${pos} ${active ? "active" : ""} ${player.finishedCount === 4 ? "done" : ""}`} style={{ "--c": player.color }}>
      <div className="ludo-pod-av">
        {active && <span className="ludo-pod-ring" aria-hidden />}
        <span className="ludo-pod-em">{player.avatar}</span>
      </div>
      <div className="ludo-pod-info">
        <span className="ludo-pod-name">{player.name}{isYou ? " (أنت)" : ""}</span>
        <span className="ludo-pod-home">🏠 {player.finishedCount}/4</span>
      </div>
      <span className={`ludo-pod-die ${active ? "lit" : ""}`}>{dice ? DICE[dice] : "🎲"}</span>
    </div>
  );
}

function cellBox(r, c, w = 1, h = 1) {
  return {
    top: `${(r / 15) * 100}%`,
    left: `${(c / 15) * 100}%`,
    width: `${(w / 15) * 100}%`,
    height: `${(h / 15) * 100}%`,
  };
}

function hexA(hex, a) {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function LudoOver({ players, onExit }) {
  const ranked = [...players].sort((a, b) => (a.rank || 99) - (b.rank || 99));
  return (
    <div className="snl-over">
      <h3>انتهت اللعبة 🏁</h3>
      <ol className="snl-rank">
        {ranked.map((p) => (
          <li key={p.id}>
            <span>{["🥇", "🥈", "🥉"][p.rank - 1] || `#${p.rank}`}</span>
            <span className="snl-pl-av">{p.avatar}</span>
            <span>{p.name}</span>
          </li>
        ))}
      </ol>
      <button className="grm-start" onClick={onExit}>رجوع للقائمة</button>
    </div>
  );
}
