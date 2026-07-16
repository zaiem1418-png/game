import { io } from "socket.io-client";
import { SERVER_URL } from "./config";

// اتصال Socket.IO واحد مشترك. في React Native نفضّل websocket فقط لتفادي
// مشاكل الـpolling، مع السماح بالاحتياط.
export const socket = io(SERVER_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
});
