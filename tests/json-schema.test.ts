import { Ajv2019 } from "ajv/dist/2019.js";
import { Ajv2020 } from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";
import exampleBadge from "../examples/microcredential-badge.json" with { type: "json" };
import {
  CONTEXT_URL,
  CREDENTIAL_SCHEMA_URL,
  OB_EXTENSIONS_CONTEXT_URL,
  completionCertificateProfile,
  euMicrocredentialProfile,
  microCredentialProfile,
  toCredentialJsonSchema,
  toCriteriaNarrative,
  toJsonSchema,
  validateBadge,
  validateMetadata,
  type MicroCredentialDescriptors,
} from "../src/index.ts";
import {
  minimalDescriptors,
  validCompletionCertificate,
  validEuMicrocredential,
} from "./fixtures.ts";

/*
 * 配信する JSON Schema（schema.json と dist/schemas/*.json）が、
 * validateBadge() / validateMetadata() と同じ入力で同じ結果になることを確かめる。
 * 書き換えの例は両方に通し、結果をそろえて比べる。
 */

// テストでは JSON を自由に書き換えるので、型を付けない
type Json = any;

const ajvOptions = { strict: false, validateFormats: false } as const;
const validateBadgeSchema = new Ajv2019(ajvOptions).compile(toCredentialJsonSchema());
const validateProfileSchema = new Ajv2020(ajvOptions).compile(toJsonSchema(microCredentialProfile));

const baseDescriptors = (): Json =>
  structuredClone(exampleBadge.credentialSubject.achievement.microCredentialDescriptors);

/** 構造化データの書き換え。期待する結果（通すか）と組にする */
const descriptorCases: [name: string, change: (d: Json) => void, valid: boolean][] = [
  ["記載例のまま", () => {}, true],
  ["type に MicroCredentialDescriptors が無い", (d) => (d.type = ["Foo"]), false],
  ["type が空", (d) => (d.type = []), false],
  ["type にほかの値も並べる", (d) => (d.type = ["MicroCredentialDescriptors", "Other"]), true],
  ["テキストに言語が 1 つも無い", (d) => (d.learningOutcomes[0].description = {}), false],
  ["省略できるテキストでも、言語が 1 つも無い", (d) => (d.certification = {}), false],
  [
    'kind が "none" の認定を、ほかの認定と並べる',
    (d) => (d.recognitions = [{ kind: "none" }, { kind: "credit", amount: 2 }]),
    false,
  ],
  [
    'kind が "none" の認定を、ほかの認定の後に並べる',
    (d) => (d.recognitions = [{ kind: "credit", amount: 2 }, { kind: "none" }]),
    false,
  ],
  [
    'kind が "none" の認定に amount を書く',
    (d) => (d.recognitions = [{ kind: "none", amount: 3 }]),
    false,
  ],
  [
    'kind が "none" の認定に scheme を書く',
    (d) => (d.recognitions = [{ kind: "none", scheme: "UCTS" }]),
    false,
  ],
  ['kind が "none" の認定 1 件だけ', (d) => (d.recognitions = [{ kind: "none" }]), true],
  [
    'kind が "none" の認定 1 件に説明を書く',
    (d) => (d.recognitions = [{ kind: "none", description: { ja: "認定なし" } }]),
    true,
  ],
  [
    "none 以外の認定は scheme と amount を省ける",
    (d) => (d.recognitions = [{ kind: "other" }, { kind: "credit", scheme: "UCTS" }]),
    true,
  ],
  ["認定が空", (d) => (d.recognitions = []), false],
  [
    "学修成果の alignment の type に Alignment が無い",
    (d) =>
      (d.learningOutcomes[0].alignment = {
        type: ["X"],
        targetName: "スキル標準",
        targetUrl: "https://example.org/skills/1",
      }),
    false,
  ],
  [
    "学修成果の alignment の type に Alignment とほかの値",
    (d) =>
      (d.learningOutcomes[0].alignment = {
        type: ["Alignment", "Extra"],
        targetName: "スキル標準",
        targetUrl: "https://example.org/skills/1",
      }),
    true,
  ],
  [
    "学修成果の alignment に OB 3.0 の 7 項目をすべて書く",
    (d) =>
      (d.learningOutcomes[0].alignment = {
        type: ["Alignment"],
        targetName: "スキル標準",
        targetUrl: "https://example.org/skills/1",
        targetCode: "DS-1",
        targetDescription: "データ分析の基礎",
        targetFramework: "サンプルスキル標準",
        targetType: "ceasn:Competency",
      }),
    true,
  ],
  [
    "学修成果の alignment に決まりに無い項目",
    (d) =>
      (d.learningOutcomes[0].alignment = {
        type: ["Alignment"],
        targetName: "a",
        targetUrl: "https://e.org/a",
        foo: "x",
      }),
    false,
  ],
  [
    "学修成果の alignment に targetName が無い",
    (d) =>
      (d.learningOutcomes[0].alignment = {
        type: ["Alignment"],
        targetUrl: "https://e.org/a",
      }),
    false,
  ],
  ["総学習時間が 10 時間未満", (d) => (d.learnerEffort.totalHours = 5), false],
  ["決まりに無い項目名", (d) => (d.learnerEffort.totalHour = 90), false],
  ["言語タグの書式に合わない", (d) => (d.languages = ["日本語"]), false],
  ["同じ言語を重ねる", (d) => (d.languages = ["ja", "ja"]), false],
  ["授業時間が総学習時間と同じ", (d) => (d.learnerEffort.contactHours = 90), true],
  ["総学習時間が 0.25 の倍数の小数", (d) => (d.learnerEffort.totalHours = 90.75), true],
  ["総学習時間が 0.25 の倍数でない", (d) => (d.learnerEffort.totalHours = 10.3), false],
  ["総学習時間に丸めの誤差がある", (d) => (d.learnerEffort.totalHours = 0.1 + 10.2), false],
  ["総学習時間が上限と同じ", (d) => (d.learnerEffort.totalHours = 100000), true],
  ["総学習時間が上限を超える", (d) => (d.learnerEffort.totalHours = 100000.25), false],
  ["総学習時間が指数表記になる大きさ", (d) => (d.learnerEffort.totalHours = 1e21), false],
  ["授業時間が 0.25 の倍数でない", (d) => (d.learnerEffort.contactHours = 0.1), false],
  ["授業時間が 0", (d) => (d.learnerEffort.contactHours = 0), true],
  [
    "認定の数が 0.25 の倍数の小数",
    (d) => (d.recognitions = [{ kind: "credit", scheme: "UCTS", amount: 0.5 }]),
    true,
  ],
  [
    "認定の数が 0.25 の倍数でない",
    (d) => (d.recognitions = [{ kind: "continuingEducation", scheme: "CEU", amount: 1.2 }]),
    false,
  ],
  [
    "認定の数が上限を超える",
    (d) => (d.recognitions = [{ kind: "credit", scheme: "UCTS", amount: 100000.25 }]),
    false,
  ],
];

