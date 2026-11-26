// GitHub Pages で配信するフォルダ（site/）を作る。pnpm build の後に実行する。
//
// dist/rule/ の中身と、プロファイルの JSON Schema を、RULE_BASE_URL と同じ並びになるように置く。
// 例: RULE_BASE_URL が https://<組織>.github.io/<リポジトリ>/draft なら、
//     site/draft/microcredential/v1/context.json と
//     site/draft/schemas/microcredential/<版>.json ができる
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  CONTEXT_URL,
  CREDENTIAL_SCHEMA_URL,
  RULE_BASE_URL,
  profileSchemaUrl,
  profiles,
} from "../src/index.ts";

const root = join(import.meta.dirname, "..");
const site = join(root, "site");

// Pages のルートは /<リポジトリ名>/ なので、パスの 1 つ目（リポジトリ名）を除いた残りが置き場所になる
const [, , ...prefix] = new URL(RULE_BASE_URL).pathname.split("/");
const target = join(site, ...prefix);

rmSync(site, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(join(root, "dist", "rule"), target, { recursive: true });

// プロファイルの JSON Schema は、$id（profileSchemaUrl()）の URL で開けるところに置く
const profileSchemaUrls = profiles.map((profile) => {
  const url = profileSchemaUrl(profile);
  const file = join(target, ...url.slice(RULE_BASE_URL.length + 1).split("/"));
  mkdirSync(dirname(file), { recursive: true });
  cpSync(join(root, "dist", "schemas", `${profile.id}.json`), file);
  return { title: profile.title, url };
});

const testVectorsUrl = CONTEXT_URL.replace(/context\.json$/, "test-vectors.json");
writeFileSync(
  join(site, "index.html"),
  `<!doctype html>
<html lang="ja">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>マイクロクレデンシャル記述子の格納ルール</title>
<h1>マイクロクレデンシャル記述子の格納ルール</h1>
<p>Open Badges 3.0 のバッジに、マイクロクレデンシャルの記述子を値として取り出せる形で入れるためのルールが公開するファイルです。</p>
<p><strong>試すための置き場所です。</strong>ここにある URL とファイルの内容は、変わることがあります。</p>
<ul>
<li><a href="${CONTEXT_URL}">JSON-LD コンテキスト</a>（バッジの <code>@context</code> に入れる）</li>
<li><a href="${CREDENTIAL_SCHEMA_URL}">JSON Schema</a>（バッジの <code>credentialSchema</code> に入れる）</li>
<li><a href="${testVectorsUrl}">照合用のデータ</a>（構造化データと、そこから作られる文章の組）</li>
</ul>
<p>プロファイルの JSON Schema（構造化データだけに当てる）:</p>
<ul>
${profileSchemaUrls.map(({ title, url }) => `<li><a href="${url}">${title}</a></li>`).join("\n")}
</ul>
<p>仕様とコードは <a href="https://github.com/H-E-Technology/open-badge-metadata">GitHub のリポジトリ</a>にあります。</p>
</html>
`,
);

console.log(`wrote ${site}`);
console.log(`  ${CONTEXT_URL}`);
console.log(`  ${CREDENTIAL_SCHEMA_URL}`);
console.log(`  ${testVectorsUrl}`);
for (const { url } of profileSchemaUrls) console.log(`  ${url}`);
