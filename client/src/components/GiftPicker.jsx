import { useMemo, useState } from "react";

// تبويبات الفئات (مطابقة لنمط تطبيقات الغرف)
const CATEGORIES = [
  { id: "bag",    label: "الحقيبة" },
  { id: "gift",   label: "هدية" },
  { id: "flag",   label: "علم" },
  { id: "tribe",  label: "قبيلة" },
  { id: "member", label: "عضو" },
  { id: "celeb",  label: "مشاهير" },
  { id: "vip",    label: "VIP" },
];

const QUANTITIES = [1, 7, 10, 30, 99, 199, 520, 1314];
const PAGE_SIZE = 8;

const RAR_LABEL = { rare: "نادرة", epic: "ملحمية", legendary: "أسطورية" };

// نافذة اختيار الهدية والمستلم — تصميم Drawer احترافي
export default function GiftPicker({ gifts, members, selfCoins = 0, onSend, onClose }) {
  const [cat, setCat] = useState("gift");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [toUserId, setToUserId] = useState("all");
  const [qty, setQty] = useState(1);
  const [qtyOpen, setQtyOpen] = useState(false);
  const [anon, setAnon] = useState(false);

  // هدايا الفئة الحالية
  const list = useMemo(() => gifts.filter((g) => (g.category || "gift") === cat), [gifts, cat]);
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const pageGifts = list.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  function switchCat(id) {
    setCat(id);
    setPage(0);
    setSelected(null);
  }

  function send() {
    if (!selected) return;
    onSend(selected, toUserId === "all" ? null : toUserId, { quantity: qty, anon });
  }

  return (
    <div className="gd-backdrop" onClick={onClose}>
      <div className="gd-sheet" onClick={(e) => e.stopPropagation()}>
        {/* تبويبات الفئات */}
        <div className="gd-cats">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`gd-cat ${cat === c.id ? "active" : ""}`}
              onClick={() => switchCat(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* شريط الكاريزما */}
        <div className="gd-charisma">
          <span className="gd-q">؟</span>
          الكاريزما 60+ ، كأقصى حد يمكن للمستلم الحصول على 1500 الماس
        </div>

        {/* المستلم */}
        <div className="gd-to">
          <span>إلى:</span>
          <select value={toUserId} onChange={(e) => setToUserId(e.target.value)}>
            <option value="all">الجميع 🌍</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.avatar} {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* الشبكة */}
        {pageGifts.length === 0 ? (
          <div className="gd-empty">لا توجد عناصر في هذا القسم بعد</div>
        ) : (
          <div className="gd-grid">
            {pageGifts.map((g) => (
              <button
                key={g.id}
                className={`gd-item rar-${g.rarity || "common"} ${selected === g.id ? "active" : ""}`}
                onClick={() => setSelected(g.id)}
              >
                {RAR_LABEL[g.rarity] && <span className="gd-rar">{RAR_LABEL[g.rarity]}</span>}
                <span className="gd-emoji">{g.emoji}</span>
                <span className="gd-name">{g.name}</span>
                <span className="gd-price">{g.coins.toLocaleString("en-US")} 💎</span>
              </button>
            ))}
          </div>
        )}

        {/* نقاط الصفحات */}
        {pages > 1 && (
          <div className="gd-dots">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                className={`gd-dot ${page === i ? "active" : ""}`}
                onClick={() => setPage(i)}
                aria-label={`صفحة ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* شريط الإرسال */}
        <div className="gd-sendbar">
          <button className="gd-send" onClick={send} disabled={!selected}>
            إرسال
          </button>

          <div className="gd-qty">
            <button className="gd-qty-btn" onClick={() => setQtyOpen((o) => !o)}>
              <span className="gd-caret">⌄</span> {qty}
            </button>
            {qtyOpen && (
              <div className="gd-qty-list">
                {QUANTITIES.map((q) => (
                  <button
                    key={q}
                    className={q === qty ? "active" : ""}
                    onClick={() => {
                      setQty(q);
                      setQtyOpen(false);
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className={`gd-mask ${anon ? "active" : ""}`}
            onClick={() => setAnon((a) => !a)}
            title={anon ? "إرسال مجهول مُفعّل" : "إرسال مجهول"}
          >
            🎭
          </button>

          <button className="gd-balance" onClick={onClose} title="رصيدك">
            <span className="gd-plus">+</span> {selfCoins.toLocaleString("en-US")} 💎
          </button>
        </div>
      </div>
    </div>
  );
}
