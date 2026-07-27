import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import Sheet from "../../components/Sheet";
import { glory } from "../../gameApi";

function rewardLabel(r) {
  const parts = [];
  if (r.diamonds) parts.push(`💎 ${r.diamonds.toLocaleString("en-US")}`);
  if (r.coins) parts.push(`🪙 ${r.coins.toLocaleString("en-US")}`);
  return parts.join(" + ");
}

// بطاقة المجد 🏅 — تعكس client/src/lobby/GloryModal.jsx
export default function GloryModal({ visible, onClose, onWallet }) {
  const [st, setSt] = useState(null);
  const [busy, setBusy] = useState(0);
  const [err, setErr] = useState("");

  const load = () => glory.status().then(setSt).catch((e) => setErr(e.message || ""));
  useEffect(() => { if (visible) { setSt(null); setErr(""); load(); } }, [visible]);

  async function claim(level) {
    setBusy(level); setErr("");
    try {
      const r = await glory.claim(level);
      setSt(r.status);
      if (r.wallet) onWallet?.(r.wallet);
    } catch (e) { setErr(e.message || "تعذّر الاستلام"); }
    finally { setBusy(0); }
  }

  const pct = st?.nextNeed ? Math.min(100, Math.round((st.points / st.nextNeed) * 100)) : 100;

  return (
    <Sheet visible={visible} onClose={onClose} title="🏅 بطاقة المجد" right={st ? `المجد: ${st.points.toLocaleString("en-US")}` : null}>
      <ScrollView contentContainerStyle={{ padding: 14, gap: 10 }}>
        {err ? <Text style={styles.err}>{err}</Text> : null}
        <View style={styles.hero}>
          <Text style={styles.points}>🏅 {st ? st.points.toLocaleString("en-US") : "…"}</Text>
          <View style={styles.bar}><View style={[styles.barFill, { width: `${pct}%` }]} /></View>
          <Text style={styles.next}>{st?.nextNeed ? `المستوى التالي عند ${st.nextNeed.toLocaleString("en-US")} نقطة` : "بلغت أعلى المستويات 🎉"}</Text>
        </View>
        <Text style={styles.hint}>اكسب نقاط المجد من تسجيل الدخول اليومي واستلام المهام، ثم افتح مكافآت المستويات.</Text>
        {!st && !err ? <ActivityIndicator color="#3fd3ac" style={{ marginTop: 20 }} /> : null}
        {st?.tiers.map((t) => (
          <View key={t.level} style={[styles.tier, t.claimable && styles.ready, t.claimed && styles.tierDone]}>
            <Text style={styles.lv}>{t.level}</Text>
            <View style={styles.mid}>
              <Text style={styles.reward}>{rewardLabel(t.reward)}</Text>
              <Text style={styles.need}>يفتح عند {t.need.toLocaleString("en-US")} مجد</Text>
            </View>
            {t.claimed ? (
              <Text style={styles.claimed}>✓ استُلمت</Text>
            ) : t.claimable ? (
              <Pressable style={styles.btnOk} disabled={busy === t.level} onPress={() => claim(t.level)}>
                <Text style={styles.btnOkTxt}>{busy === t.level ? "…" : "استلام"}</Text>
              </Pressable>
            ) : (
              <Text style={styles.locked}>🔒</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  err: { color: "#ff8a3d", textAlign: "center", backgroundColor: "rgba(255,138,61,0.12)", borderRadius: 10, padding: 8 },
  hero: { alignItems: "center", gap: 8, backgroundColor: "rgba(255,206,90,0.1)", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(255,206,90,0.3)" },
  points: { color: "#ffce5a", fontSize: 26, fontWeight: "800" },
  bar: { width: "100%", height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.12)", overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: "#ffce5a", borderRadius: 4 },
  next: { color: "#c9dad5", fontSize: 12 },
  hint: { color: "#9dc0b8", fontSize: 12, textAlign: "right" },
  tier: { flexDirection: "row-reverse", alignItems: "center", gap: 10, backgroundColor: "rgba(30,90,86,0.35)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 14, padding: 12 },
  ready: { borderColor: "#3fd3ac" },
  tierDone: { opacity: 0.6 },
  lv: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,206,90,0.25)", color: "#ffce5a", fontWeight: "800", textAlign: "center", textAlignVertical: "center", fontSize: 13 },
  mid: { flex: 1, gap: 2 },
  reward: { color: "#eaf6f3", fontWeight: "700", fontSize: 13, textAlign: "right" },
  need: { color: "#9dc0b8", fontSize: 10, textAlign: "right" },
  claimed: { color: "#3ad6c4", fontSize: 11 },
  locked: { color: "#9dc0b8", fontSize: 16 },
  btnOk: { backgroundColor: "#3fd3ac", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6 },
  btnOkTxt: { color: "#04211b", fontWeight: "800", fontSize: 12 },
});
