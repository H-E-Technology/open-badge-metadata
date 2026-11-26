import { z } from "zod";
import { toCriteriaNarrative } from "./narrative.ts";
import type { ValidationResult } from "./profile.ts";
import { Alignment, MicroCredentialDescriptors } from "./profiles/microcredential.ts";
import {
  ACHIEVEMENT_TYPE,
  CONTEXT_URL,
  CREDENTIAL_SCHEMA_URL,
  FRAMEWORK_URLS,
  OB_CONTEXT_URL_PATTERN,
  OB_EXTENSIONS_CONTEXT_URL,
  SCHEMA_VALIDATOR_TYPE,
  VC_CONTEXT_URL,
} from "./rule.ts";

/**
 * 格納ルールに沿ったバッジ全体（OpenBadgeCredential）の検証。
 *
 * 確かめるのは、このルールとガイドライン 3.0 が求めることだけ。
 * 署名や、OB 3.0 本体の項目の細かい形（issuer.type など）は確かめない。
 * そちらは OB 3.0 本体の JSON Schema と検証ツールに任せる。
 * そのため、ここに無い項目はそのまま通す（looseObject）。
 */

const CredentialSchemaEntry = z.looseObject({
  id: z.string().min(1),
  type: z.string().min(1),
});

export const MicroCredentialBadge = z
  .looseObject({
    "@context": z.array(z.unknown()).min(1),
    type: z.array(z.string()),
    /** 発行機関。ガイドライン 3.0 は、名前を実際の発行では必須としている */
    issuer: z.looseObject({
      id: z.string().min(1),
      name: z.string().min(1),
    }),
    /** 発行日 */
    validFrom: z.string().min(1),
    credentialSchema: z.union([CredentialSchemaEntry, z.array(CredentialSchemaEntry)]),
    credentialSubject: z
      .looseObject({
        id: z.string().min(1).optional(),
        identifier: z.array(z.unknown()).min(1).optional(),
        achievement: z.looseObject({
          /** マイクロクレデンシャル名称 */
          name: z.string().min(1),
          /** 内容 */
          description: z.string().min(1),
          achievementType: z.literal(ACHIEVEMENT_TYPE),
          alignment: z.array(Alignment).min(1),
          criteria: z.looseObject({
            narrative: z.string().min(1),
          }),
          microCredentialDescriptors: MicroCredentialDescriptors,
        }),
      })
      .refine((subject) => subject.id !== undefined || subject.identifier !== undefined, {
        message: "学習者を識別する情報として、id か identifier のどちらかを入れてください",
      }),
  })
  .superRefine((badge, ctx) => {
    // 1 番目と 2 番目は位置で確かめる。拡張用とこのルールのコンテキストは、3 番目以降のどこかにあればよい
    const contexts = badge["@context"];
    if (contexts[0] !== VC_CONTEXT_URL) {
      ctx.addIssue({
        code: "custom",
        path: ["@context", 0],
        message: `@context の 1 番目は ${VC_CONTEXT_URL} にしてください`,
      });
    }
    if (typeof contexts[1] !== "string" || !OB_CONTEXT_URL_PATTERN.test(contexts[1])) {
      ctx.addIssue({
        code: "custom",
        path: ["@context", 1],
        message: "@context の 2 番目は Open Badges 3.0 のコンテキストにしてください",
      });
    }
    const rest = contexts.slice(2);
    if (!rest.includes(OB_EXTENSIONS_CONTEXT_URL)) {
      ctx.addIssue({
        code: "custom",
        path: ["@context"],
        message: `@context の 3 番目以降に、credentialSchema の type を定義する ${OB_EXTENSIONS_CONTEXT_URL} を入れてください`,
      });
    }
    if (!rest.includes(CONTEXT_URL)) {
      ctx.addIssue({
        code: "custom",
        path: ["@context"],
        message: `@context の 3 番目以降に、このルールのコンテキスト ${CONTEXT_URL} を入れてください`,
      });
    }

    if (
      !badge.type.includes("VerifiableCredential") ||
      !(badge.type.includes("OpenBadgeCredential") || badge.type.includes("AchievementCredential"))
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["type"],
        message: "type に VerifiableCredential と、OpenBadgeCredential（または AchievementCredential）を入れてください",
      });
    }

    const schemas = Array.isArray(badge.credentialSchema)
      ? badge.credentialSchema
      : [badge.credentialSchema];
    if (!schemas.some((s) => s.id === CREDENTIAL_SCHEMA_URL && s.type === SCHEMA_VALIDATOR_TYPE)) {
      ctx.addIssue({
        code: "custom",
        path: ["credentialSchema"],
        message: `credentialSchema に、このルールの JSON Schema ${CREDENTIAL_SCHEMA_URL}（type は ${SCHEMA_VALIDATOR_TYPE}）を入れてください`,
      });
    }

    const achievement = badge.credentialSubject.achievement;
    const frameworkUrls: readonly string[] = FRAMEWORK_URLS;
    if (!achievement.alignment.some((a) => frameworkUrls.includes(a.targetUrl))) {
      ctx.addIssue({
        code: "custom",
        path: ["credentialSubject", "achievement", "alignment"],
        message: "alignment に、マイクロクレデンシャルのフレームワーク 1.0 の名前と URL を入れてください",
      });
    }

    // 構造化データの形が合っていないときは、そちらの指摘だけを出す。文章との照合はしない
    const descriptors = MicroCredentialDescriptors.safeParse(achievement.microCredentialDescriptors);
    if (
      descriptors.success &&
      achievement.criteria.narrative !== toCriteriaNarrative(descriptors.data)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["credentialSubject", "achievement", "criteria", "narrative"],
        message:
          "criteria.narrative が、microCredentialDescriptors から作った文章と一致しません。toCriteriaNarrative() で作り直してください",
      });
    }
  });
