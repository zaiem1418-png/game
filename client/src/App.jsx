import { useEffect, useRef, useState } from "react";
import { socket } from "./socket.js";
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
  const speakingTimer = useRef(null);

  // إعداد مستمعات السوكِت مرة واحدة
  useEffect(() => {
    socket.on("room:joined", ({ selfId, room }) => {
      setSelfId(selfId);
      setRoom(room);
      setJoined(true);
    });

    socket.on("room:update", (room) => setRoom(room));

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
      // أضف رسالة الهدية + شغّل أنيميشن طائر
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
    };
  }, []);

  function handleJoin(user) {
    socket.connect();
    socket.emit("room:join", { roomId: "130096", user });
    socket.emit("gift:list");
  }

  const mySeatIndex = room?.seats.findIndex((s) => s.user?.id === selfId) ?? -1;
  const onMic = mySeatIndex !== -1;
  const mySeat = onMic ? room.seats[mySeatIndex] : null;

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

  // محاكاة "التحدث": ضغطة على المايك ترسل موجة لثوانٍ
  function pulseSpeaking() {
    if (!onMic || mySeat?.muted) return;
    socket.emit("seat:speaking", { speaking: true });
    clearTimeout(speakingTimer.current);
    speakingTimer.current = setTimeout(() => {
      socket.emit("seat:speaking", { speaking: false });
    }, 1500);
  }

  if (!joined) return <JoinScreen onJoin={handleJoin} />;

  return (
    <div className="room">
      <div className="room-bg" />
      <RoomHeader room={room} memberCount={room.members.length} />

      <SeatGrid
        seats={room.seats}
        selfId={selfId}
        onTakeSeat={takeSeat}
        onSeatTap={(seat) => {
          // اضغط على مقعدك للتحدث (محاكاة)، أو افتح الهدايا على مقعد غيرك
          if (seat.user?.id === selfId) pulseSpeaking();
          else if (seat.user) setGiftPickerOpen(true);
        }}
      />

      <ChatPanel messages={room.messages} selfId={selfId} />

      <BottomBar
        onMic={onMic}
        muted={mySeat?.muted}
        onTakeMic={() => {
          // خذ أول مقعد فاضي
          const free = room.seats.find((s) => !s.user && !s.locked);
          if (free) takeSeat(free.index);
        }}
        onLeaveMic={leaveSeat}
        onToggleMute={toggleMute}
        onSendChat={sendChat}
        onOpenGifts={() => setGiftPickerOpen(true)}
        onSpeak={pulseSpeaking}
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
