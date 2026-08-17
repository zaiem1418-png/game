import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sfx, say, announceBid, unlock, isMuted, setMuted } from "./balootSound.js";

const SUIT_COLOR = { "♥": "#e3405a", "♦": "#e3405a", "♠": "#10182b", "♣": "#10182b" };

// يترجم آخِر حدث في الحالة إلى مؤثر صوتي (نداء + نغمة)
function playEventSound(ev, st) {
  if (!ev) return;
  switch (ev.type) {
    case "deal":
      sfx.deal();
      setTimeout(() => say("أول"), 260); // بداية الجولة الأولى للمزايدة
      break;
    case "bidRound":
      if (ev.round === 2) say("ثاني");
      break;
    case "pass":
      say("بس");
      break;
    case "bid":
      sfx.buy();
      announceBid(ev.mode, ev.ashkal);
      break;
    case "play":
      sfx.play();
      break;
    case "trick":
      sfx.trick();
      break;
    case "roundOver":
      if (st?.roundSummary?.qahar) sfx.qahar();
      else sfx.trick();
      break;
    case "matchOver":
      sfx.win();
      break;
    default:
      break;
  }
}

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
  const [muted, setMutedState] = useState(isMuted());
  const st = game?.state;

  // مؤثرات صوتية عند تغيّر آخر حدث (توقيع فريد يمنع التكرار)
  const lastSig = useRef(null);
  useEffect(() => {
    if (!st) return;
    const ev = st.lastEvent;
    const sig = [
      ev?.type,
      st.phase,
      st.roundNo,
      st.bidRound,
      st.passes,
      st.trickCount,
      st.trick?.length,
      st.buyerSeat,
    ].join("|");
    if (sig === lastSig.current) return;
    const first = lastSig.current === null;
    lastSig.current = sig;
    if (first && ev?.type === "deal") {
      // لا نطلق نداء عند أول تحميل قبل تفاعل المستخدم (يُرفض على الجوال)
      return;
    }
    playEventSound(ev, st);
  }, [st]);

  if (!st) return <div className="grm-loading">جاري التحميل…</div>;

  const me = st.players.find((p) => p.id === you);
  const mySeat = me?.seat ?? 0;
  const turnPlayer = st.players[st.phase === "bid" ? st.bidTurn : st.turn];
  const myTurn = turnPlayer?.id === you;

  const myTeam = me?.team ?? 0;
  const other = myTeam === 0 ? 1 : 0;
  const matchPts = st.matchPoints || [0, 0];
  const target = st.matchTarget || 152;
  const usMatch = matchPts[myTeam];
  const themMatch = matchPts[other];
  const usPts = st.teamPoints[myTeam];
  const themPts = st.teamPoints[other];

  const toggleMute = () => {
    const v = !muted;
    setMuted(v);
    setMutedState(v);
    if (!v) unlock();
  };

  return (
    <div className="bl" onPointerDown={() => unlock()}>
      {/* الشريط العلوي: زر القواعد + كتم الصوت + لوحة النقاط */}
      <div className="bl-topbar">
        <div className="bl-topbtns">
          <button className="bl-rules-btn" onClick={() => setShowRules(true)} title="قواعد وأنظمة البلوت">
            📖 القواعد
          </button>
          <button className="bl-rules-btn" onClick={toggleMute} title={muted ? "تشغيل الصوت" : "كتم الصوت"}>
            {muted ? "🔇" : "🔊"}
          </button>
        </div>
        <div className="bl-scoreboard">
          <div className="bl-sb-target">السباق إلى {target}</div>
          <div className="bl-sb-row">
            <span className="bl-sb-us">لنا {usMatch}</span>
            <span className="bl-sb-sep">:</span>
            <span className="bl-sb-them">{themMatch} لهم</span>
          </div>
          <div className="bl-sb-sub">
            جولة {st.roundNo || 1} · هذه اليد {usPts}-{themPts}
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
        {st.phase === "roundOver" && st.roundSummary && (
          <BlRoundOver key="ro" st={st} you={you} action={action} />
        )}
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

        {/* الحيلة في الوسط — كل ورقة في موضع ثابت حول المركز حسب جهة صاحبها */}
        <div className="bl-trick">
          <AnimatePresence>
            {st.trick.map((t) => {
              const pos = relPos(mySeat, t.seat);
              return (
                // الموضع بالـCSS (مضمون)، وframer-motion يحرّك الظهور/الحجم فقط
                <div key={t.card.id} className={`bl-trick-slot ${pos}`}>
                  <motion.div
                    className="bl-trick-card"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 26 }}
                  >
                    <Card card={t.card} small disabled />
                  </motion.div>
                </div>
              );
            })}
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
      ) : (
        <>
          {st.phase === "bid" ? (
            <BidBar st={st} myTurn={myTurn} action={action} turnName={turnPlayer?.name} />
          ) : (
            <div className="bl-status">
              {myTurn ? "دورك — العب ورقة" : `دور ${turnPlayer?.name || "…"}`}
            </div>
          )}
          {/* يدك تظهر دائماً — أوراقك البدائية الخمس أثناء المزايدة ثم الثمانية أثناء اللعب */}
          {me && <HandStrip st={st} me={me} myTurn={myTurn} action={action} />}
        </>
      )}
    </div>
  );
}

