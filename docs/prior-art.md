# 先行事例の調査

調査日: 2026-11-25

Open Badges 3.0（以下 OB 3.0）のバッジに入れるメタデータについて、項目や書き方のルールを整備した事例をまとめる。このパッケージが項目を独自に決めず、構造化して格納するルールだけを担う根拠である。

## 結論

- 「何の項目を入れるか」のルールは既にある。国内には OB 3.0 向けのものが公開されている。
- 「項目を値として取り出せる形で入れる」ルールは、国内外とも見つからなかった。国内ガイドラインは、大半の項目を 1 つの文章にまとめて入れる方式である。
- したがって、項目を独自に決める必要は薄い。空いているのは、既存の項目を構造化して格納するルールと、それを検証できる実装である。

## 国内

| 事例 | 内容 |
| --- | --- |
| マイクロクレデンシャルのフレームワーク 1.0（マイクロクレデンシャル共同WG、2023-03-27） | 必須記述子 11、選択記述子 6 を定義する。日本マイクロクレデンシャル機構のサイトで公開されている |
| マイクロクレデンシャルをデジタル発行するためのガイドライン 3.0（同WG、2025-03-12 作成、2025-05-27 改訂） | 上の記述子を OB 3.0 のどこに書くかの対応表と、JSON の記載例 |
| オープンバッジ・ネットワーク 大学WG（阪井、2025） | メタデータは「マイクロクレデンシャル共通記述子に合わせて構造的に書く」ことを勧めている |
| 文部科学省 令和 7 年度調査研究 事業報告書（2026-03-23） | 私立大学の自由記述に「メタデータの記述ルール等を国内標準として整備・普及してほしい」という要望がある。国が定めた標準は見当たらない |

### フレームワーク 1.0 の記述子

| 区分 | 記述子 |
| --- | --- |
| 必須（11） | 学習者を識別する情報、発行日、マイクロクレデンシャル名称、発行機関、内容、学修成果、授業の方法、学習量（総学習時間）、評価の方法、質保証、単位／その他の認定 |
| 選択（6） | 発行国／地域、授業言語、レベル、証明書、（受講）前提条件、積み上げ可能性 |

EU 理事会勧告の必須 11 項目とは一致しない。EU は「発行国」「レベル（該当する場合）」が必須で、「内容」「単位／その他の認定」は無い。

### ガイドライン 3.0 の割り当て

| 記述子 | OB 3.0 での書き場所 |
| --- | --- |
| 発行機関 | `issuer.name` |
| 発行国／地域 | `issuer.address.addressCountry` |
| 発行日 | `validFrom` |
| 学習者を識別する情報 | `credentialSubject.identifier`、`credentialSubject.id` |
| マイクロクレデンシャル名称 | `credentialSubject.achievement.name` |
| 内容 | `credentialSubject.achievement.description` |
| 学修成果、授業言語、授業の方法、学習量、評価の方法、質保証、レベル、証明書、単位／その他の認定、前提条件、積み上げ可能性 | `credentialSubject.achievement.criteria.narrative` に、記述子名を見出しにした 1 つの文章として入れる |

このほか、`achievementType` に `MicroCredential` を入れ、`alignment` にフレームワークの名前と URL を入れることを求めている。

`criteria.narrative` に入る 11 記述子は文章なので、学習時間やレベルを値として取り出せない。これがこのパッケージで解きたい問題である（[storage-rule.md](storage-rule.md)）。

## 海外

| 事例 | 内容 | OB 3.0 との関係 |
| --- | --- | --- |
| EU: European Learning Model（ELM） | 理事会勧告の必須 11 項目を構造化して持つ。Europass が項目ごとの対応表を公開している | OB ではなく別の形式（European Digital Credentials）で使う |
| EUNIS の実務ガイド（2026-06） | 「OB 3.0 と EDC の相互運用プロファイルはまだ確立していない」と書いている | EU 勧告に準拠したマイクロクレデンシャルは OB だけでは実装できない、という立場 |
| 1EdTech TrustEd Credential Framework（2026-05-12 改訂、最終案） | OB 3.0 上の必須・推奨項目（スキル、評価、証拠、`achievementType` など）を定める | 新しい項目は定義しない。認証の仕組みは未整備。EU 勧告には触れていない |
| 1EdTech の拡張レジストリ | OB 3.0 用に Assessment、Issuer Accreditation、ACE の 3 つの拡張が載っている | 前の 2 つは 2025 年に出た版で、レビュー段階。Assessment 拡張は自ら「草案であり本番向けでない可能性がある」と書いている |
| SURF edubadges（オランダ） | ECTS、EQF などを拡張として足し、EU の標準要素との対応表を持つ | OB 2.1 が土台。OB 3.0 への移行状況は確認できていない |
| Credential Engine（CTDL） | `alignment` に登録簿の識別子を入れる方式 | OB 3.0 の `achievementType` の語彙は CTDL と対応している |

