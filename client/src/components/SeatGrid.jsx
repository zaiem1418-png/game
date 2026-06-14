import Seat from "./Seat.jsx";

// شبكة المقاعد — 12 مقعداً
export default function SeatGrid({ seats, selfId, reactions = {}, onTakeSeat, onSeatTap }) {
  return (
    <div className="seat-grid">
      {seats.map((seat) => (
        <Seat
          key={seat.index}
          seat={seat}
          isSelf={seat.user?.id === selfId}
          reaction={reactions[seat.index] || null}
          onTake={() => onTakeSeat(seat.index)}
          onTap={() => onSeatTap(seat)}
        />
      ))}
    </div>
  );
}
