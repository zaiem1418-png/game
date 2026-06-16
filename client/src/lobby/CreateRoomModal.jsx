import { useState } from "react";
import { motion } from "framer-motion";
import { createRoom } from "./rooms.js";

const CATEGORIES = ["الأصدقاء", "جاكارو", "بلوت", "لودو", "القبيلة", "الموسيقى"];
const COUNTRIES = ["🇸🇦", "🇦🇪", "🇰🇼", "🇶🇦", "🇴🇲", "🇧🇭", "🇮🇶", "🇪🇬", "🇯🇴", "🌍"];
const COVERS = ["#6a2f8f", "#5a1f24", "#1f4a3a", "#6a3a1f", "#2a2f4a", "#5a2a2a", "#1f6a8a"];

// نافذة إنشاء غرفة صوتية — تدعم غرفة عامة أو خاصة برمز PIN
export default function CreateRoomModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("public"); // public | private
  const [pin, setPin] = useState("");
  const [category, setCategory] = useState("الأصدقاء");
  const [country, setCountry] = useState("🇸🇦");
  const [cover, setCover] = useState(COVERS[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const pinOk = type === "public" || /^\d{4,8}$/.test(pin);

  async function submit() {
    setErr("");
    if (!pinOk) return setErr("رمز PIN يجب أن يكون 4–8 أرقام");
    setBusy(true);
    try {
      const { roomId } = await createRoom({ name: name.trim() || "غرفتي", type, pin, category, country, cover });
      onCreated(roomId, type === "private" ? pin : null);
    } catch (e) {
      setErr(e.message || "تعذّر الإنشاء");
      setBusy(false);
    }
  }

  return (
    <div className="cr-backdrop" onClick={onClose}>
      <motion.div
        className="cr-sheet"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
      >
        <div className="cr-grip" />
        <h2 className="cr-title">إنشاء غرفة صوتية</h2>

        {/* المعاينة */}
        <div className="cr-preview" style={{ background: `linear-gradient(135deg, ${cover}, #15101f)` }}>
          <span className="cr-prev-flag">{country}</span>
          <span className="cr-prev-name">{name.trim() || "غرفتي"}</span>
          <span className="cr-prev-cat">{category}</span>
          {type === "private" && <span className="cr-prev-lock">🔒 خاصة</span>}
        </div>

        <label className="cr-label">اسم الغرفة</label>
        <input
          className="cr-input"
          placeholder="اكتب اسم الغرفة..."
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
        />

        {/* نوع الغرفة */}
        <label className="cr-label">نوع الغرفة</label>
        <div className="cr-seg">
          <button className={type === "public" ? "active" : ""} onClick={() => setType("public")}>
            🌐 عامة
          </button>
          <button className={type === "private" ? "active" : ""} onClick={() => setType("private")}>
            🔒 خاصة (PIN)
          </button>
        </div>

        {/* رمز PIN */}
        {type === "private" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
            <label className="cr-label">رمز الدخول (PIN)</label>
            <input
              className="cr-input cr-pin"
              placeholder="• • • •"
              inputMode="numeric"
              value={pin}
              maxLength={8}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            />
            <p className="cr-hint">من يملك الرمز فقط يقدر يدخل الغرفة (4–8 أرقام).</p>
          </motion.div>
        )}

        <label className="cr-label">التصنيف</label>
        <div className="cr-chips">
          {CATEGORIES.map((c) => (
            <button key={c} className={category === c ? "active" : ""} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>

        <label className="cr-label">الدولة</label>
        <div className="cr-chips cr-flags">
          {COUNTRIES.map((c) => (
            <button key={c} className={country === c ? "active" : ""} onClick={() => setCountry(c)}>
              {c}
            </button>
          ))}
        </div>

        <label className="cr-label">لون الغلاف</label>
        <div className="cr-covers">
          {COVERS.map((c) => (
            <button
              key={c}
              className={`cr-cover ${cover === c ? "active" : ""}`}
              style={{ background: c }}
              onClick={() => setCover(c)}
            />
          ))}
        </div>

        {err && <div className="cr-err">{err}</div>}

        <button className="cr-create" disabled={busy || !pinOk} onClick={submit}>
          {busy ? "جارٍ الإنشاء..." : "إنشاء ودخول"}
        </button>
      </motion.div>
    </div>
  );
}
