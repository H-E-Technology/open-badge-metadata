import { Ajv2019 } from "ajv/dist/2019.js";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";
import exampleBadge from "../examples/microcredential-badge.json" with { type: "json" };
import obCredentialSchema from "./vendor/ob_v3p0_achievementcredential_schema.json" with { type: "json" };
import {
  OB_CREDENTIAL_SCHEMA_URL,
  narrativeTestVectors,
  toCredentialJsonSchema,
  type NarrativeTestVector,
} from "../src/index.ts";

/*
 * 記載例と照合用データで組んだバッジが、credentialSchema に並べる 2 つの JSON Schema
 * （OB 3.0 本体のものと、このルールのもの）を通ることを確かめる。
 * OB 3.0 本体の JSON Schema は tests/vendor/ に写したものを使い、ネットワークは使わない。
 * OB 3.0 本体の JSON Schema は format（date-time、uri など）も検証する。
 * このルールの JSON Schema は、ほかのテストと同じく format を検証しない。
 */

const ajv = new Ajv2019({ strict: false, allErrors: true });
addFormats.default(ajv);
const validateObSchema = ajv.compile(obCredentialSchema);
const validateRule = new Ajv2019({ strict: false, validateFormats: false }).compile(
  toCredentialJsonSchema(),
);

/** 記載例の構造化データと文章を、照合用データのものに差し替えたバッジ */
const badgeFrom = (vector: NarrativeTestVector): unknown => {
  const badge = structuredClone(exampleBadge) as { credentialSubject: { achievement: Record<string, unknown> } };
  badge.credentialSubject.achievement.microCredentialDescriptors = vector.descriptors;
  badge.credentialSubject.achievement.criteria = { narrative: vector.narrative };
  return badge;
};

describe("OB 3.0 本体の JSON Schema", () => {
  it("写しは credentialSchema に入れる URL のものである", () => {
    expect(obCredentialSchema.$id).toBe(OB_CREDENTIAL_SCHEMA_URL);
  });

  it("記載例のバッジを通す", () => {
    expect(validateObSchema(exampleBadge) ? [] : validateObSchema.errors).toEqual([]);
  });

  it.each(narrativeTestVectors.map((v) => [v.name, v] as const))(
    "照合用データ「%s」で組んだバッジを、OB 3.0 本体とこのルールの両方の JSON Schema で通す",
    (_, vector) => {
      const badge = badgeFrom(vector);
      expect(validateObSchema(badge) ? [] : validateObSchema.errors).toEqual([]);
      expect(validateRule(badge) ? [] : validateRule.errors).toEqual([]);
    },
  );

  it("OB 3.0 本体の必須項目が無いバッジを落とす", () => {
    const { issuer: _, ...rest } = exampleBadge;
    expect(validateObSchema(rest)).toBe(false);
  });
});
