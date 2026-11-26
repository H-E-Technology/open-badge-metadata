import { defineConfig } from "vitest/config";

// ビルドの出力（dist/ と site/）を確かめるテスト。pnpm build の後に pnpm test:build で動かす
export default defineConfig({
  test: {
    include: ["tests/build/*.test.ts"],
  },
});
