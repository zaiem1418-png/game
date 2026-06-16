// ===== مُجمّع المشهد: طاولة + لوحة لعب + شخصيات + قِطع طائرة =====
// رسوم SVG أصلية بالكامل، تتغيّر حسب اللعبة. مرجع المشهد 340×280.

import { CHAR_MAP } from "./Characters.jsx";
import { BOARD_MAP } from "./Boards.jsx";
import { Dice, Token, Marble, Card, Ladder, Snake } from "./Pieces.jsx";

// تكوين كل لعبة: الشخصيات (نوع + موضع + مقياس) والقِطع الطائرة
const SCENE = {
  jackaroo: {
    cast: [
      { t: "lion", x: 170, y: 96, s: 1.15 },
      { t: "beard", x: 70, y: 150, s: 0.92 },
      { t: "hijab", x: 270, y: 150, s: 0.92 },
    ],
    pieces: (
      <>
        <FloatPiece x={120} y={120} d={0}><Marble color="#e74c3c" /></FloatPiece>
        <FloatPiece x={220} y={116} d={0.6}><Marble color="#3aa3ff" /></FloatPiece>
        <FloatPiece x={250} y={150} d={1.1}><Marble color="#2ecc71" /></FloatPiece>
        <FloatPiece x={96} y={158} d={0.3}><Card rank="A" suit="heart" w={30} /></FloatPiece>
      </>
    ),
  },
  ludo: {
    cast: [
      { t: "lion", x: 170, y: 96, s: 1.15 },
      { t: "guy", x: 70, y: 150, s: 0.92 },
      { t: "beard", x: 270, y: 150, s: 0.92 },
    ],
    pieces: (
      <>
        <FloatPiece x={110} y={118} d={0}><Dice value={5} size={18} /></FloatPiece>
        <FloatPiece x={232} y={112} d={0.7}><Token color="#e74c3c" /></FloatPiece>
        <FloatPiece x={250} y={150} d={1.2}><Token color="#3498db" /></FloatPiece>
        <FloatPiece x={96} y={156} d={0.4}><Token color="#2ecc71" /></FloatPiece>
      </>
    ),
  },
  baloot: {
    cast: [
      { t: "lion", x: 170, y: 96, s: 1.15 },
      { t: "beard", x: 66, y: 148, s: 0.95 },
      { t: "guy", x: 274, y: 148, s: 0.95 },
    ],
    pieces: (
      <>
        <g transform="translate(170 168)">
          <g transform="rotate(-18) translate(-14 0)"><Card rank="A" suit="spade" w={32} /></g>
          <g transform="translate(0 -4)"><Card rank="A" suit="diamond" w={32} /></g>
          <g transform="rotate(18) translate(14 0)"><Card rank="A" suit="heart" w={32} /></g>
        </g>
        <FloatPiece x={92} y={120} d={0.5}><Card rank="K" suit="club" w={26} /></FloatPiece>
      </>
    ),
  },
  snake: {
    cast: [
      { t: "lion", x: 170, y: 96, s: 1.1 },
      { t: "guy", x: 70, y: 152, s: 0.92 },
      { t: "hijab", x: 270, y: 152, s: 0.92 },
    ],
    pieces: (
      <>
        <g transform="translate(120 130)"><Ladder len={48} w={14} /></g>
        <g transform="translate(225 118)"><Snake scale={0.8} /></g>
        <FloatPiece x={110} y={170} d={0.6}><Dice value={6} size={15} /></FloatPiece>
      </>
    ),
  },
};

function FloatPiece({ x, y, d = 0, children }) {
  // المجموعة الخارجية للموضع (سمة transform) والداخلية للأنميشن (CSS transform)
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="gl-art-float" style={{ animationDelay: `${d}s` }}>{children}</g>
    </g>
  );
}

export default function GameArt({ game }) {
  const conf = SCENE[game.id] || SCENE.jackaroo;
  const Board = BOARD_MAP[game.id] || BOARD_MAP.jackaroo;

  return (
    <svg className="gl-art" viewBox="0 0 340 280" preserveAspectRatio="xMidYMax meet">
      <defs>
        <radialGradient id="tableTop" cx="50%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#a06a3a" />
          <stop offset="70%" stopColor="#6e4423" />
          <stop offset="100%" stopColor="#4a2c14" />
        </radialGradient>
        <linearGradient id="diceFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e6e0d0" />
        </linearGradient>
        <radialGradient id="haloG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={game.glow} stopOpacity="0.55" />
          <stop offset="100%" stopColor={game.glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* هالة ضوء خلف المشهد */}
      <ellipse cx="170" cy="150" rx="150" ry="120" fill="url(#haloG)" />

      {/* الشخصيات خلف الطاولة */}
      {conf.cast.map((c, i) => {
        const Char = CHAR_MAP[c.t];
        return (
          <g key={i} transform={`translate(${c.x} ${c.y}) scale(${c.s})`}>
            <g className="gl-art-char" style={{ animationDelay: `${i * 0.4}s` }}>
              <Char />
            </g>
          </g>
        );
      })}

      {/* الطاولة الخشبية */}
      <ellipse cx="170" cy="228" rx="158" ry="46" fill="rgba(0,0,0,0.35)" />
      <ellipse cx="170" cy="220" rx="156" ry="46" fill="url(#tableTop)" stroke="#3a2310" strokeWidth="3" />
      <ellipse cx="170" cy="216" rx="140" ry="38" fill="none" stroke="#c9904f" strokeWidth="1.5" opacity="0.5" />

      {/* اللوحة فوق الطاولة (بمنظور مائل) */}
      <g transform="translate(170 206) scale(1 0.6)">
        <Board />
      </g>

      {/* القِطع الطائرة */}
      {conf.pieces}
    </svg>
  );
}
