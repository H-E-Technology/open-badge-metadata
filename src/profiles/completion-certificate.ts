import { z } from "zod";
import { IsoDate, LocalizedText, Organization } from "../common.ts";
import { defineProfile, type ProfileMetadata } from "../profile.ts";

/**
 * 修了証明書。講座・プログラムを修了したことを示す。
 *
 * ⚠️ 初版の叩き台。項目は大学・企業研修の修了証でよく載るものから選んだ。
 *    実際に発行している修了証と突き合わせて確定させる（docs/open-questions.md）。
 */
export const CompletionCertificateMetadata = z.object({
  /** 証明書番号（発行者内で一意） */
  certificateNumber: z.string().min(1),
  /** 講座・プログラムの名称 */
  programName: LocalizedText,
  /** 実施機関 */
  provider: Organization,
  /** 受講期間 */
  period: z
    .object({
      startDate: IsoDate,
      endDate: IsoDate,
    })
    .refine((p) => p.startDate <= p.endDate, {
      message: "startDate は endDate 以前にしてください",
    }),
  /** 修了日 */
  completedOn: IsoDate,
  /** 総学習時間 */
  totalHours: z.number().positive(),
  /** 修了要件（出席率、課題提出など） */
  completionRequirements: z.array(LocalizedText).min(1),
  /** 成績・評価（任意） */
  grade: z.string().min(1).optional(),
});

export const completionCertificateProfile = defineProfile({
  id: "completion-certificate",
  version: "0.1.0",
  title: "修了証明書",
  description: "講座・プログラムの修了を示す証明書のメタデータ",
  references: [],
  schema: CompletionCertificateMetadata,
});

export type CompletionCertificateMetadata = ProfileMetadata<
  typeof completionCertificateProfile
>;