/** validateMetadata() では落とし、JSON Schema では確かめない書き換え */
const zodOnlyCases: [name: string, change: (d: Json) => void][] = [
  ["大文字小文字だけが違う言語を重ねる", (d) => (d.languages = ["ja", "JA"])],
  ["授業時間が総学習時間を超える", (d) => (d.learnerEffort.contactHours = 91)],
  [
    "テキストに大文字小文字だけが違う言語タグを並べる",
    (d) => (d.certification = { ja: "認定", JA: "認定" }),
  ],
];

/** 構造化データを差し替えたバッジ。構造化データが正しければ、文章もそれに合わせて作り直す */
const badgeWithDescriptors = (descriptors: Json): Json => {
  const badge: Json = structuredClone(exampleBadge);
  badge.credentialSubject.achievement.microCredentialDescriptors = descriptors;
  const parsed = validateMetadata(microCredentialProfile, descriptors);
  if (parsed.success) {
    badge.credentialSubject.achievement.criteria.narrative = toCriteriaNarrative(parsed.data);
  }
  return badge;
};

/** バッジの、構造化データの外の書き換え */
const badgeCases: [name: string, change: (b: Json) => void, valid: boolean][] = [
  ["記載例のまま", () => {}, true],
  [
    "バッジの type に VerifiableCredential が無い",
    (b) => (b.type = ["OpenBadgeCredential"]),
    false,
  ],
  [
    "バッジの type に OpenBadgeCredential が無い",
    (b) => (b.type = ["VerifiableCredential"]),
    false,
  ],
  [
    "バッジの type が AchievementCredential",
    (b) => (b.type = ["VerifiableCredential", "AchievementCredential"]),
    true,
  ],
  [
    "@context にこのルールのコンテキストが無い",
    (b) => (b["@context"] = b["@context"].filter((c: string) => c !== CONTEXT_URL)),
    false,
  ],
  [
    "@context に拡張用のコンテキストが無い",
    (b) => (b["@context"] = b["@context"].filter((c: string) => c !== OB_EXTENSIONS_CONTEXT_URL)),
    false,
  ],
  [
    "@context の 1 番目と 2 番目が逆",
    (b) => {
      const [vc, ob, ...rest] = b["@context"];
      b["@context"] = [ob, vc, ...rest];
    },
    false,
  ],
  [
    "@context の 2 番目が OB 3.0.x のほかの版",
    (b) => (b["@context"][1] = "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.2.json"),
    true,
  ],
  [
    "@context の 2 番目が OB 3.0 ではない",
    (b) => (b["@context"][1] = "https://example.org/context.json"),
    false,
  ],
  ["発行機関の名前が無い", (b) => delete b.issuer.name, false],
  ["発行機関が文字列", (b) => (b.issuer = "https://example.com/issuers/876543"), false],
  ["発行日が無い", (b) => delete b.validFrom, false],
  [
    "credentialSchema にこのルールの JSON Schema が無い",
    (b) =>
      (b.credentialSchema = b.credentialSchema.filter((s: Json) => s.id !== CREDENTIAL_SCHEMA_URL)),
    false,
  ],
  ["credentialSchema の type が違う", (b) => (b.credentialSchema[1].type = "JsonSchema"), false],
  [
    "credentialSchema がこのルールの JSON Schema 1 件だけ（配列でない）",
    (b) => (b.credentialSchema = b.credentialSchema[1]),
    true,
  ],
  [
    "credentialSchema がほかの JSON Schema 1 件だけ（配列でない）",
    (b) => (b.credentialSchema = b.credentialSchema[0]),
    false,
  ],
  ["学習者を識別する情報が無い", (b) => delete b.credentialSubject.id, false],
  [
    "学習者を identifier で識別する",
    (b) => {
      delete b.credentialSubject.id;
      b.credentialSubject.identifier = [{ type: "IdentityObject", identityHash: "x" }];
    },
    true,
  ],
  [
    "identifier が空",
    (b) => {
      delete b.credentialSubject.id;
      b.credentialSubject.identifier = [];
    },
    false,
  ],
  [
    "achievementType が MicroCredential ではない",
    (b) => (b.credentialSubject.achievement.achievementType = "Certificate"),
    false,
  ],
  ["名称が無い", (b) => delete b.credentialSubject.achievement.name, false],
  ["内容が空", (b) => (b.credentialSubject.achievement.description = ""), false],
  [
    "alignment の type に Alignment が無い",
    (b) => (b.credentialSubject.achievement.alignment[0].type = ["X"]),
    false,
  ],
  [
    "alignment にフレームワークが無い",
    (b) =>
      (b.credentialSubject.achievement.alignment = [
        { type: ["Alignment"], targetName: "別の枠組み", targetUrl: "https://example.org/other" },
      ]),
    false,
  ],
  [
    "alignment にフレームワークとほかの枠組み",
    (b) =>
      b.credentialSubject.achievement.alignment.push({
        type: ["Alignment"],
        targetName: "別の枠組み",
        targetUrl: "https://example.org/other",
      }),
    true,
  ],
  ["alignment が空", (b) => (b.credentialSubject.achievement.alignment = []), false],
  [
    "alignment に決まりに無い項目",
    (b) => (b.credentialSubject.achievement.alignment[0].foo = "x"),
    false,
  ],
  [
    "alignment に OB 3.0 の 7 項目をすべて書く",
    (b) =>
      Object.assign(b.credentialSubject.achievement.alignment[0], {
        targetCode: "MC-1.0",
        targetDescription: "マイクロクレデンシャルのフレームワーク",
        targetFramework: "マイクロクレデンシャルのフレームワーク",
        targetType: "CTDL",
      }),
    true,
  ],
  [
    "criteria.narrative が無い",
    (b) => delete b.credentialSubject.achievement.criteria.narrative,
    false,
  ],
  [
    "構造化データが無い",
    (b) => delete b.credentialSubject.achievement.microCredentialDescriptors,
    false,
  ],
];

