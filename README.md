# open-badge-metadata

Open Badges 3.0 のバッジに入れるメタデータについて、**種類ごとの決まりごと（プロファイル）と、それに対応する型**を定義するパッケージです。

- マイクロクレデンシャル: EU 理事会勧告（2022）の必須 11 項目
- 修了証明書: 講座・プログラムの修了を示す項目（叩き台）

各プロファイルは [zod](https://zod.dev) のスキーマ 1 つで書き、そこから次の 3 つを作ります。

| 使い道 | 作られるもの |
| --- | --- |
| TypeScript から使う | 型（`MicrocredentialMetadata` など） |
| 発行前・受け取り時に確かめる | `validateMetadata()` |
| TypeScript 以外（Flutter など）から使う | JSON Schema（`dist/schemas/<id>.json`） |

## 使い方

```bash
pnpm add @h-e-technology/open-badge-metadata
```

```ts
import {
  microcredentialProfile,
  validateMetadata,
  type MicrocredentialMetadata,
} from "@h-e-technology/open-badge-metadata";

const result = validateMetadata(microcredentialProfile, input);
if (!result.success) console.error(result.issues);
```

JSON Schema はパッケージ内のファイルとして読めます。

```ts
import schema from "@h-e-technology/open-badge-metadata/schemas/microcredential.json" with { type: "json" };
```

## プロファイルを足すとき

1. `src/profiles/<id>.ts` に `defineProfile()` で書く（出典は `references` に入れる）
2. `src/index.ts` の export と `profiles` に足す
3. `tests/` に通る例と落ちる例を足す

項目を足す・意味を変えるときは、プロファイルの `version` を上げます。

## 開発

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build   # dist/ に JS・型・JSON Schema を出す
```

## 方針の見直しについて

先行事例を調べた結果、方針を見直しています。今のコードは見直し前のもので、これから書き直します。

- [docs/prior-art.md](docs/prior-art.md): 先行事例の調査
- [docs/storage-rule.md](docs/storage-rule.md): マイクロクレデンシャル記述子の格納ルール（案）
- [docs/open-questions.md](docs/open-questions.md): まだ決めていないこと
