# tests/vendor

テストで使う、外部の JSON Schema の写し。テストはネットワークを使わず、ここにある写しを読む。

## ob_v3p0_achievementcredential_schema.json

Open Badges 3.0 本体の JSON Schema（AchievementCredential）。`src/rule.ts` の `OB_CREDENTIAL_SCHEMA_URL` が指すもの。

- 取得元: https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json
- 取得日: 2026-11-26
- 取得時の HTTP ヘッダー: `Last-Modified: Thu, 23 Oct 2025 12:27:25 GMT`、`ETag: "1b896-641d28e3e0176"`
- SHA-256: `b7358e895f492e74055dc6bfc7ffc420d0e497f90c4579fb83d9519b86d393ea`
- 中身は取得したまま変えていない。

著作権は 1EdTech Consortium, Inc. にある（© 1EdTech® Consortium, Inc. All Rights Reserved.）。
このファイルには、リポジトリの MIT ライセンスは及ばない。
利用の条件は、1EdTech の仕様のライセンス（https://www.1edtech.org/standards/specification-license）と、
Open Badges 3.0 の仕様（https://www.imsglobal.org/spec/ob/v3p0/）の IPR and Distribution Notice に従う。
このファイルは npm のパッケージには入らない（`package.json` の `files` は `dist` だけ）。

更新するときは、取得元から取り直して置き換え、上の取得日、ヘッダー、SHA-256 を書き換える。
