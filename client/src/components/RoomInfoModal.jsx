import { useState } from "react";
import { motion } from "framer-motion";

// تفاصيل الغرفة: المعرّف (للبحث/النسخ)، المستوى وتقدّم النقاط، المالك، وإدارة المشرفين.
// يضيف/يزيل المالك المشرفين (العدد المسموح حسب مستوى الغرفة).
export default function RoomInfoModal({ room, selfUid, onAddAdmin, onRemoveAdmin, onClose }) {
  const [copied, setCopied] = useState(false);
  const level = room.level || 1;
  const per = room.pointsPerLevel || 5000;
  const points = room.points || 0;
  const into = points % per;
  const pct = Math.min(100, Math.round((into / per) * 100));
  const maxAdmins = room.maxAdmins || 2;
  const admins = room.admins || [];
  const isOwner = selfUid && room.ownerUid && selfUid === room.ownerUid;

  // الأعضاء المتصلون (لهم uid) — لاشتقاق المالك/المشرفين/المرشّحين للترقية
  const members = room.members || [];
  const owner = members.find((m) => m.uid && m.uid === room.ownerUid);
  const adminMembers = members.filter((m) => m.uid && admins.includes(m.uid));
  // مرشّحون للترقية: أعضاء حاضرون ليسوا المالك ولا مشرفين
  const candidates = members.filter(
    (m) => m.uid && m.uid !== room.ownerUid && !admins.includes(m.uid)
  );

  function copyId() {
    navigator.clipboard?.writeText(room.id).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {}
    );
  }

  return (
    <div className="cr-backdrop" onClick={onClose}>
      <motion.div
        className="ri-sheet"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
      >
        <div className="cr-grip" />
        <h2 className="cr-title">تفاصيل الغرفة</h2>

        {/* المعرّف + نسخ (للبحث عن الغرفة) */}
        <div className="ri-id-row">
          <div className="ri-id-box">
            <span className="ri-id-label">معرّف الغرفة</span>
            <span className="ri-id-val">{room.id}</span>
          </div>
          <button className="ri-copy" onClick={copyId}>{copied ? "✓ نُسخ" : "نسخ"}</button>
        </div>

        <div className="ri-name">{room.name}</div>

        {/* المستوى + شريط التقدّم */}
        <div className="ri-level-card">
          <div className="ri-level-top">
            <span className="ri-level-badge">🛡️ المستوى {level}</span>
            <span className="ri-level-pts">{points.toLocaleString("en-US")} نقطة</span>
          </div>
          <div className="ri-level-bar">
            <div className="ri-level-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="ri-level-hint">
            {into.toLocaleString("en-US")} / {per.toLocaleString("en-US")} للوصول للمستوى {level + 1}
            <span className="ri-level-note"> — تتجمّع النقاط من قيمة الهدايا داخل الغرفة</span>
          </div>
        </div>

        {/* المالك */}
        <div className="ri-section-title">👑 مالك الغرفة</div>
        <div className="ri-person owner">
          <span className="ri-ava">{owner?.avatar || "👤"}</span>
          <span className="ri-person-name">{owner?.name || "المالك"}</span>
          <span className="ri-role-tag owner">المالك</span>
        </div>

        {/* المشرفون */}
        <div className="ri-section-title">
          🛡️ المشرفون <span className="ri-count">{admins.length}/{maxAdmins}</span>
        </div>
        {adminMembers.length === 0 && <div className="ri-empty">لا يوجد مشرفون بعد</div>}
        {adminMembers.map((m) => (
          <div className="ri-person" key={m.uid}>
            <span className="ri-ava">{m.avatar || "👤"}</span>
            <span className="ri-person-name">{m.name}</span>
            <span className="ri-role-tag admin">مشرف</span>
            {isOwner && (
              <button className="ri-btn demote" onClick={() => onRemoveAdmin(m.uid)}>إزالة</button>
            )}
          </div>
        ))}

        {/* ترقية أعضاء (للمالك فقط) */}
        {isOwner && (
          <>
            <div className="ri-section-title">ترقية عضو لمشرف</div>
            {admins.length >= maxAdmins && (
              <div className="ri-empty">بلغت الحد الأقصى للمشرفين في هذا المستوى — ارفع مستوى الغرفة للمزيد</div>
            )}
            {candidates.length === 0 && <div className="ri-empty">لا يوجد أعضاء آخرون في الغرفة الآن</div>}
            {candidates.map((m) => (
              <div className="ri-person" key={m.uid}>
                <span className="ri-ava">{m.avatar || "👤"}</span>
                <span className="ri-person-name">{m.name}</span>
                <button
                  className="ri-btn promote"
                  disabled={admins.length >= maxAdmins}
                  onClick={() => onAddAdmin(m.uid)}
                >
                  ترقية
                </button>
              </div>
            ))}
          </>
        )}

        <button className="cr-create" onClick={onClose}>إغلاق</button>
      </motion.div>
    </div>
  );
}
