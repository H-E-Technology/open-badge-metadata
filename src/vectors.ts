import type { MicroCredentialDescriptors } from "./profiles/microcredential.ts";

/**
 * 照合用のデータ。構造化データと、そこから作られるはずの criteria.narrative の組。
 *
 * TypeScript 以外で文章の生成を実装するときに、結果を突き合わせるために使う。
 * 文章は関数の出力を写したものではなく、決まりに沿って書いた期待値である。
 * ビルドすると dist/rule/microcredential/v1/test-vectors.json に書き出される。
 */
export interface NarrativeTestVector {
  readonly name: string;
  readonly descriptors: MicroCredentialDescriptors;
  readonly narrative: string;
}

/** docs/storage-rule.md の記載例 */
const example: NarrativeTestVector = {
  name: "記載例",
  descriptors: {
    type: ["MicroCredentialDescriptors"],
    learningOutcomes: [
      { description: { ja: "データサイエンスの基本概念を理解する" } },
      { description: { ja: "統計手法を実世界の問題に適用する" } },
    ],
    languages: ["ja"],
    participation: { mode: "online", timing: "synchronous" },
    learnerEffort: { totalHours: 90, contactHours: 30 },
    assessments: [{ method: "project" }, { method: "peer-assessment" }],
    qualityAssurance: { internal: { name: { ja: "質保証委員会による審査" } } },
    levels: [{ framework: "大学の課程", value: "学士" }],
    recognitions: [
      { kind: "credit", scheme: "UCTS", amount: 2 },
      { kind: "continuingEducation", scheme: "PDU", amount: 15 },
    ],
    prerequisites: [{ description: { ja: "統計学の基礎知識" } }],
  },
  narrative: `学修成果 (Learning Outcomes):
- データサイエンスの基本概念を理解する
- 統計手法を実世界の問題に適用する

授業言語 (Language):
日本語（Japanese）

授業の方法 (Form of participation):
オンライン、同期（Online, synchronous）

学習量（総学習時間） (Learner effort):
90 時間、うち授業時間 30 時間（90 hours, including 30 contact hours）

評価の方法 (Type of assessment):
- プロジェクト・成果物（Project）
- 相互評価（Peer assessment）

質保証 (Type of quality assurance):
- 内部質保証（Internal）: 質保証委員会による審査

レベル (Level):
- 大学の課程: 学士

単位/その他認定 (Credit/Other recognition):
- 単位（Credit）: UCTS 2
- 継続教育ポイント（Continuing education）: PDU 15

(受講)前提条件 (Prerequisites needed to enroll):
- 統計学の基礎知識`,
};

/** 必須の記述子だけ。選択記述子の見出しは出ない */
const minimal: NarrativeTestVector = {
  name: "必須の記述子だけ",
  descriptors: {
    type: ["MicroCredentialDescriptors"],
    learningOutcomes: [{ description: { ja: "表形式のデータを集計できる" } }],
    participation: { mode: "onsite" },
    learnerEffort: { totalHours: 10 },
    assessments: [{ method: "exam" }],
    qualityAssurance: { internal: { name: { ja: "教務委員会による審査" } } },
    recognitions: [{ kind: "none" }],
  },
  narrative: `学修成果 (Learning Outcomes):
- 表形式のデータを集計できる

授業の方法 (Form of participation):
対面（Onsite）

学習量（総学習時間） (Learner effort):
10 時間（10 hours）

評価の方法 (Type of assessment):
- 試験（Exam）

質保証 (Type of quality assurance):
- 内部質保証（Internal）: 教務委員会による審査

単位/その他認定 (Credit/Other recognition):
- なし（None）`,
};

