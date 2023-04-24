import { defineConfig } from "vitest/config";

// https://vitest.dev/config/
export default defineConfig({
  test: {
    globalSetup: ["./tests/globalSetup.ts"],
    setupFiles: ["./tests/setup.ts"],
  },
});
