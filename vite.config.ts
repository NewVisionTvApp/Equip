import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: { "/api": "http://127.0.0.1:8787" },
    host: true, // Allows ushers on phones/tablets on local Wi-Fi to access the desk
    watch: {
      ignored: ["**/.wrangler/**"],
    },
  },
});
