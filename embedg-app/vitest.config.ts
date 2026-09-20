import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { dedupe: ["react", "react-dom"] },
  // The app builds with the SWC plugin, but its refresh preamble does not
  // belong in tests, so JSX goes through esbuild here.
  esbuild: { jsx: "automatic" },
  test: {
    setupFiles: ["./src/test/setup.ts"],
    // Only the editor tests need a DOM; the store tests run faster without one.
    environmentMatchGlobs: [["src/**/*.dom.test.tsx", "jsdom"]],
  },
});
