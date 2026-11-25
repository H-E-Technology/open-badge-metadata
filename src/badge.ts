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
    if (!contexts.includes(OB_EXTENSIONS_CONTEXT_URL)) {
      ctx.addIssue({
        code: "custom",
        path: ["@context"],
        message: `@context に、credentialSchema の type を定義する ${OB_EXTENSIONS_CONTEXT_URL} を入れてください`,
      });
    }
    if (!contexts.includes(CONTEXT_URL)) {
      ctx.addIssue({
        code: "custom",
        path: ["@context"],
        message: `@context に、このルールのコンテキスト ${CONTEXT_URL} を入れてください`,
      });
    }

    if (
      !badge.type.includes("VerifiableCredential") ||
      !(badge.type.includes("OpenBadgeCredential") || badge.type.includes("AchievementCredential"))
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["type"],
        message: "type に VerifiableCredential と OpenBadgeCredential を入れてください",
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

/**
 * バッジの credentialSchema に入れる JSON Schema（Draft 2019-09）。
 *
 * TypeScript 以外からも使えるよう、形だけを確かめる。
 * 文章と構造化データの一致は JSON Schema では書けないので、含まない。
 */
export function toCredentialJsonSchema(): Record<string, unknown> {
  const { $schema: _, ...descriptors } = z.toJSONSchema(MicroCredentialDescriptors, {
    target: "draft-2020-12",
  });
  return {
    $schema: "https://json-schema.org/draft/2019-09/schema",
    $id: CREDENTIAL_SCHEMA_URL,
    title: "マイクロクレデンシャル記述子の格納ルール",
    description:
      "Open Badges 3.0 のバッジに、マイクロクレデンシャルの記述子を構造化して入れるときの形",
    type: "object",
    required: ["@context", "credentialSubject"],
    properties: {
      "@context": {
        type: "array",
        allOf: [
          { contains: { const: OB_EXTENSIONS_CONTEXT_URL } },
          { contains: { const: CONTEXT_URL } },
        ],
      },
      credentialSubject: {
        type: "object",
        required: ["achievement"],
        properties: {
          achievement: {
            type: "object",
            required: ["achievementType", "alignment", "criteria", "microCredentialDescriptors"],
            properties: {
              achievementType: { const: ACHIEVEMENT_TYPE },
              alignment: { type: "array", minItems: 1 },
              criteria: {
                type: "object",
                required: ["narrative"],
                properties: { narrative: { type: "string", minLength: 1 } },
              },
              microCredentialDescriptors: descriptors,
            },
          },
        },
      },
    },
  };
}
