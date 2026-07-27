import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import Sheet from "../../components/Sheet";
import { tasks } from "../../gameApi";

function progressLabel(t) {
  if (t.unit === "seconds") return `${Math.floor(t.progress / 60)} / ${Math.floor(t.goal / 60)} دقيقة`;
  return `${t.progress} / ${t.goal}`;
}

// المهام اليومية ✅ — تعكس client/src/lobby/TasksModal.jsx
export default function TasksModal({ visible, onClose, onWallet }) {
  const [st, setSt] = useState(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  const load = () => tasks.status().then(setSt).catch((e) => setErr(e.message || ""));
  useEffect(() => { if (visible) { setSt(null); setErr(""); load(); } }, [visible]);

  async function claim(id) {
    setBusy(id); setErr("");
    try {
      const r = await tasks.claim(id);
      setSt(r.status);
      if (r.wallet) onWallet?.(r.wallet);
    } catch (e) { setErr(e.message || "تعذّر الاستلام"); }
    finally { setBusy(""); }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="✅ المهام اليومية" right={st?.claimable > 0 ? `جاهز: ${st.claimable}` : null}>
      <ScrollView contentContainerStyle={{ padding: 14, gap: 10 }}>
        {err ? <Text style={styles.err}>{err}</Text> : null}
        <Text style={styles.hint}>أكمل المهام واستلم الألماس 💎 — تتجدّد كل يوم.</Text>
        {!st && !err ? <ActivityIndicator color="#3fd3ac" style={{ marginTop: 20 }} /> : null}
        {st?.tasks.map((t) => {
          const pct = Math.min(100, Math.round((t.progress / t.goal) * 100));
          return (
            <View key={t.id} style={[styles.row, t.claimed && styles.rowDone]}>
              <Text style={styles.ico}>{t.icon}</Text>
              <View style={styles.mid}>
                <Text style={styles.title}>{t.title}</Text>
                <Text style={styles.desc}>{t.desc}</Text>
                <View style={styles.bar}><View style={[styles.barFill, { width: `${pct}%` }]} /></View>
                <Text style={styles.prog}>{progressLabel(t)}</Text>
              </View>
              <View style={styles.end}>
                <Text style={styles.reward}>💎 {t.reward}</Text>
                {t.claimed ? (
                  <Text style={styles.claimed}>✓ استُلمت</Text>
                ) : t.done ? (
                  <Pressable style={styles.btnOk} disabled={busy === t.id} onPress={() => claim(t.id)}>
                    <Text style={styles.btnOkTxt}>{busy === t.id ? "…" : "استلام"}</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.pending}>قيد التنفيذ</Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  err: { color: "#ff8a3d", textAlign: "center", backgroundColor: "rgba(255,138,61,0.12)", borderRadius: 10, padding: 8 },
  hint: { color: "#9dc0b8", fontSize: 12, textAlign: "right" },
  row: { flexDirection: "row-reverse", alignItems: "center", gap: 10, backgroundColor: "rgba(30,90,86,0.35)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 14, padding: 12 },
  rowDone: { opacity: 0.6 },
  ico: { fontSize: 26 },
  mid: { flex: 1, gap: 3 },
  title: { color: "#eaf6f3", fontWeight: "700", fontSize: 14, textAlign: "right" },
  desc: { color: "#9dc0b8", fontSize: 11, textAlign: "right" },
  bar: { height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden", marginTop: 2 },
  barFill: { height: "100%", backgroundColor: "#3fd3ac", borderRadius: 3 },
  prog: { color: "#9dc0b8", fontSize: 10, textAlign: "right" },
  end: { alignItems: "center", gap: 5 },
  reward: { color: "#ffce5a", fontSize: 12, fontWeight: "700" },
  claimed: { color: "#3ad6c4", fontSize: 11 },
  pending: { color: "#9dc0b8", fontSize: 10 },
  btnOk: { backgroundColor: "#3fd3ac", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6 },
  btnOkTxt: { color: "#04211b", fontWeight: "800", fontSize: 12 },
});
