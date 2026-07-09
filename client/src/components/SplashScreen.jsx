import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// شاشة الترحيب الافتتاحية — تُظهر الشخصية الأساسية (الماسكوت) بإطار متوهّج
// وحركة عائمة، ثم تتلاشى تلقائياً بعد لحظات لتكشف الواجهة الرئيسية.
export default function SplashScreen({ onDone, duration = 2000 }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShow(false), duration);
    return () => clearTimeout(t);
  }, [duration]);

  // شرارات ذهبية تدور حول الماسكوت
  const sparks = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        a: (i / 14) * Math.PI * 2,
        r: 120 + Math.random() * 40,
        s: 2 + Math.random() * 3,
        d: 1.6 + Math.random() * 2,
        delay: Math.random() * 1.5,
      })),
    []
  );

  return (
    <AnimatePresence onExitComplete={onDone}>
      {show && (
        <motion.div
          className="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.08 }}
          transition={{ duration: 0.55, ease: "easeInOut" }}
        >
          {/* هالة ضوئية خلف الشخصية */}
          <div className="splash-glow" />

          {/* الشرارات الدائرة */}
          <div className="splash-sparks">
            {sparks.map((sp, i) => (
              <motion.span
                key={i}
                className="splash-spark"
                style={{
                  width: sp.s,
                  height: sp.s,
                  left: `calc(50% + ${Math.cos(sp.a) * sp.r}px)`,
                  top: `calc(42% + ${Math.sin(sp.a) * sp.r}px)`,
                }}
                animate={{ opacity: [0, 1, 0], scale: [0.4, 1.2, 0.4] }}
                transition={{ duration: sp.d, repeat: Infinity, delay: sp.delay }}
              />
            ))}
          </div>

          {/* الشخصية داخل إطار دائري متوهّج + حلقة دوّارة */}
          <motion.div
            className="splash-hero"
            initial={{ scale: 0.6, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.1 }}
          >
            <span className="splash-ring" />
            <motion.div
              className="splash-frame"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <img className="splash-img" src="/mascot.png" alt="شخصية اللعبة" />
              <span className="splash-shine" />
            </motion.div>
          </motion.div>

          {/* الاسم والشعار */}
          <motion.div
            className="splash-title-wrap"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
          >
            <h1 className="splash-title">أهلاً بك في عالم الألعاب</h1>
            <p className="splash-sub">العب · تنافس · اربح</p>
            <span className="splash-loader" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
