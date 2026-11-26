# open-badge-metadata

Open Badges 3.0 のバッジに入れるマイクロクレデンシャルの記述子を、**値として取り出せる形で格納するための型・検証・文章生成**をまとめたパッケージです。

国内の「マイクロクレデンシャルをデジタル発行するためのガイドライン 3.0」では、学修成果や学習量など 11 の記述子が `criteria.narrative` に 1 つの文章として入ります。人は読めますが、受け取った側のウォレットは学習時間やレベルを値として取り出せません。

このパッケージは、ガイドライン 3.0 の書き方を残したまま、同じ記述子を構造化して併記する格納ルール（[docs/storage-rule.md](docs/storage-rule.md)）を実装します。

| 使い道 | 提供するもの |
| --- | --- |
| TypeScript から使う | 型（`MicroCredentialDescriptors`） |
| 構造化データを確かめる | `validateMetadata()` |
| ガイドライン 3.0 どおりの文章を作る | `toCriteriaNarrative()` |
| バッジ全体を確かめる | `validateBadge()` |
| バッジの `@context` に入れる | JSON-LD コンテキスト（`dist/rule/microcredential/v1/context.json`） |
| バッジの `credentialSchema` に入れる | JSON Schema（`dist/rule/microcredential/v1/schema.json`） |
| TypeScript 以外（Flutter など）で実装する | 上の JSON Schema と、照合用のデータ（`test-vectors.json`） |

語彙と本文の言い回しは仮のものです。コンテキストと JSON Schema は、試すための置き場所（`https://h-e-technology.github.io/open-badge-metadata/draft/microcredential/v1/`）で配信しています。ここのファイルは書き換えることがあり、本番の URL は未決です。

## 使い方

パッケージの公開先は未決で、まだ公開していません。

```bash
pnpm add @h-e-technology/open-badge-metadata
```

```ts
import {
  microCredentialProfile,
  toCriteriaNarrative,
  validateMetadata,
} from "@h-e-technology/open-badge-metadata";

const result = validateMetadata(microCredentialProfile, input);
if (!result.success) {
  console.error(result.issues);
} else {
  // バッジの credentialSubject.achievement に、構造化データと文章の両方を入れる
  const achievement = {
    microCredentialDescriptors: result.data,
    criteria: { narrative: toCriteriaNarrative(result.data) },
  };
}
```

組み立てたバッジや受け取ったバッジは、`validateBadge()` で全体を確かめられます。文章と構造化データが食い違っていれば落とします。バッジ全体の例は [examples/microcredential-badge.json](examples/microcredential-badge.json) にあります。

```ts
import { validateBadge } from "@h-e-technology/open-badge-metadata";

const checked = validateBadge(badge);
if (!checked.success) console.error(checked.issues);
```

JSON Schema はパッケージ内のファイルとして読めます。

```ts
import schema from "@h-e-technology/open-badge-metadata/schemas/microcredential.json" with { type: "json" };
```

同じファイルは、`$id` の URL（`<公開先>/schemas/<id>/<版>.json`）でも配信しています。置き場所の決め方は [docs/storage-rule.md](docs/storage-rule.md) の 5 章にあります。

## プロファイル

| id | 内容 | 状態 |
| --- | --- | --- |
| `microcredential` | 国内フレームワーク 1.0 の記述子のうち、文章で入る 11 個の構造化データ | 語彙は仮 |
| `eu-microcredential` | EU 理事会勧告（2022）の必須 11 項目 | 格納ルールの形になっていない。扱いは未決 |
| `completion-certificate` | 修了証明書 | 項目は未確定。扱いは未決 |

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

## 文書

- [docs/prior-art.md](docs/prior-art.md): 先行事例の調査
- [docs/storage-rule.md](docs/storage-rule.md): マイクロクレデンシャル記述子の格納ルール（案）
- [docs/open-questions.md](docs/open-questions.md): まだ決めていないこと
- [docs/slides/storage-rule.md](docs/slides/storage-rule.md): 説明用のスライド（Marp）
