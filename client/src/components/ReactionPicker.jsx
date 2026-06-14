// منتقي التفاعلات السريعة — شريط دائري فوق الشريط السفلي.
import { REACTIONS } from "../reactions.js";

export default function ReactionPicker({ onPick, onClose }) {
  return (
    <div className="rxp-backdrop" onClick={onClose}>
      <div className="rxp-bar" onClick={(e) => e.stopPropagation()}>
        {REACTIONS.map((r) => (
          <button
            key={r.type}
            className="rxp-btn"
            title={r.label}
            onClick={() => {
              onPick(r.type);
              onClose();
            }}
          >
            <span className="rxp-emoji">{r.emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
