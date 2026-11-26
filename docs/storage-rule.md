# マイクロクレデンシャル記述子の格納ルール（案 0.1）

状態: 案。語彙、本文の言い回し、公開先の URL は仮のものである。このルールの型、検証、文章を作る関数、JSON-LD コンテキスト、JSON Schema は、このパッケージにある。コンテキストと JSON Schema は、試すための置き場所で配信している。決めていない点は [open-questions.md](open-questions.md) にまとめている。

## 1. 解きたい問題

国内の「マイクロクレデンシャルをデジタル発行するためのガイドライン 3.0」は、学修成果や学習量など 11 の記述子を `criteria.narrative` に 1 つの文章として入れる。

```text
学習量（総学習時間） (Learner effort):
90 時間（90 hours）
```

人は読めるが、受け取った側のウォレットや他のシステムは、「90」という数値や「オンライン」という区分を値として取り出せない。検索、比較、他システムへの取り込みに使えない。

このルールは、同じ 11 記述子を値として取り出せる形でも格納する方法を定める。

## 2. 方針

1. **項目は増やさない。** 記述子の一覧と必須・選択の区分は、マイクロクレデンシャルのフレームワーク 1.0 のままとする。
2. **ガイドライン 3.0 の書き方は守る。** `issuer.name` や `validFrom` などへの割り当ても、`criteria.narrative` の文章も、そのまま残す。このルールを知らないウォレットでも、これまでどおり表示できる。
3. **11 記述子を構造化して 1 か所に併記する。** 置き場所は 3 章、形は 4 章で定める。
4. **正は構造化データとする。** `criteria.narrative` は構造化データから作る（6 章）。両者が食い違うバッジは、このルールに沿っていない。
5. **OB 3.0 の拡張の決まりに従う。** 足す項目は JSON-LD コンテキストと JSON Schema で定義して公開する（5 章）。

対象は、講座そのものを説明する記述子である。学習者ごとに変わる値（取得した単位数、受講した期間）は対象にしない。それらは OB 3.0 本体の `credentialSubject.creditsEarned`、`activityStartDate`、`activityEndDate` に入れる。

## 3. 置き場所

`credentialSubject.achievement.microCredentialDescriptors` に、1 つのオブジェクトとして入れる。

- 取り出す側は、この 1 か所を見ればよい。
- OB 3.0 の `Achievement` は、仕様上、項目を足してよいクラスである。
- 足す項目名が 1 つで済む。OB 3.0 のコンテキストは項目名の再定義を禁じているので、足す名前が少ないほど、将来の版と名前がぶつかる心配が小さい。

## 4. 項目

「テキスト」は、言語タグ（BCP 47）をキーにしたオブジェクトである。例: `{ "ja": "統計学の基礎知識", "en": "Basic statistics knowledge" }`。キーは書かれたとおりに扱う（小文字に直さない）。

| 記述子 | 項目名 | 区分 | 形 |
| --- | --- | --- | --- |
| 学修成果 | `learningOutcomes` | 必須 | 1 件以上の配列。要素は `description`（テキスト、必須）と `alignment`（スキル標準などへの対応、任意。OB 3.0 の `Alignment` と同じ形） |
| 授業言語 | `languages` | 選択 | 言語タグの配列。例: `["ja"]` |
| 授業の方法 | `participation` | 必須 | `mode`（必須。`onsite`、`online`、`hybrid` のどれか）、`timing`（任意。`synchronous`、`asynchronous`、`mixed` のどれか）、`description`（テキスト、任意） |
| 学習量（総学習時間） | `learnerEffort` | 必須 | `totalHours`（必須。10 以上の数値）、`contactHours`（授業時間。任意の数値）、`description`（テキスト、任意） |
| 評価の方法 | `assessments` | 必須 | 1 件以上の配列。要素は `method`（必須。語彙は仮の 9 種）と `description`（テキスト、任意） |
| 質保証 | `qualityAssurance` | 必須 | `internal`（必須。内部質保証の基準の `name` と、任意の `url`）、`external`（任意の配列。第三者による評価・認証の `name` と、任意の `url`） |
| レベル | `levels` | 選択 | 配列。要素は `framework`（枠組みの名前）、`value`（その枠組みでの値）、`url`（定義のある場所、任意） |
| 証明書 | `certification` | 選択 | テキスト |
| 単位／その他の認定 | `recognitions` | 必須 | 1 件以上の配列。要素は `kind`（必須。`credit`、`continuingEducation`、`other`、`none` のどれか）、`scheme`（単位やポイントの制度名、任意）、`amount`（数値、任意）、`description`（テキスト、任意） |
| （受講）前提条件 | `prerequisites` | 選択 | 配列。要素は `description`（テキスト、必須）と `url`（任意） |
| 積み上げ可能性 | `stackableInto` | 選択 | 配列。要素は積み上げ先の `name`（テキスト、必須）と `url`（任意） |

