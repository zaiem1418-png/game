import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import Sheet from "../../components/Sheet";
import { packages } from "../../gameApi";

function grantLabel(p) {
  const parts = [];
  if (p.grant?.coins) parts.push(`🪙 ${p.grant.coins.toLocaleString("en-US")}`);
  if (p.grant?.diamonds) parts.push(`💎 ${p.grant.diamonds.toLocaleString("en-US")}`);
  if (p.grantItem) parts.push("🎁 عنصر حصري");
  return parts.join(" + ");
}

// الحزم الحصرية 🎁 — تعكس client/src/lobby/PackagesModal.jsx
export default function PackagesModal({ visible, onClose, wallet, onWalletUpdate }) {
  const [list, setList] = useState(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => packages.list().then((d) => setList(d.packages)).catch((e) => setErr(e.message || ""));
  useEffect(() => { if (visible) { setList(null); setErr(""); setMsg(""); load(); } }, [visible]);

  const diamonds = wallet?.infinite ? "∞" : (wallet?.diamonds ?? 0).toLocaleString("en-US");

  async function buy(p) {
    setBusy(p.id); setErr(""); setMsg("");
    try {
      const r = await packages.buy(p.id);
      onWalletUpdate?.(r.wallet);
      setMsg(`🎉 اشتريت ${p.name}`);
    } catch (e) { setErr(e.message || "تعذّر الشراء"); }
    finally { setBusy(""); }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="🎁 الحزم الحصرية" right={`💎 ${diamonds}`}>
      <ScrollView contentContainerStyle={{ padding: 14, gap: 10 }}>
        {err ? <Text style={styles.err}>{err}</Text> : null}
        {msg ? <Text style={styles.ok}>{msg}</Text> : null}
        {!list && !err ? <ActivityIndicator color="#3fd3ac" style={{ marginTop: 20 }} /> : null}
        {list?.map((p) => (
          <View key={p.id} style={styles.card}>
            <Text style={styles.emoji}>{p.emoji}</Text>
            <View style={styles.mid}>
              <Text style={styles.name}>{p.name}</Text>
              <Text style={styles.grant}>{grantLabel(p)}</Text>
            </View>
            <Pressable style={styles.btnOk} disabled={busy === p.id} onPress={() => buy(p)}>
              <Text style={styles.btnOkTxt}>{busy === p.id ? "…" : `💎 ${p.priceDiamonds?.toLocaleString("en-US")}`}</Text>
            </Pressable>
          </View>
        ))}
        <Text style={styles.hint}>باقات لفترة محدودة — ادفع بالألماس واحصل على كوينز وعناصر حصرية بقيمة أكبر.</Text>
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  err: { color: "#ff8a3d", textAlign: "center", backgroundColor: "rgba(255,138,61,0.12)", borderRadius: 10, padding: 8 },
  ok: { color: "#3ad6c4", textAlign: "center", backgroundColor: "rgba(58,214,196,0.12)", borderRadius: 10, padding: 8 },
  card: { flexDirection: "row-reverse", alignItems: "center", gap: 12, backgroundColor: "rgba(30,90,86,0.35)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 14, padding: 12 },
  emoji: { fontSize: 34 },
  mid: { flex: 1, gap: 3 },
  name: { color: "#eaf6f3", fontWeight: "700", fontSize: 14, textAlign: "right" },
  grant: { color: "#ffce5a", fontSize: 12, textAlign: "right" },
  btnOk: { backgroundColor: "#3fd3ac", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  btnOkTxt: { color: "#04211b", fontWeight: "800", fontSize: 12 },
  hint: { color: "#9dc0b8", fontSize: 11, textAlign: "right", lineHeight: 18 },
});
