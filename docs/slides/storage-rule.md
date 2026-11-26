---
marp: false
paginate: true
theme: default
---

<style>
/* Marp 標準の default テーマに、文字の大きさと表・2 段組みの指定だけを足している */
section { font-size:20pt; padding:44px 60px 56px; align-content:start; justify-content:start;
  font-family:'Hiragino Sans','Noto Sans JP','Yu Gothic','Meiryo',sans-serif; }
section::after { font-size:13pt; }
h1 { font-size:30pt; margin:0 0 .55em; padding-bottom:.25em; border-bottom:2px solid #d0d7de; }
h3 { font-size:19pt; margin:.2em 0 .35em; }
p, li { font-size:20pt; line-height:1.55; }
p { margin:.45em 0; }
ul, ol { margin:.3em 0; padding-left:1.3em; }
li { margin:.12em 0; }
section.lead { display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; }
section.lead h1 { font-size:40pt; line-height:1.4; margin:0 0 .6em; padding:0; border:none; }
section.lead p { font-size:22pt; line-height:1.7; margin:0; color:#57606a; }
pre { font-size:16pt; line-height:1.45; margin:20px 0; padding:16px 22px; border-radius:8px; }
pre code { font-size:100%; }
:not(pre) > code { font-size:.92em; }
table { display:table; width:100%; border-collapse:collapse; font-size:16pt; margin:18px 0 0; }
table th { font-size:14pt; text-align:left; padding:.4em .7em; background:#f0f2f5; border:1px solid #d0d7de; }
table td { padding:.42em .7em; line-height:1.45; vertical-align:top; background:#ffffff; border:1px solid #d0d7de; }
table td:first-child { font-weight:700; white-space:nowrap; }
.cols { display:grid; grid-template-columns:1fr 1fr; gap:0 56px; margin-top:8px; }
.cols.wide-left { grid-template-columns:1.25fr 1fr; }
.cols.wide-right { grid-template-columns:1fr 1.3fr; }
.cols li, .cols p { font-size:18pt; }
</style>

<!-- _class: lead -->
<!-- _paginate: false -->

# オープンバッジに入れるメタデータの<br>格納ルール整備について

先行事例の調査と、マイクロクレデンシャル記述子の格納ルール（案 0.1）
2026-11-25

---

# 要点

- 入れる項目のルールは、国内に既にある。「マイクロクレデンシャルのフレームワーク 1.0」と「デジタル発行するためのガイドライン 3.0」である
- ただしガイドライン 3.0 では、11 の記述子が `criteria.narrative` に 1 つの文章として入る。受け取った側は、学習時間やレベルを値として取り出せない
- 記述子を構造化して Open Badges 3.0 に入れるルールは、国内外とも見つからなかった
- 格納ルール案は、ガイドライン 3.0 の書き方を残したまま、同じ記述子を構造化して 1 か所に併記する
- 型、検証、文章を作る関数、コンテキスト、JSON Schema は、このパッケージにある。
  コンテキストと JSON Schema は、試すための置き場所で配信している
- 実物のバッジでの確認は、まだしていない。決まっていないのは、語彙、本番の URL、採用の働きかけである

---

# 目次

1. 背景と課題
2. 先行事例の調査
3. 国内ルールと OB 3.0 仕様の中身
4. 格納ルール案
5. 決めていないことと残っている作業

---

<!-- _class: lead -->
<!-- _paginate: false -->

# 1. 背景と課題

---

# この資料で使う用語

| 用語 | この資料での意味 |
| --- | --- |
| Open Badges 3.0（OB 3.0） | 1EdTech が定めるデジタル証明の技術仕様。W3C の Verifiable Credentials の形に沿う |
| マイクロクレデンシャル | 評価を伴う、対象を絞った学修成果の証明。講座そのものと、その学修歴の証明の両面を指す |
| 記述子 | マイクロクレデンシャルの内容と取得条件を示す共通の項目。国内フレームワーク 1.0 が定義する |
| メタデータ | バッジの中に入る説明データ。発行者、名称、取得条件など |
| ウォレット | 学習者が受け取ったバッジを保管し、表示・提示するサービス |

---

# 現状: 記述子は 1 つの文章として入る

ガイドライン 3.0 の記載例では、`criteria.narrative` に次の文章が入る（抜粋）

```text
学修成果 (Learning Outcomes):
- データサイエンスの基本概念を理解する（Understand basic data science concepts）
- 統計手法を実世界の問題に適用する（Apply statistical methods to real-world problems）

授業言語 (Language):
日本語 (Japanese)

学習量（総学習時間） (Learner effort):
90 時間（90 hours）

評価の方法 (Type of assessment):
プロジェクト提出およびピアレビュー（Project submission and peer review）
```

---

# 課題: 表示はできるが、値を取り出せない

| やりたいこと | 文章のままだと起きること |
| --- | --- |
| 学習時間やレベルで検索・絞り込み・並べ替えをする | 「90 時間（90 hours）」のような文から数値を読み取る処理が要る。書き方が発行者ごとに違うと読み取れない |
| 複数のバッジを項目ごとに比べる | 見出しを手がかりに文章を分解する必要がある。見出しの表記が揺れると失敗する |
| 他のシステムへ取り込む | 項目と値の対応が取れず、文章のかたまりとしてしか渡せない |

人が読むぶんには困らない。
問題は、受け取った側のウォレットや他のシステムが<strong>値として抽出できない</strong>ことにある。

---

<!-- _class: lead -->
<!-- _paginate: false -->

# 2. 先行事例の調査

---

# 調査の問いと結論

### 問い

OB 3.0 のバッジに入れるメタデータについて、項目や書き方のルールは既に整備されているか

### 結論

- 「何の項目を入れるか」のルールは既にある。国内には OB 3.0 向けのものが公開されている
- 「項目を値として取り出せる形で入れる」ルールは、国内外とも見つからなかった
- 項目を独自に決める必要は薄い。空いているのは、既存の項目を構造化して格納するルールと、それを検証できる実装である

調査日は 2026-11-25。出典は末尾と `docs/prior-art.md` にまとめている。

---

# 国内の事例

| 事例 | 内容 |
| --- | --- |
| マイクロクレデンシャルのフレームワーク 1.0<br>共同WG、2023-03-27 | 必須記述子 11、選択記述子 6 を定義する。日本マイクロクレデンシャル機構のサイトで公開されている |
| デジタル発行するためのガイドライン 3.0<br>共同WG、2025-05-27 改訂 | 上の記述子を OB 3.0 のどこに書くかの対応表と、JSON の記載例を示す |
| オープンバッジ・ネットワーク 大学WG<br>阪井、2025 | メタデータは「マイクロクレデンシャル共通記述子に合わせて構造的に書く」ことを勧めている |
| 文部科学省 令和 7 年度調査研究 事業報告書<br>2026-03-23 | 私立大学の自由記述に「メタデータの記述ルール等を国内標準として整備・普及してほしい」という要望がある。国が定めた標準は見当たらない |

共同WG: JV-Campus と JMOOC のマイクロクレデンシャル共同ワーキンググループ

---

# 海外の事例（EU）

| 事例 | 内容 | OB 3.0 との関係 |
| --- | --- | --- |
| EU 理事会勧告（2022） | マイクロクレデンシャルを記述する必須 11 要素と選択要素を定める | 形式は決めていない。データモデルは欧州委員会が別に作るとしている |
| European Learning Model（ELM） | 勧告の要素を構造化して持つデータモデル。Europass が要素ごとの対応表を公開している | OB ではなく、European Digital Credentials という別の形式で使う |
| EUNIS の実務ガイド（2026-06） | 大学向けに、オープンバッジと European Digital Credentials の使い分けを説明する | 「OB 3.0 と EDC の相互運用プロファイルはまだ確立していない」と書いている |

EU には構造化された形があるが、OB 3.0 に載せるためのルールにはなっていない。

---

# 海外の事例（1EdTech ほか）

| 事例 | 内容 | OB 3.0 との関係 |
| --- | --- | --- |
| TrustEd Credential Framework<br>1EdTech、2026-05-12 改訂の最終案 | 信頼できるバッジの必須・推奨項目を定める。スキル、評価、証拠、`achievementType` など | 既存の項目の使い方を決めるだけで、新しい項目は定義しない。認証の仕組みは未整備 |
| Open Badges 拡張レジストリ<br>1EdTech | OB 3.0 用に Assessment、Issuer Accreditation、ACE の 3 つの拡張が載っている | 前の 2 つは 2025 年の版でレビュー段階。Assessment 拡張は自ら草案としている |
| SURF edubadges<br>オランダ | ECTS、EQF などを拡張として足し、EU の標準要素との対応表を持つ | OB 2.1 が土台。OB 3.0 への移行状況は確認できていない |
| Credential Engine（CTDL） | `alignment` に登録簿の識別子を入れる方式 | `achievementType` の語彙は CTDL と対応している |

---

# 実装面の先行例と、確認できなかったこと

### 実装面の先行例

- OB 2.0 / 3.0 本体の TypeScript 型は、npm の `openbadges-types` にある
- マイクロクレデンシャルの記述子を型、検証関数、JSON Schema にしたパッケージは見つからなかった

### 確認できなかったこと

- SURF の wiki は直接読めなかった。edubadges の記述は検索結果の要約に基づく
- 修了証明書に絞った調査はしていない
- オーストラリアなど他国の枠組みは、OB との対応まで追っていない

---

<!-- _class: lead -->
<!-- _paginate: false -->

# 3. 国内ルールと OB 3.0 仕様の中身

---

# フレームワーク 1.0 の記述子

<div class="cols wide-left">
<div>

### 必須（11）

- 学習者を識別する情報
- 発行日
- マイクロクレデンシャル名称（英語の併記が必須）
- 発行機関（英語の併記が必須）
- 内容（ごく簡潔な説明。URI は使えない）
- 学修成果
- 授業の方法（対面・オンライン、同期・非同期）
- 学習量（総学習時間。10 時間以上）
- 評価の方法
- 質保証（内部質保証と、あれば外部の認証）
- 単位／その他の認定

</div>
<div>

### 選択（6）

- 発行国／地域
- 授業言語
- レベル
- 証明書
- （受講）前提条件
- 積み上げ可能性

### 対象外とされるもの

- 学修成果の評価を伴わない講座や、参加するだけで得られる証明
- 学士、修士などの学位

</div>
</div>

---

# EU 理事会勧告との違い

| 項目 | 国内フレームワーク 1.0 | EU 理事会勧告（2022） |
| --- | --- | --- |
| 発行国／地域 | 選択 | 必須 |
| レベル | 選択 | 必須（該当する場合） |
| 内容 | 必須 | なし |
| 単位／その他の認定 | 必須 | なし（学習量に ECTS を併記） |
| 授業言語、証明書 | 選択 | なし |
| 評価時の監督と本人確認、成績 | なし | 選択 |

学習者、名称、発行機関、発行日、学修成果、学習量、評価の方法、授業の方法、質保証は、どちらでも必須である。

このパッケージの `microcredential` プロファイルは、国内フレームワークの記述子に基づく。EU の 11 項目は `eu-microcredential` プロファイルが持つ。

---

<style scoped>
th:nth-child(1), td:nth-child(1) { width:21%; }
th:nth-child(2), td:nth-child(2) { width:41%; }
</style>

# ガイドライン 3.0 の割り当て（1）

OB 3.0 本体の項目に入る記述子は 6 つである

| 記述子 | OB 3.0 での書き場所 | 補足 |
| --- | --- | --- |
| 発行機関 | `issuer.name` | 仕様上は任意だが、実際の発行では必須とする |
| 発行国／地域 | `issuer.address.addressCountry` | |
| 発行日 | `validFrom` | VC 1.1 の場合は `issuanceDate` |
| 学習者を識別する情報 | `credentialSubject.identifier`<br>`credentialSubject.id` | 氏名、学生番号、DID など。仕様上は任意だが、実際の発行では必須とする |
| マイクロクレデンシャル名称 | `credentialSubject.achievement.name` | |
| 内容 | `credentialSubject.achievement.description` | ウォレットに表示する説明 |

---

# ガイドライン 3.0 の割り当て（2）

<div class="cols">
<div>

### 文章で入る記述子（11）

`achievement` の下の `criteria.narrative` に、見出し付きの 1 つの文章として入れる

- 学修成果、授業言語、授業の方法
- 学習量、評価の方法、質保証
- レベル、証明書、単位／その他の認定
- 前提条件、積み上げ可能性

詳細を URL で示す場合は `criteria.id` に書く

</div>
<div>

### OB 3.0 側で指定する項目

- `achievementType` に `MicroCredential` を入れる
- `alignment` に、フレームワークの名前と URL を入れる
- `@context` に、VC 2.0 と OB 3.0 のコンテキストを指定する
- `type`、`issuer.id`、`achievement.id` などは OB 3.0 の仕様どおりに入れる
- バッジ画像に、英語で Micro-credential の語を入れることを勧めている

</div>
</div>

---

# OB 3.0 の仕様が定める拡張の決まり

| 仕様書の節 | 決まり |
| --- | --- |
| C.1 データモデルの拡張 | 拡張可能なクラスには項目を足してよい。足す項目は JSON Schema と JSON-LD コンテキストで定義し、どちらも CORS の制限なしで公開する |
| C.1 使う側の義務 | 発行する側は、コンテキストの URL を `@context` に、JSON Schema の URL を `credentialSchema` に入れなければならない |
| C.2 語彙の拡張 | `achievementType` などの語彙に独自の値を足すときは、`ext:` で始める |
| C.4 プロファイル | 特定の地域や分野に向けて仕様を絞り込んだものをプロファイルと呼ぶ。制約を足すだけで、元の仕様の制約を緩めてはならない |

`Achievement`、`AchievementSubject`、`Alignment`、`Criteria` は、どれも拡張可能なクラスである。
独自の項目を足すこと自体は、仕様に沿った使い方になる。

---

<!-- _class: lead -->
<!-- _paginate: false -->

# 4. 格納ルール案

---

# 方針

1. **項目は増やさない**
   記述子の一覧と必須・選択の区分は、フレームワーク 1.0 のままとする
2. **ガイドライン 3.0 の書き方は守る**
   OB 3.0 本体への割り当ても、`criteria.narrative` の文章も、そのまま残す
3. **11 記述子を構造化して 1 か所に併記する**
   文章で入っていた記述子を、値として取り出せる形でも入れる
4. **正は構造化データとする**
   `criteria.narrative` は構造化データから作る。両者が食い違うバッジは、ルールに沿っていない
5. **OB 3.0 の拡張の決まりに従う**
   足す項目は JSON-LD コンテキストと JSON Schema で定義して公開する

---

# バッジ全体の中での位置

```text
OpenBadgeCredential
├─ @context                 このルールのコンテキストの URL を足す
├─ credentialSchema         このルールの JSON Schema の URL を足す
├─ issuer / validFrom       ガイドライン 3.0 どおり
└─ credentialSubject
   └─ achievement
      ├─ name / description / achievementType / alignment
      │                     ガイドライン 3.0 どおり
      ├─ criteria.narrative
      │                     ガイドライン 3.0 どおりの文章。構造化データから作る
      └─ microCredentialDescriptors
                            このルールで足す構造化データ
```

このルールを知らないウォレットも、これまでどおり文章を表示できる。

---

# 置き場所とその理由

次の場所に、1 つのオブジェクトとして入れる
`credentialSubject.achievement.microCredentialDescriptors`

### 理由

- 取り出す側は、この 1 か所を見ればよい
- `Achievement` は、仕様上、項目を足してよいクラスである
- 足す項目名が 1 つで済む。OB 3.0 のコンテキストは項目名の再定義を禁じているので、足す名前が少ないほど、将来の版と名前がぶつかる心配が小さい

### 対象にしないもの

学習者ごとに変わる値は対象にしない。取得した単位数は OB 3.0 本体の `credentialSubject.creditsEarned` に、受講した期間は `activityStartDate` と `activityEndDate` に入れる

---

<style scoped>
th:nth-child(1), td:nth-child(1) { width:14%; }
th:nth-child(2), td:nth-child(2) { width:17%; }
th:nth-child(3), td:nth-child(3) { width:6%; white-space:nowrap; }
</style>

# 項目一覧（1）

| 記述子 | 項目名 | 区分 | 形 |
| --- | --- | --- | --- |
| 学修成果 | `learningOutcomes` | 必須 | 1 件以上の配列。要素は `description`（テキスト、必須）と `alignment`（スキル標準などへの対応、任意） |
| 授業言語 | `languages` | 選択 | 言語タグの配列。例は `["ja"]` |
| 授業の方法 | `participation` | 必須 | `mode`（必須）は `onsite`、`online`、`hybrid`。`timing`（任意）は `synchronous`、`asynchronous`、`mixed` |
| 学習量 | `learnerEffort` | 必須 | `totalHours` は必須で、10 以上の数値。`contactHours`（授業時間）は任意の 0 以上の数値 |
| 評価の方法 | `assessments` | 必須 | 1 件以上の配列。要素は `method`（必須。語彙は仮の 9 種）と `description`（任意） |
| 質保証 | `qualityAssurance` | 必須 | `internal`（必須。内部質保証）と `external`（任意の配列。第三者による認証）。どちらも `name` と任意の `url` を持つ |

---

<style scoped>
th:nth-child(1), td:nth-child(1) { width:14%; }
th:nth-child(2), td:nth-child(2) { width:17%; }
th:nth-child(3), td:nth-child(3) { width:6%; white-space:nowrap; }
</style>

# 項目一覧（2）

| 記述子 | 項目名 | 区分 | 形 |
| --- | --- | --- | --- |
| レベル | `levels` | 選択 | 配列。要素は `framework`（枠組みの名前）、`value`（その枠組みでの値）、`url`（任意） |
| 証明書 | `certification` | 選択 | テキスト |
| 単位／その他の認定 | `recognitions` | 必須 | 1 件以上の配列。`kind` は必須で、`credit`、`continuingEducation`、`other`、`none` のどれか。`scheme`（制度名）と `amount`（0 より大きい数値）は任意 |
| 前提条件 | `prerequisites` | 選択 | 配列。要素は `description`（テキスト、必須）と `url`（任意） |
| 積み上げ可能性 | `stackableInto` | 選択 | 配列。要素は積み上げ先の `name`（テキスト、必須）と `url`（任意） |

---

# 項目一覧の補足

- **テキストの持ち方**
  表の「テキスト」は、言語タグ（BCP 47）をキーにしたオブジェクトである。例は `{ "ja": "統計学の基礎知識", "en": "Basic statistics knowledge" }`
- **数値の範囲**
  `totalHours` は 10 以上（フレームワーク 1.0 の条件）。時間数と `amount` は 0.25 の倍数で 100000 以下にし、文章の数値をどの言語でも同じ文字にする
- **単位の出ない講座**
  `recognitions` はフレームワークで必須の記述子なので、単位もポイントも出ない講座は `kind: "none"` を 1 件入れる
- **フレームワークへの準拠**
  フレームワークは、質保証の記述子に準拠の旨を書くよう求めている。これはガイドライン 3.0 どおり `achievement.alignment` で示し、ここには重ねて持たない

---

# OB 3.0 本体の項目を使わない理由

本体にも近い項目があるが、記述子の格納先にはしない。意味が合えば併記してよい

| 本体の項目 | 使わない理由 |
| --- | --- |
| `achievement.inLanguage` | 仕様上は「アチーブメントの言語」で、別言語版を示す `related` と組で使う。バッジの記述に使った言語を指すと読め、授業で使う言語とは限らない。値も 1 つしか持てない |
| `achievement.creditsAvailable` | 数値だけで、どの制度の単位か（大学設置基準、UCTS、ECTS など）を持てない |
| `achievement.alignment` | `targetUrl` が必須で、URL の無い枠組みを書けない。スキルへの対応やフレームワーク準拠の表明と同じ配列に混ざり、どれがレベルかを区別できない |
| `achievement.related` | 別言語版や旧版を指すための項目で、積み上げ先を示すものではない |
| 1EdTech の Assessment 拡張 | 評価の種類が `Exam`、`Performance`、`Artifact` の 3 つしかなく、必須項目が多い。拡張自身が草案段階としている |

---

# ルールに従っていることの示し方

発行する側は、コンテキストと JSON Schema の URL をバッジに入れる

```json
"@context": [
  "https://www.w3.org/ns/credentials/v2",
  "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
  "https://purl.imsglobal.org/spec/ob/v3p0/extensions.json",
  "https://h-e-technology.github.io/…/draft/microcredential/v1/context.json"
],
"credentialSchema": [
  { "id": "（OB 3.0 の JSON Schema の URL）", "type": "1EdTechJsonSchemaValidator2019" },
  { "id": "https://h-e-technology.github.io/…/draft/microcredential/v1/schema.json",
    "type": "1EdTechJsonSchemaValidator2019" }
]
```

`extensions.json` は、`credentialSchema` の `type` を定義するコンテキスト

---

<style scoped>
td:first-child code { white-space:nowrap; }
</style>

# 公開するファイル

| ファイル | 役割 |
| --- | --- |
| `context.json` | JSON-LD コンテキスト。足す項目名は `microCredentialDescriptors` の 1 つだけ |
| `schema.json` | バッジ全体に当てる JSON Schema。構造化データの形などを確かめる |
| `test-vectors.json` | 構造化データと文章の組。ほかの言語で文章の生成を実装するときの照合用 |

- 受け取る側は、`@context` にこのルールの URL があれば構造化データを読める
- コンテキストと JSON Schema は、CORS の制限なしで公開する（OB 3.0 の仕様の要件）
- 検証する側は `credentialSchema` の URL から JSON Schema を取得する。開けないと検証に失敗する
- 公開した版のファイルは書き換えない。項目や語彙を変えるときは、版を上げて別の URL にする
- 今の URL は試すための置き場所を指している。本番の公開先は未決である

---

# criteria.narrative の作り方

<div class="cols wide-right">
<div>

### 書式

- 構造化データから、ガイドライン 3.0 の記載例と同じ書式で作る
- 記述子ごとに、見出しの行、本文の順に書く。記述子の間は空行で区切る
- 見出しは「日本語名 (英語名):」とする
- 配列は箇条書きにする
- 値の無い選択記述子は、見出しごと省く
- 数値は 10 進で書き、指数表記を使わない。小数の末尾の 0 は付けない（`90.0` は `90`）

区分や数値を本文にするときの言い回しは、仮のものである

</div>
<div>

### 見出しと並び順

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

</div>
</div>

---

# 記載例（1）

`achievement` の中に、文章と構造化データを並べて入れる

```json
"achievement": {
  "id": "https://example.com/achievements/data-science-2025",
  "type": ["Achievement"],
  "name": "データサイエンス入門 / Introduction to Data Science",
  "description": "データ分析の基礎を学ぶ講座",
  "achievementType": "MicroCredential",
  "alignment": [ （フレームワーク 1.0 の名前と URL） ],
  "criteria": {
    "narrative": "学修成果 (Learning Outcomes):\n- データサイエンスの…（文章が続く）"
  },
  "microCredentialDescriptors": { （次のスライド） }
}
```

---

# 記載例（2）

`microCredentialDescriptors` の前半。学修成果から評価の方法まで

```json
"microCredentialDescriptors": {
  "type": ["MicroCredentialDescriptors"],
  "learningOutcomes": [
    { "description": { "ja": "データサイエンスの基本概念を理解する" } },
    { "description": { "ja": "統計手法を実世界の問題に適用する" } }
  ],
  "languages": ["ja"],
  "participation": { "mode": "online", "timing": "synchronous" },
  "learnerEffort": { "totalHours": 90, "contactHours": 30 },
  "assessments": [{ "method": "project" }, { "method": "peer-assessment" }],
  （次のスライドへ続く）
```

---

# 記載例（3）

`microCredentialDescriptors` の後半。質保証から前提条件まで

```json
  "qualityAssurance": { "internal": { "name": { "ja": "質保証委員会による審査" } } },
  "levels": [{ "framework": "大学の課程", "value": "学士" }],
  "recognitions": [
    { "kind": "credit", "scheme": "UCTS", "amount": 2 },
    { "kind": "continuingEducation", "scheme": "PDU", "amount": 15 }
  ],
  "prerequisites": [{ "description": { "ja": "統計学の基礎知識" } }]
}
```

「90 時間」「オンライン」「UCTS 2 単位」が、どれも値として取り出せる形になる。

---

# 検証で確かめること

バッジ全体について、次の 5 つを確かめる。このパッケージの `validateBadge()` が行う

1. 必須の記述子がそろっていて、項目一覧の形に合っている
2. `criteria.narrative` が、構造化データから決まった書式で作った文章と一致する
3. `achievementType` が `MicroCredential` で、`alignment` にフレームワークが入っている
4. ガイドライン 3.0 が必須とする OB 3.0 本体の項目が入っている
   発行機関の名前、発行日、学習者を識別する情報、名称、内容
5. `@context` と `credentialSchema` が、決まりのとおりに入っている

署名と、OB 3.0 本体の項目の細かい形は確かめない。そちらは OB 3.0 本体の JSON Schema と検証ツールが担う

---

# パッケージの現状

<div class="cols">
<div>

### このパッケージにあるもの

- 構造化データの型と検証
- 構造化データから `criteria.narrative` を作る関数
- バッジ全体の検証
- JSON-LD コンテキスト
- バッジ全体に当てる JSON Schema
- 照合用のデータ
- バッジ全体の記載例

</div>
<div>

### 確かめてあること

- コンテキストは、JSON-LD の処理系で展開と正規化（署名の前処理）ができる
- 記載例と照合用データで組んだバッジは、OB 3.0 本体の JSON Schema と、このルールの JSON Schema の両方を通る
- コンテキストと JSON Schema は、試すための URL で開ける

### まだ確かめていないこと

- 署名付きのバッジの発行
- 他のウォレットでの取り込み・検証・表示
- 1EdTech の検証ツール

</div>
</div>

---

<!-- _class: lead -->
<!-- _paginate: false -->

# 5. 決めていないことと残っている作業

---

# このルールの限界と、採用の働きかけ

### 限界

- 独自に足した項目は、このルールを知らないウォレットには読めない
- そのため `criteria.narrative` の文章を残し、知らないウォレットでも表示は変わらないようにしている
- 他のサービスに値として読んでもらうには、ルールを公開し、採用してもらう必要がある

### 働きかける先の候補

| 提案先 | 提案の形 |
| --- | --- |
| マイクロクレデンシャル共同WG／日本マイクロクレデンシャル機構 | ガイドライン 3.0 の構造化版として提案する |
| 1EdTech の Open Badges 拡張レジストリ | OB 3.0 の拡張として登録する。受付は GitHub |

提案するかどうかと、その時期はまだ決めていない。

---

# 決めていないこと（1）

| 論点 | 内容 |
| --- | --- |
| 評価の方法の語彙 | 仮に 9 種（`exam`、`assignment`、`project` など）を使っている。ELM の統制語彙などに寄せるか |
| 単位やポイントの制度名 | 大学設置基準の単位、UCTS、ECTS、PDU などを、どう書き表すか |
| レベルの枠組み名 | 日本には全国資格枠組みが無い。「学士」「修士」などを、どの枠組みの値として書くか |
| 多言語のテキスト | 日本語を必須にするか、どれか 1 言語あればよいとするか。OB 3.0 本体の文字列項目に入る名称と発行機関で、英語の併記をどう書くか |
| コンテキストと JSON Schema の公開先 | どのドメインに置くか。版を URL にどう含めるか。URL は一度使い始めると変えられない |

語彙と公開先には、仮の値が入っている。

---

# 決めていないこと（2）

| 論点 | 内容 |
| --- | --- |
| 文章だけのバッジを読むか | 他の発行者がガイドライン 3.0 だけに沿って出したバッジは、文章しか持たない。見出しを手がかりに分解して読む機能を持つかどうか |
| EU 理事会勧告の扱い | EU の 11 項目を持つプロファイル（`eu-microcredential`）は、格納ルールの形になっていない。EU 向けの発行が要るなら格納ルールの形に直し、要らないなら消す |
| 修了証明書の扱い | 国内フレームワークは、評価を伴わない修了・参加の証明を対象外としている。修了証明書のプロファイルは項目が確定しておらず、該当する既存のルールも見つかっていない |
| 自社の LMS との分担 | バッジの署名とコンテキストを扱う LMS 側のパッケージと、どちらが何を持つか |
| パッケージの公開先とライセンス | npm か GitHub Packages か。ライセンスは仮に MIT としている |

---

# 残っている作業

1. **実物のバッジでの確認**
   署名付きで発行し、自社と他のウォレットで取り込み・検証・表示を試す。1EdTech の検証ツールにも通す
2. **語彙と公開先の決定**
   評価の方法、単位の制度名、レベルの枠組み名の語彙と、コンテキスト・JSON Schema の本番の URL を決める
3. **本番の公開**
   コンテキストと JSON Schema を本番の URL で配信し、パッケージを公開する
4. **採用の働きかけ**
   国内の共同WG／機構と、1EdTech の拡張レジストリへの提案。するかどうかと時期は未決

---

<style scoped>
li { font-size:16pt; line-height:1.5; }
p { font-size:16pt; }
</style>

# 参考資料

- マイクロクレデンシャルのフレームワーク 1.0
  `https://micro-credentials.jp/wp-content/uploads/2024/04/MC_frameworkver1.0.pdf`
- Guidelines for Issuing Micro-credentials Digitally 3.0
  `https://micro-credential-jwg.org/wp-content/uploads/2025/05/Guideline-for-issuing-micro-credentials-digitally-3.0-20250527.pdf`
- Open Badges Specification 3.0（付録 C が拡張とプロファイル）
  `https://www.imsglobal.org/spec/ob/v3p0/`
- EU 理事会勧告（ST 9790/22）
  `https://data.consilium.europa.eu/doc/document/ST-9790-2022-INIT/en/pdf`
- Europass: 勧告の付属書 I と ELM の対応表
  `https://europass.europa.eu/system/files/2026-05/MC-Mapping.pdf`
- Open Badges Extension Registry
  `https://www.imsglobal.org/node/224015`

ほかの出典は `docs/prior-art.md`、格納ルール案の全文は `docs/storage-rule.md` にある。
