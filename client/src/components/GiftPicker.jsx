import { useState } from "react";

// نافذة اختيار الهدية والمستلم
export default function GiftPicker({ gifts, members, onSend, onClose }) {
  const [selected, setSelected] = useState(null);
  const [toUserId, setToUserId] = useState("all");

  function send() {
    if (!selected) return;
    onSend(selected, toUserId === "all" ? null : toUserId);
  }

  return (
    <div className="gift-modal-backdrop" onClick={onClose}>
      <div className="gift-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gift-head">
          <span>🎁 إرسال هدية</span>
          <button className="gift-close" onClick={onClose}>✕</button>
        </div>

        <div className="gift-to">
          <span>إلى:</span>
          <select value={toUserId} onChange={(e) => setToUserId(e.target.value)}>
            <option value="all">الجميع 🌍</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.avatar} {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="gift-grid">
          {gifts.map((g) => (
            <button
              key={g.id}
              className={`gift-item ${selected === g.id ? "active" : ""}`}
              onClick={() => setSelected(g.id)}
            >
              <span className="gift-emoji">{g.emoji}</span>
              <span className="gift-name">{g.name}</span>
              <span className="gift-coins">🪙 {g.coins}</span>
            </button>
          ))}
        </div>

        <button className="gift-send" onClick={send} disabled={!selected}>
          إرسال
        </button>
      </div>
    </div>
  );
}
