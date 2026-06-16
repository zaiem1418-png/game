// ===== قِطع اللعب SVG أصلية (نرد / أحجار لودو / أوراق / كرات جاكارو) =====

const PIP = [
  [],
  [[0, 0]],
  [[-1, -1], [1, 1]],
  [[-1, -1], [0, 0], [1, 1]],
  [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
];

/* نرد أبيض بنقاط — مرجع 40×40 حول (0,0) */
export function Dice({ value = 5, size = 20 }) {
  const s = size;
  return (
    <g>
      <rect x={-s} y={-s} width={s * 2} height={s * 2} rx={s * 0.32}
        fill="url(#diceFace)" stroke="#d8d2c4" strokeWidth="1.5" />
      <rect x={-s} y={-s} width={s * 2} height={s * 0.55} rx={s * 0.3}
        fill="#ffffff" opacity="0.5" />
      {PIP[value].map(([x, y], i) => (
        <circle key={i} cx={x * s * 0.5} cy={y * s * 0.5} r={s * 0.16} fill="#c0392b" />
      ))}
    </g>
  );
}

/* حجر لودو (بيدق) */
export function Token({ color = "#e74c3c", size = 16 }) {
  const s = size;
  return (
    <g>
      <ellipse cx="0" cy={s * 1.05} rx={s * 0.75} ry={s * 0.28} fill="rgba(0,0,0,0.3)" />
      <path d={`M ${-s * 0.55} ${s * 0.9} Q ${-s * 0.7} ${s * 0.4} ${-s * 0.25} ${s * 0.2}
        Q ${-s * 0.55} 0 ${-s * 0.4} ${-s * 0.3}
        A ${s * 0.4} ${s * 0.4} 0 1 1 ${s * 0.4} ${-s * 0.3}
        Q ${s * 0.55} 0 ${s * 0.25} ${s * 0.2}
        Q ${s * 0.7} ${s * 0.4} ${s * 0.55} ${s * 0.9} Z`}
        fill={color} stroke="rgba(0,0,0,0.25)" strokeWidth="1.2" />
      <circle cx={-s * 0.18} cy={-s * 0.45} r={s * 0.16} fill="#fff" opacity="0.6" />
    </g>
  );
}

/* كرة زجاجية (جاكارو) */
export function Marble({ color = "#3aa3ff", size = 14 }) {
  const id = `m${color.replace("#", "")}`;
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor={color} />
          <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
      </defs>
      <circle cx="0" cy="0" r={size} fill={`url(#${id})`} />
      <circle cx={-size * 0.32} cy={-size * 0.36} r={size * 0.28} fill="#fff" opacity="0.85" />
    </g>
  );
}

const SUITS = { spade: ["♠", "#1a1a1a"], heart: ["♥", "#d2342b"], diamond: ["♦", "#d2342b"], club: ["♣", "#1a1a1a"] };

/* ورقة لعب */
export function Card({ rank = "A", suit = "spade", w = 34 }) {
  const h = w * 1.4;
  const [sym, col] = SUITS[suit] || SUITS.spade;
  return (
    <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={w * 0.16}
        fill="#fff" stroke="#d8d2c4" strokeWidth="1.2" />
      <text x={-w / 2 + 4} y={-h / 2 + 12} fontSize={w * 0.32} fontWeight="800" fill={col}
        fontFamily="Arial, sans-serif">{rank}</text>
      <text x="0" y={h * 0.06} fontSize={w * 0.62} fill={col} textAnchor="middle"
        dominantBaseline="middle" fontFamily="Arial, sans-serif">{sym}</text>
    </g>
  );
}

/* درج للسلم والثعبان */
export function Ladder({ len = 60, w = 16 }) {
  const rungs = 4;
  return (
    <g stroke="#c98a3a" strokeWidth="3.4" strokeLinecap="round">
      <line x1={-w / 2} y1="0" x2={-w / 2} y2={len} />
      <line x1={w / 2} y1="0" x2={w / 2} y2={len} />
      {Array.from({ length: rungs }).map((_, i) => (
        <line key={i} x1={-w / 2} y1={(len / rungs) * (i + 0.5)} x2={w / 2} y2={(len / rungs) * (i + 0.5)} stroke="#e0a24a" />
      ))}
    </g>
  );
}

/* ثعبان متعرّج */
export function Snake({ scale = 1 }) {
  return (
    <g transform={`scale(${scale})`}>
      <path d="M 6 70 C -18 56 30 40 8 26 C -12 14 28 4 18 -8"
        fill="none" stroke="#2ec27a" strokeWidth="11" strokeLinecap="round" />
      <path d="M 6 70 C -18 56 30 40 8 26 C -12 14 28 4 18 -8"
        fill="none" stroke="#27ae60" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 9" />
      <circle cx="18" cy="-10" r="9" fill="#2ec27a" />
      <circle cx="15" cy="-12" r="1.8" fill="#111" />
      <circle cx="21" cy="-12" r="1.8" fill="#111" />
      <path d="M 18 -2 L 18 4 M 15 4 L 21 4" stroke="#c0392b" strokeWidth="1.6" />
    </g>
  );
}