/** 11 記述子すべてと、説明、URL、スキル標準への対応、複数の言語 */
const full: NarrativeTestVector = {
  name: "11 記述子すべてと、説明・URL・複数言語",
  descriptors: {
    type: ["MicroCredentialDescriptors"],
    learningOutcomes: [
      {
        description: { ja: "統計手法を適用する", en: "Apply statistical methods" },
        alignment: {
          type: ["Alignment"],
          targetName: "サンプルスキル標準 データ分析 1",
          targetUrl: "https://example.org/skills/ds-1",
        },
      },
    ],
    languages: ["ja", "en", "fr"],
    participation: {
      mode: "hybrid",
      timing: "mixed",
      description: { ja: "講義は録画、演習は教室で行う" },
    },
    learnerEffort: {
      totalHours: 45.5,
      contactHours: 1,
      description: { ja: "授業外の学習を含む" },
    },
    assessments: [{ method: "project", description: { ja: "最終成果物を提出する" } }],
    qualityAssurance: {
      internal: { name: { ja: "質保証委員会による審査" }, url: "https://example.ac.jp/qa" },
      external: [{ name: { ja: "サンプル認証機構の認証" } }],
    },
    levels: [{ framework: "EQF", value: "6", url: "https://example.org/eqf/6" }],
    certification: { ja: "修了証をデジタル発行", en: "Certificate issued digitally" },
    recognitions: [
      { kind: "credit", scheme: "UCTS", amount: 2, description: { ja: "卒業要件に算入できる" } },
      { kind: "other", description: { ja: "業界団体による認定" } },
    ],
    prerequisites: [
      { description: { ja: "統計学の基礎知識" }, url: "https://example.ac.jp/courses/stat-101" },
    ],
    stackableInto: [{ name: { ja: "データサイエンス・マイクロクレデンシャル" } }],
  },
  narrative: `学修成果 (Learning Outcomes):
- 統計手法を適用する（Apply statistical methods） [サンプルスキル標準 データ分析 1](<https://example.org/skills/ds-1>)

授業言語 (Language):
日本語（Japanese）、英語（English）、fr

授業の方法 (Form of participation):
対面とオンラインの併用、同期と非同期の併用（Hybrid, mixed）
講義は録画、演習は教室で行う

学習量（総学習時間） (Learner effort):
45.5 時間、うち授業時間 1 時間（45.5 hours, including 1 contact hour）
授業外の学習を含む

評価の方法 (Type of assessment):
- プロジェクト・成果物（Project）: 最終成果物を提出する

質保証 (Type of quality assurance):
- 内部質保証（Internal）: 質保証委員会による審査 <https://example.ac.jp/qa>
- 外部質保証（External）: サンプル認証機構の認証

レベル (Level):
- EQF: 6 <https://example.org/eqf/6>

証明書 (Certification):
修了証をデジタル発行（Certificate issued digitally）

単位/その他認定 (Credit/Other recognition):
- 単位（Credit）: UCTS 2、卒業要件に算入できる
- その他の認定（Other recognition）: 業界団体による認定

(受講)前提条件 (Prerequisites needed to enroll):
- 統計学の基礎知識 <https://example.ac.jp/courses/stat-101>

積み上げ可能性 (Stackability):
- データサイエンス・マイクロクレデンシャル`,
};

/**
 * Markdown のエスケープが要る値。
 * リンクの文字の `\`、`[`、`]` には `\` を付け、URL は `<URL>` の形で入れる。
 * URL の中の括弧や角括弧は、そのまま残る。
 */
const escaping: NarrativeTestVector = {
  name: "Markdown のエスケープが要る値",
  descriptors: {
    type: ["MicroCredentialDescriptors"],
    learningOutcomes: [
      {
        description: { ja: "表形式のデータを集計できる" },
        alignment: {
          type: ["Alignment"],
          targetName: "スキル標準 [第2版] 集計\\分析",
          targetUrl: "https://example.org/skills/(v2)/[ds-1]",
        },
      },
    ],
    participation: { mode: "onsite" },
    learnerEffort: { totalHours: 10 },
    assessments: [{ method: "exam" }],
    qualityAssurance: {
      internal: {
        name: { ja: "教務委員会による審査" },
        url: "https://example.ac.jp/qa/[x](y)",
      },
    },
    recognitions: [{ kind: "none" }],
  },
  narrative: `学修成果 (Learning Outcomes):
- 表形式のデータを集計できる [スキル標準 \\[第2版\\] 集計\\\\分析](<https://example.org/skills/(v2)/[ds-1]>)

授業の方法 (Form of participation):
対面（Onsite）

学習量（総学習時間） (Learner effort):
10 時間（10 hours）

評価の方法 (Type of assessment):
- 試験（Exam）

質保証 (Type of quality assurance):
- 内部質保証（Internal）: 教務委員会による審査 <https://example.ac.jp/qa/[x](y)>

単位/その他認定 (Credit/Other recognition):
- なし（None）`,
};

export const narrativeTestVectors: readonly NarrativeTestVector[] = [
  example,
  minimal,
  full,
  escaping,
];
