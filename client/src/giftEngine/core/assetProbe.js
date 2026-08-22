// فحص وجود ملفات الأصول (فيديو/Lottie/صوت) قبل استخدامها — حتى لا يظهر عطل
// إذا لم يضع المستخدم الملفات بعد. النتيجة تُخزَّن في الذاكرة (وlocalStorage) لتفادي التكرار.
//
// المنطق: إذا كان الملف موجوداً → نستخدم الأنيميشن/الصوت الحقيقي (MP4/Lottie/mp3).
//         إذا لم يكن موجوداً → المحرك يتراجع تلقائياً للسيناريو المُولّد + مؤثّر synth.

const cache = new Map(); // url -> true | false | Promise
const LS_KEY = "gx_asset_probe_v2"; // v2: نخزّن الإيجابي فقط (تفادي حجب ملف يُضاف لاحقاً)

// استرجاع النتائج الإيجابية فقط من localStorage (تسريع). النتائج السلبية لا تُخزَّن
// حتى لا يبقى ملف أُضيف لاحقاً محجوباً بنتيجة "مفقود" قديمة — يُعاد فحصه كل جلسة.
try {
  const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  for (const [k, val] of Object.entries(saved)) {
    if (val === true) cache.set(k, true);
  }
} catch {}

function persist() {
  try {
    const obj = {};
    for (const [k, val] of cache.entries()) if (val === true) obj[k] = true;
    localStorage.setItem(LS_KEY, JSON.stringify(obj));
  } catch {}
}

// تعليم أصل بأنه مفقود/تالف (يُستدعى من onError عند فشل عرض الفيديو/Lottie).
export function markMissing(url) {
  if (!url) return;
  cache.set(url, false);
  persist();
}

// نتيجة متزامنة إن كانت معروفة مسبقاً: true/false، أو undefined إن لم تُفحَص بعد.
export function known(url) {
  const v = cache.get(url);
  return v === true || v === false ? v : undefined;
}

// فحص غير متزامن (HEAD ثم GET احتياطاً) — يُرجع Promise<boolean>.
export function probe(url) {
  if (!url) return Promise.resolve(false);
  const cur = cache.get(url);
  if (cur === true || cur === false) return Promise.resolve(cur);
  if (cur instanceof Promise) return cur;

  const p = fetch(url, { method: "HEAD" })
    .then((r) => r.ok)
    .catch(() =>
      // بعض الخوادم لا تدعم HEAD → جرّب GET برأس range صغير
      fetch(url, { method: "GET", headers: { Range: "bytes=0-0" } })
        .then((r) => r.ok || r.status === 206)
        .catch(() => false)
    )
    .then((ok) => {
      cache.set(url, ok);
      persist();
      return ok;
    });

  cache.set(url, p);
  return p;
}

// تسخين مسبق لقائمة الهدايا: يفحص كل asset وكل ملفات الصوت مرة واحدة.
export function prewarmGifts(gifts) {
  if (!Array.isArray(gifts)) return;
  for (const g of gifts) {
    // الأصول البعيدة (CDN) لا تُفحَص: fetch يفشل بسبب CORS ويعطي نتيجة مضلّلة؛
    // المحرك متفائل معها ويتراجع عبر onError عند الحاجة.
    if (g.asset && g.asset.startsWith("/")) probe(g.asset);
    if (g.sounds && typeof g.sounds === "object") {
      for (const url of Object.values(g.sounds)) {
        if (typeof url === "string" && /^https?:|^\//.test(url)) probe(url);
      }
    }
  }
}
