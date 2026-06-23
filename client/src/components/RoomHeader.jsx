// رأس الغرفة — مستوحى من نمط تطبيقات الغرف: شارة الموسم/المستوى، الأصدقاء، المعرّف.
const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export default function RoomHeader({ room, memberCount, onBack, onOpenInfo }) {
  const month = MONTHS_AR[new Date().getMonth()];
  const level = room.level || 1;
  const per = room.pointsPerLevel || 5000;
  const points = room.points || 0;
  // تقدّم النقاط داخل المستوى الحالي (0..1) — كل 5000 نقطة مستوى
  const into = points % per;
  const pct = Math.min(100, Math.round((into / per) * 100));

  return (
    <div className="room-header">
      {/* تحكّمات يسار (نهاية RTL) */}
      <div className="rh-controls">
        <button className="rh-ctl" title="القائمة" onClick={onOpenInfo}>⋯</button>
        <span className="rh-page">{memberCount || 1}</span>
        <button className="rh-ctl rh-back" title="خروج" aria-label="خروج من الغرفة" onClick={onBack}>
          ✕
        </button>
      </div>

      <div className="rh-flex" />

      {/* معلومات الغرفة يمين (بداية RTL) */}
      <div className="rh-shield" title="مستوى الغرفة">
        <span className="rh-shield-ic">🛡️</span>
        <span className="rh-shield-lv">{level}</span>
      </div>

      <div className="rh-room" onClick={onOpenInfo} role="button" title="تفاصيل الغرفة">
        <div className="rh-line1">
          <span className="rh-spark">✨</span>
          <span className="rh-month">{month}</span>
          {/* شريط تقدّم نقاط الغرفة نحو المستوى التالي */}
          <span className="rh-lvbar" title={`${into} / ${per} نقطة للمستوى ${level + 1}`}>
            <span className="rh-lvbar-fill" style={{ width: `${pct}%` }} />
          </span>
        </div>
        <div className="rh-line2">
          <span className="rh-friends">{room.name || "الأصدقاء"}</span>
          <span className="rh-id">ID: {room.id}</span>
        </div>
      </div>

      <button className="rh-next" title="تفاصيل الغرفة" onClick={onOpenInfo}>›</button>
    </div>
  );
}