function BidBar({ st, myTurn, action, turnName }) {
  const bid = st.myBid;
  if (!myTurn || !bid) {
    return (
      <div className="bl-status">
        المزايدة ({st.bidRound === 2 ? "الجولة الثانية" : "الجولة الأولى"}) — دور {turnName || "…"}…
      </div>
    );
  }
  return (
    <div className="bl-bid">
      <div className="bl-status">
        {bid.round === 1 ? `الشراء — حكم على ${st.flipped.suit}؟` : "الجولة الثانية — اختر شراءك"}
      </div>
      <div className="bl-bid-btns">
        {bid.round === 1 && (
          <>
            <button
              className="bl-btn hokom"
              style={{ color: SUIT_COLOR[st.flipped.suit] }}
              onClick={() => action({ type: "hokom" })}
            >
              🃏 حكم {st.flipped.suit}
            </button>
            {bid.canAshkal && (
              <button className="bl-btn ashkal" onClick={() => action({ type: "ashkal" })} title="أشكل: صن، وتُعطى المقلوبة لشريكك">
                🔀 أشكل
              </button>
            )}
          </>
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
        <button className="bl-btn pass" onClick={() => action({ type: "pass" })}>بس</button>
      </div>
    </div>
  );
}

// شريط اليد — يظهر دائماً: أثناء المزايدة (5 أوراق، للعرض فقط) وأثناء اللعب (8، القابل منها للّعب مفعّل)
function HandStrip({ st, me, myTurn, action }) {
  const isPlay = st.phase === "play";
  const playTurn = isPlay && myTurn;
  const legalIds = new Set((st.myLegal || []).map((c) => c.id));
  const myProjects = st.myProjects || [];
  const hand = me.hand || [];
  return (
    <div className="bl-handwrap">
      {isPlay && myProjects.length > 0 && (
        <div className="bl-myproj">
          مشاريعك:
          {myProjects.map((p, i) => (
            <span key={i} className="bl-proj-chip">{p.label} {p.suit} ({p.value})</span>
          ))}
        </div>
      )}
      {st.phase === "bid" && (
        <div className="bl-hand-lbl">أوراقك ({hand.length}) — تكتمل إلى ٨ بعد الشراء</div>
      )}
      <div className="bl-hand">
        {hand.map((card) => {
          const playable = playTurn && legalIds.has(card.id);
          return (
            <Card
              key={card.id}
              card={card}
              dim={playTurn && !playable}
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
                على لون آخر، أو يُمرِّر بقول <b>«بس»</b>.
              </li>
              <li>
                <b>🔀 أشكل:</b> خيار خاص في الجولة الأولى <b>للموزّع واللاعب على يساره</b> فقط —
                يجعل اللعب <b>صن</b>، وتُعطى الورقة المقلوبة إلى <b>الشريك المقابل</b>،
                ويُعتبر من قالها هو المشتري.
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
            <p className="bl-rules-note">تُحتسب المشاريع بقاعدة المقارنة: الفريق صاحب أعلى مشروع يأخذ كل مشاريعه.</p>
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

// ملخّص نتيجة الجولة (يُستخدم بين الجولات وفي نهاية المباراة)
function RoundSummaryBody({ s, myTeam }) {
  if (!s) return null;
  const us = myTeam;
  const them = myTeam === 0 ? 1 : 0;
  const teamLabel = (t) => (t === myTeam ? "فريقك" : "الخصم");
  return (
    <div className="bl-sum">
      <div className="bl-sum-mode">
        {s.mode === "sun" ? "☀️ صن" : `🃏 حكم ${s.trump || ""}`} · اشترى {teamLabel(s.buyerTeam)}
        {s.qahar && <span className="bl-sum-qahar"> — قُهر! 💥</span>}
      </div>
      <div className="bl-sum-row">
        <span>نقاط اليد</span>
        <b>{s.cardPoints[us]} ↔ {s.cardPoints[them]}</b>
      </div>
      {s.projects && s.projects.length > 0 && (
        <div className="bl-sum-proj">
          مشاريع:
          {s.projects.map((p, i) => (
            <span key={i} className="bl-proj-chip">
              {p.label} {p.suit} ({p.value}) — {teamLabel(p.team)}
            </span>
          ))}
        </div>
      )}
      {s.baloot && <div className="bl-sum-proj">بلوت 🂮🂭 (20) — {teamLabel(s.baloot.team)}</div>}
      <div className="bl-sum-row bl-sum-gain">
        <span>أبناط هذه الجولة</span>
        <b>+{s.abnatGained[us]} ↔ +{s.abnatGained[them]}</b>
      </div>
      <div className="bl-sum-row bl-sum-total">
        <span>إجمالي المباراة</span>
        <b>{s.matchPoints[us]} ↔ {s.matchPoints[them]}</b>
      </div>
    </div>
  );
}

function BlRoundOver({ st, you, action }) {
  const me = st.players.find((p) => p.id === you);
  const myTeam = me?.team ?? 0;
  return (
    <motion.div
      className="bl-rules-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bl-rules-sheet bl-ro-sheet"
        initial={{ y: 40, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.96 }}
      >
        <div className="bl-rules-head">
          <h3>📋 نتيجة الجولة {st.roundSummary.roundNo}</h3>
        </div>
        <div className="bl-rules-body">
          <RoundSummaryBody s={st.roundSummary} myTeam={myTeam} />
        </div>
        <button className="bl-rules-done" onClick={() => action({ type: "next" })}>
          الجولة التالية ▶
        </button>
      </motion.div>
    </motion.div>
  );
}

function BlOver({ st, you, onExit }) {
  const me = st.players.find((p) => p.id === you);
  const myTeam = me?.team ?? 0;
  const won = me && me.team === st.winnerTeam;
  return (
    <div className="snl-over">
      <h3>{won ? "🎉 فاز فريقك!" : "فاز الخصم"}</h3>
      {st.roundSummary && <RoundSummaryBody s={st.roundSummary} myTeam={myTeam} />}
      <button className="grm-start" onClick={onExit}>رجوع للقائمة</button>
    </div>
  );
}
