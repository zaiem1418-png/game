// مكتبة أيقونات SVG موحّدة للشاشة الرئيسية وعناصر الواجهة المتكرّرة.
// نفس نمط ProfileIcons: زجاج/تدرّجات ملوّنة، شبكة 24px، تملأ حاويتها.
// تُستعمل في العملات، صفّ الترتيب، الأيقونات الجانبية، الأنماط والإجراءات.

const VB = "0 0 24 24";
const wrap = (children) => (
  <svg viewBox={VB} width="100%" height="100%" aria-hidden="true">{children}</svg>
);

/* ===== العملات ===== */
// ألماس
function Diamond() {
  return wrap(<>
    <defs><linearGradient id="gi-dia" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#8be9ff" /><stop offset="1" stopColor="#1f9fd6" />
    </linearGradient></defs>
    <path d="M7 4h10l4 5-9 11L3 9z" fill="url(#gi-dia)" />
    <g stroke="#fff" strokeOpacity="0.55" strokeWidth="0.9" fill="none" strokeLinejoin="round">
      <path d="M3 9h18" /><path d="M9 4 7 9l5 11" /><path d="M15 4l2 5-5 11" />
    </g>
  </>);
}
// عملة ذهبية
function Coin() {
  return wrap(<>
    <defs><linearGradient id="gi-coin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ffe487" /><stop offset="1" stopColor="#f0a429" />
    </linearGradient></defs>
    <circle cx="12" cy="12" r="9" fill="url(#gi-coin)" />
    <circle cx="12" cy="12" r="6.4" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.1" />
    <path d="M12 8.2v7.6M9.4 12h5.2" stroke="#b9760f" strokeWidth="1.6" strokeLinecap="round" />
  </>);
}
// نجمة (نقاط/مكافأة)
function Star() {
  return wrap(<>
    <defs><linearGradient id="gi-star" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#d6a6ff" /><stop offset="1" stopColor="#8a3dff" />
    </linearGradient></defs>
    <path d="m12 3 2.6 5.5L20.5 9l-4.4 4.3 1.1 6.1L12 16.5 6.8 19.4l1.1-6.1L3.5 9l5.9-.5z" fill="url(#gi-star)" />
    <path d="m12 3 2.6 5.5L20.5 9l-4.4 4.3 1.1 6.1L12 16.5 6.8 19.4l1.1-6.1L3.5 9l5.9-.5z" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="0.8" strokeLinejoin="round" />
  </>);
}

