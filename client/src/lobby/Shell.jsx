import { useState } from "react";
import GameLobby from "./GameLobby.jsx";
import VoiceRooms from "./VoiceRooms.jsx";
import Messages from "./Messages.jsx";
import Profile from "./Profile.jsx";
import BottomNav from "./BottomNav.jsx";
import "./screens.css";

// الغلاف الرئيسي: يبدّل بين الشاشات الأربع ويعرض شريط التنقّل المشترك
export default function Shell({ user, wallet, onRecharge, onOwnerTap, onEnterRoom, onPlay, onWalletUpdate }) {
  const [tab, setTab] = useState("home");

  return (
    <div className="shell">
      <div className="shell-screen">
        {tab === "home" && (
          <GameLobby
            wallet={wallet}
            user={user}
            onRecharge={onRecharge}
            onOwnerTap={onOwnerTap}
            onOpenRooms={() => setTab("rooms")}
            onPlay={onPlay}
            onWalletUpdate={onWalletUpdate}
          />
        )}
        {tab === "rooms" && <VoiceRooms onEnterRoom={onEnterRoom} />}
        {tab === "messages" && <Messages onRecharge={onRecharge} />}
        {tab === "me" && (
          <Profile user={user} wallet={wallet} onRecharge={onRecharge} onOwnerTap={onOwnerTap} onWalletUpdate={onWalletUpdate} />
        )}
      </div>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
