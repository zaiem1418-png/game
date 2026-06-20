import { motion } from "framer-motion";

// أيقونات الوصول السريع أعلى الرسائل
const QUICK = [
  { id: "gamefriend", label: "صديق اللعب", icon: "👥", tint: "#1f8a6e" },
  { id: "court", label: "المحكمة", icon: "🏛️", tint: "#9a3a5a" },
  { id: "tribe", label: "القبيلة", icon: "🏅", tint: "#b5731f" },
  { id: "moments", label: "اللحظات", icon: "🌀", tint: "#5a3a9a" },
];

// قائمة المحادثات (فارغة — تُملأ بالرسائل الواردة)
const THREADS = [];

export default function Messages() {
  return (
    <div className="ms">
      <div className="gl-bg vr-bg" />

      <header className="ms-top">
        <div className="ms-top-actions">
          <button className="ms-act add">＋</button>
          <button className="ms-act">👥</button>
        </div>
        <h1 className="ms-title">رسالة</h1>
      </header>

      <div className="vr-scroll">
        {/* وصول سريع */}
        <div className="ms-quick">
          {QUICK.map((q) => (
            <motion.button key={q.id} className="ms-quick-btn" whileTap={{ scale: 0.92 }}>
              <span className="ms-quick-ico" style={{ background: `radial-gradient(circle at 50% 30%, ${q.tint}, #15101f)` }}>
                {q.icon}
              </span>
              <span className="ms-quick-lbl">{q.label}</span>
            </motion.button>
          ))}
        </div>

        {/* قائمة المحادثات */}
        <div className="ms-list">
          {THREADS.length === 0 && (
            <div className="ms-empty">
              <span className="ms-empty-ico">💬</span>
              <span>لا توجد رسائل</span>
            </div>
          )}
          {THREADS.map((t, i) => (
            <motion.button
              key={t.id}
              className="ms-thread"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              whileTap={{ scale: 0.99 }}
            >
              <span className={`ms-ava ${t.heart ? "heart" : ""}`} style={{ background: `radial-gradient(circle at 50% 30%, ${t.color}, #15101f)` }}>
                {t.icon}
              </span>
              <span className="ms-thread-body">
                <span className="ms-thread-row1">
                  <span className="ms-thread-name">
                    {t.name}
                    {t.official && <span className="ms-official">الحساب الرسمي</span>}
                  </span>
                  <span className="ms-thread-time">{t.time}</span>
                </span>
                <span className="ms-thread-preview">{t.preview}</span>
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
