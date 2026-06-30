// أيقونات SVG لأزرار التحكّم في الغرفة (المايك/الكتم/النزول).
// تتبع لون الزر الحالي (currentColor).

const S = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none" };

// ميكروفون مفتوح
export function MicIcon() {
  return (
    <svg {...S} aria-hidden="true">
      <rect x="9" y="2.5" width="6" height="11" rx="3" fill="currentColor" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" fill="none" stroke="currentColor"
        strokeWidth="1.9" strokeLinecap="round" />
      <path d="M12 17.5V21" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M8.5 21h7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

// ميكروفون مكتوم (مع خط مائل)
export function MicMutedIcon() {
  return (
    <svg {...S} aria-hidden="true">
      <rect x="9" y="2.5" width="6" height="11" rx="3" fill="currentColor" opacity="0.55" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" fill="none" stroke="currentColor"
        strokeWidth="1.9" strokeLinecap="round" />
      <path d="M12 17.5V21" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M8.5 21h7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M4 3.5 20 20" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

// النزول عن المايك — سهم لأسفل داخل دائرة
export function LeaveIcon() {
  return (
    <svg {...S} aria-hidden="true">
      <circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <path d="M12 7.5v8.5M8.4 12.4 12 16l3.6-3.6" fill="none" stroke="currentColor"
        strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
