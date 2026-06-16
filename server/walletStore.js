// مخزن المحافظ — يحفظ رصيد كل مستخدم (ألماس + كوينز) على القرص في wallets.json.
// كل مستخدم يُعرّف بمعرّف ثابت (uid) يُولّده العميل ويُخزّنه محلياً.
// • مستخدم جديد يحصل تلقائياً على مكافأة البداية: 500 ألماسة + 10000 كوينز.
// • مالك اللعبة (owner) رصيده لانهائي: لا يُخصم منه شيء ويُعرض كـ ∞.
// • بقية المستخدمين يشحنون عبر المتجر (فيزا) فقط.

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, "wallets.json");

// مكافأة البداية لكل مستخدم جديد (تُمنح مرة واحدة)
export const STARTER_DIAMONDS = 500;
export const STARTER_COINS = 10000;

// قيمة تُمثّل "لانهائي" للمالك (كبيرة جداً لكن آمنة للحساب/الإرسال)
export const INFINITE = 1_000_000_000;

/**
 * مخطط المحفظة:
 * {
 *   uid: string,        // معرّف المستخدم الثابت
 *   coins: number,      // رصيد الكوينز
 *   diamonds: number,   // رصيد الألماس
 *   owner: boolean,     // مالك اللعبة؟ (رصيد لانهائي)
 *   createdAt: number,
 * }
 */

let wallets = {}; // uid -> wallet

function load() {
  if (existsSync(FILE)) {
    try {
      const data = JSON.parse(readFileSync(FILE, "utf8"));
      if (data && typeof data === "object") {
        wallets = data;
        return;
      }
    } catch {
      /* تالف → ابدأ فارغاً */
    }
  }
  wallets = {};
  persist();
}

let saveTimer = null;
function persist() {
  // كتابة مؤجَّلة بسيطة لتقليل ضغط القرص عند الشحن/الإرسال المتكرر
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      writeFileSync(FILE, JSON.stringify(wallets, null, 2), "utf8");
    } catch (e) {
      console.error("تعذّر حفظ wallets.json:", e.message);
    }
  }, 200);
}

function cleanUid(uid) {
  return String(uid || "").trim().slice(0, 64);
}

// يُرجع المحفظة بصيغة العرض (المالك يظهر رصيده لانهائياً)
function view(w) {
  if (w.owner) {
    return { uid: w.uid, coins: INFINITE, diamonds: INFINITE, owner: true, infinite: true };
  }
  return { uid: w.uid, coins: w.coins, diamonds: w.diamonds, owner: false, infinite: false };
}

export const walletStore = {
  init: load,

  // يُنشئ المحفظة إن لم توجد (مع مكافأة البداية) ويُرجعها للعرض.
  // يُرجع isNew=true إذا أُنشئت الآن (لتعرض الواجهة رسالة المكافأة).
  ensure(uid) {
    uid = cleanUid(uid);
    if (!uid) return { wallet: view({ uid: "", coins: 0, diamonds: 0, owner: false }), isNew: false };
    let isNew = false;
    if (!wallets[uid]) {
      wallets[uid] = {
        uid,
        coins: STARTER_COINS,
        diamonds: STARTER_DIAMONDS,
        owner: false,
        createdAt: Date.now(),
      };
      isNew = true;
      persist();
    }
    return { wallet: view(wallets[uid]), isNew };
  },

  // الرصيد الخام (للحسابات الداخلية) — يُنشئ المحفظة إن لزم
  raw(uid) {
    uid = cleanUid(uid);
    if (!uid) return null;
    if (!wallets[uid]) this.ensure(uid);
    return wallets[uid];
  },

  isOwner(uid) {
    const w = this.raw(uid);
    return !!(w && w.owner);
  },

  // يرفع/يخفض علم المالك (يُستدعى بعد التحقق من كلمة السر في الخادم)
  setOwner(uid, isOwner) {
    const w = this.raw(uid);
    if (!w) return null;
    w.owner = !!isOwner;
    persist();
    return view(w);
  },

  // يشحن الرصيد (شراء ناجح). المالك لانهائي فلا يتغيّر فعلياً.
  credit(uid, { coins = 0, diamonds = 0 } = {}) {
    const w = this.raw(uid);
    if (!w) return null;
    if (!w.owner) {
      w.coins = Math.max(0, w.coins + Math.max(0, Math.floor(coins)));
      w.diamonds = Math.max(0, w.diamonds + Math.max(0, Math.floor(diamonds)));
      persist();
    }
    return view(w);
  },

  // يخصم الرصيد (إرسال هدية مثلاً). يُرجع true عند النجاح.
  // المالك: يُسمح دائماً دون خصم. غيره: يُرفض إن كان الرصيد غير كافٍ.
  spend(uid, { coins = 0, diamonds = 0 } = {}) {
    const w = this.raw(uid);
    if (!w) return false;
    coins = Math.max(0, Math.floor(coins));
    diamonds = Math.max(0, Math.floor(diamonds));
    if (w.owner) return true; // لانهائي
    if (w.coins < coins || w.diamonds < diamonds) return false;
    w.coins -= coins;
    w.diamonds -= diamonds;
    persist();
    return true;
  },
};