補足:

- オブジェクトには `type` を持たせ、`MicroCredentialDescriptors` を含める。
- 表に無い項目名は使えない。項目名の打ち間違いを検証で見つけるためである。
- 選択の配列は、値が無ければ項目ごと省く。空の配列は使えない。
- `learnerEffort.totalHours` の下限 10 は、フレームワーク 1.0 の条件（1 つのマイクロクレデンシャルの学習量は 10 時間以上）による。上限（学位課程 1 年分）は時間数で決まっていないので、検証しない。
- `recognitions` はフレームワークで必須の記述子なので、単位もポイントも出ない講座は `kind: "none"` を 1 件だけ入れる。ほかの認定とは並べず、`scheme` と `amount` は書かない。
- 言語タグは大文字小文字を区別しない（BCP 47）。テキストに、大文字小文字を無視して同じになるキー（`ja` と `JA` など）を並べてはいけない。同じ言語のどちらを表示するかが決まらないためである。
- `languages` には、同じ言語を重ねて書かない。大文字小文字を無視して比べる（`["ja", "JA"]` も重複）。
- `learnerEffort.contactHours`（授業時間）は、`totalHours`（総学習時間）以下にする。
- 上の 3 つのうち、このルールの JSON Schema で確かめるのは、`languages` に書かれたとおりに同じ値が重なること（`uniqueItems`）だけである。大文字小文字を無視した比較と、2 つの項目の値の比較は JSON Schema で書けないので、`validateMetadata()` と `validateBadge()` だけが確かめる。
- フレームワークは、質保証の記述子に「本フレームワークに準拠していること」を書くよう求めている。これはガイドライン 3.0 どおり `achievement.alignment` にフレームワークの名前と URL を入れることで示し、ここには重ねて持たない。

### OB 3.0 本体の項目を使わない理由

OB 3.0 本体にも近い項目があるが、次の理由で、上の記述子の格納先にはしない。意味が合う場合に併記するのは構わない。

| 本体の項目 | 使わない理由 |
| --- | --- |
| `achievement.inLanguage` | 仕様上は「アチーブメントの言語」で、別言語版を示す `related` と組で使う。バッジの記述に使った言語を指すと読め、授業で使う言語とは限らない。値も 1 つしか持てない |
| `achievement.creditsAvailable` | 数値だけで、どの制度の単位か（大学設置基準、UCTS、ECTS など）を持てない |
| `achievement.alignment` | レベルを入れられるが、`targetUrl` が必須で、URL の無い枠組みを書けない。また、スキルへの対応やフレームワーク準拠の表明と同じ配列に混ざり、どれがレベルかを区別できない |
| `achievement.related` | 仕様上は別言語版や旧版を指すための項目で、積み上げ先を示すものではない |
| 1EdTech の Assessment 拡張 | 評価の種類が `Exam`、`Performance`、`Artifact` の 3 つしかなく、必須項目が多い。拡張自身が草案段階としている |

## 5. このルールに従っていることの示し方

OB 3.0 の仕様（付録 C.1）に従い、発行する側は次を入れる。

- `@context` に、このルールの JSON-LD コンテキストの URL を足す。
- `credentialSchema` に、このルールの JSON Schema の URL を足す。`type` は、OB 3.0 の仕様が定める `1EdTechJsonSchemaValidator2019` にする。
- `@context` に、OB 3.0 の拡張用コンテキスト `https://purl.imsglobal.org/spec/ob/v3p0/extensions.json` も足す。`1EdTechJsonSchemaValidator2019` という値はこのコンテキストで定義されていて、無いと署名の前処理（JSON-LD としての処理）で失敗する。

`@context` の並びは、VC 2.0、OB 3.0、OB 3.0 の拡張用、このルール、の順にする。

受け取る側は、`@context` にこのルールの URL があるかどうかで、構造化データを読めるバッジかを判断できる。版は URL に含める。

### 公開するファイル

| ファイル | 役割 |
| --- | --- |
| `context.json` | JSON-LD コンテキスト。足す項目名は `microCredentialDescriptors` の 1 つだけで、その中の項目名は、この項目の中だけで効く定義にしている |
| `schema.json` | バッジ全体に当てる JSON Schema（Draft 2019-09）。構造化データの形と、`achievementType` などを確かめる |
| `test-vectors.json` | 構造化データと、そこから作られる文章の組。TypeScript 以外で文章の生成を実装するときに、結果を突き合わせる |