describe("構造化データ: validateMetadata() と dist/schemas/microcredential.json", () => {
  it.each(descriptorCases)("%s", (_, change, valid) => {
    const descriptors = baseDescriptors();
    change(descriptors);
    expect({
      validateMetadata: validateMetadata(microCredentialProfile, descriptors).success,
      jsonSchema: validateProfileSchema(descriptors),
    }).toEqual({ validateMetadata: valid, jsonSchema: valid });
  });

  it.each(zodOnlyCases)("JSON Schema では確かめない: %s", (_, change) => {
    const descriptors = baseDescriptors();
    change(descriptors);
    expect({
      validateMetadata: validateMetadata(microCredentialProfile, descriptors).success,
      jsonSchema: validateProfileSchema(descriptors),
    }).toEqual({ validateMetadata: false, jsonSchema: true });
  });

  it("必須の記述子だけのデータ", () => {
    expect(validateMetadata(microCredentialProfile, minimalDescriptors).success).toBe(true);
    expect(validateProfileSchema(minimalDescriptors)).toBe(true);
  });
});

describe("バッジ全体: validateBadge() と schema.json", () => {
  it.each(descriptorCases)("構造化データ: %s", (_, change, valid) => {
    const descriptors = baseDescriptors();
    change(descriptors);
    const badge = badgeWithDescriptors(descriptors);
    expect({
      validateBadge: validateBadge(badge).success,
      jsonSchema: validateBadgeSchema(badge),
    }).toEqual({ validateBadge: valid, jsonSchema: valid });
  });

  it.each(badgeCases)("%s", (_, change, valid) => {
    const badge: Json = structuredClone(exampleBadge);
    change(badge);
    expect({
      validateBadge: validateBadge(badge).success,
      jsonSchema: validateBadgeSchema(badge),
    }).toEqual({ validateBadge: valid, jsonSchema: valid });
  });

  it("文章と構造化データの一致は、JSON Schema では確かめない", () => {
    const badge: Json = structuredClone(exampleBadge);
    badge.credentialSubject.achievement.criteria.narrative = "別の文章";
    expect(validateBadge(badge).success).toBe(false);
    expect(validateBadgeSchema(badge)).toBe(true);
  });

  it("必須の記述子だけのバッジ", () => {
    const badge = badgeWithDescriptors(
      structuredClone(minimalDescriptors) as MicroCredentialDescriptors,
    );
    expect(validateBadge(badge).success).toBe(true);
    expect(validateBadgeSchema(badge)).toBe(true);
  });
});

