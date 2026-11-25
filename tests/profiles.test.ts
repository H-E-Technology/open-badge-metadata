import { describe, expect, it } from "vitest";
import {
  completionCertificateProfile,
  microcredentialProfile,
  profiles,
  toJsonSchema,
  validateMetadata,
} from "../src/index.ts";
import { validCompletionCertificate, validMicrocredential } from "./fixtures.ts";

describe("microcredential", () => {
  it("11 項目そろったメタデータを通す", () => {
    expect(validateMetadata(microcredentialProfile, validMicrocredential).success).toBe(true);
  });

  it("必須 11 項目をすべて持つ", () => {
    expect(Object.keys(microcredentialProfile.schema.shape)).toHaveLength(11);
  });

  it("項目が欠けていたら落とす", () => {
    const { qualityAssurance: _, ...missing } = validMicrocredential;
    const result = validateMetadata(microcredentialProfile, missing);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.issues[0]?.path).toEqual(["qualityAssurance"]);
  });

  it("国コードの書式を確かめる", () => {
    const result = validateMetadata(microcredentialProfile, {
      ...validMicrocredential,
      issuerCountry: "jpn",
    });
    expect(result.success).toBe(false);
  });
});

describe("completion-certificate", () => {
  it("正しいメタデータを通す", () => {
    expect(
      validateMetadata(completionCertificateProfile, validCompletionCertificate).success,
    ).toBe(true);
  });

  it("受講期間が逆転していたら落とす", () => {
    const result = validateMetadata(completionCertificateProfile, {
      ...validCompletionCertificate,
      period: { startDate: "2026-12-01", endDate: "2026-11-01" },
    });
    expect(result.success).toBe(false);
  });
});

describe("JSON Schema", () => {
  it.each(profiles.map((p) => [p.id, p] as const))("%s の JSON Schema を作れる", (_, profile) => {
    const schema = toJsonSchema(profile);
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.type).toBe("object");
  });

  it("プロファイル id が重複しない", () => {
    const ids = profiles.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
