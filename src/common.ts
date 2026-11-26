import { z } from "zod";

/** 複数のプロファイルで使う部品 */

/** BCP 47 の言語タグ（"ja", "en", "zh-Hant" など） */
export const LanguageTag = z
  .string()
  .regex(/^[A-Za-z]{2,3}(-[A-Za-z0-9]{1,8})*$/, "BCP 47 の言語タグで書いてください")
  .describe("BCP 47 の言語タグ");

/** 大文字小文字を無視して同じになる値が 2 つ以上あるか。言語タグは大文字小文字を区別しない（BCP 47） */
export const hasCaseInsensitiveDuplicate = (values: readonly string[]): boolean =>
  new Set(values.map((v) => v.toLowerCase())).size !== values.length;

/**
 * 多言語テキスト。キーは BCP 47 の言語タグ（"ja", "en" など）。最低 1 言語。
 * キーは書かれたとおりに扱い、大文字小文字を無視して同じになるキー（"ja" と "JA"）は並べられない。
 */
export const LocalizedText = z
  .record(LanguageTag, z.string().min(1))
  // JSON Schema では確かめない（大文字小文字を無視した比較は JSON Schema で書けない）
  .refine((v) => !hasCaseInsensitiveDuplicate(Object.keys(v)), {
    message: "大文字小文字だけが違う言語タグを並べないでください",
  })
  .refine((v) => Object.keys(v).length > 0, { message: "最低 1 言語は必要です" })
  // refine は JSON Schema に出ないので、同じ決まりを JSON Schema の書き方で足す
  .meta({ minProperties: 1 })
  .describe("言語タグをキーにしたテキスト");
export type LocalizedText = z.infer<typeof LocalizedText>;

/** ISO 3166-1 alpha-2 の国コード（"JP" など） */
export const CountryCode = z
  .string()
  .regex(/^[A-Z]{2}$/, "ISO 3166-1 alpha-2 の大文字 2 文字で書いてください")
  .describe("ISO 3166-1 alpha-2 の国コード");

/** 日付（YYYY-MM-DD） */
export const IsoDate = z.iso.date().describe("YYYY-MM-DD 形式の日付");

/**
 * URL に使える形。スキームは http と https だけ（小文字）。
 * 空白、制御文字、`<`、`>`、`\` は使えない。
 * criteria.narrative には `<URL>` の形で入れるので、この形なら Markdown の中で URL が途中で切れない。
 */
export const HTTP_URL_PATTERN = /^https?:\/\/[^\s\x00-\x1f\x7f<>\\]+$/;

/**
 * http か https の URL。
 * z.url() は前後の空白などを取り除いた値を返すので使わず、値は書き換えずに判定する。
 */
export const HttpUrl = z
  .string()
  .regex(HTTP_URL_PATTERN, "http か https の URL で書いてください（空白、< > \\ は使えません）")
  .refine((v) => URL.canParse(v), { message: "URL として読めません" })
  .meta({ format: "uri" })
  .describe("http か https の URL");

/**
 * 組織の識別子に使える形。スキームは http、https、did、urn だけ（小文字）。
 * - `http://`、`https://`: 組織の Web ページなどの URL
 * - `did:<メソッド名>:`: OB 3.0 の発行者で使われる DID（メソッド名は小文字の英数字）
 * - `urn:<名前空間>:`: 法人番号などの URN（名前空間は英数字とハイフンで 32 文字まで）
 * 空白、制御文字、`<`、`>`、`\` は使えない。
 */
export const ORGANIZATION_ID_PATTERN =
  /^(?:https?:\/\/|did:[a-z0-9]+:|urn:[A-Za-z0-9][A-Za-z0-9-]{0,31}:)[^\s\x00-\x1f\x7f<>\\]+$/;

/**
 * 組織の識別子（URL、DID、URN）。`javascript:` や `data:` などは使えない。
 * z.url() は前後の空白などを取り除いた値を返すので使わず、値は書き換えずに判定する。
 */
export const OrganizationId = z
  .string()
  .regex(
    ORGANIZATION_ID_PATTERN,
    "http か https の URL、did: の DID、urn: の URN で書いてください（空白、< > \\ は使えません）",
  )
  .refine((v) => URL.canParse(v), { message: "URI として読めません" })
  .meta({ format: "uri" })
  .describe("組織の識別子（http か https の URL、did: の DID、urn: の URN）");

/** 組織 */
export const Organization = z.object({
  name: LocalizedText,
  /** 組織の識別子。許す形は OrganizationId を参照 */
  id: OrganizationId.optional(),
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
