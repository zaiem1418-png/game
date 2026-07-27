import React, { useEffect, useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet, ScrollView } from "react-native";
import Sheet from "../../components/Sheet";
import { marriage, getMyShortId } from "../../gameApi";

// المحكمة 🏛️ — الزواج والطلاق. تعكس client/src/lobby/CourtModal.jsx
export default function CourtModal({ visible, onClose }) {
  const [st, setSt] = useState(null);
  const [partnerId, setPartnerId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [confirmKhul, setConfirmKhul] = useState(false);
  const myId = getMyShortId();

  const load = () => marriage.status().then(setSt).catch(() => {});
  useEffect(() => { if (visible) { setSt(null); setErr(""); setMsg(""); setConfirmKhul(false); load(); } }, [visible]);

  async function run(fn, okMsg) {
    setBusy(true); setErr(""); setMsg("");
    try { await fn(); if (okMsg) setMsg(okMsg); await load(); }
    catch (e) { setErr(e.message || "تعذّرت العملية"); }
    finally { setBusy(false); }
  }

  const married = !!st?.partner;
  const divIncoming = st?.divorceIncoming?.[0] || null;
  const divOutgoing = st?.divorceOutgoing?.[0] || null;

  return (
    <Sheet visible={visible} onClose={onClose} title="🏛️ المحكمة" right={`معرّفي: ${myId || "…"}`}>
      <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
        {err ? <Text style={styles.err}>{err}</Text> : null}
        {msg ? <Text style={styles.ok}>{msg}</Text> : null}

        {married && (
          <>
            <View style={styles.couple}>
              <Text style={styles.coupleAva}>{st.me?.avatar || "🧑🏻"}</Text>
              <Text style={{ fontSize: 26 }}>💞</Text>
              <Text style={styles.coupleAva}>{st.partner.avatar || "🧑🏻"}</Text>
            </View>
            <Text style={styles.status}>متزوّج من <Text style={{ fontWeight: "800" }}>{st.partner.name}</Text></Text>
            <Text style={styles.sub}>معرّفه: {st.partner.shortId}</Text>

            {divIncoming && (
              <View style={styles.reqHot}>
                <Text style={styles.reqTxt}>💔 طلب شريكك الطلاق بالتراضي</Text>
                <View style={styles.actions}>
                  <Pressable style={styles.btnOk} disabled={busy} onPress={() => run(() => marriage.acceptDivorce(divIncoming.id), "تم الطلاق بالتراضي")}><Text style={styles.btnOkTxt}>موافقة</Text></Pressable>
                  <Pressable style={styles.btnGhost} disabled={busy} onPress={() => run(() => marriage.rejectDivorce(divIncoming.id), "رفضت الطلب")}><Text style={styles.btnGhostTxt}>رفض</Text></Pressable>
                </View>
              </View>
            )}
            {divOutgoing && !divIncoming && <Text style={styles.pending}>⏳ أرسلت طلب طلاق — بانتظار موافقة الشريك</Text>}

            {!confirmKhul ? (
              <View style={{ gap: 8 }}>
                {!divOutgoing && (
                  <Pressable style={styles.btnWarn} disabled={busy} onPress={() => run(() => marriage.proposeDivorce(), "أُرسل طلب الطلاق بالتراضي")}><Text style={styles.btnWarnTxt}>💌 طلب طلاق بالتراضي</Text></Pressable>
                )}
                <Pressable style={styles.btnDanger} disabled={busy} onPress={() => setConfirmKhul(true)}><Text style={styles.btnDangerTxt}>⚡ طلاق إجباري (خلع فوري)</Text></Pressable>
              </View>
            ) : (
              <View style={styles.confirm}>
                <Text style={styles.confirmTxt}>الخلع يفسخ الزواج فوراً دون موافقة الشريك. متأكد؟</Text>
                <View style={styles.actions}>
                  <Pressable style={styles.btnDanger} disabled={busy} onPress={() => run(() => marriage.forceDivorce(), "تم الطلاق (خلع)").then(() => setConfirmKhul(false))}><Text style={styles.btnDangerTxt}>نعم، خلع</Text></Pressable>
                  <Pressable style={styles.btnGhost} disabled={busy} onPress={() => setConfirmKhul(false)}><Text style={styles.btnGhostTxt}>تراجع</Text></Pressable>
                </View>
              </View>
            )}
          </>
        )}

        {st && !married && (
          <>
            <Text style={styles.single}>💍 اطلب الزواج</Text>
            <View style={styles.form}>
              <TextInput style={styles.input} placeholder="رقم الطرف الآخر (ID)" placeholderTextColor="#6d8a84" keyboardType="number-pad" value={partnerId} onChangeText={(v) => setPartnerId(v.replace(/\D/g, ""))} textAlign="right" />
              <Pressable style={[styles.btnOk, (!partnerId || busy) && styles.dim]} disabled={busy || !partnerId} onPress={() => run(() => marriage.propose(partnerId).then(() => setPartnerId("")), "أُرسل طلب الزواج 💍")}><Text style={styles.btnOkTxt}>اطلب</Text></Pressable>
            </View>
            {st.incoming?.length > 0 && (
              <View style={{ gap: 8 }}>
                <Text style={styles.sec}>طلبات زواج واردة</Text>
                {st.incoming.map((r) => (
                  <View key={r.id} style={styles.req}>
                    <Text style={styles.reqTxt}>💌 {r.from?.name || "لاعب"} ({r.from?.shortId})</Text>
                    <View style={styles.actions}>
                      <Pressable style={styles.btnOk} disabled={busy} onPress={() => run(() => marriage.accept(r.id), "مبارك الزواج 💑")}><Text style={styles.btnOkTxt}>قبول</Text></Pressable>
                      <Pressable style={styles.btnGhost} disabled={busy} onPress={() => run(() => marriage.reject(r.id))}><Text style={styles.btnGhostTxt}>رفض</Text></Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  err: { color: "#ff8a3d", textAlign: "center", backgroundColor: "rgba(255,138,61,0.12)", borderRadius: 10, padding: 8 },
  ok: { color: "#3ad6c4", textAlign: "center", backgroundColor: "rgba(58,214,196,0.12)", borderRadius: 10, padding: 8 },
  couple: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 14 },
  coupleAva: { fontSize: 44 },
  status: { color: "#eaf6f3", fontSize: 16, textAlign: "center" },
  sub: { color: "#9dc0b8", fontSize: 12, textAlign: "center" },
  single: { color: "#eaf6f3", fontSize: 18, fontWeight: "800", textAlign: "center" },
  sec: { color: "#eaf6f3", fontSize: 15, fontWeight: "800", textAlign: "right" },
  form: { flexDirection: "row-reverse", gap: 10 },
  input: { flex: 1, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: "#eaf6f3", fontSize: 15 },
  req: { backgroundColor: "rgba(30,90,86,0.35)", borderRadius: 12, padding: 10, gap: 8 },
  reqHot: { backgroundColor: "rgba(255,92,122,0.15)", borderWidth: 1, borderColor: "rgba(255,92,122,0.4)", borderRadius: 12, padding: 10, gap: 8 },
  reqTxt: { color: "#eaf6f3", fontSize: 13, textAlign: "right" },
  pending: { color: "#9dc0b8", fontSize: 13, textAlign: "center" },
  confirm: { backgroundColor: "rgba(255,92,122,0.12)", borderRadius: 12, padding: 12, gap: 10 },
  confirmTxt: { color: "#eaf6f3", fontSize: 13, textAlign: "center" },
  actions: { flexDirection: "row-reverse", gap: 8, justifyContent: "center" },
  dim: { opacity: 0.5 },
  btnOk: { backgroundColor: "#3fd3ac", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, justifyContent: "center" },
  btnOkTxt: { color: "#04211b", fontWeight: "800", fontSize: 13 },
  btnGhost: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  btnGhostTxt: { color: "#9dc0b8", fontWeight: "700", fontSize: 13 },
  btnWarn: { backgroundColor: "#f0a93a", borderRadius: 10, paddingVertical: 11, alignItems: "center" },
  btnWarnTxt: { color: "#3a2708", fontWeight: "800", fontSize: 14 },
  btnDanger: { backgroundColor: "#ff5c7a", borderRadius: 10, paddingVertical: 11, paddingHorizontal: 16, alignItems: "center" },
  btnDangerTxt: { color: "#2a0810", fontWeight: "800", fontSize: 14 },
});
