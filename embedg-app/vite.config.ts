import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return defineConfig({
    plugins: [react()],
    base: env.VITE_DISCORD_ACTIVITY === "true" ? undefined : "/app",
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
