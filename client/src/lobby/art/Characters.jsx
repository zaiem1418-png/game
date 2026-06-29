// ===== شخصيات SVG أصلية (تصميم خاص — رسوم متجهية كرتونية) =====
// كل شخصية: رأس + كتفان/صدر تُطلّ من خلف الطاولة. أبعاد المرجع ~ 96×104.
// أُضيف للأسد تاج ملكي ورداء مزخرف ليتطابق مع ماسكوت اللعبة.

/* كتفان/صدر برداء — قاعدة كل شخصية */
function Torso({ color, dark, trim }) {
  return (
    <g>
      <path
        d="M -46 104 C -46 56 -24 42 0 42 C 24 42 46 56 46 104 Z"
        fill={color}
        stroke={dark}
        strokeWidth="2.4"
      />
      {/* فتحة الياقة */}
      <path d="M -16 44 Q 0 60 16 44 L 12 70 Q 0 80 -12 70 Z" fill={dark} opacity="0.55" />
      {trim && (
        <>
          <path d="M -16 44 Q 0 60 16 44" fill="none" stroke={trim} strokeWidth="3" />
          <path d="M -40 86 Q 0 70 40 86" fill="none" stroke={trim} strokeWidth="2.5" opacity="0.8" />
        </>
      )}
    </g>
  );
}

/* تاج ملكي ذهبي */
function Crown() {
  return (
    <g transform="translate(0 -40)">
      <path d="M -26 8 L -26 -10 L -14 2 L 0 -16 L 14 2 L 26 -10 L 26 8 Z"
        fill="#ffd24a" stroke="#c8901f" strokeWidth="2" strokeLinejoin="round" />
      <rect x="-27" y="6" width="54" height="8" rx="3" fill="#f0b021" stroke="#c8901f" strokeWidth="1.5" />
      {/* جواهر */}
      <circle cx="-14" cy="-2" r="3" fill="#e74c3c" />
      <circle cx="0" cy="-8" r="3.4" fill="#2ecc71" />
      <circle cx="14" cy="-2" r="3" fill="#3aa3ff" />
      {/* كرات على القمم */}
      <circle cx="-26" cy="-12" r="2.6" fill="#fff3c4" />
      <circle cx="0" cy="-18" r="2.8" fill="#fff3c4" />
      <circle cx="26" cy="-12" r="2.6" fill="#fff3c4" />
      <rect x="-27" y="9" width="54" height="2" fill="#fff7e0" opacity="0.6" />
    </g>
  );
}

/* أسد — الماسكوت. king ⇒ يضيف تاجاً ورداءً ملكياً بنفسجياً مذهّباً */
export function LionChar({ king = false }) {
  return (
    <g>
      <Torso
        color={king ? "#6b3fd6" : "#5a4bc4"}
        dark={king ? "#43249e" : "#3a2f9a"}
        trim={king ? "#ffd24a" : "#8a7be0"}
      />
      {/* العُرف */}
      <g>
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return (
            <circle key={i} cx={Math.cos(a) * 35} cy={Math.sin(a) * 35 - 6} r="11.5"
              fill={i % 2 ? "#a8661f" : "#b9772e"} />
          );
        })}
      </g>
      {/* الوجه */}
      <circle cx="0" cy="-6" r="33" fill="#f0b65a" />
      <circle cx="-23" cy="-27" r="9.5" fill="#e0a24a" />
      <circle cx="23" cy="-27" r="9.5" fill="#e0a24a" />
      <circle cx="-23" cy="-27" r="4.5" fill="#f7c873" />
      <circle cx="23" cy="-27" r="4.5" fill="#f7c873" />
      {/* الكمامة */}
      <ellipse cx="0" cy="7" rx="19" ry="15" fill="#ffe1a8" />
      <circle cx="-10" cy="-8" r="6.5" fill="#fff" />
      <circle cx="10" cy="-8" r="6.5" fill="#fff" />
      <circle cx="-9" cy="-7" r="3.6" fill="#27231d" />
      <circle cx="11" cy="-7" r="3.6" fill="#27231d" />
      <circle cx="-7.6" cy="-8.4" r="1.2" fill="#fff" />
      <circle cx="12.4" cy="-8.4" r="1.2" fill="#fff" />
      <path d="M -6 2 L 6 2 L 0 10 Z" fill="#5a3b2a" />
      <path d="M 0 10 Q 0 17 -7 17 M 0 10 Q 0 17 7 17" stroke="#5a3b2a" strokeWidth="2.4" fill="none" />
      {/* شعيرات */}
      <g stroke="#caa276" strokeWidth="1" opacity="0.7">
        <line x1="-16" y1="6" x2="-30" y2="2" /><line x1="-16" y1="10" x2="-30" y2="10" />
        <line x1="16" y1="6" x2="30" y2="2" /><line x1="16" y1="10" x2="30" y2="10" />
      </g>
      {king && <Crown />}
    </g>
  );
}

