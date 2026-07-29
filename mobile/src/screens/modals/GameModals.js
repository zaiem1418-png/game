import React from "react";
import TasksModal from "./TasksModal";
import ShopModal from "./ShopModal";
import VipModal from "./VipModal";
import RankingModal from "./RankingModal";
import GloryModal from "./GloryModal";
import PackagesModal from "./PackagesModal";
import AchievementsModal from "./AchievementsModal";
import FriendsModal from "./FriendsModal";
import CourtModal from "./CourtModal";
import MomentsModal from "./MomentsModal";
import TribeModal from "./TribeModal";

// مضيف موحّد لكل النوافذ — يُستعمل من شاشات الألعاب حتى تعمل كل الأزرار.
// المفتاح: "tasks" | "shop" | "vip" | "ranking" | "glory" | "packages" |
//          "achievements" | "friends" | "court" | "moments" | "tribe"
export default function GameModals({ modal, onClose, identity, wallet, onWalletUpdate }) {
  return (
    <>
      <TasksModal visible={modal === "tasks"} onClose={onClose} onWallet={onWalletUpdate} />
      <ShopModal visible={modal === "shop"} onClose={onClose} wallet={wallet} onWalletUpdate={onWalletUpdate} />
      <VipModal visible={modal === "vip"} onClose={onClose} wallet={wallet} onWalletUpdate={onWalletUpdate} />
      <RankingModal visible={modal === "ranking"} onClose={onClose} identity={identity} />
      <GloryModal visible={modal === "glory"} onClose={onClose} onWallet={onWalletUpdate} />
      <PackagesModal visible={modal === "packages"} onClose={onClose} wallet={wallet} onWalletUpdate={onWalletUpdate} />
      <AchievementsModal visible={modal === "achievements"} onClose={onClose} />
      <FriendsModal visible={modal === "friends"} onClose={onClose} />
      <CourtModal visible={modal === "court"} onClose={onClose} />
      <MomentsModal visible={modal === "moments"} onClose={onClose} />
      <TribeModal visible={modal === "tribe"} onClose={onClose} />
    </>
  );
}
