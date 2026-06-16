import { motion } from "framer-motion";
import { useGameTable } from "./useGameTable.js";
import SnakeLadderBoard from "./SnakeLadderBoard.jsx";
import LudoBoard from "./LudoBoard.jsx";
import JackarooBoard from "./JackarooBoard.jsx";
import "./games.css";

// خريطة معرّف اللعبة -> لوحتها
const BOARDS = {
  snake: SnakeLadderBoard,
  ludo: LudoBoard,
  jackaroo: JackarooBoard,
};

const TITLES = {
  snake: "السلم والثعبان",
  ludo: "لودو",
  jackaroo: "جاكارو",
  baloot: "بلوت",
};

export default function GameRoom({ gameId, mode, user, onExit }) {
  const table = useGameTable({ gameId, mode, user });
  const { phase, lobby, game, you, error } = table;
  const Board = BOARDS[gameId];

  // لعبة غير مبنية بعد
  if (!Board) {
    return (
      <div className="grm">
        <Header title={TITLES[gameId] || gameId} onExit={onExit} />
        <div className="grm-soon">
          <span className="grm-soon-ico">🛠️</span>
          <p>لعبة «{TITLES[gameId] || gameId}» قيد التجهيز.</p>
          <button className="grm-btn" onClick={onExit}>رجوع</button>
        </div>
      </div>
    );
  }

  return (
    <div className="grm">
      <Header title={TITLES[gameId]} onExit={onExit} />
      {error && <div className="grm-error">{error}</div>}

      {phase !== "playing" ? (
        <Lobby lobby={lobby} you={you} onStart={table.start} onExit={onExit} />
      ) : (
        <Board game={game} you={you} action={table.action} onExit={onExit} />
      )}
    </div>
  );
}

function Header({ title, onExit }) {
  return (
    <header className="grm-head">
      <button className="grm-back" onClick={onExit}>‹ خروج</button>
      <h2>{title}</h2>
      <span style={{ width: 56 }} />
    </header>
  );
}

function Lobby({ lobby, you, onStart, onExit }) {
  if (!lobby) {
    return <div className="grm-loading">جاري الاتصال بالطاولة…</div>;
  }
  const isHost = lobby.hostId === you;
  const seats = Array.from({ length: lobby.maxSeats }, (_, i) => lobby.players[i] || null);

  return (
    <div className="grm-lobby">
      <p className="grm-lobby-hint">
        في انتظار اللاعبين — المقاعد الفارغة تُملأ بلاعبين آليين عند البدء.
      </p>
      <div className="grm-seats">
        {seats.map((p, i) => (
          <div key={i} className={`grm-seat ${p ? "filled" : ""}`}>
            <span className="grm-seat-av">{p ? p.avatar : "＋"}</span>
            <span className="grm-seat-name">
              {p ? p.name : "بانتظار…"}
              {p && p.id === lobby.hostId && <b className="grm-host"> ★</b>}
              {p && p.id === you && <b className="grm-you"> (أنت)</b>}
            </span>
          </div>
        ))}
      </div>

      {isHost ? (
        <motion.button className="grm-start" whileTap={{ scale: 0.96 }} onClick={onStart}>
          ابدأ اللعب ▶
        </motion.button>
      ) : (
        <p className="grm-wait">بانتظار أن يبدأ المضيف…</p>
      )}
      <button className="grm-btn ghost" onClick={onExit}>إلغاء</button>
    </div>
  );
}
