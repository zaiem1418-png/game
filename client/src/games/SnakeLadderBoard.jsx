import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// يبني صفوف اللوحة مرئياً (الأعلى = 100، الأسفل = 1) بنمط الثعبان
function buildRows() {
  const rows = [];
  for (let visual = 0; visual < 10; visual++) {
    const boardRow = 9 - visual; // 0 = الصف السفلي
    const base = boardRow * 10;
    let nums = Array.from({ length: 10 }, (_, c) => base + c + 1);
    if (boardRow % 2 === 1) nums = nums.reverse(); // الصفوف الفردية تنعكس
    rows.push(nums);
  }
  return rows;
}

export default function SnakeLadderBoard({ game, you, action, onExit }) {
  const rows = useMemo(buildRows, []);
  const st = game?.state;
  if (!st) return <div className="grm-loading">جاري التحميل…</div>;

  const players = st.players;
  const myTurn = game.turn === you && st.phase === "roll";
  const turnPlayer = players.find((p) => p.id === game.turn);

  // خريطة رقم الخانة -> اللاعبون عليها
  const byCell = {};
  players.forEach((p) => {
    if (p.pos >= 1) (byCell[p.pos] ||= []).push(p);
  });
  const atStart = players.filter((p) => p.pos === 0);

  const lm = st.lastMove;

  return (
    <div className="snl">
      {/* شريط اللاعبين */}
      <div className="snl-players">
        {players.map((p) => (
          <div
            key={p.id}
            className={`snl-pl ${game.turn === p.id ? "active" : ""} ${p.finished ? "done" : ""}`}
            style={{ "--c": p.color }}
          >
            <span className="snl-pl-av">{p.avatar}</span>
            <span className="snl-pl-name">{p.name}{p.id === you ? " (أنت)" : ""}</span>
            <span className="snl-pl-pos">{p.finished ? `#${p.rank} 🏁` : p.pos}</span>
          </div>
        ))}
      </div>

      {/* اللوحة */}
      <div className="snl-board">
        {rows.map((nums, r) => (
          <div key={r} className="snl-row">
            {nums.map((n) => {
              const isLadder = st.ladders[n] != null;
              const isSnakeHead = st.snakes[n] != null;
              const here = byCell[n] || [];
              return (
                <div
                  key={n}
                  className={`snl-cell ${isLadder ? "ladder" : ""} ${isSnakeHead ? "snake" : ""}`}
                >
                  <span className="snl-num">{n}</span>
                  {isLadder && <span className="snl-mark">🪜</span>}
                  {isSnakeHead && <span className="snl-mark">🐍</span>}
                  <div className="snl-tokens">
                    {here.map((p) => (
                      <motion.span
                        key={p.id}
                        layoutId={`tok-${p.id}`}
                        className="snl-token"
                        style={{ background: p.color }}
                        transition={{ type: "spring", stiffness: 260, damping: 26 }}
                      >
                        {p.avatar}
                      </motion.span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* صينية البداية للبيادق التي لم تنطلق */}
      {atStart.length > 0 && (
        <div className="snl-start">
          <span>البداية:</span>
          {atStart.map((p) => (
            <motion.span key={p.id} layoutId={`tok-${p.id}`} className="snl-token" style={{ background: p.color }}>
              {p.avatar}
            </motion.span>
          ))}
        </div>
      )}

      {/* لوحة التحكم */}
      <div className="snl-ctrl">
        {st.phase === "over" ? (
          <Over players={players} onExit={onExit} />
        ) : (
          <>
            <div className="snl-turn">
              {myTurn ? "دورك! ارمِ النرد" : `دور ${turnPlayer?.name || "…"}`}
            </div>
            <AnimatePresence mode="wait">
              <motion.button
                key={st.dice || "die"}
                className="snl-die"
                initial={{ rotate: -180, scale: 0.6, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                disabled={!myTurn}
                onClick={() => myTurn && action({ type: "roll" })}
              >
                {st.dice ? DICE[st.dice] : "🎲"}
              </motion.button>
            </AnimatePresence>
            {lm && lm.via && (
              <div className={`snl-note ${lm.via}`}>
                {lm.via === "ladder" ? `🪜 سلّم! صعد إلى ${lm.to}` : `🐍 ثعبان! نزل إلى ${lm.to}`}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const DICE = { 1: "⚀", 2: "⚁", 3: "⚂", 4: "⚃", 5: "⚄", 6: "⚅" };

function Over({ players, onExit }) {
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
