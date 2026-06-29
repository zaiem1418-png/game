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

/* ستارة مخملية مجمّعة في زاوية علوية مع رِباط ذهبي */
function Drape({ side = "left", color, dark, gold }) {
  const flip = side === "right";
  const g = (
    <g>
      {/* قماش متهدّل */}
      <path d="M 0 0 L 92 0 L 92 6 Q 70 96 40 150 Q 30 120 24 150 Q 18 116 12 150 Q 6 110 0 138 Z"
        fill={color} stroke={dark} strokeWidth="1.5" />
      {/* طيّات */}
      <path d="M 16 6 Q 14 90 24 140" stroke={dark} strokeWidth="2" fill="none" opacity="0.5" />
      <path d="M 40 6 Q 40 92 40 144" stroke={dark} strokeWidth="2" fill="none" opacity="0.5" />
      <path d="M 64 6 Q 66 80 50 120" stroke={dark} strokeWidth="2" fill="none" opacity="0.4" />
      {/* لمعة */}
      <path d="M 30 6 Q 28 70 34 110" stroke="#fff" strokeWidth="1.4" fill="none" opacity="0.18" />
      {/* كنّة ذهبية علوية */}
      <rect x="-4" y="-2" width="100" height="12" rx="3" fill={gold} opacity="0.9" />
      <rect x="-4" y="8" width="100" height="2.5" fill="#fff7e0" opacity="0.5" />
      {/* شراشيب */}
      {Array.from({ length: 9 }).map((_, i) => (
        <path key={i} d={`M ${i * 11 + 2} 10 l -2 8 l 4 0 z`} fill={gold} opacity="0.85" />
      ))}
    </g>
  );
  return flip ? <g transform="translate(340 0) scale(-1 1)">{g}</g> : g;
}

/* نجمة لمّاعة رباعية الأطراف — المجموعة الخارجية للموضع والداخلية للأنميشن */
function Sparkle({ x, y, s = 4, color, delay = 0 }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="gl-bd-twinkle" style={{ animationDelay: `${delay}s` }}>
        <path
          d={`M 0 ${-s * 2.4} Q ${s * 0.5} ${-s * 0.5} ${s * 2.4} 0
              Q ${s * 0.5} ${s * 0.5} 0 ${s * 2.4}
              Q ${-s * 0.5} ${s * 0.5} ${-s * 2.4} 0
              Q ${-s * 0.5} ${-s * 0.5} 0 ${-s * 2.4} Z`}
          fill={color}
        />
        <circle cx="0" cy="0" r={s * 0.5} fill="#fff7e0" />
      </g>
    </g>
  );
}

/* سجادة شرقية بمنظور أمام الطاولة (شبه منحرف) */
function Carpet({ p }) {
  return (
    <g opacity="0.95">
      {/* جسم السجادة */}
      <polygon points="92,250 248,250 286,279 54,279" fill={p.warm} stroke={p.gold} strokeWidth="1.6" />
      <polygon points="92,250 248,250 286,279 54,279" fill={p.near} opacity="0.35" />
      {/* حدّ داخلي مزدوج */}
      <polygon points="106,255 234,255 262,274 78,274" fill="none" stroke={p.gold} strokeWidth="1" opacity="0.7" />
      <polygon points="116,258 224,258 246,271 94,271" fill="none" stroke={p.glow} strokeWidth="0.8"
        opacity="0.55" strokeDasharray="3 4" />
      {/* ميدالية مركزية */}
      <g transform="translate(170 264)">
        <path d="M 0 -8 L 12 0 L 0 8 L -12 0 Z" fill={p.gold} opacity="0.85" />
        <path d="M 0 -5 L 7 0 L 0 5 L -7 0 Z" fill={p.glow} opacity="0.7" />
        <circle cx="0" cy="0" r="2" fill="#fff7e0" />
      </g>
      {/* شراشيب الحافة الأمامية */}
      {Array.from({ length: 17 }).map((_, i) => (
        <line key={i} x1={56 + i * 14} y1="279" x2={56 + i * 14} y2="283"
          stroke={p.gold} strokeWidth="1.4" opacity="0.7" />
      ))}
    </g>
  );
}

