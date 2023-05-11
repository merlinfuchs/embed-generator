import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/app",
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",
      },
    },
    base: "/app/",
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        // nested: resolve(__dirname, "nested/index.html"),
      },
    },
  },
});
