// إدارة طابور التفاعلات لكل مقعد — يعرض التفاعلات بشكل متتابع دون تداخل.
import { useCallback, useRef, useState } from "react";
import { REACTION_MAP } from "./reactions.js";
import { playSound } from "./giftEngine/core/SoundManager.js";

export function useReactions() {
  const [active, setActive] = useState({}); // seatIndex -> { id, type }
  const queues = useRef(new Map()); // seatIndex -> [{id,type}]
  const timers = useRef(new Map()); // seatIndex -> timeoutId

  const playNext = useCallback((seatIndex) => {
    const q = queues.current.get(seatIndex) || [];
    const nextItem = q.shift();
    if (!nextItem) {
      setActive((a) => {
        const n = { ...a };
        delete n[seatIndex];
        return n;
      });
      return;
    }
    const def = REACTION_MAP[nextItem.type];
    const dur = def?.dur || 2800;
    setActive((a) => ({ ...a, [seatIndex]: nextItem }));
    if (def?.sound) playSound(def.sound, 0.5);

    const t = setTimeout(() => playNext(seatIndex), dur);
    timers.current.set(seatIndex, t);
  }, []);

  // استقبال تفاعل جديد (من السوكِت)
  const push = useCallback(
    ({ id, seatIndex, type }) => {
      if (!REACTION_MAP[type]) return;
      const q = queues.current.get(seatIndex) || [];
      // حدّ أقصى لطول الطابور لكل مقعد (تفادي التكدّس)
      if (q.length < 5) q.push({ id, type });
      queues.current.set(seatIndex, q);
      // إن لم يكن هناك تفاعل نشط لهذا المقعد، ابدأ فوراً
      setActive((a) => {
        if (!a[seatIndex]) setTimeout(() => playNext(seatIndex), 0);
        return a;
      });
    },
    [playNext]
  );

  // تنظيف مقعد (عند مغادرة المستخدم)
  const clearSeat = useCallback((seatIndex) => {
    queues.current.delete(seatIndex);
    const t = timers.current.get(seatIndex);
    if (t) clearTimeout(t);
    timers.current.delete(seatIndex);
    setActive((a) => {
      if (!a[seatIndex]) return a;
      const n = { ...a };
      delete n[seatIndex];
      return n;
    });
  }, []);

  return { active, push, clearSeat };
}
