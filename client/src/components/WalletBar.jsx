// شريط المحفظة العلوي — يعرض رصيد الألماس والكوينز مع زر شحن (+) لكل عملة،
// كما في تطبيقات الألعاب. المالك يظهر رصيده ∞ (لانهائي).

const INFINITE = 1_000_000_000;

// تنسيق الأرقام الكبيرة: 779800 -> "779.8K"، 1200000 -> "1.2M"
function fmt(n) {
  if (n >= INFINITE) return "∞";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "K";
  return String(n);
}

export default function WalletBar({ wallet, onRecharge, onOwnerTap }) {
  const diamonds = wallet?.diamonds ?? 0;
  const coins = wallet?.coins ?? 0;
  const isOwner = wallet?.owner;

  return (
    <div className="wallet-bar">
      {/* شعار صغير — ضغطة مطوّلة عليه تفتح دخول المالك */}
      <button
        className="wb-logo"
        title="Jackaroo"
        onClick={(e) => {
          // ضغطة مطوّلة (أو نقرة مزدوجة) لفتح دخول المالك — مخفي عن المستخدم العادي
          if (e.detail >= 2) onOwnerTap?.();
        }}
      >
        🎴{isOwner && <span className="wb-crown">👑</span>}
      </button>

      <div className="wb-flex" />

      {/* الألماس */}
      <div className="wb-pill diamonds">
        <span className="wb-icon">💎</span>
        <span className="wb-amt">{fmt(diamonds)}</span>
        <button className="wb-plus" onClick={() => onRecharge("diamonds")} aria-label="شحن ألماس">
          ＋
        </button>
      </div>

      {/* الكوينز */}
      <div className="wb-pill coins">
        <span className="wb-icon">🪙</span>
        <span className="wb-amt">{fmt(coins)}</span>
        <button className="wb-plus" onClick={() => onRecharge("coins")} aria-label="شحن كوينز">
          ＋
        </button>
      </div>
    </div>
  );
}
