import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import Sheet from "../../components/Sheet";
import { SYSTEMS } from "../../data/rankings";

const fmt = (n) => n.toLocaleString("en-US");
const medal = (r) => (r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : `#${r}`);

// نافذة الترتيب 🏆 — تعكس client/src/lobby/RankingModal.jsx (نظاما اللوبي)
export default function RankingModal({ visible, onClose, identity }) {
  const [sysId, setSysId] = useState("players");
  const sys = SYSTEMS[sysId];
  const data = useMemo(
    () => (visible ? sys.build({ name: identity?.name || "أنا", avatar: identity?.avatar || "🧑🏻" }) : null),
    [visible, sysId, identity]
  );

  return (
    <Sheet visible={visible} onClose={onClose} title={`${sys.emoji} ${sys.title}`} right={data?.me ? medal(data.me.rank) : null}>
      <View style={styles.tabs}>
        {Object.values(SYSTEMS).map((s) => (
          <Pressable key={s.id} style={[styles.tab, sysId === s.id && { borderColor: s.accent, backgroundColor: `${s.accent}22` }]} onPress={() => setSysId(s.id)}>
            <Text style={[styles.tabTxt, sysId === s.id && { color: s.accent }]}>{s.emoji} {s.title}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, gap: 8 }}>
        <Text style={styles.blurb}>{sys.blurb}</Text>

        {data?.tier && (
          <View style={[styles.tierCard, { borderColor: data.tier.color }]}>
            <Text style={{ fontSize: 26 }}>{data.tier.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.tierName, { color: data.tier.color }]}>{data.tier.name}</Text>
              <View style={styles.tierBar}>
                <View style={[styles.tierFill, { width: `${Math.round((data.progress || 0) * 100)}%`, backgroundColor: data.tier.color }]} />
              </View>
              <Text style={styles.tierNext}>{data.next ? `التالي: ${data.next.name} عند ${fmt(data.next.min)}` : "أعلى رتبة 👑"}</Text>
            </View>
          </View>
        )}

        {data?.me && (
          <View style={[styles.row, styles.meRow]}>
            <Text style={styles.rank}>{medal(data.me.rank)}</Text>
            <Text style={styles.ava}>{data.me.avatar}</Text>
            <Text style={styles.name} numberOfLines={1}>{data.me.name}</Text>
            <Text style={[styles.value, { color: sys.accent }]}>{fmt(data.me.value)}</Text>
          </View>
        )}

        {data?.rows.map((r, i) => (
          <View key={r.id} style={[styles.row, r.isMe && styles.meRow]}>
            <Text style={styles.rank}>{medal(i + 1)}</Text>
            <Text style={styles.ava}>{r.avatar || "🧑🏻"}</Text>
            <Text style={styles.name} numberOfLines={1}>{r.flag ? r.flag + " " : ""}{r.name}</Text>
            <Text style={[styles.value, { color: sys.accent }]}>{fmt(r.value)}</Text>
          </View>
        ))}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row-reverse", gap: 8, paddingHorizontal: 14, paddingTop: 12 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  tabTxt: { color: "#9dc0b8", fontSize: 12, fontWeight: "700" },
  blurb: { color: "#9dc0b8", fontSize: 12, textAlign: "right", marginBottom: 4 },
  tierCard: { flexDirection: "row-reverse", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, borderWidth: 1.5, backgroundColor: "rgba(255,255,255,0.04)" },
  tierName: { fontWeight: "800", fontSize: 16, textAlign: "right" },
  tierBar: { height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.12)", overflow: "hidden", marginVertical: 4 },
  tierFill: { height: "100%", borderRadius: 3 },
  tierNext: { color: "#9dc0b8", fontSize: 10, textAlign: "right" },
  row: { flexDirection: "row-reverse", alignItems: "center", gap: 10, backgroundColor: "rgba(30,90,86,0.3)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
  meRow: { borderWidth: 1.5, borderColor: "#3fd3ac", backgroundColor: "rgba(63,211,172,0.12)" },
  rank: { width: 34, color: "#eaf6f3", fontWeight: "800", fontSize: 13, textAlign: "center" },
  ava: { fontSize: 20 },
  name: { flex: 1, color: "#eaf6f3", fontSize: 13, fontWeight: "600", textAlign: "right" },
  value: { fontWeight: "800", fontSize: 14 },
});
