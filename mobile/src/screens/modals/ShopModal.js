import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import Sheet from "../../components/Sheet";
import { shop } from "../../gameApi";

const TABS = [
  { id: "frame", label: "🖼️ الإطارات" },
  { id: "ring", label: "💍 الخواتم" },
  { id: "entrance", label: "🚪 الدخوليات" },
  { id: "bubble", label: "💬 الفقاعات" },
  { id: "mic", label: "🎤 المايك" },
  { id: "background", label: "🖼 الخلفيات" },
];

// متجر الإطارات والخواتم 🛍️ — تعكس client/src/lobby/ShopModal.jsx
export default function ShopModal({ visible, onClose, wallet, onWalletUpdate }) {
  const [tab, setTab] = useState("frame");
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => shop.list().then(setData).catch((e) => setErr(e.message || ""));
  useEffect(() => { if (visible) { setData(null); setErr(""); setMsg(""); load(); } }, [visible]);

  const diamonds = wallet?.infinite ? "∞" : (wallet?.diamonds ?? 0).toLocaleString("en-US");
  const coins = wallet?.infinite ? "∞" : (wallet?.coins ?? 0).toLocaleString("en-US");

  async function buy(item) {
    setBusy(item.id); setErr(""); setMsg("");
    try {
      const r = await shop.buy(item.id);
      onWalletUpdate?.(r.wallet);
      setMsg(`🎉 اشتريت ${item.name} وجُهِّز لك`);
      await load();
    } catch (e) { setErr(e.message || "تعذّر الشراء"); }
    finally { setBusy(""); }
  }
  async function equip(item, on) {
    setBusy(item.id); setErr("");
    try {
      if (on) await shop.unequip(item.kind);
      else await shop.equip(item.id);
      await load();
    } catch (e) { setErr(e.message || ""); }
    finally { setBusy(""); }
  }

  const list = (data?.items || []).filter((i) => i.kind === tab);

  return (
    <Sheet visible={visible} onClose={onClose} title="🛍️ المتجر" right={`💎${diamonds} 🪙${coins}`}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsWrap} contentContainerStyle={styles.tabs}>
        {TABS.map((t) => (
          <Pressable key={t.id} style={[styles.tab, tab === t.id && styles.tabOn]} onPress={() => setTab(t.id)}>
            <Text style={[styles.tabTxt, tab === t.id && styles.tabTxtOn]}>{t.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 14, gap: 10 }}>
        {err ? <Text style={styles.err}>{err}</Text> : null}
        {msg ? <Text style={styles.ok}>{msg}</Text> : null}
        {!data && !err ? <ActivityIndicator color="#3fd3ac" style={{ marginTop: 20 }} /> : null}

        <View style={styles.grid}>
          {list.map((it) => {
            const locked = it.vipOnly && !data?.vip;
            return (
              <View key={it.id} style={[styles.card, it.equipped && styles.cardEquipped]}>
                {it.vipOnly ? <Text style={styles.vipTag}>VIP</Text> : null}
                <View style={[styles.art, { borderColor: it.glow || "#fff" }]}>
                  <Text style={{ fontSize: 26 }}>{it.emoji || "◈"}</Text>
                </View>
                <Text style={styles.name} numberOfLines={1}>{it.name}</Text>
                {it.owned ? (
                  <Pressable style={[styles.btn, it.equipped ? styles.btnGhost : styles.btnOk]} disabled={busy === it.id} onPress={() => equip(it, it.equipped)}>
                    <Text style={[styles.btnTxt, it.equipped && { color: "#9dc0b8" }]}>{it.equipped ? "إلغاء" : "تجهيز"}</Text>
                  </Pressable>
                ) : locked ? (
                  <Text style={styles.locked}>🔒 حصري VIP</Text>
                ) : (
                  <Pressable style={[styles.btn, styles.btnOk]} disabled={busy === it.id} onPress={() => buy(it)}>
                    <Text style={styles.btnTxt}>{it.currency === "diamonds" ? "💎" : "🪙"} {it.price?.toLocaleString("en-US")}</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
        <Text style={styles.hint}>الإطار يحيط بصورتك، الخاتم بجانب اسمك، الدخولية عند دخولك الغرفة. المميّز بـ VIP يُفتح بالاشتراك.</Text>
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  tabsWrap: { maxHeight: 50, flexGrow: 0 },
  tabs: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tab: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  tabOn: { backgroundColor: "rgba(63,211,172,0.2)", borderColor: "#3fd3ac" },
  tabTxt: { color: "#9dc0b8", fontSize: 12, fontWeight: "700" },
  tabTxtOn: { color: "#5fe0bd" },
  err: { color: "#ff8a3d", textAlign: "center", backgroundColor: "rgba(255,138,61,0.12)", borderRadius: 10, padding: 8 },
  ok: { color: "#3ad6c4", textAlign: "center", backgroundColor: "rgba(58,214,196,0.12)", borderRadius: 10, padding: 8 },
  grid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 10, justifyContent: "flex-start" },
  card: { width: "31%", alignItems: "center", gap: 6, padding: 10, borderRadius: 14, backgroundColor: "rgba(30,90,86,0.35)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  cardEquipped: { borderColor: "#3fd3ac", backgroundColor: "rgba(63,211,172,0.12)" },
  vipTag: { position: "absolute", top: 4, right: 4, backgroundColor: "#ffce5a", color: "#3a2708", fontSize: 8, fontWeight: "800", borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1, overflow: "hidden" },
  art: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.25)" },
  name: { color: "#eaf6f3", fontSize: 11, fontWeight: "600", textAlign: "center" },
  btn: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, minWidth: 60, alignItems: "center" },
  btnOk: { backgroundColor: "#3fd3ac" },
  btnGhost: { backgroundColor: "rgba(255,255,255,0.08)" },
  btnTxt: { color: "#04211b", fontWeight: "800", fontSize: 11 },
  locked: { color: "#9dc0b8", fontSize: 10 },
  hint: { color: "#9dc0b8", fontSize: 11, textAlign: "right", lineHeight: 18, marginTop: 6 },
});
