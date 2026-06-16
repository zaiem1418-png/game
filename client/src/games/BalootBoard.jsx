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
  const st = game?.state;
  if (!st) return <div className="grm-loading">جاري التحميل…</div>;

  const me = st.players.find((p) => p.id === you);
  const mySeat = me?.seat ?? 0;
  const turnPlayer = st.players[st.phase === "bid" ? st.bidTurn : st.turn];
  const myTurn = turnPlayer?.id === you;

  return (
    <div className="bl">
      {/* النقاط */}
      <div className="bl-scores">
        <span className="bl-score t0">فريق 1: {st.teamPoints[0]}</span>
        {st.mode && (
          <span className="bl-mode">
            {st.mode === "sun" ? "☀️ صن" : `🃏 حكم ${st.trump}`}
          </span>
        )}
        <span className="bl-score t1">فريق 2: {st.teamPoints[1]}</span>
      </div>

      {/* الطاولة */}
      <div className="bl-table">
        {st.players.map((p) => {
          const pos = relPos(mySeat, p.seat);
          const active = turnPlayer?.id === p.id;
          return (
            <div key={p.id} className={`bl-seat ${pos} ${active ? "active" : ""}`} style={{ "--c": p.team === 0 ? "#3aa3ff" : "#f5c451" }}>
              <span className="bl-seat-av">{p.avatar}</span>
              <span className="bl-seat-name">{p.name}{p.id === you ? " (أنت)" : ""}</span>
              <span className="bl-seat-cards">🂠 {p.id === you ? me.hand.length : p.handCount}</span>
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
