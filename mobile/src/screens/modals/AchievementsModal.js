import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import Sheet from "../../components/Sheet";
import { achievements } from "../../gameApi";

// إنجازات اللعب 🏆 — تعكس client/src/lobby/AchievementsModal.jsx
export default function AchievementsModal({ visible, onClose }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!visible) return;
    setData(null); setErr("");
    achievements.list().then(setData).catch((e) => setErr(e.message || "تعذّر التحميل"));
  }, [visible]);

  return (
    <Sheet visible={visible} onClose={onClose} title="🏆 إنجازات اللعب" right={data ? `${data.unlocked}/${data.total}` : null}>
      <ScrollView contentContainerStyle={{ padding: 14, gap: 10 }}>
        {err ? <Text style={styles.err}>{err}</Text> : null}
        {!data && !err ? <ActivityIndicator color="#3fd3ac" style={{ marginTop: 20 }} /> : null}
        {data?.achievements.map((a) => {
          const pct = Math.min(100, Math.round((a.progress / a.goal) * 100));
          return (
            <View key={a.id} style={[styles.card, a.done && styles.done]}>
              <Text style={styles.ico}>{a.done ? a.icon : "🔒"}</Text>
              <View style={styles.info}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{a.title}</Text>
                  {a.done ? <Text style={styles.tag}>مكتمل</Text> : null}
                </View>
                <Text style={styles.desc}>{a.desc}</Text>
                <View style={styles.bar}><View style={[styles.barFill, { width: `${pct}%` }]} /></View>
              </View>
              <Text style={styles.prog}>{a.progress}/{a.goal}</Text>
            </View>
          );
        })}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  err: { color: "#ff8a3d", textAlign: "center", backgroundColor: "rgba(255,138,61,0.12)", borderRadius: 10, padding: 8 },
  card: { flexDirection: "row-reverse", alignItems: "center", gap: 10, backgroundColor: "rgba(30,90,86,0.35)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 14, padding: 12 },
  done: { borderColor: "rgba(255,206,90,0.4)", backgroundColor: "rgba(255,206,90,0.08)" },
  ico: { fontSize: 28 },
  info: { flex: 1, gap: 3 },
  titleRow: { flexDirection: "row-reverse", alignItems: "center", gap: 6 },
  title: { color: "#eaf6f3", fontWeight: "700", fontSize: 14, textAlign: "right" },
  tag: { color: "#3a2708", backgroundColor: "#ffce5a", fontSize: 9, fontWeight: "800", borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1, overflow: "hidden" },
  desc: { color: "#9dc0b8", fontSize: 11, textAlign: "right" },
  bar: { height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden", marginTop: 2 },
  barFill: { height: "100%", backgroundColor: "#ffce5a", borderRadius: 3 },
  prog: { color: "#9dc0b8", fontSize: 11 },
});
