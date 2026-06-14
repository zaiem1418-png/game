// نظام طابور الهدايا — يمنع تكرار الأنيميشن عند إرسال عدة هدايا متتالية،
// ويعطي أولوية للهدايا النادرة/الأسطورية، ويدمج الهدايا المتطابقة المتتالية في "combo ×N".
//
// الاستخدام: أنشئ GiftQueue مرة، نادِ enqueue() عند وصول هدية،
// وسجّل onPlay/onIdle. عندما ينتهي عرض هدية نادِ next().

export class GiftQueue {
  constructor({ onPlay, onUpdate } = {}) {
    this.items = [];
    this.current = null;
    this.onPlay = onPlay || (() => {});
    this.onUpdate = onUpdate || (() => {});
  }

  // وزن الأولوية: priority الصريح، وإلا تقدير من الندرة.
  _priority(gift) {
    if (gift.priority != null) return gift.priority;
    return { common: 1, rare: 2, epic: 3, legendary: 5 }[gift.rarity] || 1;
  }

  /**
   * إضافة هدية للطابور.
   * payload = { id, gift, combo, from, to, ts }
   */
  enqueue(payload) {
    const gift = payload.gift;
    const priority = this._priority(gift);

    // دمج تكرار نفس الهدية من نفس المرسِل لنفس المستلم (ضد السبام) → combo
    const sameKey = (p) =>
      p.gift.id === gift.id &&
      p.from?.id === payload.from?.id &&
      (p.to?.id || null) === (payload.to?.id || null);

    // إن كانت تُعرض الآن نفس الهدية → ارفع combo الحالي بدل إعادة التشغيل
    if (this.current && sameKey(this.current.payload)) {
      this.current.payload.combo = (this.current.payload.combo || 1) + (payload.combo || 1);
      this.onUpdate(this.snapshot());
      return;
    }
    // إن كانت بانتظارها في الطابور → ادمج combo
    const pending = this.items.find((it) => sameKey(it.payload));
    if (pending) {
      pending.payload.combo = (pending.payload.combo || 1) + (payload.combo || 1);
      this.onUpdate(this.snapshot());
      return;
    }

    const item = { payload, priority, seq: Date.now() + Math.random() };
    // إدراج حسب الأولوية (الأعلى أولاً)، مع الحفاظ على ترتيب الوصول داخل نفس الأولوية
    let i = this.items.length;
    while (i > 0 && this.items[i - 1].priority < priority) i--;
    this.items.splice(i, 0, item);

    this.onUpdate(this.snapshot());
    if (!this.current) this._advance();
  }

  _advance() {
    const next = this.items.shift();
    if (!next) {
      this.current = null;
      this.onUpdate(this.snapshot());
      return;
    }
    this.current = next;
    this.onUpdate(this.snapshot());
    this.onPlay(next.payload);
  }

  // تُنادى عند انتهاء عرض الهدية الحالية
  next() {
    this.current = null;
    this._advance();
  }

  get isBusy() {
    return !!this.current;
  }

  snapshot() {
    return {
      current: this.current?.payload || null,
      queued: this.items.map((it) => it.payload),
      length: this.items.length,
    };
  }

  clear() {
    this.items.length = 0;
    this.current = null;
    this.onUpdate(this.snapshot());
  }
}
