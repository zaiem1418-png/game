// ===== سجلّ أيقونات 3D =====
// React Native يتطلّب مسارات require() ثابتة (لا يقبل مسارات نصّية ديناميكية
// مثل الويب "/games/icons/x.png")، لذا نجمع كل الأيقونات في خريطة ثابتة.
// المفاتيح تطابق حقول `icon` في mobile/src/data/games.js.
export const ICONS = {
  // أيقونات الألعاب
  jackaroo: require("../../assets/games/icons/jackaroo.png"),
  "ludo-dice": require("../../assets/games/icons/ludo-dice.png"),
  baloot: require("../../assets/games/icons/baloot.png"),
  snake: require("../../assets/games/icons/snake.png"),
  // أيقونات الأنماط والإجراءات
  play: require("../../assets/games/icons/play.png"),
  cards: require("../../assets/games/icons/cards.png"),
  vs: require("../../assets/games/icons/vs.png"),
  friends: require("../../assets/games/icons/friends.png"),
  vip: require("../../assets/games/icons/vip.png"),
  trophy: require("../../assets/games/icons/trophy.png"),
  "baloot-play": require("../../assets/games/icons/baloot-play.png"),
  board: require("../../assets/games/icons/board.png"),
  bolt: require("../../assets/games/icons/bolt.png"),
  // أيقونات شريط التنقّل السفلي
  home: require("../../assets/games/icons/home.png"),
  voice: require("../../assets/games/icons/voice.png"),
  messages: require("../../assets/games/icons/messages.png"),
  profile: require("../../assets/games/icons/profile.png"),
  // صور «هيرو» كاملة (رسمة المشهد — الاسم مدمج داخل الصورة)
  "baloot-hero": require("../../assets/games/baloot.png"),
  "jackaroo-hero": require("../../assets/games/jackaroo.png"),
  "ludo-hero": require("../../assets/games/ludo.png"),
  "snake-hero": require("../../assets/games/snake.png"),
};

// إرجاع مصدر الأيقونة أو undefined إن لم توجد (نرجع للإيموجي حينها)
export const icon = (key) => (key ? ICONS[key] : undefined);
