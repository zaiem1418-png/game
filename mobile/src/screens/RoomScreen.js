import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { socket } from "../socket";
import { theme } from "../theme";
import GiftSheet from "../components/GiftSheet";

// شبكة المقاعد: مقعد واحد يعرض الأفاتار أو رقم المايك.
function Seat({ seat, isSelf, onPress }) {
  const user = seat.user;
  const speaking = seat.speaking && !seat.muted;
  return (
    <Pressable style={styles.seat} onPress={() => onPress(seat)}>
      <View
        style={[
          styles.seatCircle,
          user && styles.seatTaken,
          speaking && styles.seatSpeaking,
          isSelf && styles.seatSelf,
        ]}
      >
        {user ? (
          <Text style={styles.seatAvatarText}>{(user.name || "?").slice(0, 1)}</Text>
        ) : seat.locked ? (
          <Text style={styles.seatIcon}>🔒</Text>
        ) : (
          <Text style={styles.seatIcon}>＋</Text>
        )}
        {user && seat.muted && (
          <View style={styles.muteBadge}>
            <Text style={styles.muteBadgeText}>🔇</Text>
          </View>
        )}
      </View>
      <Text style={styles.seatName} numberOfLines={1}>
        {user ? user.name : `مايك ${seat.index + 1}`}
      </Text>
    </Pressable>
  );
}

function ChatRow({ msg }) {
  if (msg.type === "system" || msg.type === "enter") {
    return <Text style={styles.sysMsg}>{msg.text}</Text>;
  }
  return (
    <View style={styles.chatRow}>
      <Text style={styles.chatName}>{msg.user?.name || "؟"}: </Text>
      <Text style={styles.chatText}>{msg.text}</Text>
    </View>
  );
}

