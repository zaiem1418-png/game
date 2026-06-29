// ===== مُجمّع المشهد الكامل: قاعة قصر + طاولة + لوحة لعب + شخصيات + قِطع طائرة =====
// طبقتان: خلفية (Backdrop، تملأ البطاقة) + مقدّمة SVG (طاولة وشخصيات، تتناسب). مرجع 340×280.

import Backdrop from "./Backdrop.jsx";
import { CHAR_MAP, CardFan } from "./Characters.jsx";
import { BOARD_MAP } from "./Boards.jsx";
import { Dice, Token, Marble, Card, Ladder, Snake } from "./Pieces.jsx";

// تكوين كل لعبة: الشخصيات (نوع + موضع + مقياس) + زخارف اليدين + القِطع الطائرة.
// الأسد دائماً ملك (king) في الوسط كماسكوت رئيسي تتوّجه التاج.
const SCENE = {
  jackaroo: {
    cast: [
      { t: "king", x: 170, y: 86, s: 1.22 },
      { t: "beard", x: 58, y: 150, s: 0.96 },
      { t: "hijab", x: 282, y: 150, s: 0.96 },
      { t: "guy", x: 170, y: 168, s: 0.84 },
    ],
    hands: [{ x: 138, y: 188, r: -14, s: 0.8 }, { x: 206, y: 190, r: 12, s: 0.78 }],
    pieces: (
      <>
        <FloatPiece x={116} y={120} d={0}><Marble color="#e74c3c" /></FloatPiece>
        <FloatPiece x={226} y={114} d={0.6}><Marble color="#3aa3ff" /></FloatPiece>
        <FloatPiece x={256} y={150} d={1.1}><Marble color="#2ecc71" /></FloatPiece>
        <FloatPiece x={88} y={156} d={0.3}><Marble color="#f1c40f" /></FloatPiece>
      </>
    ),
  },
  ludo: {
    cast: [
      { t: "king", x: 170, y: 86, s: 1.22 },
      { t: "guy", x: 58, y: 150, s: 0.96 },
      { t: "beard", x: 282, y: 150, s: 0.96 },
      { t: "hijab", x: 170, y: 168, s: 0.84 },
    ],
    pieces: (
      <>
        <FloatPiece x={108} y={118} d={0}><Dice value={5} size={19} /></FloatPiece>
        <FloatPiece x={236} y={110} d={0.7}><Token color="#e74c3c" /></FloatPiece>
        <FloatPiece x={258} y={150} d={1.2}><Token color="#3498db" /></FloatPiece>
        <FloatPiece x={86} y={156} d={0.4}><Token color="#2ecc71" /></FloatPiece>
        <FloatPiece x={210} y={170} d={0.9}><Token color="#f1c40f" /></FloatPiece>
      </>
    ),
  },
  baloot: {
    cast: [
      { t: "king", x: 170, y: 86, s: 1.22 },
      { t: "beard", x: 56, y: 148, s: 0.98 },
      { t: "guy", x: 284, y: 148, s: 0.98 },
      { t: "hijab", x: 170, y: 168, s: 0.84 },
    ],
    hands: [{ x: 110, y: 190, r: -16, s: 0.82 }, { x: 232, y: 190, r: 14, s: 0.8 }],
    pieces: (
      <>
        <g transform="translate(170 176)">
          <g transform="rotate(-18) translate(-15 0)"><Card rank="A" suit="spade" w={32} /></g>
          <g transform="translate(0 -4)"><Card rank="A" suit="diamond" w={32} /></g>
          <g transform="rotate(18) translate(15 0)"><Card rank="A" suit="heart" w={32} /></g>
        </g>
        <FloatPiece x={86} y={120} d={0.5}><Card rank="K" suit="club" w={26} /></FloatPiece>
        <FloatPiece x={256} y={124} d={1}><Card rank="Q" suit="heart" w={26} /></FloatPiece>
      </>
    ),
  },
  snake: {
    cast: [
      { t: "king", x: 170, y: 86, s: 1.2 },
      { t: "guy", x: 58, y: 152, s: 0.96 },
      { t: "hijab", x: 282, y: 152, s: 0.96 },
      { t: "beard", x: 170, y: 168, s: 0.84 },
    ],
    pieces: (
      <>
        <g transform="translate(112 126)"><Ladder len={50} w={14} /></g>
        <g transform="translate(232 116)"><Snake scale={0.82} /></g>
        <FloatPiece x={104} y={176} d={0.6}><Dice value={6} size={16} /></FloatPiece>
        <FloatPiece x={250} y={168} d={1}><Token color="#e74c3c" /></FloatPiece>
      </>
    ),
  },
};

function FloatPiece({ x, y, d = 0, children }) {
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
    <>
      {/* الطبقة الخلفية: قاعة القصر المزخرفة */}
      <Backdrop game={game} />

      {/* الطبقة الأمامية: الطاولة والشخصيات والقِطع */}
      <svg className="gl-art" viewBox="0 0 340 280" preserveAspectRatio="xMidYMax meet">
        <defs>
          <radialGradient id="tableTop" cx="50%" cy="28%" r="78%">
            <stop offset="0%" stopColor="#b07a44" />
            <stop offset="60%" stopColor="#7a4e28" />
            <stop offset="100%" stopColor="#46290f" />
          </radialGradient>
          <linearGradient id="tableRim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d8a45a" />
            <stop offset="100%" stopColor="#6e421d" />
          </linearGradient>
          <linearGradient id="diceFace" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e6e0d0" />
          </linearGradient>
          <radialGradient id="haloG" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={game.glow} stopOpacity="0.5" />
            <stop offset="100%" stopColor={game.glow} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* هالة ضوء خلف الشخصيات */}
        <ellipse cx="170" cy="120" rx="150" ry="100" fill="url(#haloG)" />

        {/* الشخصيات خلف الطاولة */}
        {conf.cast.map((c, i) => {
          const Char = CHAR_MAP[c.t] || CHAR_MAP.guy;
          return (
            <g key={i} transform={`translate(${c.x} ${c.y}) scale(${c.s})`}>
              <g className="gl-art-char" style={{ animationDelay: `${i * 0.4}s` }}>
                <Char />
              </g>
            </g>
          );
        })}

        {/* الطاولة الخشبية المزخرفة */}
        <ellipse cx="170" cy="232" rx="162" ry="48" fill="rgba(0,0,0,0.4)" />
        <ellipse cx="170" cy="222" rx="160" ry="48" fill="url(#tableRim)" />
        <ellipse cx="170" cy="218" rx="150" ry="44" fill="url(#tableTop)" stroke="#3a2310" strokeWidth="2" />
        <ellipse cx="170" cy="214" rx="138" ry="37" fill="none" stroke={game.accent} strokeWidth="1.4" opacity="0.45" strokeDasharray="2 6" />

        {/* اللوحة فوق الطاولة (بمنظور مائل) */}
        <g transform="translate(170 206) scale(1 0.6)">
          <Board />
        </g>

        {/* أيدٍ تمسك أوراقاً (للألعاب الورقية) */}
        {conf.hands?.map((h, i) => (
          <g key={`h${i}`} transform={`translate(${h.x} ${h.y}) rotate(${h.r}) scale(${h.s})`}>
            <g className="gl-art-char" style={{ animationDelay: `${0.5 + i * 0.3}s` }}>
              <CardFan />
            </g>
          </g>
        ))}

        {/* القِطع الطائرة */}
        {conf.pieces}
      </svg>
    </>
  );
}