コードでは、OB 2.0 / 3.0 本体の TypeScript 型（npm の `openbadges-types`）がある。マイクロクレデンシャルの項目を型や検証関数にしたパッケージは見つからなかった。

## OB 3.0 の仕様が定める拡張の決まり

仕様書の付録 C による。

- **拡張（C.1）**: 拡張可能なクラスに項目を足してよい。`Achievement`、`AchievementSubject`、`Alignment`、`Criteria` は拡張可能である。足す項目は JSON Schema と JSON-LD コンテキストで定義し、どちらも CORS の制限なしで公開する。発行する側は、コンテキストの URL を `@context` に、JSON Schema の URL を `credentialSchema` に入れなければならない。
- **語彙の拡張（C.2）**: `achievementType` などの語彙に独自の値を足すときは、`ext:` で始める。
- **プロファイル（C.4）**: 特定の地域や分野に向けて仕様を絞り込んだものをプロファイルと呼ぶ。プロファイルは制約を足すだけで、元の仕様の制約を緩めてはならない。

## 確認できなかったこと

- SURF の wiki は直接読めなかった。edubadges の記述は検索結果の要約に基づく。
- 修了証明書に絞った調査はしていない。国内フレームワークは、評価を伴わない修了・参加の証明をマイクロクレデンシャルの対象外としている。
- オーストラリアなど他国の枠組みは、OB との対応まで追っていない。

## 出典

- [マイクロクレデンシャルのフレームワーク 1.0](https://micro-credentials.jp/wp-content/uploads/2024/04/MC_frameworkver1.0.pdf)
- [Guidelines for Issuing Micro-credentials Digitally 3.0](https://micro-credential-jwg.org/wp-content/uploads/2025/05/Guideline-for-issuing-micro-credentials-digitally-3.0-20250527.pdf)
- [フレームワーク/ガイドライン - 日本マイクロクレデンシャル機構](https://www.micro-credentials.jp/ova_doc/mc-framework/)
- [阪井「オープンバッジのメタデータ活用の実際」（愛媛大学シンポジウム、2025-11）](https://digital.ins.ehime-u.ac.jp/wp-content/uploads/docs/cdre_20251126_01_docs-1.pdf)
- [文部科学省 令和 7 年度調査研究 事業報告書](https://www.mext.go.jp/content/20260609-mxt_syogai03-000034993_02.pdf)
- [EU 理事会勧告（ST 9790/22）](https://data.consilium.europa.eu/doc/document/ST-9790-2022-INIT/en/pdf)
- [Europass: 勧告の付属書 I と ELM の対応表](https://europass.europa.eu/system/files/2026-05/MC-Mapping.pdf)
- [EUNIS: Badges and Digital Credentials in Higher Education](https://eunis.org/wp-content/uploads/2026/07/EUNIS_SIG_Badges_and_Digital_Credentials_in_Higher_Education_2026.pdf)
- [1EdTech TrustEd Credential Coalition](https://1edtech.org/program/tmc)
- [Open Badges Extension Registry](https://www.imsglobal.org/node/224015)
- [Open Badges Assessment Extension v2.0](https://www.imsglobal.org/spec/ob-assessment/v2p0/)
- [Open Badges Issuer Accreditation Extension v2.0](https://www.imsglobal.org/spec/ob-accred/v2p0/)
- [Open Badges Specification 3.0](https://www.imsglobal.org/spec/ob/v3p0/)
- [SURF edubadges メタデータモデル](https://wiki.surfnet.nl/display/Edubadges/Specificatie+Metadatamodel+Edubadges)
- [Credential Engine: CTDL と Open Badges 3.0](https://credentialengine.org/2024/06/18/enhanced-integration-of-ctdl-in-new-open-badges-standard-boosts-credential-clarity/)
