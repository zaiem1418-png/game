import { useState } from "react";

// الشريط السفلي: إدخال الشات، المايك، الكتم، الهدايا
export default function BottomBar({
  onMic,
  muted,
  onTakeMic,
  onLeaveMic,
  onToggleMute,
  onSendChat,
  onOpenGifts,
}) {
  const [text, setText] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onSendChat(text);
    setText("");
  }

  return (
    <form className="bottom-bar" onSubmit={submit}>
      {/* زر الهدايا */}
      <button type="button" className="bb-icon gift-icon" onClick={onOpenGifts} title="الهدايا">
        🎁
      </button>

      {/* إدخال الشات */}
      <input
        className="bb-input"
        placeholder="أدخل نص هنا"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={200}
      />

      {/* أزرار المايك */}
      {!onMic ? (
        <button type="button" className="bb-mic take" onClick={onTakeMic}>
          🎤 أخذ المايك
        </button>
      ) : (
        <div className="bb-mic-group">
          <button
            type="button"
            className={`bb-icon ${muted ? "muted" : "live"}`}
            onClick={onToggleMute}
            title={muted ? "فتح المايك" : "كتم المايك"}
          >
            {muted ? "🔇" : "🎙️"}
          </button>
          <button type="button" className="bb-icon leave" onClick={onLeaveMic} title="نزول عن المايك">
            ⬇
          </button>
        </div>
      )}
    </form>
  );
}
