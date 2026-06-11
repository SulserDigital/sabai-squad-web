import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { VitePWA } from "vite-plugin-pwa";

const pwaPlugin = VitePWA({
  registerType: "autoUpdate",
  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "supabase-cache",
          networkTimeoutSeconds: 10,
          expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
        },
      },
    ],
  },
  manifest: {
    name: "SabaiSquad",
    short_name: "SabaiSquad",
    description: "Dein Reisebegleiter für Gruppenreisen",
    theme_color: "#1a1a2e",
    background_color: "#1a1a2e",
    display: "standalone",
    orientation: "portrait",
    icons: [
      { src: "/favicon.ico", sizes: "64x64", type: "image/x-icon" },
    ],
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), pwaPlugin],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port: 5173,
    host: true,
  },
});