export default function RoomScreen({ identity, room, onLeave }) {
  const [state, setState] = useState(null); // room مُسلسلة من السيرفر
  const [selfId, setSelfId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [text, setText] = useState("");
  const [connecting, setConnecting] = useState(true);
  const [giftOpen, setGiftOpen] = useState(false);
  const chatRef = useRef(null);

  // مقعد المستخدم الحالي (إن كان صاعداً على مايك)
  const mySeat = state?.seats?.find((s) => s.user && s.user.id === selfId);

  useEffect(() => {
    function onJoined({ selfId, room }) {
      setSelfId(selfId);
      setState(room);
      setMessages(room.messages || []);
      setConnecting(false);
    }
    function onUpdate(r) {
      setState(r);
    }
    function onChatNew(msg) {
      setMessages((prev) => [...prev, msg].slice(-120));
    }
    function onSpeaking({ index, speaking }) {
      setState((prev) => {
        if (!prev) return prev;
        const seats = prev.seats.map((s) =>
          s.index === index ? { ...s, speaking } : s
        );
        return { ...prev, seats };
      });
    }
    function onWallet(w) {
      setWallet(w);
    }
    function onInsufficient({ need, kind }) {
      Alert.alert("رصيد غير كافٍ", `تحتاج ${need} ${kind === "diamonds" ? "💎" : "🪙"}`);
    }
    function onJoinError({ reason }) {
      Alert.alert("تعذّر الدخول", reason === "pin" ? "الغرفة تتطلب رمز PIN" : "خطأ في الدخول");
      onLeave();
    }
    function onRoomClosed() {
      Alert.alert("أُغلقت الغرفة", "تم إغلاق الغرفة");
      onLeave();
    }

    socket.on("room:joined", onJoined);
    socket.on("room:update", onUpdate);
    socket.on("chat:new", onChatNew);
    socket.on("seat:speaking", onSpeaking);
    socket.on("wallet:update", onWallet);
    socket.on("wallet:insufficient", onInsufficient);
    socket.on("room:join:error", onJoinError);
    socket.on("room:closed", onRoomClosed);

    if (!socket.connected) socket.connect();
    const doJoin = () =>
      socket.emit("room:join", {
        roomId: String(room.id),
        user: { uid: identity.uid, name: identity.name, avatar: identity.avatar },
      });
    if (socket.connected) doJoin();
    else socket.once("connect", doJoin);

    return () => {
      socket.emit("seat:leave");
      socket.off("room:joined", onJoined);
      socket.off("room:update", onUpdate);
      socket.off("chat:new", onChatNew);
      socket.off("seat:speaking", onSpeaking);
      socket.off("wallet:update", onWallet);
      socket.off("wallet:insufficient", onInsufficient);
      socket.off("room:join:error", onJoinError);
      socket.off("room:closed", onRoomClosed);
    };
  }, [room.id, identity, onLeave]);

  // مؤشر تحدّث بسيط: أثناء عدم الكتم نرسل نبضات "أتكلم" (محاكاة كالويب)
  useEffect(() => {
    if (!mySeat || mySeat.muted) return;
    let on = false;
    const t = setInterval(() => {
      on = !on;
      socket.emit("seat:speaking", { speaking: on });
    }, 900);
    return () => {
      clearInterval(t);
      socket.emit("seat:speaking", { speaking: false });
    };
  }, [mySeat?.index, mySeat?.muted]);

  const onSeatPress = useCallback(
    (seat) => {
      if (seat.user) {
        // مقعدي؟ انزل. غير ذلك: افتح هدية للجالس.
        if (seat.user.id === selfId) socket.emit("seat:leave");
        else {
          setGiftTarget(seat.user);
          setGiftOpen(true);
        }
        return;
      }
      if (seat.locked) return;
      socket.emit("seat:take", { index: seat.index });
    },
    [selfId]
  );

  const [giftTarget, setGiftTarget] = useState(null);

  function send() {
    const clean = text.trim();
    if (!clean) return;
    socket.emit("chat:send", { text: clean });
    setText("");
  }

  function sendGift(gift, combo) {
    socket.emit("gift:send", {
      giftId: gift.id,
      toUserId: giftTarget?.id || null,
      combo: combo || 1,
    });
    setGiftOpen(false);
  }

  if (connecting) {
    return (
      <View style={[styles.fill, styles.center]}>
        <ActivityIndicator color={theme.accent} size="large" />
        <Text style={styles.connectingText}>جارٍ الدخول للغرفة…</Text>
      </View>
    );
  }

  const seats = state?.seats || [];

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* الهيدر */}
      <View style={styles.header}>
        <Pressable onPress={onLeave} style={styles.backBtn}>
          <Text style={styles.backText}>‹ خروج</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.roomTitle} numberOfLines={1}>
            {state?.name || room.name}
          </Text>
          <Text style={styles.roomSub}>
            #{state?.id} · {state?.members?.length || 0} 👥
          </Text>
        </View>
        <Text style={styles.walletChip}>
          🪙 {wallet?.coins ?? "…"}  💎 {wallet?.diamonds ?? "…"}
        </Text>
      </View>

      {/* شبكة المقاعد */}
      <FlatList
        data={seats}
        keyExtractor={(s) => String(s.index)}
        numColumns={4}
        scrollEnabled={false}
        columnWrapperStyle={{ justifyContent: "space-around" }}
        contentContainerStyle={styles.seatsWrap}
        renderItem={({ item }) => (
          <Seat seat={item} isSelf={item.user?.id === selfId} onPress={onSeatPress} />
        )}
      />

      {/* الشات */}
      <FlatList
        ref={chatRef}
        data={messages}
        keyExtractor={(m, i) => m.id || String(i)}
        style={styles.chat}
        contentContainerStyle={{ padding: 12, gap: 6 }}
        renderItem={({ item }) => <ChatRow msg={item} />}
        onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: true })}
      />

      {/* شريط الأدوات */}
      <View style={styles.bottomBar}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="اكتب رسالة…"
          placeholderTextColor={theme.textDim}
          style={styles.chatInput}
          textAlign="right"
          onSubmitEditing={send}
          returnKeyType="send"
        />
        {mySeat ? (
          <Pressable
            style={[styles.toolBtn, mySeat.muted ? styles.toolMuted : styles.toolLive]}
            onPress={() => socket.emit("seat:toggleMute")}
          >
            <Text style={styles.toolIcon}>{mySeat.muted ? "🔇" : "🎤"}</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.toolBtn, styles.toolLive]}
            onPress={() => {
              const free = seats.find((s) => !s.user && !s.locked);
              if (free) socket.emit("seat:take", { index: free.index });
              else Alert.alert("لا يوجد مايك فارغ");
            }}
          >
            <Text style={styles.toolIcon}>🎤</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.toolBtn, styles.toolGift]}
          onPress={() => {
            setGiftTarget(null);
            setGiftOpen(true);
          }}
        >
          <Text style={styles.toolIcon}>🎁</Text>
        </Pressable>
      </View>

      <GiftSheet
        visible={giftOpen}
        target={giftTarget}
        onClose={() => setGiftOpen(false)}
        onSend={sendGift}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: theme.bg },
  center: { alignItems: "center", justifyContent: "center" },
  connectingText: { color: theme.textDim, marginTop: 14 },
  header: {
    paddingTop: 54,
    paddingBottom: 12,
    paddingHorizontal: 14,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    backgroundColor: theme.bgDeep,
  },
  backBtn: { paddingVertical: 4, paddingHorizontal: 6 },
  backText: { color: theme.accent, fontSize: 16, fontWeight: "700" },
  roomTitle: { color: theme.text, fontWeight: "800", fontSize: 16, textAlign: "right" },
  roomSub: { color: theme.textDim, fontSize: 12, textAlign: "right", marginTop: 2 },
  walletChip: { color: theme.gold, fontSize: 12, fontWeight: "700" },
  seatsWrap: { paddingVertical: 18, gap: 18 },
  seat: { width: 74, alignItems: "center", marginBottom: 6 },
  seatCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: theme.seatEmpty,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  seatTaken: { backgroundColor: theme.cardSoft, borderColor: theme.accent2 },
  seatSpeaking: { borderColor: theme.accent, borderWidth: 3, shadowColor: theme.accent, shadowOpacity: 0.9, shadowRadius: 8 },
  seatSelf: { borderColor: theme.gold },
  seatIcon: { color: theme.textDim, fontSize: 22 },
  seatAvatarText: { color: theme.text, fontSize: 22, fontWeight: "800" },
  seatName: { color: theme.textDim, fontSize: 11, marginTop: 5, maxWidth: 72, textAlign: "center" },
  muteBadge: { position: "absolute", bottom: -2, right: -2, backgroundColor: theme.bgDeep, borderRadius: 10, paddingHorizontal: 2 },
  muteBadgeText: { fontSize: 12 },
  chat: { flex: 1, backgroundColor: theme.bgDeep, marginHorizontal: 10, borderRadius: 14, marginBottom: 8 },
  chatRow: { flexDirection: "row-reverse", flexWrap: "wrap" },
  chatName: { color: theme.accent, fontWeight: "700", fontSize: 14 },
  chatText: { color: theme.text, fontSize: 14 },
  sysMsg: { color: theme.textDim, fontSize: 12, fontStyle: "italic", textAlign: "center" },
  bottomBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 28,
    paddingTop: 6,
    backgroundColor: theme.bgDeep,
  },
  chatInput: {
    flex: 1,
    backgroundColor: theme.card,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: theme.text,
    fontSize: 15,
  },
  toolBtn: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  toolLive: { backgroundColor: theme.accent },
  toolMuted: { backgroundColor: theme.danger },
  toolGift: { backgroundColor: theme.gold },
  toolIcon: { fontSize: 20 },
});
