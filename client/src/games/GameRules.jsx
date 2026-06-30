import { motion } from "framer-motion";

// زر فتح نافذة القواعد — يوضع أعلى لوحة اللعبة
export function RulesButton({ onClick }) {
  return (
    <div className="gr-bar">
      <button className="bl-rules-btn" onClick={onClick} title="قواعد وأنظمة اللعبة">
        📖 القواعد
      </button>
    </div>
  );
}

// نافذة القواعد المشتركة لكل الألعاب — تمرّر العنوان والمحتوى
export default function GameRules({ title, onClose, children }) {
  return (
    <motion.div
      className="bl-rules-overlay"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bl-rules-sheet"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.96 }}
      >
        <div className="bl-rules-head">
          <h3>{title}</h3>
          <button className="bl-rules-x" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>
        <div className="bl-rules-body">{children}</div>
        <button className="bl-rules-done" onClick={onClose}>فهمت، لنلعب 👍</button>
      </motion.div>
    </motion.div>
  );
}