/* نافذة زجاجية ملوّنة (vitrail) تملأ داخل القوس بأشعّة ملوّنة وقضبان ذهبية */
function StainedGlass({ p, uid }) {
  const cx = 170, cy = 206;          // مركز التشعّع (قاعدة القوس)
  const a0 = -Math.PI, a1 = 0;        // نصف دائرة علوية
  const N = 12;                       // عدد الأشعّة
  const R = 196;                      // طول الشعاع
  const jewels = ["#d24b4b", p.glow, "#3bb371", p.gold, "#4a7bd2", "#e0a33a"];
  const wedges = [];
  for (let i = 0; i < N; i++) {
    const b0 = a0 + ((a1 - a0) * i) / N;
    const b1 = a0 + ((a1 - a0) * (i + 1)) / N;
    const x0 = cx + Math.cos(b0) * R, y0 = cy + Math.sin(b0) * R;
    const x1 = cx + Math.cos(b1) * R, y1 = cy + Math.sin(b1) * R;
    wedges.push(
      <path key={i} d={`M ${cx} ${cy} L ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1} Z`}
        fill={jewels[i % jewels.length]} opacity="0.42" />
    );
  }
  return (
    <g clipPath={`url(#${uid}-archclip)`}>
      {wedges}
      {/* حلقات متّحدة المركز */}
      {[60, 110, 160].map((r, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={p.gold} strokeWidth="1.4" opacity="0.5" />
      ))}
      {/* قضبان ذهبية شعاعية (cames) */}
      {Array.from({ length: N + 1 }).map((_, i) => {
        const b = a0 + ((a1 - a0) * i) / N;
        return (
          <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(b) * R} y2={cy + Math.sin(b) * R}
            stroke={p.gold} strokeWidth="1" opacity="0.45" />
        );
      })}
      {/* روزيتة مركزية صغيرة في أعلى القوس */}
      <g transform="translate(170 64)">
        <circle r="14" fill={p.near} opacity="0.5" stroke={p.gold} strokeWidth="1.4" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <circle key={i} cx={Math.cos(a) * 8} cy={Math.sin(a) * 8} r="3.4"
            fill={jewels[i % jewels.length]} opacity="0.8" />;
        })}
        <circle r="3.5" fill={p.gold} />
      </g>
      {/* لمعة زجاج */}
      <ellipse cx="150" cy="90" rx="44" ry="60" fill={`url(#${uid}-sheen)`} />
    </g>
  );
}

/* وسادة مزخرفة بشراشيب (جلسة أرضية) */
function Cushion({ x, y, scale = 1, color, dark, gold }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="16" rx="30" ry="8" fill="rgba(0,0,0,0.35)" />
      <path d="M -30 8 Q -34 -14 -16 -16 Q 0 -22 16 -16 Q 34 -14 30 8 Q 16 18 0 18 Q -16 18 -30 8 Z"
        fill={color} stroke={dark} strokeWidth="2" />
      {/* تطريز */}
      <path d="M -22 -8 Q 0 4 22 -8" fill="none" stroke={gold} strokeWidth="1.4" opacity="0.8" />
      <path d="M -20 2 Q 0 12 20 2" fill="none" stroke={gold} strokeWidth="1" opacity="0.5" />
      <ellipse cx="0" cy="-4" rx="6" ry="4" fill={gold} opacity="0.5" />
      {/* زر مركزي + شراشيب الأركان */}
      <circle cx="0" cy="-4" r="2.4" fill={gold} />
      {[-30, 30].map((sx, i) => (
        <g key={i}>
          <circle cx={sx} cy="6" r="3" fill={gold} />
          <path d={`M ${sx} 9 l -2 6 l 4 0 z`} fill={gold} opacity="0.85" />
        </g>
      ))}
    </g>
  );
}

