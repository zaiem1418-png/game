// طبقة أنيميشن الهدايا الطائرة فوق الغرفة
export default function GiftOverlay({ flyingGifts }) {
  return (
    <div className="gift-overlay">
      {flyingGifts.map((g) => (
        <div key={g.id} className="flying-gift">
          <div className="fg-emoji">{g.gift.emoji}</div>
          <div className="fg-text">
            {g.from.name} {g.to ? `→ ${g.to.name}` : ""}
          </div>
        </div>
      ))}
    </div>
  );
}
