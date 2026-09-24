import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  base: "/app",
  build: {
    // The server caches everything under this directory long term and 404s
    // misses there, so it has to stay in sync with registerFrontendRoutes.
    assetsDir: "assets",
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",
      },
      "/e": {
        target: "http://127.0.0.1:8080",
      },
    },
  },
});
