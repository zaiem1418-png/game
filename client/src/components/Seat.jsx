// مقعد واحد — تصميم محدّث: إطار احترافي، إطار متحرك للمالك/المشرف،
// توهج وموجات صوت عند التحدث، تأثير دخول، وطبقة تفاعلات فوق الصورة.
import ReactionBurst from "./ReactionBurst.jsx";

export default function Seat({ seat, isSelf, reaction, onTake, onTap }) {
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

  const role = user.role; // owner | admin | member
  const roleClass = role === "owner" ? "role-owner" : role === "admin" ? "role-admin" : "";

  return (
    <div className={`seat filled ${isSelf ? "self" : ""}`} onClick={onTap}>
      <div className={`seat-av-wrap ${roleClass} ${speaking ? "is-speaking" : ""}`}>
        {/* حلقات صوت عند التحدث */}
        {speaking && (
          <>
            <span className="sw sw1" aria-hidden />
            <span className="sw sw2" aria-hidden />
          </>
        )}

        {/* الإطار + الصورة */}
        <div className={`seat-circle frame-${user.frame || "none"}`}>
          <span className="seat-avatar">{user.avatar || "🙂"}</span>
          <span className="seat-gloss" aria-hidden />
        </div>

        {/* مؤشر الكتم / معادل الصوت أثناء الكلام */}
        {muted ? (
          <span className="mute-badge">🔇</span>
        ) : speaking ? (
          <span className="eq" aria-hidden>
            <i /><i /><i /><i />
          </span>
        ) : null}

        {/* شارة المالك/المشرف */}
        {role === "owner" && <span className="role-badge owner">👑</span>}
        {role === "admin" && <span className="role-badge admin">🛡️</span>}

        {/* طبقة التفاعل فوق الصورة */}
        {reaction && (
          <div className="rx-layer">
            <ReactionBurst key={reaction.id} type={reaction.type} />
          </div>
        )}
      </div>

      <div className="seat-name">
        {user.name} {isSelf && <span className="you-tag">(أنت)</span>}
      </div>
    </div>
  );
}