/* شمعة متوهّجة مع خيط دخان متصاعد */
export function Candle({ x, y, scale = 1, gold = "#f5c451", delay = 0 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* دخان متصاعد */}
      <g className="gl-bd-smoke" style={{ animationDelay: `${delay}s` }}>
        <path d="M 0 -16 q 7 -8 0 -16 q -7 -8 0 -16 q 7 -8 1 -16"
          fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.18" />
      </g>
      {/* قاعدة نحاسية */}
      <ellipse cx="0" cy="10" rx="11" ry="4" fill={gold} opacity="0.85" />
      <path d="M -7 10 L -5 1 L 5 1 L 7 10 Z" fill={gold} opacity="0.7" />
      {/* جسم الشمعة */}
      <rect x="-4" y="-14" width="8" height="16" rx="2" fill="#fbf0d0" stroke="#d8c89a" strokeWidth="0.8" />
      <rect x="-4" y="-14" width="2.5" height="16" fill="#fff" opacity="0.5" />
      {/* هالة اللهب */}
      <ellipse cx="0" cy="-20" rx="9" ry="14" fill="#ffd76a" opacity="0.35" />
      {/* اللهب */}
      <g className="gl-bd-flame">
        <path d="M 0 -30 Q 5 -22 0 -14 Q -5 -22 0 -30 Z" fill="#ffb43a" />
        <path d="M 0 -27 Q 3 -21 0 -15 Q -3 -21 0 -27 Z" fill="#fff2b0" />
      </g>
    </g>
  );
}