/* رجل بالشماغ */
export function ArabManChar() {
  return (
    <g>
      <Torso color="#d9d2c4" dark="#b3aa97" trim="#c9bfa6" />
      <circle cx="0" cy="-4" r="31" fill="#e9b486" />
      {/* الغترة */}
      <path d="M -35 -10 C -35 -42 35 -42 35 -10 L 31 -2 C 18 -17 -18 -17 -31 -2 Z"
        fill="#f7f4ee" stroke="#d8d2c4" strokeWidth="1.5" />
      <path d="M -35 -10 L -42 40 L -22 28 L -18 -4 Z" fill="#f1ede4" stroke="#d8d2c4" strokeWidth="1.5" />
      <path d="M 35 -10 L 42 40 L 22 28 L 18 -4 Z" fill="#f7f4ee" stroke="#d8d2c4" strokeWidth="1.5" />
      {/* نقشة الشماغ */}
      <g stroke="#cf3b34" strokeWidth="1" opacity="0.35">
        <line x1="-34" y1="-2" x2="-22" y2="-10" /><line x1="-26" y1="6" x2="-14" y2="-2" />
      </g>
      {/* العقال */}
      <path d="M -33 -14 Q 0 -29 33 -14" stroke="#2b2b2b" strokeWidth="5.5" fill="none" />
      <path d="M -33 -10 Q 0 -25 33 -10" stroke="#1a1a1a" strokeWidth="2.5" fill="none" opacity="0.7" />
      <circle cx="-11" cy="-6" r="3.6" fill="#3a2a1d" />
      <circle cx="11" cy="-6" r="3.6" fill="#3a2a1d" />
      <circle cx="-9.8" cy="-7" r="1.1" fill="#fff" />
      <circle cx="12.2" cy="-7" r="1.1" fill="#fff" />
      {/* لحية */}
      <path d="M -17 6 Q 0 32 17 6 Q 13 24 0 26 Q -13 24 -17 6 Z" fill="#5a4031" />
      <path d="M -6 6 Q 0 13 6 6" stroke="#7a5a44" strokeWidth="2" fill="none" />
    </g>
  );
}

/* امرأة بالحجاب */
export function HijabWomanChar() {
  return (
    <g>
      <Torso color="#1f9d8f" dark="#147a6e" trim="#54d3c4" />
      {/* الحجاب الخلفي */}
      <path d="M -38 8 C -42 -44 42 -44 38 8 L 31 20 C 31 -24 -31 -24 -31 20 Z" fill="#6f46c4" />
      <circle cx="0" cy="-2" r="28" fill="#f0bc92" />
      {/* الحجاب الأمامي */}
      <path d="M -31 -2 C -31 -36 31 -36 31 -2 C 22 -17 -22 -17 -31 -2 Z" fill="#9a6bff" />
      <path d="M -31 -2 Q -35 20 -20 26 L -16 0 Z" fill="#8a5bf0" />
      <path d="M 31 -2 Q 35 20 20 26 L 16 0 Z" fill="#8a5bf0" />
      {/* حافة مطرّزة */}
      <path d="M -28 -4 C -28 -32 28 -32 28 -4" fill="none" stroke="#ffd24a" strokeWidth="1.6" opacity="0.7" />
      <circle cx="-10" cy="-2" r="3.4" fill="#3a2a1d" />
      <circle cx="10" cy="-2" r="3.4" fill="#3a2a1d" />
      <circle cx="-8.8" cy="-3" r="1.1" fill="#fff" />
      <circle cx="11.2" cy="-3" r="1.1" fill="#fff" />
      <path d="M -7 9 Q 0 14 7 9" stroke="#b06a4a" strokeWidth="2.2" fill="none" />
      <circle cx="-15" cy="6" r="4" fill="#ff9aa6" opacity="0.5" />
      <circle cx="15" cy="6" r="4" fill="#ff9aa6" opacity="0.5" />
    </g>
  );
}

/* شاب بشعر داكن */
export function YoungManChar() {
  return (
    <g>
      <Torso color="#c44a3a" dark="#9c3528" trim="#e0705f" />
      <circle cx="0" cy="-4" r="30" fill="#e6a878" />
      {/* الشعر */}
      <path d="M -31 -8 C -33 -42 33 -42 31 -8 C 22 -23 16 -19 14 -15 C 6 -23 -6 -23 -14 -15 C -16 -19 -22 -23 -31 -8 Z"
        fill="#2c2118" />
      <path d="M -8 -34 Q 0 -30 8 -34" stroke="#1a130d" strokeWidth="2" fill="none" opacity="0.6" />
      <circle cx="-10" cy="-4" r="3.6" fill="#2c2118" />
      <circle cx="10" cy="-4" r="3.6" fill="#2c2118" />
      <circle cx="-8.8" cy="-5" r="1.1" fill="#fff" />
      <circle cx="11.2" cy="-5" r="1.1" fill="#fff" />
      <path d="M -7 8 Q 0 13 7 8" stroke="#a86a48" strokeWidth="2.2" fill="none" />
      <path d="M -14 6 Q 0 26 14 6 Q 10 18 0 20 Q -10 18 -14 6 Z" fill="#3a2a1d" opacity="0.55" />
    </g>
  );
}

/* يد تمسك مروحة أوراق — زخرفة تُوضع أمام إحدى الشخصيات */
export function CardFan({ color = "#e9b486" }) {
  const cards = [-24, -8, 8, 24];
  return (
    <g>
      {cards.map((a, i) => (
        <g key={i} transform={`rotate(${a}) translate(0 -22)`}>
          <rect x="-9" y="-14" width="18" height="26" rx="2.5" fill="#fff" stroke="#d8d2c4" strokeWidth="1" />
          <circle cx="0" cy="-6" r="2.4" fill={i % 2 ? "#d2342b" : "#1a1a1a"} />
        </g>
      ))}
      {/* اليد */}
      <ellipse cx="0" cy="10" rx="14" ry="9" fill={color} stroke="#c98f63" strokeWidth="1.4" />
      <path d="M -10 8 Q -6 2 -2 8 M -3 8 Q 1 1 5 8 M 4 8 Q 8 2 11 9"
        stroke="#c98f63" strokeWidth="1.2" fill="none" />
    </g>
  );
}

/* خريطة الأنواع → المكوّن */
export const CHAR_MAP = {
  lion: LionChar,
  king: () => <LionChar king />,
  beard: ArabManChar,
  hijab: HijabWomanChar,
  guy: YoungManChar,
};
