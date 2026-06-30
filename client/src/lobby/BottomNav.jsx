import { NAV } from "./games.js";
import NavIcon from "./NavIcons.jsx";

// شريط التنقّل السفلي المشترك بين الشاشات (أنا/الرسائل/الغرف الصوتية/الرئيسية)
export default function BottomNav({ active, onChange }) {
  return (
    <nav className="gl-nav">
      {NAV.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            className={`gl-nav-btn ${isActive ? "active" : ""}`}
            onClick={() => onChange(item.id)}
          >
            <span className="gl-nav-ico">
              <NavIcon id={item.id} active={isActive} />
              {item.dot && <span className="gl-nav-dot" />}
            </span>
            <span className="gl-nav-lbl">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