/* ===== أيقونات عامة ===== */
// هدية
function Gift() {
  return wrap(<>
    <defs><linearGradient id="gi-gift" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ff7aa8" /><stop offset="1" stopColor="#e23d76" />
    </linearGradient></defs>
    <rect x="4" y="9.5" width="16" height="10.5" rx="1.8" fill="url(#gi-gift)" />
    <rect x="3" y="6.5" width="18" height="4" rx="1.2" fill="#ffd24a" />
    <rect x="10.5" y="6.5" width="3" height="13.5" fill="#ffeaa0" />
    <path d="M12 6.5c-2.5-3.6-6-1-3.2 0M12 6.5c2.5-3.6 6-1 3.2 0" fill="none" stroke="#ffd24a" strokeWidth="1.6" strokeLinecap="round" />
  </>);
}
// كأس البطولة
function Trophy() {
  return wrap(<>
    <defs><linearGradient id="gi-tro" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ffe06a" /><stop offset="1" stopColor="#e7a32a" />
    </linearGradient></defs>
    <path d="M7 4h10v4.5a5 5 0 0 1-10 0z" fill="url(#gi-tro)" />
    <path d="M7 5H4.4v1.8A3 3 0 0 0 7 9.7M17 5h2.6v1.8A3 3 0 0 1 17 9.7" fill="none" stroke="url(#gi-tro)" strokeWidth="1.6" strokeLinecap="round" />
    <rect x="10.6" y="12.6" width="2.8" height="3" fill="#c8881f" />
    <path d="M7.6 16h8.8l.8 3.6H6.8z" fill="#ffce5a" />
  </>);
}
// تاج VIP
function Crown() {
  return wrap(<>
    <defs><linearGradient id="gi-crown" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ffe487" /><stop offset="1" stopColor="#f0a429" />
    </linearGradient></defs>
    <path d="M4 8.5 7.5 12 12 6l4.5 6L20 8.5l-1.4 9.2a1 1 0 0 1-1 .85H6.4a1 1 0 0 1-1-.85z" fill="url(#gi-crown)" />
    <g fill="#fff"><circle cx="4" cy="8.5" r="1.4" /><circle cx="20" cy="8.5" r="1.4" /><circle cx="12" cy="5.6" r="1.5" /></g>
    <circle cx="12" cy="15" r="1.2" fill="#c8881f" />
  </>);
}
// أصدقاء
function Friends() {
  return wrap(<>
    <circle cx="9" cy="9" r="3" fill="#ff8fb3" />
    <path d="M3.6 18.6c0-3 2.4-4.6 5.4-4.6s5.4 1.6 5.4 4.6z" fill="#ff8fb3" />
    <circle cx="16.2" cy="9.6" r="2.4" fill="#6cc6ff" />
    <path d="M14.2 18.6c0-2.6 1.8-4 4-4 1.5 0 2.7.5 3.4 1.6" fill="#6cc6ff" />
  </>);
}
// مهام — قائمة بعلامة صح
function Tasks() {
  return wrap(<>
    <rect x="4" y="3.5" width="16" height="17" rx="2.4" fill="#4ec98a" />
    <rect x="4" y="3.5" width="16" height="17" rx="2.4" fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="0.8" />
    <path d="m8 11.5 2.3 2.3L16 8.4" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
  </>);
}
// بطاقة المجد — وسام بشريط
function Medal() {
  return wrap(<>
    <path d="M8.5 3.5 12 9l-2 2-3.5-5.5z" fill="#7fd0ff" />
    <path d="M15.5 3.5 12 9l2 2 3.5-5.5z" fill="#5fb0ee" />
    <circle cx="12" cy="15.5" r="5" fill="#ffcf3f" />
    <path d="m12 12.6 1 2 2.2.2-1.7 1.5.6 2.2-2.1-1.2-2.1 1.2.6-2.2-1.7-1.5 2.2-.2z" fill="#e89a18" />
  </>);
}
// هلال (مناسبة)
function Moon() {
  return wrap(<>
    <defs><linearGradient id="gi-moon" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#ffe9a8" /><stop offset="1" stopColor="#f0b43a" />
    </linearGradient></defs>
    <path d="M16.5 16.8A7.5 7.5 0 1 1 14 3.6 6 6 0 0 0 16.5 16.8z" fill="url(#gi-moon)" />
    <path d="m18.5 5 .7 1.7L21 7.4l-1.8.7-.7 1.7-.7-1.7L16 7.4l1.8-.7z" fill="#ffe9a8" />
  </>);
}

