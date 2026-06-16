import { NAV } from "./games.js";

// شريط التنقّل السفلي المشترك بين الشاشات (أنا/الرسائل/الغرف الصوتية/الرئيسية)
export default function BottomNav({ active, onChange }) {
  return (
    <nav className="gl-nav">
      {NAV.map((item) => (
        <button
          key={item.id}
          className={`gl-nav-btn ${active === item.id ? "active" : ""}`}
          onClick={() => onChange(item.id)}
        >
          <span className="gl-nav-ico">
            {item.icon}
            {item.dot && <span className="gl-nav-dot" />}
          </span>
          <span className="gl-nav-lbl">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
