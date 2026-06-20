// شريط المقاعد العلوية فوق طاولة اللعب — يحاكي مقاعد غرفة الدردشة الصوتية
// أثناء اللعب: صفّ دائري من صور اللاعبين + مقاعد فارغة قابلة للانضمام.
import { motion } from "framer-motion";

export default function GameTopSeats({ players = [], turn, you, count = 7 }) {
  // وزّع اللاعبين على عدد ثابت من المقاعد العلوية مع مقاعد فارغة للزوّار
  const seats = Array.from({ length: Math.max(count, players.length) }, (_, i) => players[i] || null);

  return (
    <div className="gts">
      <div className="gts-row">
        {seats.map((p, i) => {
          if (!p) {
            return (
              <button key={`e${i}`} className="gts-seat empty" title="مقعد شاغر">
                <span className="gts-circle"><span className="gts-plus">＋</span></span>
              </button>
            );
          }
          const active = p.id === turn;
          const isYou = p.id === you;
          return (
            <motion.div
              key={p.id}
              className={`gts-seat ${active ? "active" : ""} ${isYou ? "self" : ""}`}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.04 }}
            >
              <span
                className="gts-circle filled"
                style={{ "--ring": p.color || "#caa23a" }}
              >
                {active && <span className="gts-pulse" aria-hidden />}
                <span className="gts-av">{p.avatar || "🙂"}</span>
              </span>
              <span className="gts-name">{p.name}{isYou ? " (أنت)" : ""}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
