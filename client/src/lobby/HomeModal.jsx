import { motion } from "framer-motion";
import { getProfile } from "../wallet.js";

// المنزل 🏠 — مساحتك الخاصة: صورتك واسمك وزينة منزلك.
export default function HomeModal({ user, onClose, onRecharge }) {
  const p = getProfile();
  const name = user?.name || p.name;

  return (
    <div className="soc-backdrop" onClick={onClose}>
      <motion.div className="soc-sheet" onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
        <header className="soc-head">
          <button className="soc-close" onClick={onClose}>✕</button>
          <h2>🏠 المنزل</h2>
        </header>
        <div className="soc-body">
          <div className="home-scene">
            <div className="home-roof">🏠</div>
            <div className="home-host">
              <span className="home-host-ava">{p.avatar || "🧑🏻"}</span>
              <span className="home-host-name">منزل {name}</span>
            </div>
            <div className="home-deco">
              <span>🪴</span><span>🖼️</span><span>🛋️</span><span>🕯️</span>
            </div>
          </div>
          <p className="soc-hint">زيّن منزلك بالأثاث والتُّحف من المتجر، واستقبل أصدقاءك وزوّارك فيه.</p>
          <button className="store-pay" style={{ width: "100%", marginTop: 8 }} onClick={() => onRecharge?.("coins")}>
            🛒 تسوّق زينة المنزل
          </button>
        </div>
      </motion.div>
    </div>
  );
}
