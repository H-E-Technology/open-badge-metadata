import { z } from "zod";

/** 複数のプロファイルで使う部品 */

/** BCP 47 の言語タグ（"ja", "en", "zh-Hant" など） */
export const LanguageTag = z
  .string()
  .regex(/^[A-Za-z]{2,3}(-[A-Za-z0-9]{1,8})*$/, "BCP 47 の言語タグで書いてください")
  .describe("BCP 47 の言語タグ");

/** 多言語テキスト。キーは BCP 47 の言語タグ（"ja", "en" など）。最低 1 言語 */
export const LocalizedText = z
  .record(LanguageTag, z.string().min(1))
  .refine((v) => Object.keys(v).length > 0, { message: "最低 1 言語は必要です" })
  .describe("言語タグをキーにしたテキスト");
export type LocalizedText = z.infer<typeof LocalizedText>;

/** ISO 3166-1 alpha-2 の国コード（"JP" など） */
export const CountryCode = z
  .string()
  .regex(/^[A-Z]{2}$/, "ISO 3166-1 alpha-2 の大文字 2 文字で書いてください")
  .describe("ISO 3166-1 alpha-2 の国コード");

/** 日付（YYYY-MM-DD） */
export const IsoDate = z.iso.date().describe("YYYY-MM-DD 形式の日付");

/** 組織 */
export const Organization = z.object({
  name: LocalizedText,
  /** 組織の URL や法人番号の URI など */
  id: z.url().optional(),
  country: CountryCode.optional(),
});
export type Organization = z.infer<typeof Organization>;

/**
 * 評価の方法の語彙。
 *
 * ⚠️ 仮の語彙。ELM の統制語彙などに寄せるかどうかは docs/open-questions.md で決める。
 */
export const AssessmentMethod = z.enum([
  "exam", // 筆記・口頭の試験
  "assignment", // 課題・レポート
  "project", // プロジェクト・成果物
  "practical", // 実技
  "portfolio",
  "observation", // 行動の観察
  "self-assessment",
  "peer-assessment",
  "other",
]);
export type AssessmentMethod = z.infer<typeof AssessmentMethod>;

/** 授業の方法（対面、オンライン、その併用） */
export const ParticipationMode = z.enum(["onsite", "online", "hybrid"]);
export type ParticipationMode = z.infer<typeof ParticipationMode>;
