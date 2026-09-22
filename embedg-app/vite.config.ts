import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return defineConfig({
    plugins: [react()],
    base: env.VITE_DISCORD_ACTIVITY === "true" ? undefined : "/app",
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
};
