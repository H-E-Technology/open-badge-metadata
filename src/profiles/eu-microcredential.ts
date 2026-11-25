import { z } from "zod";
import {
  AssessmentMethod,
  CountryCode,
  IsoDate,
  LocalizedText,
  Organization,
  ParticipationMode,
} from "../common.ts";
import { defineProfile, type ProfileMetadata } from "../profile.ts";

/**
 * EU 理事会勧告（2022 年 6 月 16 日）付属書 I の必須 11 要素。
 * 番号はその並び順に合わせている。
 *
 * ⚠️ 国内フレームワーク 1.0 とは必須項目が違い、格納ルール案（docs/storage-rule.md）の
 *    形にもなっていない。残すか消すかは未決（docs/open-questions.md）。
 */
export const EuMicrocredentialMetadata = z.object({
  /** 1. 学習者の識別情報 */
  learner: z.object({
    name: z.string().min(1).optional(),
    /** 学籍番号やメールのハッシュなど。OB3 の credentialSubject.identifier と合わせる */
    identifier: z.string().min(1),
  }),
  /** 2. クレデンシャルの名称 */
  title: LocalizedText,
  /** 3. 発行者の国・地域 */
  issuerCountry: CountryCode,
  /** 4. 授与機関 */
  awardingBody: z.array(Organization).min(1),
  /** 5. 発行日 */
  issuedOn: IsoDate,
  /** 6. 学習成果 */
  learningOutcomes: z.array(LocalizedText).min(1),
  /** 7. 想定学習量（時間）。ECTS 単位があれば併記 */
  notionalWorkload: z.object({
    hours: z.number().positive(),
    ectsCredits: z.number().positive().optional(),
  }),
  /** 8. 水準（EQF / 各国の資格枠組みなど）。該当しない場合は省略ではなく null を明示する */
  level: z
    .object({
      framework: z.string().min(1), // 例: "EQF"
      value: z.string().min(1), // 例: "6"
    })
    .nullable(),
  /** 9. 評価の種類 */
  assessment: z.object({
    types: z.array(AssessmentMethod).min(1),
    description: LocalizedText.optional(),
  }),
  /** 10. 学習活動への参加形態 */
  participationForm: ParticipationMode,
  /** 11. 品質保証の種類 */
  qualityAssurance: z.object({
    description: LocalizedText,
    /** 外部の認証・評価機関があれば */
    body: Organization.optional(),
  }),
});

export const euMicrocredentialProfile = defineProfile({
  id: "eu-microcredential",
  version: "0.1.0",
  title: "マイクロクレデンシャル（EU 理事会勧告）",
  description: "EU 理事会勧告（2022）の必須 11 項目に沿ったマイクロクレデンシャルのメタデータ",
  references: [
    "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022H0627(02)",
  ],
  schema: EuMicrocredentialMetadata,
});

export type EuMicrocredentialMetadata = ProfileMetadata<typeof euMicrocredentialProfile>;
