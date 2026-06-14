import { useEffect, useRef, useState } from "react";
import { socket } from "./socket.js";
import { VoiceManager } from "./voice.js";
import JoinScreen from "./components/JoinScreen.jsx";
import RoomHeader from "./components/RoomHeader.jsx";
import SeatGrid from "./components/SeatGrid.jsx";
import ChatPanel from "./components/ChatPanel.jsx";
import BottomBar from "./components/BottomBar.jsx";
import GiftPicker from "./components/GiftPicker.jsx";
import GiftOverlay from "./components/GiftOverlay.jsx";

export default function App() {
  const [joined, setJoined] = useState(false);
  const [selfId, setSelfId] = useState(null);
  const [room, setRoom] = useState(null);
  const [giftPickerOpen, setGiftPickerOpen] = useState(false);
  const [gifts, setGifts] = useState([]);
  const [flyingGifts, setFlyingGifts] = useState([]); // أنيميشن الهدايا
  const [micError, setMicError] = useState(false); // رُفض إذن المايك؟
  const [peerStates, setPeerStates] = useState([]); // تشخيص الاتصالات
  const voiceRef = useRef(null);

  // إعداد مستمعات السوكِت + الصوت مرة واحدة
  useEffect(() => {
    let mySelfId = null;
    const voice = new VoiceManager(socket);
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
      // ابدأ الصوت: اطلب المايك ثم اربط الأعضاء
      voice.init(selfId).then(() => {
        voice.syncPeers(room.members.map((m) => m.id));
      });
    });

    socket.on("room:update", (room) => {
      setRoom(room);
      voice.syncPeers(room.members.map((m) => m.id));
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
      const id = payload.id;
      setFlyingGifts((g) => [...g, payload]);
      setTimeout(() => {
        setFlyingGifts((g) => g.filter((x) => x.id !== id));
      }, 2500);
    });

    socket.on("gift:list", (list) => setGifts(list));

    return () => {
      socket.off("room:joined");
      socket.off("room:update");
      socket.off("chat:new");
      socket.off("seat:speaking");
      socket.off("gift:new");
      socket.off("gift:list");
      voice.destroy();
    };
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
    socket.connect();
    socket.emit("room:join", { roomId: "130096", user });
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
  function sendGift(giftId, toUserId) {
    socket.emit("gift:send", { giftId, toUserId });
    setGiftPickerOpen(false);
  }

  if (!joined) return <JoinScreen onJoin={handleJoin} />;

  return (
    <div className="room">
      <div className="room-bg" />
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
        onTakeSeat={takeSeat}
        onSeatTap={(seat) => {
          // اضغط على مقعدك = كتم/فتح، وعلى غيرك = إرسال هدية
          if (seat.user?.id === selfId) toggleMute();
          else if (seat.user) setGiftPickerOpen(true);
        }}
      />

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
      />

      {giftPickerOpen && (
        <GiftPicker
          gifts={gifts}
          members={room.members.filter((m) => m.id !== selfId)}
          onSend={sendGift}
          onClose={() => setGiftPickerOpen(false)}
        />
      )}

      <GiftOverlay flyingGifts={flyingGifts} />
    </div>
  );
}
