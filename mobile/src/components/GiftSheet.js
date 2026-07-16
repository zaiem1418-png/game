import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { theme } from "../theme";
import { fetchGifts } from "../api";

const COMBOS = [1, 7, 77, 520];

export default function GiftSheet({ visible, target, onClose, onSend }) {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [combo, setCombo] = useState(1);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    fetchGifts()
      .then((list) => setGifts(Array.isArray(list) ? list : list?.gifts || []))
      .catch(() => setGifts([]))
      .finally(() => setLoading(false));
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <Text style={styles.title}>
          {target ? `هدية إلى ${target.name}` : "إرسال هدية"}
        </Text>

        {loading ? (
          <ActivityIndicator color={theme.accent} style={{ marginVertical: 30 }} />
        ) : (
          <FlatList
            data={gifts}
            keyExtractor={(g) => String(g.id)}
            numColumns={4}
            contentContainerStyle={{ gap: 10, paddingVertical: 8 }}
            columnWrapperStyle={{ gap: 10, justifyContent: "center" }}
            style={{ maxHeight: 260 }}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.gift, selected?.id === item.id && styles.giftSel]}
                onPress={() => setSelected(item)}
              >
                <Text style={styles.giftEmoji}>{item.emoji || item.icon || "🎁"}</Text>
                <Text style={styles.giftName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.giftPrice}>
                  {(item.coins ?? 0) >= 100 ? "💎" : "🪙"} {item.coins ?? 0}
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={<Text style={styles.empty}>لا توجد هدايا</Text>}
          />
        )}

        {/* اختيار الكمية (كومبو) */}
        <View style={styles.comboRow}>
          {COMBOS.map((c) => (
            <Pressable
              key={c}
              style={[styles.comboBtn, combo === c && styles.comboSel]}
              onPress={() => setCombo(c)}
            >
              <Text style={[styles.comboText, combo === c && styles.comboTextSel]}>×{c}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.sendBtn, !selected && styles.sendDisabled]}
          disabled={!selected}
          onPress={() => selected && onSend(selected, combo)}
        >
          <Text style={styles.sendText}>
            {selected ? `إرسال ${selected.name} ×${combo}` : "اختر هدية"}
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    paddingBottom: 34,
  },
  grabber: { width: 44, height: 5, borderRadius: 3, backgroundColor: theme.border, alignSelf: "center", marginBottom: 12 },
  title: { color: theme.text, fontWeight: "800", fontSize: 17, textAlign: "center", marginBottom: 10 },
  gift: {
    width: 72,
    backgroundColor: theme.bgDeep,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    paddingVertical: 10,
  },
  giftSel: { borderColor: theme.accent },
  giftEmoji: { fontSize: 30 },
  giftName: { color: theme.text, fontSize: 11, marginTop: 4, maxWidth: 64, textAlign: "center" },
  giftPrice: { color: theme.gold, fontSize: 11, marginTop: 2 },
  empty: { color: theme.textDim, textAlign: "center", padding: 20 },
  comboRow: { flexDirection: "row-reverse", gap: 8, justifyContent: "center", marginTop: 12 },
  comboBtn: { backgroundColor: theme.bgDeep, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7, borderWidth: 1, borderColor: theme.border },
  comboSel: { backgroundColor: theme.accent, borderColor: theme.accent },
  comboText: { color: theme.textDim, fontWeight: "700" },
  comboTextSel: { color: "#1c1526" },
  sendBtn: { backgroundColor: theme.accent, borderRadius: 16, paddingVertical: 14, alignItems: "center", marginTop: 16 },
  sendDisabled: { opacity: 0.45 },
  sendText: { color: "#1c1526", fontWeight: "800", fontSize: 16 },
});
