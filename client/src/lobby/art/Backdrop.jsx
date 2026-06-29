// ===== خلفية المشهد: قاعة قصر شرقية مزخرفة (أقواس + فوانيس + أعمدة + هالة ضوء) =====
// SVG أصلي بالكامل، يملأ البطاقة (slice). لكل لعبة لوحة ألوان خاصة تُشتقّ من ثيمها.
// مرجع 340×280 — نفس مرجع GameArt حتى تتطابق طبقتا الخلفية والمقدّمة.

// لوحة ألوان دافئة/باردة لكل لعبة: جدار بعيد، جدار قريب، توهّج، ذهب الزخرفة.
const PALETTE = {
  jackaroo: { far: "#3a1850", near: "#1c0c2c", warm: "#7a3aa6", glow: "#c98bff", gold: "#f5c451" },
  ludo:     { far: "#5a2e16", near: "#241208", warm: "#a8631f", glow: "#ffb347", gold: "#ffd24a" },
  baloot:   { far: "#6a2c12", near: "#2a1208", warm: "#b5471c", glow: "#ff9a4d", gold: "#ffce5a" },
  snake:    { far: "#134a5a", near: "#08222a", warm: "#1f7d8a", glow: "#4fe0cf", gold: "#7fffd4" },
};

/* قوس مدبّب (على الطراز الإسلامي) — مسار حول مركز سيني cx بعرض w وارتفاع h */
function archPath(cx, top, w, h) {
  const l = cx - w / 2;
  const r = cx + w / 2;
  const base = top + h;
  const sh = h * 0.42; // ارتفاع الجزء المستقيم قبل بداية القوس
  return `M ${l} ${base}
          L ${l} ${top + sh}
          C ${l} ${top + sh * 0.4}, ${cx - w * 0.18} ${top}, ${cx} ${top}
          C ${cx + w * 0.18} ${top}, ${r} ${top + sh * 0.4}, ${r} ${top + sh}
          L ${r} ${base} Z`;
}

/* فانوس معلّق متوهّج */
function Lantern({ x, y, scale = 1, color = "#ffcf6a", delay = 0 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className="gl-bd-sway" style={{ animationDelay: `${delay}s` }}>
        {/* سلسلة التعليق */}
        <line x1="0" y1="-46" x2="0" y2="-14" stroke="#caa23a" strokeWidth="1.4" opacity="0.7" />
        {/* هالة الضوء */}
        <circle cx="0" cy="8" r="26" fill={color} opacity="0.18" />
        {/* تاج علوي */}
        <path d="M -7 -14 L 7 -14 L 4 -8 L -4 -8 Z" fill="#caa23a" />
        <circle cx="0" cy="-16" r="2.4" fill="#ffe9a8" />
        {/* جسم الفانوس */}
        <path d="M -9 -8 Q 0 -12 9 -8 L 11 14 Q 0 20 -11 14 Z"
          fill={color} stroke="#caa23a" strokeWidth="1.3" opacity="0.92" />
        <path d="M -9 -8 Q 0 -12 9 -8 L 11 14 Q 0 20 -11 14 Z"
          fill="url(#bdLanternGlow)" />
        {/* أضلاع زخرفية */}
        <line x1="0" y1="-10" x2="0" y2="18" stroke="#caa23a" strokeWidth="0.8" opacity="0.6" />
        <line x1="-5.5" y1="-9" x2="-7" y2="16" stroke="#caa23a" strokeWidth="0.7" opacity="0.5" />
        <line x1="5.5" y1="-9" x2="7" y2="16" stroke="#caa23a" strokeWidth="0.7" opacity="0.5" />
        {/* ذيل سفلي */}
        <path d="M -4 18 L 4 18 L 0 24 Z" fill="#caa23a" />
      </g>
    </g>
  );
}

