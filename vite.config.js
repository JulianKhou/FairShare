import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

import prerender from "vite-plugin-prerender";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [
    react(),
    tailwindcss({ optimize: false }),
    prerender({
      // The path to the dist folder
      staticDir: path.join(__dirname, "dist"),
      // The routes to prerender
      routes: [
        "/",
        "/about-us",
        "/how-it-works",
        "/impressum",
        "/datenschutz",
        "/agb",
      ],
    }),
  ],
  server: {
    host: "127.0.0.1",
    allowedHosts: ["unshadily-bashful-aaden.ngrok-free.dev"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