/* ===== أيقونات الأنماط ===== */
// أوراق لعب
function Cards() {
  return wrap(<>
    <rect x="6.5" y="5" width="10" height="14" rx="1.8" fill="#fff" transform="rotate(-12 11.5 12)" />
    <rect x="8.5" y="5" width="10" height="14" rx="1.8" fill="#ffe9ef" stroke="#e23d76" strokeWidth="0.8" transform="rotate(8 13.5 12)" />
    <path d="M13.6 9.5c1.6-1.6 3.4.2 0 2.4-3.4-2.2-1.6-4 0-2.4z" fill="#e23d76" />
  </>);
}
// نرد
function Dice() {
  return wrap(<>
    <defs><linearGradient id="gi-dice" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#e2e6ee" />
    </linearGradient></defs>
    <rect x="4" y="4" width="16" height="16" rx="3.4" fill="url(#gi-dice)" />
    <g fill="#c0392b"><circle cx="8.5" cy="8.5" r="1.5" /><circle cx="15.5" cy="8.5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="8.5" cy="15.5" r="1.5" /><circle cx="15.5" cy="15.5" r="1.5" /></g>
  </>);
}
// سيفان
function Swords() {
  return wrap(<>
    <g stroke="#cfd6e2" strokeWidth="2.4" strokeLinecap="round"><path d="M4 4 14 14" /><path d="M20 4 10 14" /></g>
    <g stroke="#8a93a6" strokeWidth="2.4" strokeLinecap="round"><path d="M4.5 19.5 8 16" /><path d="M19.5 19.5 16 16" /></g>
    <path d="M11.5 14.5 14 17m-4.5-2.5L7 17" fill="none" stroke="#f5c451" strokeWidth="1.6" strokeLinecap="round" />
  </>);
}
// قوس وسهم
function Bow() {
  return wrap(<>
    <path d="M6 3a14 14 0 0 1 0 18" fill="none" stroke="#caa23a" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M6 3 6 21" fill="none" stroke="#8a6bff" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M5 12h15M16 8.5 20.5 12 16 15.5" fill="none" stroke="#f0e6ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </>);
}
// برق (سريع)
function Bolt() {
  return wrap(<>
    <defs><linearGradient id="gi-bolt" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#fff1a8" /><stop offset="1" stopColor="#f5a623" />
    </linearGradient></defs>
    <path d="M13 2 5 13h5l-1 9 9-12h-5z" fill="url(#gi-bolt)" stroke="#fff" strokeOpacity="0.5" strokeWidth="0.8" strokeLinejoin="round" />
  </>);
}

/* ===== أيقونات وظيفية ===== */
// بحث
function Search() {
  return wrap(<>
    <circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M15 15l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </>);
}
// سلّة حذف
function Trash() {
  return wrap(<>
    <path d="M5 7h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M6.5 7l.9 11.4a1.6 1.6 0 0 0 1.6 1.5h6a1.6 1.6 0 0 0 1.6-1.5L17.5 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M10 10.5v6M14 10.5v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </>);
}
// قفل
function Lock() {
  return wrap(<>
    <rect x="5" y="10" width="14" height="10" rx="2.2" fill="currentColor" />
    <path d="M8 10V8a4 4 0 0 1 8 0v2" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="14.5" r="1.6" fill="#1f0e2e" />
  </>);
}
// ميكروفون (غلاف غرفة)
function Mic() {
  return wrap(<>
    <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    <path d="M12 18v3M8.5 21h7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
  </>);
}
// أعضاء/مجموعة
function Users() {
  return wrap(<>
    <circle cx="9" cy="8.5" r="3" fill="currentColor" />
    <path d="M3.6 18c0-3 2.4-4.6 5.4-4.6s5.4 1.6 5.4 4.6z" fill="currentColor" />
    <circle cx="16.4" cy="9" r="2.3" fill="currentColor" opacity="0.75" />
    <path d="M14.4 18c0-2.5 1.8-3.9 4-3.9 1.5 0 2.7.5 3.4 1.6" fill="currentColor" opacity="0.75" />
  </>);
}
// نجمة مفرّغة (مفضّلة غير مفعّلة)
function StarOutline() {
  return wrap(
    <path d="m12 3.5 2.5 5.1 5.6.5-4.2 3.7 1.2 5.5L12 20.9l-5.1 2.9 1.2-5.5L3.9 9.1l5.6-.5z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  );
}

const ICONS = {
  diamond: Diamond, coin: Coin, star: Star,
  search: Search, trash: Trash, lock: Lock, mic: Mic, users: Users, starOutline: StarOutline,
  gift: Gift, trophy: Trophy, crown: Crown, friends: Friends,
  tasks: Tasks, glory: Medal, moon: Moon, worldcup: Trophy,
  cards: Cards, dice: Dice, swords: Swords, bow: Bow, bolt: Bolt,
  tournaments: Trophy, vip: Crown,
};

export default function GameIcon({ id }) {
  const Cmp = ICONS[id];
  if (!Cmp) return null;
  return <Cmp />;
}
