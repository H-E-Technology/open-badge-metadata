import { z } from "zod";

/** 複数のプロファイルで使う部品 */

/** 多言語テキスト。キーは BCP 47 の言語タグ（"ja", "en" など）。最低 1 言語 */
export const LocalizedText = z
  .record(z.string().min(2), z.string().min(1))
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
