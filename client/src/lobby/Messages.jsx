import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CourtModal from "./CourtModal.jsx";
import FriendsModal from "./FriendsModal.jsx";
import TribeModal from "./TribeModal.jsx";
import MomentsModal from "./MomentsModal.jsx";
import GameIcon from "./GameIcons.jsx";

// أيقونات الوصول السريع أعلى الرسائل — كل واحدة تفتح نظامها الاجتماعي
const QUICK = [
  { id: "gamefriend", label: "صديق اللعب", icon: "contacts", tint: "#1f8a6e" },
  { id: "court", label: "المحكمة", icon: "court", tint: "#9a3a5a" },
  { id: "tribe", label: "القبيلة", icon: "tribe", tint: "#b5731f" },
  { id: "moments", label: "اللحظات", icon: "momentsSpark", tint: "#5a3a9a" },
];

// قائمة المحادثات (فارغة — تُملأ بالرسائل الواردة)
const THREADS = [];

export default function Messages({ onRecharge }) {
  const [open, setOpen] = useState(null); // أي نظام مفتوح: court|gamefriend|tribe|moments

  return (
    <div className="ms">
      <div className="gl-bg vr-bg" />

      <header className="ms-top">
        <div className="ms-top-actions">
          <button className="ms-act add">＋</button>
          <button className="ms-act"><GameIcon id="contacts" /></button>
        </div>
        <h1 className="ms-title">رسالة</h1>
      </header>

      <div className="vr-scroll">
        {/* وصول سريع */}
        <div className="ms-quick">
          {QUICK.map((q) => (
            <motion.button
              key={q.id}
              className="ms-quick-btn"
              whileTap={{ scale: 0.92 }}
              onClick={() => setOpen(q.id)}
            >
              <span className="ms-quick-ico" style={{ background: `radial-gradient(circle at 50% 30%, ${q.tint}, #15101f)` }}>
                <GameIcon id={q.icon} />
              </span>
              <span className="ms-quick-lbl">{q.label}</span>
            </motion.button>
          ))}
        </div>

        {/* قائمة المحادثات */}
        <div className="ms-list">
          {THREADS.length === 0 && (
            <div className="ms-empty">
              <span className="ms-empty-ico"><GameIcon id="chat" /></span>
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

      {/* الأنظمة الاجتماعية */}
      <AnimatePresence>
        {open === "court" && <CourtModal key="court" onClose={() => setOpen(null)} />}
        {open === "gamefriend" && <FriendsModal key="friends" onClose={() => setOpen(null)} />}
        {open === "tribe" && <TribeModal key="tribe" onClose={() => setOpen(null)} onRecharge={onRecharge} />}
        {open === "moments" && <MomentsModal key="moments" onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </div>
  );
}