ビルドすると `dist/rule/microcredential/v1/` にできる。公開先の URL と同じ並びにしている。

公開するときの決まり:

- コンテキストと JSON Schema は、CORS の制限なしで公開する（OB 3.0 の仕様の要件）。
- OB 3.0 の仕様では、検証する側が `credentialSchema` の URL から JSON Schema を取得し、バッジが合っているかを確かめる。URL が開けないと検証に失敗する。
- 公開した版のファイルは書き換えない。項目や語彙を変えるときは、版を上げて別の URL にする。

今の URL は、試すための置き場所（GitHub Pages の `draft/` の下）を指している。3 つのファイルは `https://h-e-technology.github.io/open-badge-metadata/draft/microcredential/v1/` の下で配信している。ここに置いたファイルは書き換えることがある。本番の URL は未決である。

## 6. `criteria.narrative` の作り方

構造化データから、ガイドライン 3.0 の記載例と同じ書式で作る。

- 記述子ごとに、見出しの行、本文の順に書く。記述子の間は空行で区切る。
- 見出しは `日本語名 (英語名):` とする。日本語名、英語名、並び順はガイドライン 3.0 の記載例に合わせる。
- 配列は、行頭にハイフンと空白を付けた箇条書きにする。
- 値の無い選択記述子は、見出しごと省く。

### 本文の言い回し（仮）

区分や数値を本文にするときの書き方は次のとおりで、仮のものである。同じ構造化データからは、いつも同じ文章ができる。8 章の一致の検証は、この書き方を前提にする。

| 対象 | 書き方 | 例 |
| --- | --- | --- |
| テキスト | 日本語、英語、ほかの言語（言語タグの順）に並べ、2 つ目以降を括弧に入れる | `統計学の基礎知識（Basic statistics knowledge）` |
| 学修成果 | 1 件ごとに箇条書きにする。スキル標準への対応があれば、Markdown のリンクで続ける | `- 統計手法を適用する [名前](URL)` |
| 授業言語 | 言語名を読点で並べる。日本語、英語、中国語、韓国語以外は、言語タグのまま書く | `日本語（Japanese）、英語（English）` |
| 授業の方法 | 区分を日本語と英語で書く。説明があれば次の行に書く | `オンライン、同期（Online, synchronous）` |
| 学習量 | 時間数を日本語と英語で書く。説明があれば次の行に書く | `90 時間、うち授業時間 30 時間（90 hours, including 30 contact hours）` |
| 評価の方法 | 1 件ごとに箇条書きにする。説明があればコロンで続ける | `- プロジェクト・成果物（Project）` |
| 質保証 | 内部、外部の順に箇条書きにする。URL があれば名前の後に書く | `- 内部質保証（Internal）: 質保証委員会による審査` |
| レベル | 「枠組み: 値」を箇条書きにする。URL があれば後に書く | `- 大学の課程: 学士` |
| 単位／その他の認定 | 種類、制度名と数値、説明の順に書く | `- 単位（Credit）: UCTS 2` |
| 前提条件、積み上げ可能性 | 1 件ごとに箇条書きにする。URL があれば後に書く | `- 統計学の基礎知識` |

区分の日本語名と英語名は、`src/narrative.ts` に表として持っている。

見出しと並び順:

1. 学修成果 (Learning Outcomes)
2. 授業言語 (Language)
3. 授業の方法 (Form of participation)
4. 学習量（総学習時間） (Learner effort)
5. 評価の方法 (Type of assessment)
6. 質保証 (Type of quality assurance)
7. レベル (Level)
8. 証明書 (Certification)
9. 単位/その他認定 (Credit/Other recognition)
10. (受講)前提条件 (Prerequisites needed to enroll)
11. 積み上げ可能性 (Stackability)

## 7. 記載例

ガイドライン 3.0 の記載例に、構造化データを足したもの。コンテキストと JSON Schema の URL は、試すための置き場所を指している。

