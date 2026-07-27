import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import FriendsModal from "./modals/FriendsModal";
import CourtModal from "./modals/CourtModal";
import TribeModal from "./modals/TribeModal";
import MomentsModal from "./modals/MomentsModal";

// شاشة الرسائل — مركز الأنظمة الاجتماعية (يعكس client/src/lobby/Messages.jsx)
const QUICK = [
  { id: "friends", label: "صديق اللعب", icon: "👥", tint: ["#1f8a6e", "#15101f"] },
  { id: "court", label: "المحكمة", icon: "🏛️", tint: ["#9a3a5a", "#15101f"] },
  { id: "tribe", label: "القبيلة", icon: "🏰", tint: ["#b5731f", "#15101f"] },
  { id: "moments", label: "اللحظات", icon: "✨", tint: ["#5a3a9a", "#15101f"] },
];

export default function MessagesScreen() {
  const [open, setOpen] = useState(null);

  return (
    <View style={styles.fill}>
      <Text style={styles.title}>رسالة</Text>

      <View style={styles.quick}>
        {QUICK.map((q) => (
          <Pressable key={q.id} style={styles.quickBtn} onPress={() => setOpen(q.id)}>
            <LinearGradient colors={q.tint} style={styles.quickIco}>
              <Text style={{ fontSize: 24 }}>{q.icon}</Text>
            </LinearGradient>
            <Text style={styles.quickLbl}>{q.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.empty}>
        <Text style={{ fontSize: 40, opacity: 0.4 }}>💬</Text>
        <Text style={styles.emptyTxt}>لا توجد رسائل</Text>
      </View>

      <FriendsModal visible={open === "friends"} onClose={() => setOpen(null)} />
      <CourtModal visible={open === "court"} onClose={() => setOpen(null)} />
      <TribeModal visible={open === "tribe"} onClose={() => setOpen(null)} />
      <MomentsModal visible={open === "moments"} onClose={() => setOpen(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#0c242a" },
  title: { color: "#eaf6f3", fontWeight: "800", fontSize: 20, textAlign: "right", paddingTop: 54, paddingHorizontal: 16, paddingBottom: 10 },
  quick: { flexDirection: "row-reverse", justifyContent: "space-around", paddingHorizontal: 12, paddingVertical: 10 },
  quickBtn: { alignItems: "center", gap: 6 },
  quickIco: { width: 60, height: 60, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  quickLbl: { color: "#c9dad5", fontSize: 11, fontWeight: "600" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyTxt: { color: "#6d8a84", fontSize: 14 },
});
