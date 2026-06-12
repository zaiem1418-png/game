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
        return (
          <div key={m.id} className={`msg chat ${mine ? "mine" : ""}`}>
            <span className="msg-author">{m.user?.avatar} {m.user?.name}:</span>{" "}
            <span className="msg-text">{m.text}</span>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
