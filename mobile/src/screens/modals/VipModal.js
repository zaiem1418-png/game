import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import Sheet from "../../components/Sheet";
import { vip } from "../../gameApi";

function fmtLeft(ms) {
  const s = Math.floor(Math.max(0, ms) / 1000);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}ي ${h}س`;
  if (h > 0) return `${h}س ${m}د`;
  return `${m}د ${s % 60}ث`;
}

// مركز VIP 💎 — تعكس client/src/lobby/VipModal.jsx (الاشتراك + المسابقة)
export default function VipModal({ visible, onClose, wallet, onWalletUpdate }) {
  const [tab, setTab] = useState("plans");
  const [status, setStatus] = useState(null);
  const [comp, setComp] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [now, setNow] = useState(Date.now());
  const playEndsRef = useRef(0);

  const diamonds = wallet?.infinite ? "∞" : (wallet?.diamonds ?? 0).toLocaleString("en-US");

  const loadStatus = () => vip.status().then(setStatus).catch((e) => setErr(e.message || ""));
  const loadComp = () => vip.competition().then(setComp).catch(() => {});
  useEffect(() => { if (visible) { setErr(""); setMsg(""); loadStatus(); loadComp(); } }, [visible]);
  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [visible]);
  useEffect(() => { if (comp?.me) playEndsRef.current = Date.now() + (comp.me.cooldownLeft || 0); }, [comp]);

  const cooldownLeft = Math.max(0, playEndsRef.current - now);
  const seasonLeft = Math.max(0, (comp?.endsAt || 0) - now);
  const isVip = !!status?.vip;
  const canPlay = isVip && !busy && cooldownLeft <= 0;

  async function subscribe(plan) {
    setBusy(true); setErr(""); setMsg("");
    try {
      const r = await vip.subscribe(plan.id);
      onWalletUpdate?.(r.wallet);
      setMsg(`🎉 صرت عضو ${plan.name}!`);
      await loadStatus(); await loadComp();
    } catch (e) { setErr(e.message || "تعذّر الاشتراك"); }
    finally { setBusy(false); }
  }
  async function play() {
    setBusy(true); setErr("");
    try { const r = await vip.play(); setComp(r.overview); }
    catch (e) { setErr(e.message || "تعذّرت الجولة"); }
    finally { setBusy(false); }
  }
  async function claim() {
    setBusy(true); setErr(""); setMsg("");
    try {
      const r = await vip.claim();
      onWalletUpdate?.(r.wallet);
      setComp(r.overview);
      setMsg(`🏅 استلمت جائزة #${r.rank}: ${r.diamonds?.toLocaleString("en-US")} 💎`);
    } catch (e) { setErr(e.message || "تعذّر الاستلام"); }
    finally { setBusy(false); }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="💎 مركز VIP" right={`💎 ${diamonds}`}>
      <View style={[styles.statusBar, isVip && styles.statusOn]}>
        {isVip ? (
          <>
            <Text style={styles.statusBadge}>VIP {status.tier}</Text>
            <Text style={styles.statusSub}>عضويتك فعّالة — متبقّي {status.daysLeft} يوم</Text>
          </>
        ) : (
          <Text style={styles.statusSub}>لست مشتركاً بعد — اشترك لتفتح المزايا والجوائز ✨</Text>
        )}
      </View>

      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === "plans" && styles.tabOn]} onPress={() => setTab("plans")}><Text style={[styles.tabTxt, tab === "plans" && styles.tabTxtOn]}>👑 الاشتراك</Text></Pressable>
        <Pressable style={[styles.tab, tab === "comp" && styles.tabOn]} onPress={() => setTab("comp")}><Text style={[styles.tabTxt, tab === "comp" && styles.tabTxtOn]}>🏆 مسابقة VIP</Text></Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }}>
        {err ? <Text style={styles.err}>{err}</Text> : null}
        {msg ? <Text style={styles.ok}>{msg}</Text> : null}

        {tab === "plans" ? (
          <>
            <Text style={styles.sec}>مزايا VIP</Text>
            <View style={styles.perks}>
              <Text style={styles.perk}>🏅 علامة VIP على ملفك</Text>
              <Text style={styles.perk}>🏆 مسابقة حصريّة للمشتركين</Text>
              <Text style={styles.perk}>💎 جوائز ألماس أسبوعيّة</Text>
              <Text style={styles.perk}>💍 إطارات وخواتم حصريّة</Text>
            </View>
            <Text style={styles.sec}>اختر خطّتك</Text>
            <View style={styles.plans}>
              {status?.plans?.map((p) => (
                <View key={p.id} style={[styles.plan, p.popular && styles.planPop]}>
                  {p.popular ? <Text style={styles.planTag}>الأفضل قيمة</Text> : null}
                  <Text style={[styles.planName, { color: p.color || "#eaf6f3" }]}>{p.name}</Text>
                  <Text style={styles.planDays}>{p.days} يوم</Text>
                  <Pressable style={styles.btnOk} disabled={busy} onPress={() => subscribe(p)}>
                    <Text style={styles.btnOkTxt}>💎 {p.price?.toLocaleString("en-US")}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            {!isVip ? <Text style={styles.ok}>مسابقة VIP حصريّة للمشتركين — اشترك أولاً.</Text> : null}
            {comp ? (
              <>
                <Text style={styles.hint}>العب جولات لتجمع نقاطاً — تتجدّد كل أسبوع ⏳ {fmtLeft(seasonLeft)}</Text>
                <View style={styles.compMe}>
                  <View>
                    <Text style={styles.compRank}>{comp.me.rank ? `#${comp.me.rank}` : "—"}</Text>
                    <Text style={styles.compSub}>{comp.me.points} نقطة · {comp.me.plays} جولة</Text>
                  </View>
                  <Pressable style={[styles.btnOk, !canPlay && styles.btnDim]} disabled={!canPlay} onPress={play}>
                    <Text style={styles.btnOkTxt}>{busy ? "…" : cooldownLeft > 0 ? `⏳ ${fmtLeft(cooldownLeft)}` : "🎯 جولة"}</Text>
                  </Pressable>
                </View>
                {isVip ? (
                  <Pressable style={[styles.btnWarn, (busy || comp.me.claimed || comp.me.plays === 0) && styles.btnDim]} disabled={busy || comp.me.claimed || comp.me.plays === 0} onPress={claim}>
                    <Text style={styles.btnWarnTxt}>{comp.me.claimed ? "✓ استلمت جائزة هذا الأسبوع" : "🎁 استلم جائزة أسبوعك"}</Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  statusBar: { margin: 14, marginBottom: 0, padding: 12, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", alignItems: "center", gap: 4 },
  statusOn: { backgroundColor: "rgba(255,206,90,0.12)", borderColor: "rgba(255,206,90,0.4)" },
  statusBadge: { color: "#ffce5a", fontWeight: "800", fontSize: 15 },
  statusSub: { color: "#c9dad5", fontSize: 12, textAlign: "center" },
  tabs: { flexDirection: "row-reverse", gap: 8, paddingHorizontal: 14, paddingTop: 12 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  tabOn: { backgroundColor: "rgba(255,206,90,0.18)", borderColor: "#ffce5a" },
  tabTxt: { color: "#9dc0b8", fontSize: 13, fontWeight: "700" },
  tabTxtOn: { color: "#ffce5a" },
  err: { color: "#ff8a3d", textAlign: "center", backgroundColor: "rgba(255,138,61,0.12)", borderRadius: 10, padding: 8 },
  ok: { color: "#3ad6c4", textAlign: "center", backgroundColor: "rgba(58,214,196,0.12)", borderRadius: 10, padding: 8 },
  sec: { color: "#eaf6f3", fontSize: 15, fontWeight: "800", textAlign: "right" },
  perks: { gap: 6 },
  perk: { color: "#c9dad5", fontSize: 13, textAlign: "right", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 10 },
  plans: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 10 },
  plan: { width: "48%", alignItems: "center", gap: 5, padding: 14, borderRadius: 14, backgroundColor: "rgba(30,90,86,0.35)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  planPop: { borderColor: "#ffce5a" },
  planTag: { position: "absolute", top: -8, backgroundColor: "#ffce5a", color: "#3a2708", fontSize: 9, fontWeight: "800", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1, overflow: "hidden" },
  planName: { fontWeight: "800", fontSize: 15 },
  planDays: { color: "#9dc0b8", fontSize: 12 },
  btnOk: { backgroundColor: "#3fd3ac", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 9, marginTop: 4 },
  btnOkTxt: { color: "#04211b", fontWeight: "800", fontSize: 13 },
  btnDim: { opacity: 0.5 },
  hint: { color: "#9dc0b8", fontSize: 12, textAlign: "right" },
  compMe: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 14 },
  compRank: { color: "#ffce5a", fontSize: 22, fontWeight: "800", textAlign: "right" },
  compSub: { color: "#9dc0b8", fontSize: 12, textAlign: "right" },
  btnWarn: { backgroundColor: "#f0a93a", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  btnWarnTxt: { color: "#3a2708", fontWeight: "800", fontSize: 14 },
});