/* زخرف زاوية ذهبي على شكل قوس صغير */
function Corner({ x, y, sx, sy, gold }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${sx} ${sy})`}>
      <path d="M 2 22 Q 2 2 22 2" fill="none" stroke={gold} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M 8 28 Q 8 8 28 8" fill="none" stroke={gold} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <circle cx="4" cy="4" r="3" fill={gold} />
      <circle cx="4" cy="4" r="1.3" fill="#fff7e0" />
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
        {/* قناع داخل القوس للنافذة الزجاجية الملوّنة */}
        <clipPath id={`${uid}-archclip`}>
          <path d={archPath(170, 30, 124, 178)} />
        </clipPath>
        {/* لمعان زجاجي */}
        <radialGradient id={`${uid}-sheen`} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g clipPath={`url(#${uid}-clip)`}>
        {/* الجدار */}
        <rect x="0" y="0" width="340" height="280" fill={`url(#${uid}-wall)`} />

        {/* قوس بعيد كبير في عمق القاعة (نافذة مضيئة) */}
        <path d={archPath(170, 20, 150, 200)} fill={`url(#${uid}-arch)`} />
        <path d={archPath(170, 20, 150, 200)} fill="none" stroke={p.gold} strokeWidth="2.2" opacity="0.5" />
        <path d={archPath(170, 30, 124, 178)} fill="none" stroke={p.gold} strokeWidth="1" opacity="0.35" />

        {/* نافذة زجاجية ملوّنة داخل القوس */}
        <StainedGlass p={p} uid={uid} />

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

        {/* شريط زخرفي علوي: أقواس متعرّجة (سكالوب) + نقاط ذهبية + خيط عربي */}
        <g opacity="0.9">
          <rect x="0" y="0" width="340" height="15" fill={p.near} />
          <rect x="0" y="13" width="340" height="2.5" fill={p.gold} opacity="0.7" />
          {Array.from({ length: 19 }).map((_, i) => (
            <path key={i} d={`M ${i * 18} 15 a 9 9 0 0 0 18 0 Z`} fill={p.warm} opacity="0.55" />
          ))}
          {Array.from({ length: 19 }).map((_, i) => (
            <circle key={`d${i}`} cx={i * 18 + 9} cy={7} r="1.6" fill={p.gold} opacity="0.7" />
          ))}
        </g>

        {/* ستائر مخملية في الزاويتين العلويتين */}
        <Drape side="left" color={p.warm} dark={p.near} gold={p.gold} />
        <Drape side="right" color={p.warm} dark={p.near} gold={p.gold} />

        {/* فوانيس معلّقة متوهّجة */}
        <Lantern x={70} y={70} scale={1.05} color={p.gold} delay={0} />
        <Lantern x={270} y={64} scale={0.9} color={p.gold} delay={0.8} />
        <Lantern x={170} y={48} scale={0.7} color={p.glow} delay={1.4} />

        {/* الأرضية اللامعة + بلاط معيّن */}
        <rect x="0" y="232" width="340" height="48" fill={`url(#${uid}-floor)`} />
        <g opacity="0.18" stroke={p.gold} strokeWidth="0.7" fill="none">
          {Array.from({ length: 9 }).map((_, i) => (
            <path key={i} d={`M ${-20 + i * 46} 232 L ${4 + i * 46} 280 M ${-20 + i * 46} 232 L ${-44 + i * 46} 280`} />
          ))}
          <line x1="0" y1="246" x2="340" y2="246" opacity="0.6" />
          <line x1="0" y1="262" x2="340" y2="262" opacity="0.5" />
        </g>
        <rect x="0" y="234" width="340" height="3" fill="#fff7e0" opacity="0.1" />
        <ellipse cx="170" cy="236" rx="180" ry="20" fill={p.glow} opacity="0.12" />

        {/* انعكاس لامع على الأرضية أسفل الطاولة */}
        <ellipse cx="170" cy="262" rx="120" ry="22" fill={p.glow} opacity="0.16" />
        <ellipse cx="170" cy="258" rx="90" ry="13" fill="#fff7e0" opacity="0.1" />
        <rect x="150" y="236" width="40" height="44" fill={`url(#${uid}-sheen)`} opacity="0.5" />

        {/* وسائد جلوس مزخرفة في زاويتي الأرضية */}
        <Cushion x={40} y={250} scale={0.9} color={p.warm} dark={p.near} gold={p.gold} />
        <Cushion x={300} y={250} scale={0.9} color={p.warm} dark={p.near} gold={p.gold} />

        {/* سجادة شرقية أمام الطاولة */}
        <Carpet p={p} />

        {/* جزيئات ضوئية عائمة (بوكيه) */}
        <g className="gl-bd-bokeh">
          {[[60, 120, 3], [250, 100, 4], [110, 80, 2.4], [210, 150, 3], [300, 170, 2.6], [40, 180, 3.4]].map(
            ([x, y, r], i) => (
              <circle key={i} cx={x} cy={y} r={r} fill={p.glow} opacity="0.25"
                style={{ animationDelay: `${i * 0.7}s` }} />
            )
          )}
        </g>

        {/* نجوم متلألئة ذهبية */}
        {[[46, 64, 4, 0], [296, 96, 3.4, 0.6], [112, 52, 3, 1.1], [232, 46, 3.6, 1.6],
          [34, 158, 3, 0.3], [306, 150, 3.4, 0.9], [150, 30, 2.6, 1.3]].map(([x, y, s, d], i) => (
          <Sparkle key={i} x={x} y={y} s={s} color={p.gold} delay={d} />
        ))}

        {/* زخارف الزوايا الذهبية */}
        <Corner x={6} y={6} sx={1} sy={1} gold={p.gold} />
        <Corner x={334} y={6} sx={-1} sy={1} gold={p.gold} />
        <Corner x={6} y={274} sx={1} sy={-1} gold={p.gold} />
        <Corner x={334} y={274} sx={-1} sy={-1} gold={p.gold} />
      </g>
    </svg>
  );
}
