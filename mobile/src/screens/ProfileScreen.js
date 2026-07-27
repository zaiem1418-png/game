import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import TasksModal from "./modals/TasksModal";
import ShopModal from "./modals/ShopModal";
import VipModal from "./modals/VipModal";
import RankingModal from "./modals/RankingModal";
import GloryModal from "./modals/GloryModal";
import PackagesModal from "./modals/PackagesModal";
import AchievementsModal from "./modals/AchievementsModal";
import FriendsModal from "./modals/FriendsModal";
import CourtModal from "./modals/CourtModal";
import MomentsModal from "./modals/MomentsModal";

// شاشة «أنا» — تربط نوافذ المتجر/VIP/المهام (منقولة من الويب).
export default function ProfileScreen({ identity, wallet, onEditProfile, onWalletUpdate }) {
  const name = identity?.name || "زائر";
  const initial = name.trim().slice(0, 1).toUpperCase();
  const [modal, setModal] = useState(null); // "tasks" | "shop" | "vip"

  const fmt = (n) => (n == null ? null : n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "K" : String(n));
  const stats = [
    { label: "الترتيب", value: "16", emoji: "🏆" },
    { label: "الألماس", value: wallet?.infinite ? "∞" : fmt(wallet?.diamonds) ?? "515", emoji: "💎" },
    { label: "الكوينز", value: wallet?.infinite ? "∞" : fmt(wallet?.coins) ?? "10K", emoji: "🪙" },
  ];

  const items = [
    { icon: "🛍", label: "المتجر", key: "shop" },
    { icon: "👑", label: "VIP", key: "vip" },
    { icon: "🎯", label: "المهام", key: "tasks" },
    { icon: "🏆", label: "الترتيب", key: "ranking" },
    { icon: "🏅", label: "بطاقة المجد", key: "glory" },
    { icon: "🎁", label: "الحزم", key: "packages" },
    { icon: "🏅", label: "الإنجازات", key: "achievements" },
    { icon: "👥", label: "الأصدقاء", key: "friends" },
    { icon: "🏛️", label: "المحكمة", key: "court" },
    { icon: "✨", label: "اللحظات", key: "moments" },
    { icon: "⚙️", label: "الإعدادات", key: null },
  ];

  return (
    <ScrollView style={styles.fill} contentContainerStyle={{ paddingBottom: 30 }}>
      <LinearGradient colors={["#123840", "#0c242a"]} style={styles.header}>
        <LinearGradient colors={["#3fd3ac", "#1f9a7c"]} style={styles.av}>
          <Text style={styles.avTxt}>{initial}</Text>
        </LinearGradient>
        <Text style={styles.name}>{name}</Text>
        <Pressable style={styles.editBtn} onPress={onEditProfile}>
          <Text style={styles.editTxt}>تعديل الملف</Text>
        </Pressable>
      </LinearGradient>

      <View style={styles.stats}>
        {stats.map((s) => (
          <View key={s.label} style={styles.stat}>
            <Text style={{ fontSize: 20 }}>{s.emoji}</Text>
            <Text style={styles.statVal}>{s.value}</Text>
            <Text style={styles.statLbl}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {items.map((it) => (
          <Pressable key={it.label} style={styles.gridItem} onPress={() => it.key && setModal(it.key)}>
            <Text style={{ fontSize: 24 }}>{it.icon}</Text>
            <Text style={styles.gridLbl}>{it.label}</Text>
          </Pressable>
        ))}
      </View>

      <TasksModal visible={modal === "tasks"} onClose={() => setModal(null)} onWallet={onWalletUpdate} />
      <ShopModal visible={modal === "shop"} onClose={() => setModal(null)} wallet={wallet} onWalletUpdate={onWalletUpdate} />
      <VipModal visible={modal === "vip"} onClose={() => setModal(null)} wallet={wallet} onWalletUpdate={onWalletUpdate} />
      <RankingModal visible={modal === "ranking"} onClose={() => setModal(null)} identity={identity} />
      <GloryModal visible={modal === "glory"} onClose={() => setModal(null)} onWallet={onWalletUpdate} />
      <PackagesModal visible={modal === "packages"} onClose={() => setModal(null)} wallet={wallet} onWalletUpdate={onWalletUpdate} />
      <AchievementsModal visible={modal === "achievements"} onClose={() => setModal(null)} />
      <FriendsModal visible={modal === "friends"} onClose={() => setModal(null)} />
      <CourtModal visible={modal === "court"} onClose={() => setModal(null)} />
      <MomentsModal visible={modal === "moments"} onClose={() => setModal(null)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#0c242a" },
  header: { alignItems: "center", paddingTop: 64, paddingBottom: 24, gap: 10 },
  av: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center" },
  avTxt: { color: "#04211b", fontWeight: "800", fontSize: 34 },
  name: { color: "#eaf6f3", fontWeight: "800", fontSize: 20 },
  editBtn: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 18, paddingHorizontal: 18, paddingVertical: 7 },
  editTxt: { color: "#5fe0bd", fontWeight: "700", fontSize: 13 },
  stats: { flexDirection: "row-reverse", gap: 10, paddingHorizontal: 14, marginTop: -12 },
  stat: {
    flex: 1, alignItems: "center", gap: 3, paddingVertical: 14,
    backgroundColor: "rgba(30,90,86,0.4)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 14,
  },
  statVal: { color: "#eaf6f3", fontWeight: "800", fontSize: 16 },
  statLbl: { color: "#9dc0b8", fontSize: 11 },
  grid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 10, padding: 14 },
  gridItem: {
    width: "31%", alignItems: "center", gap: 8, paddingVertical: 18,
    backgroundColor: "rgba(30,90,86,0.35)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 14,
  },
  gridLbl: { color: "#eaf6f3", fontWeight: "600", fontSize: 12 },
});