export default function Backdrop({ game }) {
  const p = PALETTE[game.id] || PALETTE.jackaroo;
  const uid = `bd-${game.id}`;

  return (
    <svg
      className="gl-backdrop"
      viewBox="0 0 340 280"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        {/* تدرّج الجدار العام */}
        <radialGradient id={`${uid}-wall`} cx="50%" cy="20%" r="95%">
          <stop offset="0%" stopColor={p.warm} />
          <stop offset="48%" stopColor={p.far} />
          <stop offset="100%" stopColor={p.near} />
        </radialGradient>
        {/* توهّج القوس المركزي */}
        <radialGradient id={`${uid}-arch`} cx="50%" cy="78%" r="80%">
          <stop offset="0%" stopColor={p.glow} stopOpacity="0.9" />
          <stop offset="55%" stopColor={p.warm} stopOpacity="0.55" />
          <stop offset="100%" stopColor={p.far} stopOpacity="0" />
        </radialGradient>
        {/* وهج الأرضية */}
        <linearGradient id={`${uid}-floor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.warm} stopOpacity="0.55" />
          <stop offset="100%" stopColor={p.near} stopOpacity="0.95" />
        </linearGradient>
        {/* تدرّج العمود */}
        <linearGradient id={`${uid}-col`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={p.near} />
          <stop offset="35%" stopColor={p.warm} />
          <stop offset="60%" stopColor={p.far} />
          <stop offset="100%" stopColor={p.near} />
        </linearGradient>
        {/* لمعان الفانوس (معرّف عام) */}
        <radialGradient id="bdLanternGlow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fff7e0" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffcf6a" stopOpacity="0" />
        </radialGradient>
        {/* أشعة ضوئية ناعمة */}
        <linearGradient id={`${uid}-ray`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.glow} stopOpacity="0.0" />
          <stop offset="100%" stopColor={p.glow} stopOpacity="0.22" />
        </linearGradient>
        {/* قناع لإبقاء الزخرفة داخل الإطار */}
        <clipPath id={`${uid}-clip`}>
          <rect x="0" y="0" width="340" height="280" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${uid}-clip)`}>
        {/* الجدار */}
        <rect x="0" y="0" width="340" height="280" fill={`url(#${uid}-wall)`} />

        {/* قوس بعيد كبير في عمق القاعة (نافذة مضيئة) */}
        <path d={archPath(170, 20, 150, 200)} fill={`url(#${uid}-arch)`} />
        <path d={archPath(170, 20, 150, 200)} fill="none" stroke={p.gold} strokeWidth="2.2" opacity="0.5" />
        <path d={archPath(170, 30, 124, 178)} fill="none" stroke={p.gold} strokeWidth="1" opacity="0.35" />

        {/* مشربية: شبكة معيّنات خفيفة داخل القوس */}
        <g opacity="0.16" stroke={p.gold} strokeWidth="0.7">
          {Array.from({ length: 7 }).map((_, i) => (
            <line key={`a${i}`} x1={120 + i * 16} y1="44" x2={120 + i * 16} y2="210" />
          ))}
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={`b${i}`} x1="116" y1={56 + i * 18} x2="224" y2={56 + i * 18} />
          ))}
        </g>

        {/* أشعة ضوء تتدلّى من القوس */}
        <g opacity="0.6">
          <polygon points="150,40 190,40 210,250 130,250" fill={`url(#${uid}-ray)`} />
          <polygon points="166,40 174,40 184,250 156,250" fill={`url(#${uid}-ray)`} />
        </g>

        {/* أعمدة جانبية مزخرفة */}
        {[28, 312].map((cx, i) => (
          <g key={i}>
            <rect x={cx - 16} y="34" width="32" height="210" rx="5" fill={`url(#${uid}-col)`} />
            {/* تاج العمود */}
            <rect x={cx - 21} y="30" width="42" height="12" rx="3" fill={p.warm} stroke={p.gold} strokeWidth="1" opacity="0.9" />
            <rect x={cx - 21} y="236" width="42" height="12" rx="3" fill={p.near} stroke={p.gold} strokeWidth="1" opacity="0.8" />
            {/* تخديد العمود */}
            <line x1={cx - 6} y1="44" x2={cx - 6} y2="234" stroke={p.gold} strokeWidth="0.8" opacity="0.25" />
            <line x1={cx + 6} y1="44" x2={cx + 6} y2="234" stroke={p.near} strokeWidth="1.2" opacity="0.4" />
          </g>
        ))}

        {/* شريط زخرفي علوي (مقرنصات مبسّطة) */}
        <g opacity="0.85">
          <rect x="0" y="0" width="340" height="16" fill={p.near} />
          <rect x="0" y="14" width="340" height="3" fill={p.gold} opacity="0.6" />
          {Array.from({ length: 19 }).map((_, i) => (
            <path key={i} d={`M ${i * 18} 16 L ${i * 18 + 9} 26 L ${i * 18 + 18} 16 Z`}
              fill={p.warm} opacity="0.5" />
          ))}
        </g>

        {/* فوانيس معلّقة متوهّجة */}
        <Lantern x={70} y={70} scale={1.05} color={p.gold} delay={0} />
        <Lantern x={270} y={64} scale={0.9} color={p.gold} delay={0.8} />
        <Lantern x={170} y={48} scale={0.7} color={p.glow} delay={1.4} />

        {/* الأرضية اللامعة */}
        <rect x="0" y="232" width="340" height="48" fill={`url(#${uid}-floor)`} />
        <ellipse cx="170" cy="236" rx="180" ry="20" fill={p.glow} opacity="0.12" />

        {/* جزيئات ضوئية عائمة (بوكيه) */}
        <g className="gl-bd-bokeh">
          {[[60, 120, 3], [250, 100, 4], [110, 80, 2.4], [210, 150, 3], [300, 170, 2.6], [40, 180, 3.4]].map(
            ([x, y, r], i) => (
              <circle key={i} cx={x} cy={y} r={r} fill={p.glow} opacity="0.25"
                style={{ animationDelay: `${i * 0.7}s` }} />
            )
          )}
        </g>
      </g>
    </svg>
  );
}
