import { io } from "socket.io-client";
import { SERVER_URL } from "./serverUrl.js";

export const socket = io(SERVER_URL, {
  autoConnect: false,
  // polling ثم websocket — أكثر موثوقية خلف بروكسي الاستضافات (Render/Railway)
  transports: ["polling", "websocket"],
});
