// プロファイルごとの JSON Schema を dist/schemas/<id>.json に書き出す。
// ビルド後（dist/ ができた後）に実行する。
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { profiles, toJsonSchema } from "../src/index.ts";

const outDir = join(import.meta.dirname, "..", "dist", "schemas");
mkdirSync(outDir, { recursive: true });

for (const profile of profiles) {
  const file = join(outDir, `${profile.id}.json`);
  writeFileSync(file, `${JSON.stringify(toJsonSchema(profile), null, 2)}\n`);
  console.log(`wrote ${file}`);
}
