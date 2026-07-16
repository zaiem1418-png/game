import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { theme } from "../theme";
import { fetchRooms, fetchWallet } from "../api";
import { DEFAULT_ROOM_ID } from "../config";

function RoomCard({ room, onPress }) {
  const cover = room.cover || theme.cardSoft;
  return (
    <Pressable style={styles.card} onPress={() => onPress(room)}>
      <View style={[styles.cover, { backgroundColor: cover }]}>
        <Text style={styles.coverEmoji}>🎙️</Text>
        <View style={styles.live}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{room.members ?? 0}</Text>
        </View>
      </View>
      <Text style={styles.roomName} numberOfLines={1}>
        {room.name}
      </Text>
      <Text style={styles.roomMeta} numberOfLines={1}>
        {room.category || "الأصدقاء"} · #{room.id}
      </Text>
    </Pressable>
  );
}

export default function LobbyScreen({ identity, onOpenRoom, onEditProfile }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      const list = await fetchRooms();
      setRooms(Array.isArray(list) ? list : []);
    } catch (e) {
      setRooms([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    fetchWallet(identity.uid).then(setWallet).catch(() => {});
  }, [load, identity.uid]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
    fetchWallet(identity.uid).then(setWallet).catch(() => {});
  }, [load, identity.uid]);

  function enterById() {
    const id = search.trim();
    onOpenRoom({ id: id || DEFAULT_ROOM_ID, name: id ? `غرفة ${id}` : "الغرفة الرئيسية" });
  }

  return (
    <View style={styles.fill}>
      {/* الهيدر: الاسم + المحفظة */}
      <View style={styles.header}>
        <Pressable style={styles.profile} onPress={onEditProfile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(identity.name || "?").slice(0, 1)}
            </Text>
          </View>
          <View>
            <Text style={styles.hello}>{identity.name || "زائر"}</Text>
            <Text style={styles.wallet}>
              🪙 {wallet?.coins ?? "…"}   💎 {wallet?.diamonds ?? "…"}
            </Text>
          </View>
        </Pressable>
        <Text style={styles.brand}>الغرفة الصوتية 🎙️</Text>
      </View>

      {/* دخول بالرقم */}
      <View style={styles.searchRow}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="ادخل برقم الغرفة…"
          placeholderTextColor={theme.textDim}
          style={styles.searchInput}
          keyboardType="number-pad"
          textAlign="right"
        />
        <Pressable style={styles.enterBtn} onPress={enterById}>
          <Text style={styles.enterBtnText}>دخول</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>الغرف الشائعة</Text>

      {loading ? (
        <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(r) => String(r.id)}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 14 }}
          contentContainerStyle={{ gap: 12, paddingBottom: 30 }}
          renderItem={({ item }) => <RoomCard room={item} onPress={onOpenRoom} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              لا توجد غرف الآن — اضغط «دخول» للدخول للغرفة الرئيسية.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: theme.bg },
  header: {
    paddingTop: 54,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.bgDeep,
  },
  brand: { color: theme.text, fontWeight: "800", fontSize: 16 },
  profile: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#1c1526", fontWeight: "800", fontSize: 18 },
  hello: { color: theme.text, fontWeight: "700", fontSize: 15, textAlign: "right" },
  wallet: { color: theme.gold, fontSize: 12, textAlign: "right", marginTop: 2 },
  searchRow: {
    flexDirection: "row-reverse",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  searchInput: {
    flex: 1,
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    color: theme.text,
    fontSize: 15,
  },
  enterBtn: {
    backgroundColor: theme.accent,
    borderRadius: 12,
    paddingHorizontal: 22,
    justifyContent: "center",
  },
  enterBtnText: { color: "#1c1526", fontWeight: "800", fontSize: 15 },
  sectionTitle: {
    color: theme.text,
    fontWeight: "800",
    fontSize: 17,
    paddingHorizontal: 16,
    marginBottom: 10,
    textAlign: "right",
  },
  card: { flex: 1, backgroundColor: theme.card, borderRadius: 16, overflow: "hidden", paddingBottom: 10 },
  cover: { height: 110, alignItems: "center", justifyContent: "center" },
  coverEmoji: { fontSize: 40 },
  live: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.ok },
  liveText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  roomName: { color: theme.text, fontWeight: "700", fontSize: 14, paddingHorizontal: 10, paddingTop: 8, textAlign: "right" },
  roomMeta: { color: theme.textDim, fontSize: 12, paddingHorizontal: 10, paddingTop: 2, textAlign: "right" },
  empty: { color: theme.textDim, textAlign: "center", marginTop: 40, paddingHorizontal: 30, lineHeight: 22 },
});
