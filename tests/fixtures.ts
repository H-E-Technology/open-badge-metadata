import type {
  CompletionCertificateMetadata,
  EuMicrocredentialMetadata,
  MicroCredentialDescriptors,
} from "../src/index.ts";

/** docs/storage-rule.md の記載例と同じ構造化データ */
export const validDescriptors: MicroCredentialDescriptors = {
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
};

/** 上の構造化データから作られるはずの criteria.narrative */
export const validDescriptorsNarrative = `学修成果 (Learning Outcomes):
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
- 統計学の基礎知識`;

/** 必須の記述子だけを持つ構造化データ */
export const minimalDescriptors: MicroCredentialDescriptors = {
  type: ["MicroCredentialDescriptors"],
  learningOutcomes: [{ description: { ja: "表形式のデータを集計できる" } }],
  participation: { mode: "onsite" },
  learnerEffort: { totalHours: 10 },
  assessments: [{ method: "exam" }],
  qualityAssurance: { internal: { name: { ja: "教務委員会による審査" } } },
  recognitions: [{ kind: "none" }],
};

export const validEuMicrocredential: EuMicrocredentialMetadata = {
  learner: { name: "山田 花子", identifier: "sha256$0f1e2d3c" },
  title: { ja: "データ分析入門", en: "Introduction to Data Analysis" },
  issuerCountry: "JP",
  awardingBody: [{ name: { ja: "サンプル大学" }, id: "https://example.ac.jp", country: "JP" }],
  issuedOn: "2026-11-25",
  learningOutcomes: [
    { ja: "表形式のデータを集計・可視化できる" },
    { ja: "基本的な統計量を説明できる" },
  ],
  notionalWorkload: { hours: 30 },
  level: null,
  assessment: { types: ["assignment", "exam"] },
  participationForm: "online",
  qualityAssurance: { description: { ja: "学内の教務委員会による審査" } },
};

export const validCompletionCertificate: CompletionCertificateMetadata = {
  certificateNumber: "CC-2026-0001",
  programName: { ja: "生成 AI 活用講座" },
  provider: { name: { ja: "サンプル大学" } },
  period: { startDate: "2026-10-01", endDate: "2026-11-20" },
  completedOn: "2026-11-20",
  totalHours: 15,
  completionRequirements: [{ ja: "全 8 回のうち 6 回以上出席" }, { ja: "最終課題の提出" }],
};
