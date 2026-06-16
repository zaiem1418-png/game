import { useState } from "react";

// شاشة الدخول: اختيار اسم وإطار VIP اختياري
const FRAMES = [
  { id: null, label: "بدون إطار" },
  { id: "gold", label: "ذهبي 👑" },
  { id: "pink", label: "وردي 🦢" },
  { id: "neon", label: "نيون ⚡" },
];

const AVATARS = ["🦁", "🐯", "🐼", "🦊", "🐵", "🐶", "🐱", "🐸"];

export default function JoinScreen({ onJoin, onBack }) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [frame, setFrame] = useState(null);

  function submit(e) {
    e.preventDefault();
    onJoin({ name: name.trim() || "زائر", avatar, frame });
  }

  return (
    <div className="join">
      <form className="join-card" onSubmit={submit}>
        {onBack && (
          <button type="button" className="join-back" onClick={onBack}>
            ‹ الرئيسية
          </button>
        )}
        <h1>🎙️ الغرفة الصوتية</h1>
        <p className="join-sub">اختر اسمك وادخل الجلسة</p>

        <input
          className="join-input"
          placeholder="اسمك..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          autoFocus
        />

        <div className="join-label">الصورة</div>
        <div className="avatar-row">
          {AVATARS.map((a) => (
            <button
              type="button"
              key={a}
              className={`avatar-pick ${avatar === a ? "active" : ""}`}
              onClick={() => setAvatar(a)}
            >
              {a}
            </button>
          ))}
        </div>

        <div className="join-label">الإطار</div>
        <div className="frame-row">
          {FRAMES.map((f) => (
            <button
              type="button"
              key={f.label}
              className={`frame-pick ${frame === f.id ? "active" : ""}`}
              onClick={() => setFrame(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button className="join-btn" type="submit">
          دخول الغرفة
        </button>
        <p className="join-hint">
          افتح هذا الرابط في تبويب آخر (أو جهاز آخر) لتجربة المزامنة اللحظية 👥
        </p>
      </form>
    </div>
  );
}
