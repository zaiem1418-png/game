// نظام «الأي دي المميّز» (Vanity ID) — تسعير المعرّفات القصيرة المميّزة بالألماس.
// المستخدم يشتري معرّفاً قصيراً مميّزاً (4 إلى 8 أرقام) يحلّ محلّ رقمه القصير
// العادي ليجده الآخرون به ويظهر في ملفه بشارة VIP. كلما كان المعرّف أندر (أقصر،
// أرقام متطابقة، تسلسل، أو نمط متكرّر) كان أغلى.

// السعر الأساسي حسب الطول (الأقصر أندر فأغلى) — بالألماس.
const BASE_BY_LEN = { 4: 60000, 5: 30000, 6: 12000, 7: 6000, 8: 3000 };

// هل الأرقام تسلسل تصاعدي/تنازلي متّصل؟ مثل 123456 أو 4321
function isSequence(id) {
  if (id.length < 3) return false;
  let up = true, down = true;
  for (let i = 1; i < id.length; i++) {
    const d = id.charCodeAt(i) - id.charCodeAt(i - 1);
    if (d !== 1) up = false;
    if (d !== -1) down = false;
  }
  return up || down;
}

// هل النمط زوجي متكرّر؟ مثل 1212 أو 123123 (نصفان متطابقان)
function isRepeatedPattern(id) {
  const n = id.length;
  for (let unit = 1; unit <= n / 2; unit++) {
    if (n % unit !== 0) continue;
    const head = id.slice(0, unit);
    if (id.match(new RegExp(`^(${head})+$`)) && head !== id) return true;
  }
  return false;
}

// هل كل الأرقام «مزدوجة»؟ مثل 112233 أو 778899 (أزواج متطابقة متتالية)
function isPairs(id) {
  if (id.length % 2 !== 0) return false;
  for (let i = 0; i < id.length; i += 2) {
    if (id[i] !== id[i + 1]) return false;
  }
  return true;
}

// يحسب سعر معرّف معيّن (سلسلة أرقام 4..8) بالألماس
export function vipIdPrice(id) {
  id = String(id || "");
  const len = id.length;
  let price = BASE_BY_LEN[len] || 3000;
  const distinct = new Set(id).size;

  if (distinct === 1) price *= 6;            // كل الأرقام متطابقة (8888) — أسطوري
  else if (isSequence(id)) price *= 3;       // تسلسل (123456)
  else if (isRepeatedPattern(id)) price *= 2; // نمط متكرّر (123123)
  else if (isPairs(id)) price *= 2;          // أزواج (112233)
  else if (distinct === 2) price = Math.round(price * 1.6); // رقمان فقط

  // معرّف يبدأ بصفر أو يحتوي صفراً نادر قليلاً → خصم بسيط لتنويع المتاح
  return Math.round(price);
}

// اسم/رتبة المعرّف للعرض في الواجهة
export function vipIdTier(id) {
  id = String(id || "");
  const distinct = new Set(id).size;
  if (distinct === 1) return { key: "legendary", label: "أسطوري", color: "#f5c451" };
  if (isSequence(id)) return { key: "sequence", label: "تسلسلي", color: "#36c5f0" };
  if (isPairs(id) || isRepeatedPattern(id)) return { key: "pattern", label: "منقوش", color: "#c08bff" };
  if (distinct === 2) return { key: "rare", label: "نادر", color: "#7ce6cb" };
  if (id.length <= 4) return { key: "short", label: "قصير", color: "#ff9ec2" };
  return { key: "vip", label: "مميّز", color: "#9be88a" };
}

// يولّد قائمة معرّفات مميّزة مقترحة (للعرض كاختيارات جاهزة).
// taken: مجموعة المعرّفات المحجوزة لاستبعادها.
export function vipIdSuggestions(taken = new Set()) {
  const out = [];
  const add = (id) => {
    if (out.length >= 24) return;
    if (taken.has(id)) return;
    if (out.some((x) => x.id === id)) return;
    out.push({ id, price: vipIdPrice(id), tier: vipIdTier(id) });
  };

  // أرقام متطابقة (أسطورية) بأطوال مختلفة
  for (const d of [8, 6, 9, 7, 1, 5]) {
    add(String(d).repeat(4));
    add(String(d).repeat(6));
  }
  // تسلسلات
  ["1234", "12345", "123456", "4321", "654321"].forEach(add);
  // أزواج وأنماط
  ["112233", "778899", "121212", "520520", "131419"].forEach(add);
  // معرّفات قصيرة عشوائية متاحة
  let guard = 0;
  while (out.length < 18 && guard++ < 300) {
    const len = 4 + Math.floor(Math.random() * 2); // 4 أو 5
    const id = String(Math.floor(Math.random() * Math.pow(10, len))).padStart(len, "0");
    add(id);
  }
  return out.sort((a, b) => b.price - a.price);
}