```json
{
  "@context": [
    "https://www.w3.org/ns/credentials/v2",
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
    "https://purl.imsglobal.org/spec/ob/v3p0/extensions.json",
    "https://h-e-technology.github.io/open-badge-metadata/draft/microcredential/v1/context.json"
  ],
  "id": "http://example.com/credentials/3527",
  "type": ["VerifiableCredential", "OpenBadgeCredential"],
  "issuer": {
    "id": "https://example.com/issuers/876543",
    "type": ["Profile"],
    "name": "サンプル大学 / Sample University",
    "address": { "type": ["Address"], "addressCountry": "JP" }
  },
  "validFrom": "2025-04-01T00:00:00Z",
  "credentialSchema": [
    {
      "id": "https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json",
      "type": "1EdTechJsonSchemaValidator2019"
    },
    {
      "id": "https://h-e-technology.github.io/open-badge-metadata/draft/microcredential/v1/schema.json",
      "type": "1EdTechJsonSchemaValidator2019"
    }
  ],
  "credentialSubject": {
    "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
    "type": ["AchievementSubject"],
    "achievement": {
      "id": "https://example.com/achievements/data-science-2025",
      "type": ["Achievement"],
      "name": "データサイエンス入門 / Introduction to Data Science",
      "description": "データ分析の基礎を学ぶ講座",
      "achievementType": "MicroCredential",
      "alignment": [
        {
          "type": ["Alignment"],
          "targetName": "Micro-credential Framework v1.0",
          "targetUrl": "https://micro-credential-jwg.org/wp-content/uploads/2024/04/MC_frameworkver1.0.pdf"
        }
      ],
      "criteria": {
        "narrative": "学修成果 (Learning Outcomes):\n- データサイエンスの基本概念を理解する\n- 統計手法を実世界の問題に適用する\n\n授業言語 (Language):\n日本語（Japanese）\n\n授業の方法 (Form of participation):\nオンライン、同期（Online, synchronous）\n\n学習量（総学習時間） (Learner effort):\n90 時間、うち授業時間 30 時間（90 hours, including 30 contact hours）\n\n評価の方法 (Type of assessment):\n- プロジェクト・成果物（Project）\n- 相互評価（Peer assessment）\n\n質保証 (Type of quality assurance):\n- 内部質保証（Internal）: 質保証委員会による審査\n\nレベル (Level):\n- 大学の課程: 学士\n\n単位/その他認定 (Credit/Other recognition):\n- 単位（Credit）: UCTS 2\n- 継続教育ポイント（Continuing education）: PDU 15\n\n(受講)前提条件 (Prerequisites needed to enroll):\n- 統計学の基礎知識"
      },
      "microCredentialDescriptors": {
        "type": ["MicroCredentialDescriptors"],
        "learningOutcomes": [
          { "description": { "ja": "データサイエンスの基本概念を理解する" } },
          { "description": { "ja": "統計手法を実世界の問題に適用する" } }
        ],
        "languages": ["ja"],
        "participation": { "mode": "online", "timing": "synchronous" },
        "learnerEffort": { "totalHours": 90, "contactHours": 30 },
        "assessments": [
          { "method": "project" },
          { "method": "peer-assessment" }
        ],
        "qualityAssurance": {
          "internal": { "name": { "ja": "質保証委員会による審査" } }
        },
        "levels": [{ "framework": "大学の課程", "value": "学士" }],
        "recognitions": [
          { "kind": "credit", "scheme": "UCTS", "amount": 2 },
          { "kind": "continuingEducation", "scheme": "PDU", "amount": 15 }
        ],
        "prerequisites": [{ "description": { "ja": "統計学の基礎知識" } }]
      }
    }
  }
}
```

## 8. 検証で確かめること

- 必須の記述子がそろっていて、4 章の形に合っている。
- `criteria.narrative` が、構造化データから 6 章の書式で作った文章と一致する。
- `achievementType` が `MicroCredential` で、`alignment` にフレームワークが入っている（ガイドライン 3.0 の求め）。
- ガイドライン 3.0 が必須とする OB 3.0 本体の項目（発行機関の名前、発行日、学習者を識別する情報、名称、内容）が入っている。
- `@context` と `credentialSchema` が、5 章のとおりに入っている。

このパッケージの `validateBadge()` が、上の 5 つを確かめる。署名と、OB 3.0 本体の項目の細かい形は確かめない。

確かめてあること:

- このルールのコンテキストは、VC 2.0 と OB 3.0 のコンテキストと合わせて、JSON-LD の処理系で展開と正規化（署名の前処理）ができる。定義の無い項目名は、処理系が失敗として扱う。
- 7 章の記載例は、OB 3.0 本体の JSON Schema と、このルールの JSON Schema の両方を通る。記載例は `examples/microcredential-badge.json` にある。

## 参考

- [先行事例の調査](prior-art.md)
- [Guidelines for Issuing Micro-credentials Digitally 3.0](https://micro-credential-jwg.org/wp-content/uploads/2025/05/Guideline-for-issuing-micro-credentials-digitally-3.0-20250527.pdf)
- [マイクロクレデンシャルのフレームワーク 1.0](https://micro-credentials.jp/wp-content/uploads/2024/04/MC_frameworkver1.0.pdf)
- [Open Badges Specification 3.0](https://www.imsglobal.org/spec/ob/v3p0/)（付録 C: 拡張とプロファイル）
