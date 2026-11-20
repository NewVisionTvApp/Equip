import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import fs from "node:fs";

function multiDeviceSyncPlugin(): Plugin {
  const syncFile = path.resolve(__dirname, "./.sync_state.json");

  return {
    name: "equip-multi-device-sync",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/api/sync" && req.method === "GET") {
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");
          if (fs.existsSync(syncFile)) {
            try {
              const data = fs.readFileSync(syncFile, "utf-8");
              res.end(data);
              return;
            } catch {
              res.end(JSON.stringify({}));
              return;
            }
          }
          res.end(JSON.stringify({}));
          return;
        }

        if (req.url === "/api/sync" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", () => {
            try {
              if (body) {
                fs.writeFileSync(syncFile, body, "utf-8");
              }
              res.setHeader("Content-Type", "application/json");
              res.setHeader("Access-Control-Allow-Origin", "*");
              res.end(JSON.stringify({ ok: true, timestamp: Date.now() }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), multiDeviceSyncPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: true, // Allows ushers on phones/tablets on local Wi-Fi to access the desk
  },
});
