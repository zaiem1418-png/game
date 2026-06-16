// ===== شخصيات SVG أصلية (تصميم خاص — رسوم متجهية كرتونية) =====
// كل شخصية بِنية رأس + كتفين تُطلّ من خلف الطاولة. أبعاد المرجع ~ 90×90.

function Shoulders({ color, dark }) {
  return (
    <path
      d="M -42 90 C -42 52 -22 40 0 40 C 22 40 42 52 42 90 Z"
      fill={color}
      stroke={dark}
      strokeWidth="2"
    />
  );
}

/* أسد بمِعطف ملكي — الماسكوت الرئيسي */
export function LionChar() {
  return (
    <g>
      <Shoulders color="#6b4bd6" dark="#4a2fae" />
      {/* العُرف */}
      <g>
        {Array.from({ length: 14 }).map((_, i) => {
          const a = (i / 14) * Math.PI * 2;
          return (
            <circle key={i} cx={Math.cos(a) * 34} cy={Math.sin(a) * 34 - 6} r="11" fill="#b9772e" />
          );
        })}
      </g>
      {/* الوجه */}
      <circle cx="0" cy="-6" r="32" fill="#f0b65a" />
      <circle cx="-22" cy="-26" r="9" fill="#e0a24a" />
      <circle cx="22" cy="-26" r="9" fill="#e0a24a" />
      {/* الكمامة */}
      <ellipse cx="0" cy="6" rx="18" ry="14" fill="#ffe1a8" />
      <circle cx="-10" cy="-8" r="6" fill="#fff" />
      <circle cx="10" cy="-8" r="6" fill="#fff" />
      <circle cx="-9" cy="-7" r="3.4" fill="#27231d" />
      <circle cx="11" cy="-7" r="3.4" fill="#27231d" />
      <path d="M -6 2 L 6 2 L 0 9 Z" fill="#5a3b2a" />
      <path d="M 0 9 Q 0 16 -7 16 M 0 9 Q 0 16 7 16" stroke="#5a3b2a" strokeWidth="2.2" fill="none" />
    </g>
  );
}

/* رجل بالشماغ */
export function ArabManChar() {
  return (
    <g>
      <Shoulders color="#d9d2c4" dark="#b3aa97" />
      {/* الوجه */}
      <circle cx="0" cy="-4" r="30" fill="#e9b486" />
      {/* الغترة */}
      <path d="M -34 -10 C -34 -40 34 -40 34 -10 L 30 -2 C 18 -16 -18 -16 -30 -2 Z" fill="#f5f2ec" stroke="#d8d2c4" strokeWidth="1.5" />
      <path d="M -34 -10 L -40 36 L -22 26 L -18 -4 Z" fill="#f5f2ec" stroke="#d8d2c4" strokeWidth="1.5" />
      <path d="M 34 -10 L 40 36 L 22 26 L 18 -4 Z" fill="#f5f2ec" stroke="#d8d2c4" strokeWidth="1.5" />
      {/* العقال */}
      <path d="M -32 -14 Q 0 -28 32 -14" stroke="#2b2b2b" strokeWidth="5" fill="none" />
      {/* العيون + اللحية */}
      <circle cx="-11" cy="-6" r="3.4" fill="#3a2a1d" />
      <circle cx="11" cy="-6" r="3.4" fill="#3a2a1d" />
      <path d="M -16 6 Q 0 30 16 6 Q 12 22 0 24 Q -12 22 -16 6 Z" fill="#5a4031" />
      <path d="M -6 6 Q 0 12 6 6" stroke="#7a5a44" strokeWidth="2" fill="none" />
    </g>
  );
}

/* امرأة بالحجاب */
export function HijabWomanChar() {
  return (
    <g>
      <Shoulders color="#1f9d8f" dark="#147a6e" />
      {/* الحجاب الخلفي */}
      <path d="M -36 6 C -40 -42 40 -42 36 6 L 30 18 C 30 -22 -30 -22 -30 18 Z" fill="#7a4fd0" />
      {/* الوجه */}
      <circle cx="0" cy="-2" r="27" fill="#f0bc92" />
      {/* الحجاب الأمامي */}
      <path d="M -30 -2 C -30 -34 30 -34 30 -2 C 22 -16 -22 -16 -30 -2 Z" fill="#9a6bff" />
      <path d="M -30 -2 Q -34 18 -20 24 L -16 0 Z" fill="#9a6bff" />
      <path d="M 30 -2 Q 34 18 20 24 L 16 0 Z" fill="#9a6bff" />
      <circle cx="-10" cy="-2" r="3.2" fill="#3a2a1d" />
      <circle cx="10" cy="-2" r="3.2" fill="#3a2a1d" />
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
      <Shoulders color="#c44a3a" dark="#9c3528" />
      <circle cx="0" cy="-4" r="29" fill="#e6a878" />
      {/* الشعر */}
      <path d="M -30 -8 C -32 -40 32 -40 30 -8 C 22 -22 16 -18 14 -14 C 6 -22 -6 -22 -14 -14 C -16 -18 -22 -22 -30 -8 Z" fill="#2c2118" />
      <circle cx="-10" cy="-4" r="3.4" fill="#2c2118" />
      <circle cx="10" cy="-4" r="3.4" fill="#2c2118" />
      <path d="M -7 8 Q 0 13 7 8" stroke="#a86a48" strokeWidth="2.2" fill="none" />
      {/* لحية خفيفة */}
      <path d="M -14 6 Q 0 26 14 6 Q 10 18 0 20 Q -10 18 -14 6 Z" fill="#3a2a1d" opacity="0.55" />
    </g>
  );
}

/* خريطة الأنواع → المكوّن */
export const CHAR_MAP = {
  lion: LionChar,
  beard: ArabManChar,
  hijab: HijabWomanChar,
  guy: YoungManChar,
};
