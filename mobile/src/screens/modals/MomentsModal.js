import React, { useEffect, useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import Sheet from "../../components/Sheet";
import { moments } from "../../gameApi";

function when(ts) {
  const d = Math.floor((Date.now() - ts) / 1000);
  if (d < 60) return "الآن";
  if (d < 3600) return `${Math.floor(d / 60)}د`;
  if (d < 86400) return `${Math.floor(d / 3600)}س`;
  return `${Math.floor(d / 86400)}ي`;
}

// اللحظات ✨ — منشورات نصية. تعكس client/src/lobby/MomentsModal.jsx (بدون وسائط)
export default function MomentsModal({ visible, onClose }) {
  const [list, setList] = useState(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => moments.list().then((d) => setList(d.moments)).catch(() => setList([]));
  useEffect(() => { if (visible) { setList(null); setText(""); load(); } }, [visible]);

  async function post() {
    if (!text.trim()) return;
    setBusy(true);
    try { await moments.post(text.trim(), null); setText(""); await load(); }
    catch {}
    finally { setBusy(false); }
  }
  async function like(m) {
    setList((l) => l.map((x) => x.id === m.id ? { ...x, likedByMe: !x.likedByMe, likeCount: x.likeCount + (x.likedByMe ? -1 : 1) } : x));
    try { await moments.like(m.id); } catch { load(); }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="✨ اللحظات">
      <View style={styles.composer}>
        <TextInput style={styles.input} placeholder="شارك لحظتك…" placeholderTextColor="#6d8a84" value={text} onChangeText={setText} multiline textAlign="right" />
        <Pressable style={[styles.post, (!text.trim() || busy) && styles.dim]} disabled={busy || !text.trim()} onPress={post}><Text style={styles.postTxt}>نشر</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 14, gap: 10 }}>
        {!list ? <ActivityIndicator color="#3fd3ac" style={{ marginTop: 20 }} /> : null}
        {list && list.length === 0 ? <Text style={styles.hint}>لا لحظات بعد — كن أول من يشارك!</Text> : null}
        {list?.map((m) => (
          <View key={m.id} style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.ava}>{m.author?.avatar || "🧑🏻"}</Text>
              <Text style={styles.author}>{m.author?.name || "لاعب"}</Text>
              <Text style={styles.time}>{when(m.ts)}</Text>
            </View>
            {m.text ? <Text style={styles.text}>{m.text}</Text> : null}
            <Pressable style={styles.likeBtn} onPress={() => like(m)}>
              <Text style={[styles.likeTxt, m.likedByMe && { color: "#ff5c7a" }]}>{m.likedByMe ? "❤️" : "🤍"} {m.likeCount || 0}</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  composer: { flexDirection: "row-reverse", gap: 10, padding: 14, paddingBottom: 6, alignItems: "flex-end" },
  input: { flex: 1, minHeight: 44, maxHeight: 120, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: "#eaf6f3", fontSize: 15 },
  post: { backgroundColor: "#3fd3ac", borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11 },
  postTxt: { color: "#04211b", fontWeight: "800", fontSize: 14 },
  dim: { opacity: 0.5 },
  hint: { color: "#9dc0b8", fontSize: 12, textAlign: "center", marginTop: 20 },
  card: { backgroundColor: "rgba(30,90,86,0.35)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 14, padding: 12, gap: 8 },
  cardHead: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  ava: { fontSize: 22 },
  author: { flex: 1, color: "#eaf6f3", fontWeight: "700", fontSize: 14, textAlign: "right" },
  time: { color: "#9dc0b8", fontSize: 11 },
  text: { color: "#eaf6f3", fontSize: 14, textAlign: "right", lineHeight: 22 },
  likeBtn: { alignSelf: "flex-start" },
  likeTxt: { color: "#9dc0b8", fontSize: 14, fontWeight: "700" },
});
