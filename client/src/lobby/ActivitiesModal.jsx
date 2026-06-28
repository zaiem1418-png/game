import { motion } from "framer-motion";

// مركز الأنشطة 🎁 — بوابة لكل الفعاليات: المهام، بطاقة المجد، الحزم، المنافسات.
const ENTRIES = [
  { key: "tasks",    icon: "✅", title: "المهام اليومية", desc: "أكمل المهام واستلم الألماس", tint: "#2bbf8e" },
  { key: "glory",    icon: "🏅", title: "بطاقة المجد",    desc: "اكسب المجد وافتح المكافآت",  tint: "#f5c451" },
  { key: "packages", icon: "🎁", title: "الحزم الحصرية",  desc: "باقات قيمة لفترة محدودة",    tint: "#e0563a" },
  { key: "comp",     icon: "🏆", title: "المنافسات",      desc: "تصدّر لوحات الأفراد والقبائل", tint: "#b06bff" },
];

export default function ActivitiesModal({ onOpen, onClose, badges = {} }) {
  return (
    <div className="soc-backdrop" onClick={onClose}>
      <motion.div className="soc-sheet" onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
        <header className="soc-head">
          <button className="soc-close" onClick={onClose}>✕</button>
          <h2>🎁 الأنشطة</h2>
        </header>

        <div className="soc-body">
          <p className="soc-hint">كل الفعاليات في مكان واحد — اختر نشاطاً للبدء.</p>

          <div className="act-grid">
            {ENTRIES.map((e) => (
              <motion.button key={e.key} className="act-card" style={{ "--tint": e.tint }}
                whileTap={{ scale: 0.96 }} onClick={() => onOpen?.(e.key)}>
                {badges[e.key] > 0 && <span className="act-badge">{badges[e.key]}</span>}
                <span className="act-ico">{e.icon}</span>
                <span className="act-title">{e.title}</span>
                <span className="act-desc">{e.desc}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
