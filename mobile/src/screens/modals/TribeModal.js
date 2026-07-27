import React, { useEffect, useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import Sheet from "../../components/Sheet";
import { clans } from "../../gameApi";

const EMBLEMS = ["🛡️", "🦁", "🐉", "🦅", "⚔️", "👑", "🔥", "🌙", "⭐", "🐺"];

// القبيلة 🏰 — تعكس client/src/lobby/TribeModal.jsx
export default function TribeModal({ visible, onClose }) {
  const [data, setData] = useState(null);
  const [name, setName] = useState("");
  const [emblem, setEmblem] = useState("🛡️");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = () => clans.list().then(setData).catch(() => {});
  useEffect(() => { if (visible) { setData(null); setErr(""); setCreating(false); load(); } }, [visible]);

  async function run(fn) {
    setBusy(true); setErr("");
    try { await fn(); await load(); }
    catch (e) { setErr(e.message || "تعذّرت العملية"); }
    finally { setBusy(false); }
  }

  const mine = data?.mine;

  return (
    <Sheet visible={visible} onClose={onClose} title="🏰 القبيلة">
      <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
        {err ? <Text style={styles.err}>{err}</Text> : null}
        {!data ? <ActivityIndicator color="#3fd3ac" style={{ marginTop: 20 }} /> : null}

        {mine ? (
          <View style={styles.mineCard}>
            <View style={styles.mineHead}>
              <Text style={styles.emblem}>{mine.emblem}</Text>
              <Text style={styles.mineName}>{mine.name}</Text>
              <Pressable style={styles.btnGhost} disabled={busy} onPress={() => run(() => clans.leave())}><Text style={styles.btnGhostTxt}>مغادرة</Text></Pressable>
            </View>
            <View style={styles.members}>
              {mine.members?.map((m) => (
                <View key={m.uid} style={styles.member}>
                  <Text style={styles.memberAva}>{m.avatar || "🧑🏻"}</Text>
                  <Text style={styles.memberName}>{m.name}{m.uid === mine.ownerUid ? " 👑" : ""}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : data ? (
          creating ? (
            <View style={styles.create}>
              <View style={styles.emblemRow}>
                {EMBLEMS.map((e) => (
                  <Pressable key={e} style={[styles.emblemPick, emblem === e && styles.emblemPickOn]} onPress={() => setEmblem(e)}>
                    <Text style={{ fontSize: 22 }}>{e}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput style={styles.input} placeholder="اسم القبيلة" placeholderTextColor="#6d8a84" value={name} onChangeText={setName} textAlign="right" />
              <View style={styles.actions}>
                <Pressable style={[styles.btnOk, (!name.trim() || busy) && styles.dim]} disabled={busy || !name.trim()} onPress={() => run(() => clans.create(name.trim(), emblem).then(() => { setName(""); setCreating(false); }))}><Text style={styles.btnOkTxt}>تأسيس</Text></Pressable>
                <Pressable style={styles.btnGhost} onPress={() => setCreating(false)}><Text style={styles.btnGhostTxt}>إلغاء</Text></Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={styles.btnOk} onPress={() => setCreating(true)}><Text style={styles.btnOkTxt}>➕ أسّس قبيلة</Text></Pressable>
          )
        ) : null}

        <Text style={styles.sec}>أقوى القبائل</Text>
        {data && data.clans.length === 0 ? <Text style={styles.hint}>لا توجد قبائل بعد — كن أول من يؤسّس واحدة!</Text> : null}
        {data?.clans.map((c, i) => (
          <View key={c.id} style={styles.row}>
            <Text style={styles.rank}>{i + 1}</Text>
            <Text style={styles.rowEmblem}>{c.emblem}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowName}>{c.name}</Text>
              <Text style={styles.rowSub}>Lv.{c.level} · {c.memberCount} عضو · {c.points} نقطة</Text>
            </View>
            {!mine ? <Pressable style={styles.btnOkSm} disabled={busy} onPress={() => run(() => clans.join(c.id))}><Text style={styles.btnOkTxt}>انضمام</Text></Pressable> : null}
          </View>
        ))}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  err: { color: "#ff8a3d", textAlign: "center", backgroundColor: "rgba(255,138,61,0.12)", borderRadius: 10, padding: 8 },
  mineCard: { backgroundColor: "rgba(181,115,31,0.15)", borderWidth: 1, borderColor: "rgba(255,206,90,0.35)", borderRadius: 16, padding: 14, gap: 12 },
  mineHead: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  emblem: { fontSize: 34 },
  mineName: { flex: 1, color: "#eaf6f3", fontSize: 17, fontWeight: "800", textAlign: "right" },
  members: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
  member: { alignItems: "center", gap: 2, width: 60 },
  memberAva: { fontSize: 22 },
  memberName: { color: "#c9dad5", fontSize: 10, textAlign: "center" },
  create: { gap: 10 },
  emblemRow: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 6, justifyContent: "center" },
  emblemPick: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "transparent" },
  emblemPickOn: { borderColor: "#ffce5a", backgroundColor: "rgba(255,206,90,0.15)" },
  input: { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: "#eaf6f3", fontSize: 15 },
  actions: { flexDirection: "row-reverse", gap: 8 },
  dim: { opacity: 0.5 },
  sec: { color: "#eaf6f3", fontSize: 15, fontWeight: "800", textAlign: "right", marginTop: 4 },
  hint: { color: "#9dc0b8", fontSize: 12, textAlign: "right" },
  row: { flexDirection: "row-reverse", alignItems: "center", gap: 10, backgroundColor: "rgba(30,90,86,0.3)", borderRadius: 12, padding: 10 },
  rank: { width: 24, color: "#ffce5a", fontWeight: "800", textAlign: "center" },
  rowEmblem: { fontSize: 24 },
  rowName: { color: "#eaf6f3", fontSize: 14, fontWeight: "700", textAlign: "right" },
  rowSub: { color: "#9dc0b8", fontSize: 10, textAlign: "right" },
  btnOk: { backgroundColor: "#3fd3ac", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11, alignItems: "center" },
  btnOkSm: { backgroundColor: "#3fd3ac", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  btnOkTxt: { color: "#04211b", fontWeight: "800", fontSize: 13 },
  btnGhost: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  btnGhostTxt: { color: "#9dc0b8", fontWeight: "700", fontSize: 12 },
});
