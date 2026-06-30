// أيقونات SVG نظيفة لشريط التنقّل السفلي.
// تتبع لون النص الحالي (currentColor) فتتلوّن بالذهبي تلقائيًا عند التفعيل.
// كل أيقونة لها حالتان: مفرّغة (غير مفعّلة) ومملوءة (مفعّلة).

const S = { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none" };

// أنا — شخص داخل دائرة
function MeIcon({ active }) {
  return (
    <svg {...S} aria-hidden="true">
      <circle
        cx="12" cy="8.4" r="3.4"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth="1.8"
      />
      <path
        d="M4.8 19.2c0-3.4 3.2-5.4 7.2-5.4s7.2 2 7.2 5.4"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      />
    </svg>
  );
}

// الرسائل — فقاعة محادثة
function MessagesIcon({ active }) {
  return (
    <svg {...S} aria-hidden="true">
      <path
        d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H9.6L5.4 20.6A.7.7 0 0 1 4.3 20v-2.9A2.6 2.6 0 0 1 2.5 14.5V7A1.5 1.5 0 0 1 4 5.5Z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
      />
      <g stroke={active ? "#1f0e2e" : "currentColor"} strokeWidth="1.8" strokeLinecap="round">
        <path d="M7.5 10.2h9" />
        <path d="M7.5 13.4h6" />
      </g>
    </svg>
  );
}

// الغرف الصوتية — ميكروفون
function RoomsIcon({ active }) {
  return (
    <svg {...S} aria-hidden="true">
      <rect
        x="9" y="2.6" width="6" height="11" rx="3"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth="1.8"
      />
      <path
        d="M5.5 11.5a6.5 6.5 0 0 0 13 0"
        fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      />
      <path d="M12 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.5 21.4h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// الرئيسية — بيت
function HomeIcon({ active }) {
  return (
    <svg {...S} aria-hidden="true">
      <path
        d="M3.5 11.2 12 4l8.5 7.2"
        fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M5.5 10v9.2a.8.8 0 0 0 .8.8h11.4a.8.8 0 0 0 .8-.8V10"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
      />
      <path
        d="M9.6 21V14.4a.8.8 0 0 1 .8-.8h3.2a.8.8 0 0 1 .8.8V21"
        fill={active ? "#1f0e2e" : "none"}
        stroke={active ? "#1f0e2e" : "currentColor"} strokeWidth="1.8" strokeLinejoin="round"
      />
    </svg>
  );
}

const ICONS = {
  me: MeIcon,
  messages: MessagesIcon,
  rooms: RoomsIcon,
  home: HomeIcon,
};

export default function NavIcon({ id, active }) {
  const Cmp = ICONS[id];
  if (!Cmp) return null;
  return <Cmp active={active} />;
}
