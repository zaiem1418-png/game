import Seat from "./Seat.jsx";

// شبكة المقاعد — 12 مقعداً مثل الصورة
export default function SeatGrid({ seats, selfId, onTakeSeat, onSeatTap }) {
  return (
    <div className="seat-grid">
      {seats.map((seat) => (
        <Seat
          key={seat.index}
          seat={seat}
          isSelf={seat.user?.id === selfId}
          onTake={() => onTakeSeat(seat.index)}
          onTap={() => onSeatTap(seat)}
        />
      ))}
    </div>
  );
}
