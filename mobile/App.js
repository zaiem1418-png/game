import React, { useEffect, useState, useCallback } from "react";
import { View, ActivityIndicator, StyleSheet, I18nManager } from "react-native";
import { StatusBar } from "expo-status-bar";
import { theme } from "./src/theme";
import { getIdentity } from "./src/identity";
import { fetchWallet } from "./src/api";
import { setUid, registerSocial } from "./src/gameApi";
import IdentityScreen from "./src/screens/IdentityScreen";
import ShellScreen from "./src/screens/ShellScreen";
import RoomScreen from "./src/screens/RoomScreen";
import GameRoomScreen from "./src/screens/GameRoomScreen";

// فرض اتجاه من اليمين لليسار (عربي).
try {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
} catch {}

export default function App() {
  const [identity, setIdentity] = useState(null);
  const [loading, setLoading] = useState(true);
  // التنقّل البسيط: identity → shell(home/rooms/messages/me) → room | game
  const [screen, setScreen] = useState("shell");
  const [activeRoom, setActiveRoom] = useState(null);
  const [activeGame, setActiveGame] = useState(null); // { gameId, mode }
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    getIdentity().then((id) => {
      setIdentity(id);
      setUid(id.uid); // يفعّل نداءات gameApi (المهام/VIP/المتجر)
      registerSocial({ name: id.name, avatar: id.avatar }); // يمنح shortId للأصدقاء
      setScreen(id.name ? "shell" : "identity");
      setLoading(false);
      fetchWallet(id.uid).then(setWallet).catch(() => {});
    });
  }, []);

  const onSavedName = useCallback((name) => {
    setIdentity((p) => ({ ...p, name }));
    setScreen("shell");
  }, []);

  const openRoom = useCallback((room) => {
    setActiveRoom(room);
    setScreen("room");
  }, []);

  const leaveRoom = useCallback(() => {
    setActiveRoom(null);
    setScreen("shell");
  }, []);

  const openGame = useCallback((game, modeId) => {
    setActiveGame({ gameId: game.id, mode: modeId || "default" });
    setScreen("game");
  }, []);

  const exitGame = useCallback(() => {
    setActiveGame(null);
    setScreen("shell");
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
      {screen === "shell" && (
        <ShellScreen
          identity={identity}
          wallet={wallet}
          onOpenRoom={openRoom}
          onEditProfile={() => setScreen("identity")}
          onPlay={openGame}
          onWalletUpdate={setWallet}
        />
      )}
      {screen === "game" && activeGame && (
        <GameRoomScreen
          gameId={activeGame.gameId}
          mode={activeGame.mode}
          user={{ name: identity?.name || "زائر", avatar: identity?.avatar || "🧑🏻", uid: identity?.uid }}
          onExit={exitGame}
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
