import {
  narrativeTestVectors,
  type CompletionCertificateMetadata,
  type EuMicrocredentialMetadata,
  type MicroCredentialDescriptors,
  type NarrativeTestVector,
} from "../src/index.ts";

const vector = (name: string): NarrativeTestVector => {
  const found = narrativeTestVectors.find((v) => v.name === name);
  if (found === undefined) throw new Error(`照合用データ「${name}」がありません`);
  return found;
};

/** docs/storage-rule.md の記載例と同じ構造化データ */
export const validDescriptors: MicroCredentialDescriptors = vector("記載例").descriptors;

/** 上の構造化データから作られるはずの criteria.narrative */
export const validDescriptorsNarrative: string = vector("記載例").narrative;

/** 必須の記述子だけを持つ構造化データ */
export const minimalDescriptors: MicroCredentialDescriptors = vector("必須の記述子だけ").descriptors;

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
