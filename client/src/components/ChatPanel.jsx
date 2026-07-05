import { useEffect, useRef } from "react";

// لوحة الشات: رسائل النظام، الدخول، المحادثة، والهدايا
export default function ChatPanel({ messages, selfId }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="chat-panel">
      {messages.map((m) => {
        if (m.type === "system") {
          return (
            <div key={m.id} className="msg system">
              🔔 النظام: {m.text}
            </div>
          );
        }
        if (m.type === "enter") {
          const ent = m.user?.entrance;
          if (ent) {
            // دخولية مميّزة من المتجر — لافتة متوهّجة بلون العنصر
            return (
              <div
                key={m.id}
                className="msg entrance-fx"
                style={{ "--glow": ent.glow || "#ffd700" }}
              >
                <span className="entrance-em">{ent.emoji}</span>
                <span className="entrance-txt">
                  {m.user?.avatar} {m.text} — {ent.name}
                </span>
                <span className="entrance-em">{ent.emoji}</span>
              </div>
            );
          }
          return (
            <div key={m.id} className="msg enter">
              {m.user?.avatar} {m.text} 👋
            </div>
          );
        }
        if (m.type === "gift") {
          return (
            <div key={m.id} className="msg gift">
              🎁 {m.text}
            </div>
          );
        }
        const mine = m.user?.id === selfId;
        const bubble = m.user?.bubble;
        return (
          <div key={m.id} className={`msg chat ${mine ? "mine" : ""}`}>
            <span className="msg-author">{m.user?.avatar} {m.user?.name}:</span>{" "}
            <span
              className={`msg-text ${bubble ? "has-bubble" : ""}`}
              style={bubble ? { background: bubble.grad, "--glow": bubble.glow } : undefined}
            >
              {m.text}
            </span>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
