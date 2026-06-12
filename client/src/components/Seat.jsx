// مقعد واحد: فاضي (+) أو فيه مستخدم مع إطار وموجة صوت ومؤشر كتم
export default function Seat({ seat, isSelf, onTake, onTap }) {
  const { user, muted, locked, speaking } = seat;

  if (!user) {
    return (
      <button
        className={`seat empty ${locked ? "locked" : ""}`}
        onClick={() => !locked && onTake()}
        title={locked ? "مقعد مقفل" : "اجلس هنا"}
      >
        <div className="seat-circle">
          <span className="seat-plus">{locked ? "🔒" : "+"}</span>
        </div>
        <div className="seat-name muted">المقعد {seat.index + 1}</div>
      </button>
    );
  }

  return (
    <div className={`seat filled ${isSelf ? "self" : ""}`} onClick={onTap}>
      <div className={`seat-circle frame-${user.frame || "none"} ${speaking ? "speaking" : ""}`}>
        <span className="seat-avatar">{user.avatar || "🙂"}</span>
        {speaking && <span className="wave" aria-hidden />}
        {muted && <span className="mute-badge">🔇</span>}
      </div>
      <div className="seat-name">
        {user.name} {isSelf && <span className="you-tag">(أنت)</span>}
      </div>
    </div>
  );
}
