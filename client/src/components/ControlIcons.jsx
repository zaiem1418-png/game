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

// هدية (زر الهدايا)
export function GiftIcon() {
  return (
    <svg {...S} aria-hidden="true">
      <rect x="4" y="10" width="16" height="10" rx="1.6" fill="currentColor" />
      <rect x="3" y="7" width="18" height="3.6" rx="1.1" fill="currentColor" />
      <rect x="10.6" y="7" width="2.8" height="13" fill="#fff" opacity="0.55" />
      <path d="M12 7c-2.4-3.4-5.8-1-3 0M12 7c2.4-3.4 5.8-1 3 0" fill="none"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// وجه مبتسم (التفاعلات السريعة)
export function SmileyIcon() {
  return (
    <svg {...S} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="9" cy="10" r="1.2" fill="currentColor" />
      <circle cx="15" cy="10" r="1.2" fill="currentColor" />
      <path d="M8.2 14a4.5 4.5 0 0 0 7.6 0" fill="none" stroke="currentColor"
        strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

// تاج (شارة المالك)
export function CrownIcon() {
  return (
    <svg {...S} aria-hidden="true">
      <path d="M3 8 7 12l5-7 5 7 4-4-1.5 10.5h-15z" fill="currentColor" />
      <circle cx="12" cy="18.5" r="1" fill="#3a1d00" opacity="0.5" />
    </svg>
  );
}

// درع (شارة المشرف / مستوى الغرفة)
export function ShieldIcon() {
  return (
    <svg {...S} aria-hidden="true">
      <path d="M12 2.5 19 5v6c0 4.6-3 8.2-7 10.5-4-2.3-7-5.9-7-10.5V5z" fill="currentColor" />
      <path d="M9 12l2 2 4-4.5" fill="none" stroke="#1f0e2e" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
    </svg>
  );
}

// مايك مكتوم بشكل مكبّر صوت (شارة الكتم)
export function MuteBadgeIcon() {
  return (
    <svg {...S} aria-hidden="true">
      <path d="M4 9.5h3l4-3.5v12l-4-3.5H4z" fill="currentColor" />
      <path d="M15 9l4 6M19 9l-4 6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

// عين (معاينة)
export function EyeIcon() {
  return (
    <svg {...S} aria-hidden="true">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}

// سلّة حذف
export function TrashIcon() {
  return (
    <svg {...S} aria-hidden="true">
      <path d="M5 7h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6.5 7l.9 11.4a1.6 1.6 0 0 0 1.6 1.5h6a1.6 1.6 0 0 0 1.6-1.5L17.5 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

// قلم (تحرير)
export function EditIcon() {
  return (
    <svg {...S} aria-hidden="true">
      <path d="M14.5 5.5l4 4L9 19l-4.5 1 1-4.5z" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M13 7l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// قفل (مقعد مقفل)
export function LockIcon() {
  return (
    <svg {...S} aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.2" fill="currentColor" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" strokeWidth="2" />
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