describe("ほかのプロファイルの JSON Schema", () => {
  it.each([
    [euMicrocredentialProfile, validEuMicrocredential],
    [completionCertificateProfile, validCompletionCertificate],
  ] as const)("$0.id: 正しいメタデータを通す", (profile, metadata) => {
    expect(validateMetadata(profile, metadata).success).toBe(true);
    expect(new Ajv2020(ajvOptions).compile(toJsonSchema(profile))(metadata)).toBe(true);
  });

  describe("組織の識別子（Organization.id）", () => {
    const withOrgId = [
      [
        "eu-microcredential の awardingBody",
        euMicrocredentialProfile,
        (id: string): unknown => ({
          ...validEuMicrocredential,
          awardingBody: [{ name: { ja: "サンプル大学" }, id }],
        }),
      ],
      [
        "eu-microcredential の qualityAssurance.body",
        euMicrocredentialProfile,
        (id: string): unknown => ({
          ...validEuMicrocredential,
          qualityAssurance: { description: { ja: "審査" }, body: { name: { ja: "認証機関" }, id } },
        }),
      ],
      [
        "completion-certificate の provider",
        completionCertificateProfile,
        (id: string): unknown => ({
          ...validCompletionCertificate,
          provider: { name: { ja: "サンプル大学" }, id },
        }),
      ],
    ] as const;

    const ids: [id: string, valid: boolean][] = [
      ["https://example.ac.jp", true],
      ["http://example.ac.jp/about", true],
      ["did:example:ebfeb1f712ebc6f1c276e12ec21", true],
      ["did:web:example.ac.jp", true],
      ["urn:example:corporate-number:1234567890123", true],
      ["javascript:alert(1)", false],
      ["data:text/html,x", false],
      ["ftp://example.org/x", false],
      ["mailto:info@example.org", false],
      ["HTTPS://example.org", false],
      ["DID:example:x", false],
      ["did:Example:x", false],
      ["did:example:", false],
      ["urn:", false],
      ["urn:example", false],
      ["https://", false],
      [" https://example.org", false],
      ["https://example.org\n", false],
      ["https://example.org/a b", false],
      ["did:example:<x>", false],
      ["urn:example:a\\b", false],
    ];

    describe.each(withOrgId)("%s", (_, profile, withId) => {
      const validateJson = new Ajv2020(ajvOptions).compile(toJsonSchema(profile));
      it.each(ids)("%j", (id, valid) => {
        const metadata = withId(id);
        expect({
          validateMetadata: validateMetadata(profile, metadata).success,
          jsonSchema: validateJson(metadata),
        }).toEqual({ validateMetadata: valid, jsonSchema: valid });
      });
    });
  });

  it("テキストに言語が 1 つも無ければ、JSON Schema でも落とす", () => {
    const metadata = { ...validCompletionCertificate, programName: {} };
    expect(validateMetadata(completionCertificateProfile, metadata).success).toBe(false);
    expect(
      new Ajv2020(ajvOptions).compile(toJsonSchema(completionCertificateProfile))(metadata),
    ).toBe(false);
  });
});
