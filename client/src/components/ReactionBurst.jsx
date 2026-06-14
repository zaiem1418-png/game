// أنيميشن تفاعل واحد فوق المقعد — وجه رئيسي متحرك + جسيمات صغيرة.
// يُركّب داخل دائرة المقعد (overflow مرئي للأعلى) ويختفي تلقائياً عبر مؤقّت في الأب.

import { useMemo } from "react";
import { REACTION_MAP, PARTICLE_EMOJI } from "../reactions.js";

export default function ReactionBurst({ type }) {
  const r = REACTION_MAP[type];

  // مواقع/تأخيرات عشوائية ثابتة طوال العرض
  const parts = useMemo(() => {
    if (!r) return [];
    return Array.from({ length: r.count }, (_, i) => ({
      i,
      x: (Math.random() - 0.5) * 60, // px أفقي
      delay: Math.random() * 0.5, // s
      dur: 1.1 + Math.random() * 0.8,
      hue: Math.floor(Math.random() * 360),
      rot: (Math.random() - 0.5) * 60,
    }));
  }, [r]);

  if (!r) return null;
  const pe = PARTICLE_EMOJI[r.particle];

  return (
    <div className={`rx rx-${type}`} style={{ "--life": `${r.dur}ms` }}>
      <div className="rx-main">
        <span className="rx-face">{r.emoji}</span>
      </div>
      <div className="rx-parts">
        {parts.map((p) => (
          <span
            key={p.i}
            className={`rx-p rx-p-${r.particle}`}
            style={{
              "--x": `${p.x}px`,
              "--d": `${p.delay}s`,
              "--dur": `${p.dur}s`,
              "--rot": `${p.rot}deg`,
              "--hue": p.hue,
            }}
          >
            {r.particle === "confetti" ? "" : pe}
          </span>
        ))}
      </div>
    </div>
  );
}