export type MicroCredentialBadge = z.infer<typeof MicroCredentialBadge>;

/** バッジ全体が格納ルールに沿っているかを調べる */
export function validateBadge(input: unknown): ValidationResult<MicroCredentialBadge> {
  const result = MicroCredentialBadge.safeParse(input);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, issues: result.error.issues };
}

/** zod のスキーマから、$schema を除いた JSON Schema を作る（ほかの JSON Schema に埋め込む用） */
function embeddedJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const { $schema: _, ...rest } = z.toJSONSchema(schema, { target: "draft-2020-12" });
  return rest;
}

/** JSON Schema で、空でない文字列 */
const NON_EMPTY_STRING = { type: "string", minLength: 1 } as const;

/** JSON Schema で、配列にこの値を含む */
const containsValue = (value: string) => ({ contains: { const: value } });

/**
 * バッジの credentialSchema に入れる JSON Schema（Draft 2019-09）。
 *
 * TypeScript 以外からも使えるよう、validateBadge() が確かめる決まりを JSON Schema で書く。
 * 同じ入力に validateBadge() と同じ結果を返す。ただし、次は JSON Schema では書けないので含まない。
 * - criteria.narrative が、構造化データから作った文章と一致すること
 * - URL の書式（format: "uri" で示す。確かめるかどうかは検証ツールによる）
 */
export function toCredentialJsonSchema(): Record<string, unknown> {
  const credentialSchemaEntry = {
    type: "object",
    required: ["id", "type"],
    properties: { id: NON_EMPTY_STRING, type: NON_EMPTY_STRING },
  };
  const ruleCredentialSchema = {
    type: "object",
    required: ["id", "type"],
    properties: { id: { const: CREDENTIAL_SCHEMA_URL }, type: { const: SCHEMA_VALIDATOR_TYPE } },
  };

  return {
    $schema: "https://json-schema.org/draft/2019-09/schema",
    $id: CREDENTIAL_SCHEMA_URL,
    title: "マイクロクレデンシャル記述子の格納ルール",
    description:
      "Open Badges 3.0 のバッジに、マイクロクレデンシャルの記述子を構造化して入れるときの形",
    type: "object",
    required: ["@context", "type", "issuer", "validFrom", "credentialSchema", "credentialSubject"],
    properties: {
      "@context": {
        type: "array",
        minItems: 1,
        // 1 番目は VC 2.0、2 番目は OB 3.0 のコンテキスト（Draft 2019-09 の、配列で書く items）。
        // 拡張用とこのルールのコンテキストは、どちらも 1 番目と 2 番目の値にはなり得ないので、
        // contains で 3 番目以降のどこかにあることを確かめられる。2 つの順は問わない
        items: [
          { const: VC_CONTEXT_URL },
          { type: "string", pattern: OB_CONTEXT_URL_PATTERN.source },
        ],
        allOf: [containsValue(OB_EXTENSIONS_CONTEXT_URL), containsValue(CONTEXT_URL)],
      },
      type: {
        type: "array",
        items: { type: "string" },
        allOf: [
          containsValue("VerifiableCredential"),
          {
            anyOf: [containsValue("OpenBadgeCredential"), containsValue("AchievementCredential")],
          },
        ],
      },
      issuer: {
        type: "object",
        required: ["id", "name"],
        properties: { id: NON_EMPTY_STRING, name: NON_EMPTY_STRING },
      },
      validFrom: NON_EMPTY_STRING,
      credentialSchema: {
        anyOf: [
          { allOf: [credentialSchemaEntry, ruleCredentialSchema] },
          { type: "array", items: credentialSchemaEntry, contains: ruleCredentialSchema },
        ],
      },
      credentialSubject: {
        type: "object",
        required: ["achievement"],
        // 学習者を識別する情報として、id か identifier のどちらか
        anyOf: [{ required: ["id"] }, { required: ["identifier"] }],
        properties: {
          id: NON_EMPTY_STRING,
          identifier: { type: "array", minItems: 1 },
          achievement: {
            type: "object",
            required: [
              "name",
              "description",
              "achievementType",
              "alignment",
              "criteria",
              "microCredentialDescriptors",
            ],
            properties: {
              name: NON_EMPTY_STRING,
              description: NON_EMPTY_STRING,
              achievementType: { const: ACHIEVEMENT_TYPE },
              alignment: {
                type: "array",
                minItems: 1,
                items: embeddedJsonSchema(Alignment),
                // フレームワーク 1.0 を入れる
                contains: {
                  type: "object",
                  required: ["targetUrl"],
                  properties: { targetUrl: { enum: [...FRAMEWORK_URLS] } },
                },
              },
              criteria: {
                type: "object",
                required: ["narrative"],
                properties: { narrative: NON_EMPTY_STRING },
              },
              microCredentialDescriptors: embeddedJsonSchema(MicroCredentialDescriptors),
            },
          },
        },
      },
    },
  };
}
