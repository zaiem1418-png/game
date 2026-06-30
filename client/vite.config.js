import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    // متصفّحات حديثة → حزمة أصغر وأسرع
    target: "es2020",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // افصل المكتبات الكبيرة في حزم منفصلة قابلة للتخزين المؤقت (caching)
        // حتى لا يُعاد تنزيلها مع كل تحديث للكود، وتُحمَّل بالتوازي.
        manualChunks: {
          react: ["react", "react-dom"],
          motion: ["framer-motion"],
          socket: ["socket.io-client"],
          livekit: ["livekit-client"],
        },
      },
    },
  },
});
