import { io } from "socket.io-client";

// عنوان السيرفر — غيّره إن نشرته على استضافة
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

export const socket = io(SERVER_URL, {
  autoConnect: false,
  // polling ثم websocket — أكثر موثوقية خلف بروكسي الاستضافات (Render/Railway)
  transports: ["polling", "websocket"],
});
