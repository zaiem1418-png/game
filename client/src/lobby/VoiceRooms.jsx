import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchRooms, deleteRoom } from "./rooms.js";
import { getUid } from "../wallet.js";
import { getFavorites, toggleFavorite } from "./favorites.js";
import CreateRoomModal from "./CreateRoomModal.jsx";

const TOP_TABS = ["المفضلة", "الشائعة", "الكل"];
const CATS = ["الكل", "الأصدقاء", "جاكارو", "بلوت", "لودو", "القبيلة", "الموسيقى"];

// شاشة الغرف الصوتية — دليل الغرف + زر "+" لإنشاء غرفة (عامة/خاصة برمز PIN)
export default function VoiceRooms({ onEnterRoom }) {
  const [rooms, setRooms] = useState([]);
  const [topTab, setTopTab] = useState("الكل");
  const [cat, setCat] = useState("الكل");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [pinRoom, setPinRoom] = useState(null); // غرفة خاصة بانتظار إدخال الرمز
  const [pinVal, setPinVal] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmDel, setConfirmDel] = useState(null); // الغرفة المراد حذفها
  const [deleting, setDeleting] = useState(false);
  const [favs, setFavs] = useState(getFavorites); // معرّفات الغرف المفضّلة (محلياً)
  const myUid = getUid();

  function onToggleFav(id) {
    setFavs(toggleFavorite(id));
  }

  const load = () =>
    fetchRooms()
      .then((r) => setRooms(r))
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    const t = setInterval(load, 8000); // تحديث دوري لأعداد الأعضاء
    return () => clearInterval(t);
  }, []);

  // البحث بالمعرّف أو الاسم — له الأولوية على التبويبات والتصنيف
  const q = query.trim().toLowerCase();
  let list;
  if (q) {
    list = rooms.filter((r) => r.id.includes(q) || (r.name || "").toLowerCase().includes(q));
  } else {
    list = rooms.filter((r) => cat === "الكل" || r.category === cat);
    if (topTab === "المفضلة") {
      // فقط الغرف التي أضافها المستخدم لمفضّلته
      list = list.filter((r) => favs.includes(String(r.id)));
    } else if (topTab === "الشائعة") {
      // الأكثر أعضاءً أولاً
      list = [...list].sort((a, b) => (b.members || 0) - (a.members || 0));
    }
  }

  function tapRoom(r) {
    if (r.locked) {
      setPinRoom(r);
      setPinVal("");
    } else {
      onEnterRoom(r.id, null);
    }
  }

  function confirmDelete() {
    if (!confirmDel) return;
    setDeleting(true);
    deleteRoom(confirmDel.id)
      .then(() => {
        setRooms((rs) => rs.filter((x) => x.id !== confirmDel.id));
        setConfirmDel(null);
      })
      .catch((e) => alert(e.message || "تعذّر حذف الغرفة"))
      .finally(() => setDeleting(false));
  }

  return (
    <div className="vr">
      <div className="gl-bg vr-bg" />

      {/* الرأس: + | بحث | تبويبات علوية */}
      <header className="vr-top">
        <div className="vr-top-actions">
          <motion.button className="vr-add" whileTap={{ scale: 0.9 }} onClick={() => setCreateOpen(true)} aria-label="إنشاء غرفة">
            ＋
          </motion.button>
          <button
            className={`vr-search ${searchOpen ? "active" : ""}`}
            aria-label="بحث"
            onClick={() => {
              setSearchOpen((v) => !v);
              if (searchOpen) setQuery("");
            }}
          >
            🔍
          </button>
        </div>
        <div className="vr-tabs">
          {TOP_TABS.map((t) => (
            <button key={t} className={`vr-tab ${topTab === t ? "active" : ""}`} onClick={() => setTopTab(t)}>
              {t}
              {topTab === t && <motion.span layoutId="vr-tab-ul" className="vr-tab-ul" />}
            </button>
          ))}
        </div>
      </header>

      {/* شريط البحث عن غرفة بالمعرّف أو الاسم */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            className="vr-searchbar"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <input
              className="vr-search-input"
              placeholder="ابحث برقم الغرفة (ID) أو اسمها…"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button className="vr-search-clear" onClick={() => setQuery("")}>✕</button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="vr-scroll">
        {/* بانر ترويجي */}
        <div className="vr-promo">
          <span className="vr-promo-spark">🎆</span>
          <b>إرشادات إنشاء الأنشطة</b>
          <span className="vr-promo-lion">🦁</span>
        </div>

        {/* بطاقتا الترتيب */}
        <div className="vr-rankings">
          <button className="vr-rank vip">
            <span className="vr-rank-ava" />
            <span className="vr-rank-mid">VIP <span>🏆</span></span>
          </button>
          <button className="vr-rank pop">
            <span className="vr-rank-ava" />
            <span className="vr-rank-mid">الشعبية <span>🏆</span></span>
          </button>
        </div>

        {/* تصنيفات أفقية */}
        <div className="vr-cats">
          {CATS.map((c) => (
            <button key={c} className={`vr-cat ${cat === c ? "active" : ""}`} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>

        {/* قائمة الغرف */}
        <div className="vr-list">
          {loading && <div className="vr-empty">جارٍ التحميل…</div>}
          {!loading && list.length === 0 && (
            <div className="vr-empty">
              {topTab === "المفضلة"
                ? "لا توجد غرف في مفضّلتك بعد — اضغط ⭐ على أي غرفة لإضافتها"
                : "لا توجد غرف في هذا التصنيف بعد — أنشئ واحدة ＋"}
            </div>
          )}
          {list.map((r, i) => (
            <motion.div
              key={r.id}
              className="vr-room"
              role="button"
              tabIndex={0}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
              whileTap={{ scale: 0.98 }}
              onClick={() => tapRoom(r)}
            >
              <span className="vr-room-cover" style={{ background: `linear-gradient(135deg, ${r.cover}, #15101f)` }}>
                {r.locked ? "🔒" : "🎙️"}
              </span>
              <span className="vr-room-info">
                <span className="vr-room-name">
                  {r.name} <span className="vr-room-flag">{r.country}</span>
                </span>
                <span className="vr-room-meta">
                  <span className="vr-room-lv">Lv.{r.level || 1}</span>
                  <span className="vr-room-cat">{r.category}</span>
                  <span className="vr-room-count">👥 {r.members}</span>
                  <span className="vr-room-rid">ID {r.id}</span>
                  {r.tag && <span className="vr-room-tag">{r.tag}</span>}
                </span>
              </span>
              <button
                className={`vr-room-fav ${favs.includes(String(r.id)) ? "on" : ""}`}
                aria-label={favs.includes(String(r.id)) ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                title={favs.includes(String(r.id)) ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFav(r.id);
                }}
              >
                {favs.includes(String(r.id)) ? "⭐" : "☆"}
              </button>
              {r.ownerUid && r.ownerUid === myUid && (
                <button
                  className="vr-room-del"
                  aria-label="حذف الغرفة"
                  title="حذف الغرفة"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDel(r);
                  }}
                >
                  🗑️
                </button>
              )}
              <span className="vr-room-go">‹</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* نافذة الإنشاء */}
      <AnimatePresence>
        {createOpen && (
          <CreateRoomModal
            onClose={() => setCreateOpen(false)}
            onCreated={(roomId, pin) => {
              setCreateOpen(false);
              load();
              onEnterRoom(roomId, pin);
            }}
          />
        )}
      </AnimatePresence>

      {/* تأكيد حذف الغرفة */}
      <AnimatePresence>
        {confirmDel && (
          <div className="cr-backdrop" onClick={() => !deleting && setConfirmDel(null)}>
            <motion.div
              className="vr-pin-box"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
            >
              <div className="vr-pin-lock">🗑️</div>
              <h3>حذف الغرفة</h3>
              <p>هل تريد حذف «{confirmDel.name}» نهائياً؟</p>
              <div className="vr-pin-actions">
                <button className="vr-pin-cancel" disabled={deleting} onClick={() => setConfirmDel(null)}>
                  إلغاء
                </button>
                <button className="vr-pin-go vr-del-go" disabled={deleting} onClick={confirmDelete}>
                  {deleting ? "جارٍ الحذف…" : "حذف"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* طلب رمز PIN لغرفة خاصة */}
      <AnimatePresence>
        {pinRoom && (
          <div className="cr-backdrop" onClick={() => setPinRoom(null)}>
            <motion.div
              className="vr-pin-box"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
            >
              <div className="vr-pin-lock">🔒</div>
              <h3>غرفة خاصة</h3>
              <p>أدخل رمز الدخول لـ «{pinRoom.name}»</p>
              <input
                className="cr-input cr-pin"
                placeholder="• • • •"
                inputMode="numeric"
                autoFocus
                value={pinVal}
                maxLength={8}
                onChange={(e) => setPinVal(e.target.value.replace(/\D/g, ""))}
              />
              <div className="vr-pin-actions">
                <button className="vr-pin-cancel" onClick={() => setPinRoom(null)}>إلغاء</button>
                <button
                  className="vr-pin-go"
                  disabled={pinVal.length < 4}
                  onClick={() => {
                    onEnterRoom(pinRoom.id, pinVal);
                    setPinRoom(null);
                  }}
                >
                  دخول
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
