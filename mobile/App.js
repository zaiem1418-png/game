import React, { useEffect, useState, useCallback } from "react";
import { View, ActivityIndicator, StyleSheet, I18nManager } from "react-native";
import { StatusBar } from "expo-status-bar";
import { theme } from "./src/theme";
import { getIdentity } from "./src/identity";
import IdentityScreen from "./src/screens/IdentityScreen";
import LobbyScreen from "./src/screens/LobbyScreen";
import RoomScreen from "./src/screens/RoomScreen";

// فرض اتجاه من اليمين لليسار (عربي).
try {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
} catch {}

export default function App() {
  const [identity, setIdentity] = useState(null);
  const [loading, setLoading] = useState(true);
  // التنقّل البسيط: identity → lobby → room
  const [screen, setScreen] = useState("lobby");
  const [activeRoom, setActiveRoom] = useState(null);

  useEffect(() => {
    getIdentity().then((id) => {
      setIdentity(id);
      setScreen(id.name ? "lobby" : "identity");
      setLoading(false);
    });
  }, []);

  const onSavedName = useCallback((name) => {
    setIdentity((p) => ({ ...p, name }));
    setScreen("lobby");
  }, []);

  const openRoom = useCallback((room) => {
    setActiveRoom(room);
    setScreen("room");
  }, []);

  const leaveRoom = useCallback(() => {
    setActiveRoom(null);
    setScreen("lobby");
  }, []);

  if (loading) {
    return (
      <View style={[styles.fill, styles.center]}>
        <StatusBar style="light" />
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <StatusBar style="light" />
      {screen === "identity" && (
        <IdentityScreen identity={identity} onSaved={onSavedName} />
      )}
      {screen === "lobby" && (
        <LobbyScreen
          identity={identity}
          onOpenRoom={openRoom}
          onEditProfile={() => setScreen("identity")}
        />
      )}
      {screen === "room" && activeRoom && (
        <RoomScreen identity={identity} room={activeRoom} onLeave={leaveRoom} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: theme.bg },
  center: { alignItems: "center", justifyContent: "center" },
});
