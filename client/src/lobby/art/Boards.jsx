// ===== لوحات اللعب SVG أصلية — تُرسم بمنظور مائل (تُوضع فوق الطاولة) =====
// مرجع كل لوحة ~ 120×120 حول (0,0).

const LUDO_COLORS = ["#e74c3c", "#2ecc71", "#f1c40f", "#3498db"];

/* لوحة لودو كلاسيكية: 4 أركان ملوّنة + صليب أبيض + مركز */
export function LudoBoard() {
  const c = 56; // نصف الضلع
  const corner = 36;
  return (
    <g>
      <rect x={-c} y={-c} width={c * 2} height={c * 2} rx="10" fill="#fdf6e3" stroke="#d8c9a0" strokeWidth="2" />
      {/* الأركان الملوّنة */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], i) => (
        <g key={i}>
          <rect x={sx < 0 ? -c : c - corner} y={sy < 0 ? -c : c - corner}
            width={corner} height={corner} rx="8" fill={LUDO_COLORS[i]} />
          <circle cx={sx * (c - corner / 2)} cy={sy * (c - corner / 2)} r={corner * 0.28}
            fill="#fff" opacity="0.85" />
        </g>
      ))}
      {/* الصليب الأبيض في الوسط */}
      <rect x={-c + corner} y={-12} width={(c - corner) * 2} height="24" fill="#fff" stroke="#e6dcc0" />
      <rect x={-12} y={-c + corner} width="24" height={(c - corner) * 2} fill="#fff" stroke="#e6dcc0" />
      {/* مركز ملوّن */}
      <path d="M -12 -12 L 12 -12 L 0 0 Z" fill="#e74c3c" />
      <path d="M 12 -12 L 12 12 L 0 0 Z" fill="#3498db" />
      <path d="M 12 12 L -12 12 L 0 0 Z" fill="#f1c40f" />
      <path d="M -12 12 L -12 -12 L 0 0 Z" fill="#2ecc71" />
      {/* مسارات الانطلاق الملوّنة */}
      <rect x={-10} y={-c + corner} width="20" height="14" fill={LUDO_COLORS[1]} opacity="0.7" />
      <rect x={-10} y={c - corner - 14} width="20" height="14" fill={LUDO_COLORS[2]} opacity="0.7" />
    </g>
  );
}

/* لوحة جاكارو: مسار دائري بفتحات ملوّنة (نمط Jackaroo/Ludo-King) */
export function JackarooBoard() {
  const holes = [];
  const R = 50;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    holes.push([Math.cos(a) * R, Math.sin(a) * R, LUDO_COLORS[i % 4]]);
  }
  return (
    <g>
      <rect x="-58" y="-58" width="116" height="116" rx="22" fill="#2e7d52" stroke="#1c5a39" strokeWidth="2" />
      <rect x="-58" y="-58" width="116" height="116" rx="22" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.2" />
      <circle cx="0" cy="0" r={R + 7} fill="none" stroke="#1c5a39" strokeWidth="9" />
      {holes.map(([x, y, col], i) => (
        <circle key={i} cx={x} cy={y} r="4.6" fill="#0d3a24" stroke={col} strokeWidth="2" />
      ))}
      {/* بيوت ملوّنة في الأركان */}
      {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy], i) => (
        <g key={i}>
          {[0, 1, 2, 3].map((j) => (
            <circle key={j} cx={sx * (20 + (j % 2) * 12)} cy={sy * (20 + Math.floor(j / 2) * 12)}
              r="4" fill={LUDO_COLORS[i]} />
          ))}
        </g>
      ))}
      <circle cx="0" cy="0" r="12" fill="#0d3a24" stroke="#ffce5a" strokeWidth="2" />
      <text x="0" y="1" fontSize="11" textAnchor="middle" dominantBaseline="middle" fill="#ffce5a" fontWeight="800">★</text>
    </g>
  );
}

/* طاولة بلوت: لباد أخضر + كومة أوراق في الوسط */
export function BalootFelt() {
  return (
    <g>
      <ellipse cx="0" cy="0" rx="62" ry="44" fill="#1f8a4a" stroke="#0f5a2e" strokeWidth="3" />
      <ellipse cx="0" cy="0" rx="50" ry="34" fill="none" stroke="#ffce5a" strokeWidth="1.5" opacity="0.6" strokeDasharray="3 5" />
      <ellipse cx="0" cy="12" rx="40" ry="10" fill="rgba(0,0,0,0.18)" />
    </g>
  );
}

/* لوحة السلم والثعبان: شبكة 5×5 متناوبة */
export function SnakeBoard() {
  const cells = [];
  const n = 5;
  const sz = 22;
  const off = (n * sz) / 2;
  for (let r = 0; r < n; r++)
    for (let col = 0; col < n; col++) {
      const light = (r + col) % 2 === 0;
      cells.push(
        <rect key={`${r}-${col}`} x={col * sz - off} y={r * sz - off} width={sz} height={sz}
          fill={light ? "#fdf0d5" : "#f4c77a"} stroke="#d8a85a" strokeWidth="0.6" />
      );
    }
  return (
    <g>
      <rect x={-off - 3} y={-off - 3} width={n * sz + 6} height={n * sz + 6} rx="6" fill="#b5651d" />
      {cells}
    </g>
  );
}

export const BOARD_MAP = {
  ludo: LudoBoard,
  jackaroo: JackarooBoard,
  baloot: BalootFelt,
  snake: SnakeBoard,
};
