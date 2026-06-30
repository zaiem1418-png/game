// أيقونات SVG ملوّنة وأنيقة لشاشة الملف الشخصي.
// تحلّ محل الإيموجي: أوضح، متناسقة الحجم، وبتدرّجات لونية ولمعة خفيفة.
// مجموعتان: أيقونات الوصول السريع (كبيرة، عائمة) وأيقونات الصفوف (داخل قرص).

const VB = "0 0 24 24";

/* ============ أيقونات الوصول السريع ============ */

// الزوّار — بطاقة زائر برأس شخص
function VisitorsIcon() {
  return (
    <svg viewBox={VB} width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="pi-vis" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5fd0f5" />
          <stop offset="1" stopColor="#1f9fd6" />
        </linearGradient>
      </defs>
      <rect x="3" y="4.5" width="18" height="15" rx="3.2" fill="url(#pi-vis)" />
      <rect x="3" y="4.5" width="18" height="15" rx="3.2" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="0.8" />
      <circle cx="9" cy="11" r="2.5" fill="#fff" />
      <path d="M5 16.4c0-2.1 1.8-3.3 4-3.3s4 1.2 4 3.3z" fill="#fff" />
      <g stroke="#eaf8ff" strokeWidth="1.5" strokeLinecap="round">
        <path d="M15 10h3.4" />
        <path d="M15 13h3.4" />
        <path d="M15 16h2.2" />
      </g>
    </svg>
  );
}

// المنزل — بيت بسقف ونافذة
function HomeIcon() {
  return (
    <svg viewBox={VB} width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="pi-home" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff8a5c" />
          <stop offset="1" stopColor="#e0492a" />
        </linearGradient>
      </defs>
      <path d="M12 3.2 21 11l-1.8 1.6V20a1 1 0 0 1-1 1H6.8a1 1 0 0 1-1-1v-7.4L4 11z" fill="url(#pi-home)" />
      <path d="M12 3.2 21 11l-1.8 1.6V20a1 1 0 0 1-1 1H6.8a1 1 0 0 1-1-1v-7.4L4 11z" fill="none" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="0.8" strokeLinejoin="round" />
      <rect x="10" y="13.5" width="4" height="7.5" rx="0.8" fill="#fff" fillOpacity="0.92" />
      <circle cx="13.1" cy="17.2" r="0.5" fill="#e0492a" />
    </svg>
  );
}

// المتجر — متجر بمظلّة مخطّطة
function StoreIcon() {
  return (
    <svg viewBox={VB} width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="pi-store" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3fe0a8" />
          <stop offset="1" stopColor="#16a578" />
        </linearGradient>
      </defs>
      <rect x="5" y="11" width="14" height="9.5" rx="1.6" fill="url(#pi-store)" />
      <path d="M4 7h16l1 4H3z" fill="#fff" />
      <g fill="#16a578">
        <path d="M7.2 7h2.4l-.5 4H6.8z" />
        <path d="M14.4 7h2.4l.8 4h-2.7z" />
      </g>
      <rect x="9.6" y="14" width="4.8" height="6.5" rx="0.8" fill="#fff" fillOpacity="0.92" />
    </svg>
  );
}

// مركز VIP — جوهرة متعدّدة الأوجه
function VipIcon() {
  return (
    <svg viewBox={VB} width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="pi-vip" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe487" />
          <stop offset="1" stopColor="#f0a429" />
        </linearGradient>
      </defs>
      <path d="M7.2 4h9.6l3.2 4.4L12 21 4 8.4z" fill="url(#pi-vip)" />
      <g stroke="#fff" strokeOpacity="0.55" strokeWidth="0.9" strokeLinejoin="round" fill="none">
        <path d="M4 8.4h16" />
        <path d="M9 4 7.6 8.4 12 21" />
        <path d="M15 4l1.4 4.4L12 21" />
      </g>
    </svg>
  );
}

/* ============ أيقونات الصفوف (داخل قرص) ============ */

// لحظاتي — صورة/لحظة
function MomentsIcon() {
  return (
    <svg viewBox={VB} width="100%" height="100%" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.2" fill="#ffd66b" />
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.2" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="0.8" />
      <circle cx="8.2" cy="9.8" r="1.6" fill="#fff" />
      <path d="M4.5 17.5 9.5 12l3 3 3.2-3.6 4 4.1v.7a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1z" fill="#ff7a59" />
    </svg>
  );
}

// إنجازات — كأس
function TrophyIcon() {
  return (
    <svg viewBox={VB} width="100%" height="100%" aria-hidden="true">
      <path d="M7 4h10v4.2a5 5 0 0 1-10 0z" fill="#ffd24a" />
      <path d="M7 4.8H4.4v1.8A3 3 0 0 0 7 9.5M17 4.8h2.6v1.8A3 3 0 0 1 17 9.5" fill="none" stroke="#ffd24a" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="10.6" y="12.4" width="2.8" height="3" fill="#e7a32a" />
      <path d="M8 16h8l.8 3.4H7.2z" fill="#ffb938" />
    </svg>
  );
}

