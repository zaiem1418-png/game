// معالجة الدفع — وضع تجريبي (Visa فقط) جاهز لاستبداله بـ Stripe لاحقاً.
//
// الوضع الحالي: يتحقق من صحّة بطاقة الفيزا محلياً (خوارزمية Luhn + تبدأ بـ 4 + تاريخ صالح)
// ثم يعتبر الدفع ناجحاً ويشحن الرصيد فوراً. لا تنتقل أي بيانات بطاقة لجهة خارجية.
//
// للتحويل لدفع حقيقي: ضع مفاتيح Stripe في متغيرات البيئة واستبدل جسم processPayment
// بإنشاء PaymentIntent عبر مكتبة stripe. الواجهة لا تحتاج تغييراً يُذكر.

// خوارزمية Luhn للتحقق من صحّة رقم البطاقة
function luhnValid(num) {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = num.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return false;
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

// يتحقق من بطاقة فيزا صالحة (للوضع التجريبي). يُرجع { ok, error }.
export function validateVisaCard({ number, exp, cvc, name }) {
  const digits = String(number || "").replace(/\D/g, "");
  if (digits[0] !== "4") return { ok: false, error: "يُقبل دفع فيزا فقط (تبدأ البطاقة بـ 4)" };
  if (digits.length < 13 || digits.length > 19) return { ok: false, error: "رقم البطاقة غير صحيح" };
  if (!luhnValid(digits)) return { ok: false, error: "رقم البطاقة غير صالح" };

  const m = String(exp || "").match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!m) return { ok: false, error: "تاريخ الانتهاء بصيغة MM/YY" };
  const mm = Number(m[1]);
  const yy = 2000 + Number(m[2]);
  if (mm < 1 || mm > 12) return { ok: false, error: "شهر الانتهاء غير صحيح" };
  const now = new Date();
  const endOfMonth = new Date(yy, mm, 0, 23, 59, 59);
  if (endOfMonth < now) return { ok: false, error: "البطاقة منتهية الصلاحية" };

  if (!/^\d{3,4}$/.test(String(cvc || ""))) return { ok: false, error: "رمز CVC غير صحيح" };
  if (!String(name || "").trim()) return { ok: false, error: "اسم حامل البطاقة مطلوب" };

  return { ok: true };
}

// يعالج عملية الدفع. (وضع تجريبي: يعتمد على التحقق المحلي فقط.)
// يُرجع { ok, txId } عند النجاح أو { ok:false, error }.
export async function processPayment({ card, amount }) {
  const check = validateVisaCard(card || {});
  if (!check.ok) return { ok: false, error: check.error };
  if (!(amount > 0)) return { ok: false, error: "مبلغ غير صالح" };

  // --- هنا يُستبدل بـ Stripe PaymentIntent عند توفّر المفاتيح ---
  const txId = "tx_" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
  return { ok: true, txId };
}
