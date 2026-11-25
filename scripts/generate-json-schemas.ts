// ビルドの最後に、JSON のファイルを dist/ に書き出す。
//
// - dist/schemas/<id>.json: プロファイルごとの JSON Schema
// - dist/rule/microcredential/<版>/: 格納ルールが公開するファイル。
//   公開先の URL と同じ並びにしているので、このフォルダをそのまま配信できる
//     context.json       バッジの @context に入れる JSON-LD コンテキスト
//     schema.json        バッジの credentialSchema に入れる JSON Schema
//     test-vectors.json  構造化データと、そこから作られる文章の組（照合用）
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  RULE_VERSION,
  jsonLdContext,
  narrativeTestVectors,
  profiles,
  toCredentialJsonSchema,
  toJsonSchema,
} from "../src/index.ts";

const dist = join(import.meta.dirname, "..", "dist");

function writeJson(dir: string, name: string, value: unknown): void {
  mkdirSync(dir, { recursive: true });
  const file = join(dir, name);
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  console.log(`wrote ${file}`);
}

for (const profile of profiles) {
  writeJson(join(dist, "schemas"), `${profile.id}.json`, toJsonSchema(profile));
}

const ruleDir = join(dist, "rule", "microcredential", RULE_VERSION);
writeJson(ruleDir, "context.json", jsonLdContext);
writeJson(ruleDir, "schema.json", toCredentialJsonSchema());
writeJson(ruleDir, "test-vectors.json", narrativeTestVectors);