// المتجر/الإطارات والخواتم — كيس تسوّق
function BagShopIcon() {
  return (
    <svg viewBox={VB} width="100%" height="100%" aria-hidden="true">
      <path d="M6 8h12l-1 11.5a1 1 0 0 1-1 .9H8a1 1 0 0 1-1-.9z" fill="#c58bff" />
      <path d="M8.4 8.5V7a3.6 3.6 0 0 1 7.2 0v1.5" fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="9.6" cy="12" r="0.9" fill="#fff" />
      <circle cx="14.4" cy="12" r="0.9" fill="#fff" />
    </svg>
  );
}

// الحقيبة — حقيبة ظهر
function BackpackIcon() {
  return (
    <svg viewBox={VB} width="100%" height="100%" aria-hidden="true">
      <path d="M6 9.5a6 6 0 0 1 12 0v9.2a1.3 1.3 0 0 1-1.3 1.3H7.3A1.3 1.3 0 0 1 6 18.7z" fill="#5fb8ff" />
      <path d="M9 8.6a3 3 0 0 1 6 0" fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="9" y="12" width="6" height="5" rx="1.2" fill="#fff" fillOpacity="0.92" />
      <path d="M12 12v5" stroke="#5fb8ff" strokeWidth="1.3" />
    </svg>
  );
}

// أي دي مميز — بطاقة هوية
function IdIcon() {
  return (
    <svg viewBox={VB} width="100%" height="100%" aria-hidden="true">
      <rect x="3.5" y="6" width="17" height="12" rx="2.4" fill="#7c9bff" />
      <circle cx="8.5" cy="11" r="2" fill="#fff" />
      <path d="M5.4 16c0-1.7 1.4-2.6 3.1-2.6s3.1.9 3.1 2.6z" fill="#fff" />
      <g stroke="#fff" strokeWidth="1.5" strokeLinecap="round">
        <path d="M14 10.5h4" />
        <path d="M14 13.5h2.6" />
      </g>
    </svg>
  );
}

// الشارة — وسام
function MedalIcon() {
  return (
    <svg viewBox={VB} width="100%" height="100%" aria-hidden="true">
      <path d="M8.5 3.5 12 9l-2 2-3.5-5.5z" fill="#7fd0ff" />
      <path d="M15.5 3.5 12 9l2 2 3.5-5.5z" fill="#5fb0ee" />
      <circle cx="12" cy="15.5" r="5" fill="#ffcf3f" />
      <circle cx="12" cy="15.5" r="5" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="0.8" />
      <path d="m12 12.6 1 2 2.2.2-1.7 1.5.6 2.2-2.1-1.2-2.1 1.2.6-2.2-1.7-1.5 2.2-.2z" fill="#e89a18" />
    </svg>
  );
}

// دعوة الأصدقاء — شخصان
function InviteIcon() {
  return (
    <svg viewBox={VB} width="100%" height="100%" aria-hidden="true">
      <circle cx="9" cy="9" r="3" fill="#ff8fb3" />
      <path d="M3.6 18.5c0-3 2.4-4.6 5.4-4.6s5.4 1.6 5.4 4.6z" fill="#ff8fb3" />
      <circle cx="16" cy="9.5" r="2.4" fill="#ffc36b" />
      <path d="M14 18.5c0-2.6 1.8-4 4-4 1.4 0 2.6.5 3.3 1.5" fill="#ffc36b" />
    </svg>
  );
}

// مساهمة الأغاني — نوتة موسيقية
function MusicIcon() {
  return (
    <svg viewBox={VB} width="100%" height="100%" aria-hidden="true">
      <path d="M16.5 4.5v9.3" fill="none" stroke="#42d9a6" strokeWidth="2" strokeLinecap="round" />
      <path d="M8.5 7v9.3" fill="none" stroke="#42d9a6" strokeWidth="2" strokeLinecap="round" />
      <path d="M8.5 7 16.5 4.5" fill="none" stroke="#42d9a6" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="6.6" cy="16.6" rx="2.4" ry="1.9" fill="#42d9a6" />
      <ellipse cx="14.6" cy="14.1" rx="2.4" ry="1.9" fill="#42d9a6" />
    </svg>
  );
}

const ICONS = {
  // سريعة
  visitors: VisitorsIcon,
  home: HomeIcon,
  store: StoreIcon,
  vip: VipIcon,
  // صفوف
  moments: MomentsIcon,
  achievements: TrophyIcon,
  shop: BagShopIcon,
  bag: BackpackIcon,
  vipid: IdIcon,
  badge: MedalIcon,
  invite: InviteIcon,
  songs: MusicIcon,
};

export default function ProfileIcon({ id }) {
  const Cmp = ICONS[id];
  if (!Cmp) return null;
  return <Cmp />;
}
