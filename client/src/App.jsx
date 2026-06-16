import { useEffect, useRef, useState } from "react";
import { socket } from "./socket.js";
import { VoiceManager } from "./voice.js";
import GameLobby from "./lobby/GameLobby.jsx";
import GameRoom from "./games/GameRoom.jsx";
import JoinScreen from "./components/JoinScreen.jsx";
import RoomHeader from "./components/RoomHeader.jsx";
import SeatGrid from "./components/SeatGrid.jsx";
import ChatPanel from "./components/ChatPanel.jsx";
import BottomBar from "./components/BottomBar.jsx";
import GiftPicker from "./components/GiftPicker.jsx";
import GiftStage from "./giftEngine/GiftStage.jsx";
import AdminPanel from "./components/AdminPanel.jsx";
import ReactionPicker from "./components/ReactionPicker.jsx";
import WalletBar from "./components/WalletBar.jsx";
import StoreModal from "./components/StoreModal.jsx";
import OwnerLogin from "./components/OwnerLogin.jsx";
import { unlockAudio } from "./giftEngine/core/SoundManager.js";
import { useReactions } from "./useReactions.js";
import { getUid, fetchWallet } from "./wallet.js";

export default function App() {
  // لوحة الإدارة: افتحها عبر ?admin في الرابط
  const isAdmin = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("admin");

  const [view, setView] = useState("lobby"); // "lobby" = واجهة الألعاب، "game" = طاولة لعبة، "app" = الغرفة الصوتية
  const [activeGame, setActiveGame] = useState(null); // { gameId, mode } للعبة المفتوحة
  const [joined, setJoined] = useState(false);
  const [selfId, setSelfId] = useState(null);
  const [room, setRoom] = useState(null);
  const [giftPickerOpen, setGiftPickerOpen] = useState(false);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [gifts, setGifts] = useState([]);
  const [micError, setMicError] = useState(false); // رُفض إذن المايك؟
  const [peerStates, setPeerStates] = useState([]); // تشخيص الاتصالات
  const [wallet, setWallet] = useState(null); // رصيد الألماس/الكوينز
  const [storeTab, setStoreTab] = useState(null); // تبويب المتجر المفتوح (null = مغلق)
  const [ownerOpen, setOwnerOpen] = useState(false); // نافذة دخول المالك
  const [bonusToast, setBonusToast] = useState(null); // مكافأة الترحيب للمستخدم الجديد
  const [needCoins, setNeedCoins] = useState(false); // الرصيد لا يكفي لإرسال الهدية
  const voiceRef = useRef(null);
  const giftStageRef = useRef(null); // محرك أنيميشن الهدايا
  const reactions = useReactions(); // طابور تفاعلات المقاعد

  // إعداد مستمعات السوكِت + الصوت مرة واحدة
  useEffect(() => {
    let mySelfId = null;
    const voice = new VoiceManager();
    voiceRef.current = voice;

    // كشف التحدّث الحقيقي → أبلغ السيرفر ليُظهر الموجة للجميع
    voice.onSpeakingChange = (speaking) => {
      socket.emit("seat:speaking", { speaking });
    };
    voice.onMicError = () => setMicError(true);
    voice.onPeersChange = (list) => setPeerStates(list);

    socket.on("room:joined", ({ selfId, room }) => {
      mySelfId = selfId;
      setSelfId(selfId);
      setRoom(room);
      setJoined(true);
      // ابدأ الصوت: اتصل بغرفة LiveKit (الانضمام للأعضاء يتم تلقائياً)
      const me = room.members.find((m) => m.id === selfId);
      voice.init({ identity: selfId, name: me?.name || "زائر", roomId: room.id });
    });

    socket.on("room:update", (room) => {
      setRoom(room);
    });

    socket.on("chat:new", (msg) => {
      setRoom((r) => (r ? { ...r, messages: [...r.messages, msg].slice(-50) } : r));
    });

    socket.on("seat:speaking", ({ index, speaking }) => {
      setRoom((r) => {
        if (!r) return r;
        const seats = r.seats.map((s) =>
          s.index === index ? { ...s, speaking } : s
        );
        return { ...r, seats };
      });
    });

    socket.on("gift:new", (payload) => {
      setRoom((r) =>
        r
          ? {
              ...r,
              messages: [
                ...r.messages,
                {
                  id: payload.id,
                  type: "gift",
                  ts: payload.ts,
                  text: `${payload.from.name} أرسل ${payload.gift.emoji} ${payload.gift.name}${payload.to ? " إلى " + payload.to.name : ""}`,
                  user: payload.from,
                },
              ].slice(-50),
            }
          : r
      );
      // ادفع الهدية لمحرك الأنيميشن (طابور + أولوية + منع تكرار)
      giftStageRef.current?.enqueue(payload);
    });

    socket.on("gift:list", (list) => setGifts(list));

    // تفاعل جديد فوق أحد المقاعد — يُدفع لطابور المقعد
    socket.on("reaction:new", (payload) => reactions.push(payload));

    // تحديث الرصيد لحظياً (بعد الشحن/إرسال هدية/دخول المالك)
    socket.on("wallet:update", (w) => setWallet(w));

    // الرصيد لا يكفي لإرسال الهدية → افتح المتجر على تبويب الكوينز
    socket.on("wallet:insufficient", () => {
      setNeedCoins(true);
      setStoreTab("coins");
      setTimeout(() => setNeedCoins(false), 4000);
    });

    return () => {
      socket.off("room:joined");
      socket.off("room:update");
      socket.off("chat:new");
      socket.off("seat:speaking");
      socket.off("gift:new");
      socket.off("gift:list");
      socket.off("reaction:new");
      socket.off("wallet:update");
      socket.off("wallet:insufficient");
      voice.destroy();
    };
  }, []);

  // اجلب المحفظة عند فتح اللعبة — مستخدم جديد يحصل على مكافأة البداية (500💎 + 10000🪙)
  useEffect(() => {
    fetchWallet()
      .then(({ wallet, isNew, starter }) => {
        setWallet(wallet);
        if (isNew) setBonusToast(starter); // اعرض رسالة الترحيب بالمكافأة
      })
      .catch(() => {});
  }, []);

  const mySeatIndex = room?.seats.findIndex((s) => s.user?.id === selfId) ?? -1;
  const onMic = mySeatIndex !== -1;
  const mySeat = onMic ? room.seats[mySeatIndex] : null;
  const muted = mySeat?.muted;

  // فعّل/أوقف إرسال المايك فعلياً حسب الجلوس والكتم
  useEffect(() => {
    voiceRef.current?.setMicEnabled(onMic && !muted);
  }, [onMic, muted]);

  function handleJoin(user) {
    unlockAudio(); // فتح سياق الصوت ضمن تفاعل المستخدم (مطلوب على الموبايل)
    socket.connect();
    // أرفق uid الثابت ليربط الخادم العضو بمحفظته الدائمة
    socket.emit("room:join", { roomId: "130096", user: { ...user, uid: getUid() } });
    socket.emit("gift:list");
  }

  function takeSeat(index) {
    socket.emit("seat:take", { index });
  }
  function leaveSeat() {
    socket.emit("seat:leave");
  }
  function toggleMute() {
    socket.emit("seat:toggleMute");
  }
  function sendChat(text) {
    socket.emit("chat:send", { text });
  }
  function sendGift(giftId, toUserId, opts = {}) {
    socket.emit("gift:send", {
      giftId,
      toUserId,
      combo: opts.quantity || 1,
      anon: !!opts.anon,
    });
    setGiftPickerOpen(false);
  }
  function sendReaction(type) {
    unlockAudio();
    socket.emit("reaction:send", { type });
  }

  if (isAdmin) return <AdminPanel />;

  // مكافأة الترحيب — تظهر أول ما تُفتح اللعبة للمستخدم الجديد
  const bonusBanner = bonusToast && (
    <div className="bonus-toast" onClick={() => setBonusToast(null)}>
      <div className="bonus-card">
        <div className="bonus-gift">🎁</div>
        <h3>هدية ترحيب!</h3>
        <p>حصلت على رصيد مجاني للبدء</p>
        <div className="bonus-amounts">
          <span className="bonus-amt diamonds">💎 {bonusToast.diamonds}</span>
          <span className="bonus-amt coins">🪙 {bonusToast.coins.toLocaleString("en-US")}</span>
        </div>
        <button className="store-pay" onClick={() => setBonusToast(null)}>استلام والبدء</button>
      </div>
    </div>
  );

  // نوافذ المحفظة المشتركة (المتجر/المالك/التنبيهات) — متاحة في اللوبي والغرفة
  const walletOverlays = (
    <>
      {storeTab && (
        <StoreModal
          initialTab={storeTab}
          onClose={() => setStoreTab(null)}
          onPurchased={(w) => setWallet(w)}
        />
      )}
      {ownerOpen && (
        <OwnerLogin
          onClose={() => setOwnerOpen(false)}
          onSuccess={(w) => {
            setWallet(w);
            setOwnerOpen(false);
          }}
        />
      )}
      {needCoins && <div className="need-coins-toast">رصيد الكوينز لا يكفي — اشحن لإرسال الهدية</div>}
      {bonusBanner}
    </>
  );

  // ===== الواجهة الرئيسية: لوبي الألعاب (جاكارو/لودو/بلوت) مع السحب =====
  if (view === "lobby")
    return (
      <>
        <GameLobby
          wallet={wallet}
          onOpenRooms={() => setView("app")}
          onPlay={(game, mode) => {
            setActiveGame({ gameId: game.id, mode: mode?.id || "default" });
            setView("game");
          }}
          onRecharge={(tab) => setStoreTab(tab)}
          onOwnerTap={() => setOwnerOpen(true)}
        />
        {walletOverlays}
      </>
    );

  // ===== طاولة لعبة (السلم والثعبان/لودو/جاكارو/بلوت) =====
  if (view === "game" && activeGame)
    return (
      <>
        <GameRoom
          gameId={activeGame.gameId}
          mode={activeGame.mode}
          user={{ name: "زائر", avatar: "🧑🏻", uid: getUid() }}
          onExit={() => {
            setActiveGame(null);
            setView("lobby");
          }}
        />
        {walletOverlays}
      </>
    );

  if (!joined)
    return (
      <>
        <JoinScreen onJoin={handleJoin} onBack={() => setView("lobby")} />
        {bonusBanner}
      </>
    );

  return (
    <div className="room">
      <div className="room-bg" />
      <WalletBar
        wallet={wallet}
        onRecharge={(tab) => setStoreTab(tab)}
        onOwnerTap={() => setOwnerOpen(true)}
      />
      <RoomHeader room={room} memberCount={room.members.length} />

      {micError && (
        <div className="mic-error">
          🎤 لم يُسمح بالوصول للمايك — تقدر تسمع لكن ما تقدر تتكلم. فعّل إذن المايك من إعدادات المتصفح ثم أعد الدخول.
        </div>
      )}

      {peerStates.length > 0 && (
        <div className="debug-panel">
          <span className="debug-title">🔌 الاتصالات:</span>
          {peerStates.map((p) => {
            const name =
              room.members.find((m) => m.id === p.id)?.name || p.id.slice(0, 4);
            const ok = p.state === "connected";
            const bad = p.state === "failed" || p.ice === "failed";
            return (
              <span
                key={p.id}
                className={`debug-peer ${ok ? "ok" : bad ? "bad" : "wait"}`}
              >
                {name}: {p.state}/{p.ice}
              </span>
            );
          })}
        </div>
      )}

      <SeatGrid
        seats={room.seats}
        selfId={selfId}
        reactions={reactions.active}
        onTakeSeat={takeSeat}
        onSeatTap={(seat) => {
          // اضغط على مقعدك = كتم/فتح، وعلى غيرك = إرسال هدية
          if (seat.user?.id === selfId) toggleMute();
          else if (seat.user) setGiftPickerOpen(true);
        }}
      />

      {/* بانر اليانصيب الترويجي */}
      <div className="promo-banner" onClick={() => setGiftPickerOpen(true)}>
        <button className="promo-cta">التفاصيل</button>
        <div className="promo-text">
          <b>أرسل الهدايا واربح اليانصيب</b>
          <span>احصل على أرقام الحظ وإربح المكافآت المفاجئة</span>
        </div>
        <span className="promo-spark">🎉</span>
      </div>

      <ChatPanel messages={room.messages} selfId={selfId} />

      <BottomBar
        onMic={onMic}
        muted={muted}
        onTakeMic={() => {
          const free = room.seats.find((s) => !s.user && !s.locked);
          if (free) takeSeat(free.index);
        }}
        onLeaveMic={leaveSeat}
        onToggleMute={toggleMute}
        onSendChat={sendChat}
        onOpenGifts={() => setGiftPickerOpen(true)}
        onOpenReactions={() => setReactionPickerOpen(true)}
        canReact={onMic}
      />

      {giftPickerOpen && (
        <GiftPicker
          gifts={gifts}
          members={room.members.filter((m) => m.id !== selfId)}
          selfCoins={wallet?.coins ?? 0}
          onSend={sendGift}
          onClose={() => setGiftPickerOpen(false)}
        />
      )}

      {reactionPickerOpen && (
        <ReactionPicker onPick={sendReaction} onClose={() => setReactionPickerOpen(false)} />
      )}

      {walletOverlays}

      <GiftStage ref={giftStageRef} />
    </div>
  );
}
