import React, { useEffect, useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet, ScrollView } from "react-native";
import Sheet from "../../components/Sheet";
import { friends, getMyShortId } from "../../gameApi";

// صديق اللعب 👥 — تعكس client/src/lobby/FriendsModal.jsx
export default function FriendsModal({ visible, onClose }) {
  const [st, setSt] = useState(null);
  const [toId, setToId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const myId = getMyShortId();

  const load = () => friends.status().then(setSt).catch(() => {});
  useEffect(() => { if (visible) { setSt(null); setErr(""); setMsg(""); load(); } }, [visible]);

  async function run(fn, okMsg) {
    setBusy(true); setErr(""); setMsg("");
    try { await fn(); if (okMsg) setMsg(okMsg); await load(); }
    catch (e) { setErr(e.message || "تعذّرت العملية"); }
    finally { setBusy(false); }
  }

  const Req = ({ children }) => <View style={styles.req}>{children}</View>;

  return (
    <Sheet visible={visible} onClose={onClose} title="👥 صديق اللعب" right={`معرّفي: ${myId || "…"}`}>
      <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
        {err ? <Text style={styles.err}>{err}</Text> : null}
        {msg ? <Text style={styles.ok}>{msg}</Text> : null}

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="رقم الصديق (ID)"
            placeholderTextColor="#6d8a84"
            keyboardType="number-pad"
            value={toId}
            onChangeText={(v) => setToId(v.replace(/\D/g, ""))}
            textAlign="right"
          />
          <Pressable style={[styles.btnOk, (!toId || busy) && styles.dim]} disabled={busy || !toId}
            onPress={() => run(() => friends.request(toId).then(() => setToId("")), "أُرسل طلب الصداقة")}>
            <Text style={styles.btnOkTxt}>إضافة</Text>
          </Pressable>
        </View>

        {st?.incoming?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sec}>طلبات واردة</Text>
            {st.incoming.map((r) => (
              <Req key={r.id}>
                <Text style={styles.reqTxt}>{r.from?.avatar || "🧑🏻"} {r.from?.name} ({r.from?.shortId})</Text>
                <View style={styles.reqActions}>
                  <Pressable style={styles.btnOkSm} disabled={busy} onPress={() => run(() => friends.accept(r.id), "تمت الإضافة")}><Text style={styles.btnOkSmTxt}>قبول</Text></Pressable>
                  <Pressable style={styles.btnGhost} disabled={busy} onPress={() => run(() => friends.reject(r.id))}><Text style={styles.btnGhostTxt}>رفض</Text></Pressable>
                </View>
              </Req>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sec}>أصدقائي {st?.friends?.length ? `(${st.friends.length})` : ""}</Text>
          {st && st.friends.length === 0 ? <Text style={styles.hint}>لا أصدقاء بعد — شارك معرّفك ({myId || "…"}) أو أضف صديقاً برقمه.</Text> : null}
          {st?.friends.map((f) => (
            <View key={f.uid} style={styles.friend}>
              <Text style={styles.ava}>{f.avatar || "🧑🏻"}</Text>
              <Text style={styles.friendName}>{f.name} <Text style={styles.friendId}>ID {f.shortId}</Text></Text>
              <Pressable style={styles.btnGhost} disabled={busy} onPress={() => run(() => friends.remove(f.uid))}><Text style={styles.btnGhostTxt}>حذف</Text></Pressable>
            </View>
          ))}
        </View>

        {st?.outgoing?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sec}>طلبات أرسلتها</Text>
            {st.outgoing.map((r) => (
              <Req key={r.id}>
                <Text style={styles.reqTxt}>⏳ بانتظار رد {r.to?.name} ({r.to?.shortId})</Text>
                <Pressable style={styles.btnGhost} disabled={busy} onPress={() => run(() => friends.reject(r.id))}><Text style={styles.btnGhostTxt}>إلغاء</Text></Pressable>
              </Req>
            ))}
          </View>
        )}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  err: { color: "#ff8a3d", textAlign: "center", backgroundColor: "rgba(255,138,61,0.12)", borderRadius: 10, padding: 8 },
  ok: { color: "#3ad6c4", textAlign: "center", backgroundColor: "rgba(58,214,196,0.12)", borderRadius: 10, padding: 8 },
  form: { flexDirection: "row-reverse", gap: 10 },
  input: { flex: 1, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: "#eaf6f3", fontSize: 15 },
  btnOk: { backgroundColor: "#3fd3ac", borderRadius: 12, paddingHorizontal: 20, justifyContent: "center" },
  btnOkTxt: { color: "#04211b", fontWeight: "800", fontSize: 14 },
  dim: { opacity: 0.5 },
  section: { gap: 8 },
  sec: { color: "#eaf6f3", fontSize: 15, fontWeight: "800", textAlign: "right" },
  hint: { color: "#9dc0b8", fontSize: 12, textAlign: "right" },
  req: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(30,90,86,0.35)", borderRadius: 12, padding: 10, gap: 8 },
  reqTxt: { color: "#eaf6f3", fontSize: 13, flex: 1, textAlign: "right" },
  reqActions: { flexDirection: "row-reverse", gap: 6 },
  friend: { flexDirection: "row-reverse", alignItems: "center", gap: 10, backgroundColor: "rgba(30,90,86,0.35)", borderRadius: 12, padding: 10 },
  ava: { fontSize: 22 },
  friendName: { flex: 1, color: "#eaf6f3", fontSize: 14, fontWeight: "700", textAlign: "right" },
  friendId: { color: "#9dc0b8", fontSize: 11, fontWeight: "400" },
  btnOkSm: { backgroundColor: "#3fd3ac", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  btnOkSmTxt: { color: "#04211b", fontWeight: "800", fontSize: 12 },
  btnGhost: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  btnGhostTxt: { color: "#9dc0b8", fontWeight: "700", fontSize: 12 },
});
