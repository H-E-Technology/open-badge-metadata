import { defineConfig } from "vitest/config";

// pnpm test で動かすテスト。ビルドの出力を確かめるテスト（tests/build/）は
// vitest.build.config.ts で、pnpm build の後に動かす（pnpm test:build）
export default defineConfig({
  test: {
    include: ["tests/*.test.ts"],
  },
});
