// رأس الغرفة — يعرض اسم الغرفة كاسم أساسي مع شارة المستوى والمعرّف.
export default function RoomHeader({ room, memberCount, onBack, onOpenInfo }) {
  const level = room.level || 1;
  const per = room.pointsPerLevel || 5000; // تكلفة الترقية الحالية (تزداد كل مستوى)
  const points = room.points || 0;
  const start = room.levelStartPoints || 0;
  // تقدّم النقاط داخل المستوى الحالي (0..per) ضمن المنحنى التصاعدي
  const into = Math.max(0, points - start);
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
          {/* اسم الغرفة هو الاسم الأساسي المعروض */}
          <span className="rh-friends">{room.name || "غرفتي"}</span>
          {/* شريط تقدّم نقاط الغرفة نحو المستوى التالي */}
          <span className="rh-lvbar" title={`${into} / ${per} نقطة للمستوى ${level + 1}`}>
            <span className="rh-lvbar-fill" style={{ width: `${pct}%` }} />
          </span>
        </div>
        <div className="rh-line2">
          <span className="rh-id">ID: {room.id}</span>
        </div>
      </div>

      <button className="rh-next" title="تفاصيل الغرفة" onClick={onOpenInfo}>›</button>
    </div>
  );
}
