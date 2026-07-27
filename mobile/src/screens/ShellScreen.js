import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { NAV } from "../data/games";
import GameLobbyScreen from "./GameLobbyScreen";
import LobbyScreen from "./LobbyScreen";
import MessagesScreen from "./MessagesScreen";
import ProfileScreen from "./ProfileScreen";

// الغلاف الرئيسي — يبدّل بين الشاشات الأربع ويعرض شريط التنقّل المشترك.
// مطابق لـ client/src/lobby/Shell.jsx (الرئيسية/غرف صوتية/الرسائل/أنا).
export default function ShellScreen({ identity, wallet, onOpenRoom, onEditProfile, onPlay, onWalletUpdate }) {
  const [tab, setTab] = useState("home");

  return (
    <View style={styles.fill}>
      <View style={styles.screen}>
        {tab === "home" && (
          <GameLobbyScreen
            identity={identity}
            wallet={wallet}
            onOpenRooms={() => setTab("rooms")}
            onTournaments={() => setTab("rooms")}
            onPlay={onPlay}
          />
        )}
        {tab === "rooms" && (
          <LobbyScreen identity={identity} onOpenRoom={onOpenRoom} onEditProfile={onEditProfile} />
        )}
        {tab === "messages" && <MessagesScreen />}
        {tab === "me" && (
          <ProfileScreen identity={identity} wallet={wallet} onEditProfile={onEditProfile} onWalletUpdate={onWalletUpdate} />
        )}
      </View>

      {/* ===== شريط التنقّل السفلي ===== */}
      <View style={styles.nav}>
        {NAV.map((n) => {
          const active = n.id === tab;
          return (
            <Pressable key={n.id} style={styles.navBtn} onPress={() => setTab(n.id)}>
              {active ? (
                <LinearGradient colors={["#3fd3ac", "#1f9a7c"]} style={styles.navIco}>
                  <Text style={{ fontSize: 18 }}>{n.icon}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.navIco}><Text style={{ fontSize: 18 }}>{n.icon}</Text></View>
              )}
              <Text style={[styles.navLbl, { color: active ? "#5fe0bd" : "#6d8a84" }]}>{n.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#0c242a" },
  screen: { flex: 1 },
  nav: {
    height: 72, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-around",
    paddingHorizontal: 18, paddingBottom: 8,
    backgroundColor: "rgba(5,16,15,0.98)", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)",
  },
  navBtn: { alignItems: "center", gap: 3 },
  navIco: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  navLbl: { fontSize: 9, fontWeight: "600" },
});
