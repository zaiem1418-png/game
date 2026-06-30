import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SUIT_COLOR = { "♥": "#e3405a", "♦": "#e3405a", "♠": "#10182b", "♣": "#10182b" };

// موضع لاعب نسبةً لي: أنا أسفل، الشريك أعلى، الخصمان يمين/يسار
function relPos(mySeat, seat) {
  const d = (seat - mySeat + 4) % 4;
  return ["bottom", "right", "top", "left"][d];
}

function Card({ card, onClick, disabled, dim, small }) {
  return (
    <motion.button
      className={`bl-card ${small ? "sm" : ""} ${dim ? "dim" : ""}`}
      style={{ color: SUIT_COLOR[card.suit] }}
      whileTap={disabled ? {} : { scale: 0.94 }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      layout
    >
      <b>{card.rank}</b>
      <span>{card.suit}</span>
    </motion.button>
  );
}

export default function BalootBoard({ game, you, action, onExit }) {
  const [showRules, setShowRules] = useState(false);
  const st = game?.state;
  if (!st) return <div className="grm-loading">جاري التحميل…</div>;

  const me = st.players.find((p) => p.id === you);
  const mySeat = me?.seat ?? 0;
  const turnPlayer = st.players[st.phase === "bid" ? st.bidTurn : st.turn];
  const myTurn = turnPlayer?.id === you;

  const myTeam = me?.team ?? 0;
  const usPts = st.teamPoints[myTeam];
  const themPts = st.teamPoints[myTeam === 0 ? 1 : 0];

  return (
    <div className="bl">
      {/* الشريط العلوي: زر القواعد + لوحة النقاط */}
      <div className="bl-topbar">
        <button className="bl-rules-btn" onClick={() => setShowRules(true)} title="قواعد وأنظمة البلوت">
          📖 القواعد
        </button>
        <div className="bl-scoreboard">
          <div className="bl-sb-row">
            <span className="bl-sb-us">لنا {usPts}</span>
            <span className="bl-sb-sep">:</span>
            <span className="bl-sb-them">{themPts} لهم</span>
          </div>
          {st.mode && (
            <div className="bl-sb-mode">
              {st.mode === "sun" ? "☀️ صن" : `🃏 حكم ${st.trump}`}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showRules && <BalootRules onClose={() => setShowRules(false)} />}
      </AnimatePresence>

      {/* الطاولة */}
      <div className="bl-table">
        {st.players.map((p) => {
          const pos = relPos(mySeat, p.seat);
          const active = turnPlayer?.id === p.id;
          return (
            <div key={p.id} className={`bl-seat ${pos} ${active ? "active" : ""}`} style={{ "--c": p.team === 0 ? "#3aa3ff" : "#f5c451" }}>
              <span className="bl-seat-avwrap">
                {active && <span className="bl-seat-ring" aria-hidden />}
                <span className="bl-seat-av">{p.avatar}</span>
              </span>
              <span className="bl-seat-pill">
                <span className="bl-seat-name">{p.name}{p.id === you ? " (أنت)" : ""}</span>
                <span className="bl-seat-cards">🂠 {p.id === you ? me.hand.length : p.handCount}</span>
              </span>
              {st.buyerSeat === p.seat && <span className="bl-buyer">مشتري</span>}
            </div>
          );
        })}

        {/* الحيلة في الوسط */}
        <div className="bl-trick">
          <AnimatePresence>
            {st.trick.map((t) => (
              <motion.div
                key={t.card.id}
                className={`bl-trick-card ${relPos(mySeat, t.seat)}`}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card card={t.card} small disabled />
              </motion.div>
            ))}
          </AnimatePresence>
          {st.flipped && st.phase === "bid" && (
            <div className="bl-flipped">
              <span className="bl-flip-lbl">المقلوبة</span>
              <Card card={st.flipped} small disabled />
            </div>
          )}
        </div>
      </div>

      {/* منطقة الإجراء */}
      {st.phase === "over" ? (
        <BlOver st={st} you={you} onExit={onExit} />
      ) : st.phase === "bid" ? (
        <BidBar st={st} myTurn={myTurn} action={action} turnName={turnPlayer?.name} />
      ) : (
        <PlayHand st={st} me={me} myTurn={myTurn} action={action} turnName={turnPlayer?.name} />
      )}
    </div>
  );
}

function BidBar({ st, myTurn, action, turnName }) {
  const bid = st.myBid;
  if (!myTurn || !bid) {
    return <div className="bl-status">المزايدة — دور {turnName || "…"}…</div>;
  }
  return (
    <div className="bl-bid">
      <div className="bl-status">
        {bid.round === 1 ? `حكم على ${st.flipped.suit}؟` : "الجولة الثانية: اختر"}
      </div>
      <div className="bl-bid-btns">
        {bid.round === 1 && (
          <button className="bl-btn hokom" onClick={() => action({ type: "hokom" })}>
            🃏 حكم {st.flipped.suit}
          </button>
        )}
        {bid.round === 2 && (
          <>
            <button className="bl-btn sun" onClick={() => action({ type: "sun" })}>☀️ صن</button>
            {bid.suits.map((s) => (
              <button key={s} className="bl-btn hokom" style={{ color: SUIT_COLOR[s] }} onClick={() => action({ type: "hokom_suit", suit: s })}>
                حكم {s}
              </button>
            ))}
          </>
        )}
        <button className="bl-btn pass" onClick={() => action({ type: "pass" })}>تمرير</button>
      </div>
    </div>
  );
}

function PlayHand({ st, me, myTurn, action, turnName }) {
  const legalIds = new Set((st.myLegal || []).map((c) => c.id));
  return (
    <div className="bl-handwrap">
      <div className="bl-status">
        {myTurn ? "دورك — العب ورقة" : `دور ${turnName || "…"}`}
      </div>
      <div className="bl-hand">
        {me.hand.map((card) => {
          const playable = myTurn && legalIds.has(card.id);
          return (
            <Card
              key={card.id}
              card={card}
              dim={myTurn && !playable}
              disabled={!playable}
              onClick={() => action({ type: "play", card: card.id })}
            />
          );
        })}
      </div>
    </div>
  );
}

function BalootRules({ onClose }) {
  return (
    <motion.div
      className="bl-rules-overlay"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bl-rules-sheet"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.96 }}
      >
        <div className="bl-rules-head">
          <h3>📖 قواعد وأنظمة البلوت</h3>
          <button className="bl-rules-x" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>

        <div className="bl-rules-body">
          <section>
            <h4>🎯 أساسيات اللعبة</h4>
            <p>
              تُلعب بـ<b>٤ لاعبين</b> في فريقين، كل لاعبَين متقابلين فريق واحد
              (المقاعد ٠ و٢ ضد ١ و٣). تُستعمل مجموعة من <b>٣٢ ورقة</b> فقط
              (من ٧ إلى الإكّة)، وتُحذف الأوراق من ٦ فما دون والجوكر.
              يُوزَّع لكل لاعب ٥ أوراق أولاً ثم تُكمَّل إلى ٨ بعد المزايدة.
            </p>
          </section>

          <section>
            <h4>🗂️ نوعا اللعب: الصن والحُكم</h4>
            <ul>
              <li>
                <b>☀️ الصن:</b> لا يوجد لون رابح (طرنيب)، وكل الأنواع
                (♠ ♥ ♦ ♣) متساوية في القوة.
              </li>
              <li>
                <b>🃏 الحُكم:</b> يُختار لون واحد ليكون <b>الرابح (الطرنيب)</b>،
                وتتقدّم أوراقه على بقية الأنواع وتتغيّر قوّتها وترتيبها.
              </li>
            </ul>
          </section>

          <section>
            <h4>🔢 ترتيب الأوراق (من الأقوى)</h4>
            <p><b>في الصن:</b> A ← 10 ← K ← Q ← J ← 9 ← 8 ← 7</p>
            <p><b>في طرنيب الحُكم:</b> J ← 9 ← A ← 10 ← K ← Q ← 8 ← 7</p>
          </section>

          <section>
            <h4>💯 نقاط الأوراق</h4>
            <p>
              <b>الصن:</b> الإكّة ١١، العشرة ١٠، الشايب (K) ٤، البنت (Q) ٣،
              الولد (J) ٢، والباقي صفر.
            </p>
            <p>
              <b>طرنيب الحُكم:</b> الولد (J) ٢٠، التسعة ١٤، الإكّة ١١،
              العشرة ١٠، الشايب ٤، البنت ٣، والباقي صفر.
            </p>
            <p>الأكلة الأخيرة لها <b>١٠ نقاط «آخِر»</b> إضافية.</p>
          </section>

          <section>
            <h4>🎚️ المزايدة (الشراء)</h4>
            <ul>
              <li>تُقلب ورقة من المجموعة، ويبدأ اللاعب على يسار الموزّع.</li>
              <li>
                <b>الجولة الأولى:</b> من يرغب يقول <b>حُكم</b> على لون
                الورقة المقلوبة، أو يُمرِّر.
              </li>
              <li>
                <b>الجولة الثانية:</b> من يرغب يختار <b>صن</b> أو <b>حُكم</b>
                على لون آخر، أو يُمرِّر.
              </li>
              <li>المشتري في الحُكم يأخذ الورقة المقلوبة ضمن أوراقه.</li>
            </ul>
          </section>

          <section>
            <h4>♣️ قواعد اللعب واتباع اللون</h4>
            <ul>
              <li>الفائز بالشراء يبدأ برمي أول ورقة، ويُلزَم الباقون باتباع اللون نفسه.</li>
              <li>من لا يملك اللون المطلوب في <b>الحُكم</b> يجب أن يقطع بالطرنيب إن أمكن (إلا إذا كان شريكه فائزاً بالأكلة).</li>
              <li>عند اللعب بالطرنيب يجب الزيادة على أعلى طرنيب مرميّ إن استطاع.</li>
              <li>صاحب أعلى ورقة يفوز بالأكلة ويقود التي بعدها.</li>
            </ul>
          </section>

          <section>
            <h4>📜 المشاريع (الفرش)</h4>
            <ul>
              <li><b>سرا:</b> ٣ أوراق متتالية من نفس النوع.</li>
              <li><b>خمسين:</b> ٤ أوراق متتالية من نفس النوع.</li>
              <li><b>مية:</b> ٥ أوراق متتالية من نفس النوع.</li>
              <li><b>بلوت:</b> في الحُكم فقط — اجتماع الشايب (K) والبنت (Q) من لون الطرنيب عند نفس اللاعب.</li>
            </ul>
            <p className="bl-rules-note">ملاحظة: نسخة اللعبة الحالية مبسّطة لجولة واحدة بدون احتساب المشاريع.</p>
          </section>

          <section>
            <h4>🏆 الفوز والقَهر</h4>
            <ul>
              <li>على المشتري أن يتجاوز نقاط الخصم، وإلا <b>«قُهر»</b> وذهبت كل النقاط للخصم.</li>
              <li>يخسر المشتري في <b>الصن</b> إذا بلغ الخصم ٦٦ نقطة.</li>
              <li>يخسر المشتري في <b>الحُكم</b> إذا بلغ الخصم ٨٢ نقطة.</li>
              <li>تنتهي المباراة الكاملة عادةً ببلوغ ١٥٢ نقطة.</li>
            </ul>
          </section>
        </div>

        <button className="bl-rules-done" onClick={onClose}>فهمت، لنلعب 👍</button>
      </motion.div>
    </motion.div>
  );
}

function BlOver({ st, you, onExit }) {
  const me = st.players.find((p) => p.id === you);
  const won = me && me.team === st.winnerTeam;
  return (
    <div className="snl-over">
      <h3>{won ? "🎉 فاز فريقك!" : `فاز الفريق ${st.winnerTeam + 1}`}</h3>
      <p>النتيجة — فريق 1: {st.teamPoints[0]} · فريق 2: {st.teamPoints[1]}</p>
      {st.qahar && <p>قُهر المشترون! 💥</p>}
      <button className="grm-start" onClick={onExit}>رجوع للقائمة</button>
    </div>
  );
}
