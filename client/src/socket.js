import { io } from "socket.io-client";
import { SERVER_URL } from "./serverUrl.js";

export const socket = io(SERVER_URL, {
  autoConnect: false,
  // websocket أولاً لمصافحة أسرع (تأخير أقل عند الدخول)، مع polling كاحتياطي
  // موثوق خلف بروكسي الاستضافات (Render/Railway) إن تعذّر الـwebsocket.
  transports: ["websocket", "polling"],
});
