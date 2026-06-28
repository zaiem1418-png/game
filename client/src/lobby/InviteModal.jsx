import { useState } from "react";
import { motion } from "framer-motion";
import { getMyShortId } from "./social.js";

// دعوة الأصدقاء 🧑‍🤝‍🧑 — شارك معرّفك أو رابط الدعوة وانسخه بنقرة.
export default function InviteModal({ onClose }) {
  const myId = getMyShortId() || "…";
  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/?invite=${myId}`;
  const [copied, setCopied] = useState("");

  async function copy(text, what) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(""), 1800);
    } catch {
      setCopied("fail");
      setTimeout(() => setCopied(""), 1800);
    }
  }

  async function share() {
    const text = `انضم إليّ في اللعبة! معرّفي ${myId}\n${link}`;
    if (navigator.share) {
      try { await navigator.share({ title: "دعوة لعب", text, url: link }); return; } catch { /* أُلغي */ }
    }
    copy(text, "share");
  }

  return (
    <div className="soc-backdrop" onClick={onClose}>
      <motion.div className="soc-sheet" onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
        <header className="soc-head">
          <button className="soc-close" onClick={onClose}>✕</button>
          <h2>🧑‍🤝‍🧑 دعوة الأصدقاء</h2>
        </header>
        <div className="soc-body">
          {copied && (
            <div className="soc-alert ok">{copied === "fail" ? "تعذّر النسخ" : "تم النسخ ✓"}</div>
          )}

          <div className="vip-current">
            <span className="vip-current-lbl">معرّفي</span>
            <span className="vip-current-id">{myId}</span>
          </div>

          <div className="soc-section">
            <h3>رابط الدعوة</h3>
            <div className="soc-form">
              <input className="soc-input" readOnly value={link} onFocus={(e) => e.target.select()} />
              <button className="soc-btn ghost" onClick={() => copy(link, "link")}>نسخ</button>
            </div>
          </div>

          <button className="store-pay" style={{ width: "100%", marginTop: 8 }} onClick={share}>
            📣 مشاركة الدعوة
          </button>

          <p className="soc-hint">شارك معرّفك مع أصدقائك ليضيفوك ويزوروا ملفك. كلما زاد أصدقاؤك، ظهرت لك شارات جديدة 🎖️</p>
        </div>
      </motion.div>
    </div>
  );
}
