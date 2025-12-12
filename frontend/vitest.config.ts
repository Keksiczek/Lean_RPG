import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "json-summary", "lcov"],
    },
  },
  resolve: {
    alias: {
      "@/src": path.resolve(__dirname, "src"),
      "@/components": path.resolve(__dirname, "components"),
      "@/lib": path.resolve(__dirname, "lib"),
      "@/types": path.resolve(__dirname, "types"),
      "@/data": path.resolve(__dirname, "data"),
    },
  },
});
