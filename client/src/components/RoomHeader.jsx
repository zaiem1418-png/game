// رأس الغرفة — مستوحى من نمط تطبيقات الغرف: شارة الموسم/المستوى، الأصدقاء، المعرّف.
const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export default function RoomHeader({ room, memberCount }) {
  const month = MONTHS_AR[new Date().getMonth()];
  const level = room.level || 5;

  return (
    <div className="room-header">
      {/* تحكّمات يسار (نهاية RTL) */}
      <div className="rh-controls">
        <button className="rh-ctl" title="القائمة">⋯</button>
        <span className="rh-page">{memberCount || 1}</span>
        <button className="rh-ctl" title="تصغير">－</button>
      </div>

      <div className="rh-flex" />

      {/* معلومات الغرفة يمين (بداية RTL) */}
      <div className="rh-shield" title="درع الغرفة">
        <span>🛡️</span>
      </div>

      <div className="rh-room">
        <div className="rh-line1">
          <span className="rh-spark">✨</span>
          <span className="rh-month">{month}</span>
          <span className="rh-spark">✨</span>
          <span className="rh-level">{level}</span>
        </div>
        <div className="rh-line2">
          <span className="rh-friends">{room.name || "الأصدقاء"}</span>
          <span className="rh-id">ID: {room.id}</span>
        </div>
      </div>

      <button className="rh-next" title="تفاصيل الغرفة">›</button>
    </div>
  );
}
