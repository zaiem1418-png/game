// رأس الغرفة: الاسم، الرقم، عدد الحاضرين، وحالة النشاط
export default function RoomHeader({ room, memberCount }) {
  return (
    <div className="room-header">
      <div className="rh-right">
        <span className="rh-badge">7</span>
        <div className="rh-titles">
          <div className="rh-name">{room.name}</div>
          <div className="rh-meta">
            ID: {room.id} · <span className="rh-active">جاري النشاط</span>
          </div>
        </div>
      </div>

      <div className="rh-left">
        <div className="rh-count">👥 {memberCount}</div>
        <button className="rh-fav">❤</button>
      </div>
    </div>
  );
}
