import { Ajv2020 } from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";
import {
  HTTP_URL_PATTERN,
  ORGANIZATION_ID_PATTERN,
  completionCertificateProfile,
  euMicrocredentialProfile,
  microCredentialProfile,
  profiles,
  toJsonSchema,
  validateMetadata,
} from "../src/index.ts";
import {
  minimalDescriptors,
  validCompletionCertificate,
  validDescriptors,
  unsafeUrlDescriptors,
  validEuMicrocredential,
} from "./fixtures.ts";

const validate = (input: unknown) => validateMetadata(microCredentialProfile, input);

describe("microcredential（記述子の構造化データ）", () => {
  it("記載例の構造化データを通す", () => {
    expect(validate(validDescriptors).success).toBe(true);
  });

  it("必須の記述子だけでも通す", () => {
    expect(validate(minimalDescriptors).success).toBe(true);
  });

  it("文章で入る 11 記述子と type だけを持つ", () => {
    // 発行機関、発行日、学習者、名称、内容、発行国は OB 3.0 本体の項目に入るので、ここには持たない
    expect(Object.keys(microCredentialProfile.schema.shape)).toEqual([
      "type",
      "learningOutcomes",
      "languages",
      "participation",
      "learnerEffort",
      "assessments",
      "qualityAssurance",
      "levels",
      "certification",
      "recognitions",
      "prerequisites",
      "stackableInto",
    ]);
  });

  it("必須の記述子が欠けていたら落とす", () => {
    const { qualityAssurance: _, ...missing } = validDescriptors;
    const result = validate(missing);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.issues[0]?.path).toEqual(["qualityAssurance"]);
  });

  it("type に MicroCredentialDescriptors が無ければ落とす", () => {
    expect(validate({ ...validDescriptors, type: ["Something"] }).success).toBe(false);
  });

  it("総学習時間が 10 時間未満なら落とす", () => {
    const result = validate({ ...validDescriptors, learnerEffort: { totalHours: 9 } });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.issues[0]?.path).toEqual(["learnerEffort", "totalHours"]);
  });

  it("数値が 0.25 の倍数でない、または 100000 を超えるなら落とす", () => {
    // 文章にすると "1e+21" や "10.299999999999999" になる値
    for (const totalHours of [1e21, 0.1 + 10.2, 10.1, 100000.25]) {
      const result = validate({ ...validDescriptors, learnerEffort: { totalHours } });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.issues[0]?.path).toEqual(["learnerEffort", "totalHours"]);
    }
    const amount = validate({
      ...validDescriptors,
      recognitions: [{ kind: "credit", scheme: "UCTS", amount: 0.1 }],
    });
    expect(amount.success).toBe(false);
    if (!amount.success) expect(amount.issues[0]?.path).toEqual(["recognitions", 0, "amount"]);
  });

  it("0.25 の倍数の小数と、上限の 100000 は通す", () => {
    expect(
      validate({ ...validDescriptors, learnerEffort: { totalHours: 100000, contactHours: 0.75 } })
        .success,
    ).toBe(true);
    expect(validate({ ...validDescriptors, learnerEffort: { totalHours: 10.25 } }).success).toBe(
      true,
    );
  });

  it("決まりに無い項目名を落とす", () => {
    // totalHours の打ち間違い
    expect(validate({ ...validDescriptors, learnerEffort: { totalHour: 90 } }).success).toBe(false);
    expect(validate({ ...validDescriptors, level: [] }).success).toBe(false);
  });

  it("選択の配列が空なら落とす", () => {
    expect(validate({ ...validDescriptors, levels: [] }).success).toBe(false);
  });

  it("語彙に無い値を落とす", () => {
    expect(
      validate({ ...validDescriptors, participation: { mode: "remote" } }).success,
    ).toBe(false);
    expect(validate({ ...validDescriptors, assessments: [{ method: "quiz" }] }).success).toBe(
      false,
    );
  });

  it("言語タグでないキーのテキストを落とす", () => {
    const result = validate({
      ...validDescriptors,
      certification: { 日本語: "修了証をデジタル発行" },
    });
    expect(result.success).toBe(false);
  });

  describe("URL", () => {
    it.each(unsafeUrlDescriptors)("%s を落とす", (_, descriptors) => {
      expect(validate(descriptors).success).toBe(false);
    });

    const withUrl = (url: string): unknown => ({
      ...validDescriptors,
      levels: [{ framework: "EQF", value: "6", url }],
    });

    it.each([
      "https://example.org/eqf/6",
      "http://example.org/eqf/6",
      "https://example.org/skills/(v2)/[ds-1]?q=a&b=c#x",
      "https://例え.jp/パス",
    ])("http と https の URL を通す: %s", (url) => {
      expect(validate(withUrl(url)).success).toBe(true);
    });

    it.each([
      "javascript:alert(1)",
      "data:text/html,x",
      "ftp://example.org/x",
      "HTTPS://example.org/x",
      "//example.org/x",
      "https://",
      "https://example.org/a b",
      "https://example.org/x\n",
      " https://example.org/x",
      "https://example.org/<x>",
      "https://example.org/a\\b",
    ])("使えないスキームや文字を含む URL を落とす: %j", (url) => {
      const result = validate(withUrl(url));
      expect(result.success).toBe(false);
      if (!result.success) expect(result.issues[0]?.path).toEqual(["levels", 0, "url"]);
    });

    it("値を書き換えずに返す", () => {
      const result = validate(withUrl("https://example.org/eqf/6"));
      expect(result.success && result.data.levels?.[0]?.url).toBe("https://example.org/eqf/6");
    });

    it.each([
      ["qualityAssurance.external", { qualityAssurance: { internal: { name: { ja: "審査" } }, external: [{ name: { ja: "認証" }, url: "javascript:x" }] } }],
      ["prerequisites", { prerequisites: [{ description: { ja: "統計学" }, url: "javascript:x" }] }],
      ["stackableInto", { stackableInto: [{ name: { ja: "積み上げ先" }, url: "javascript:x" }] }],
    ])("%s の URL も同じ決まりで確かめる", (_, change) => {
      expect(validate({ ...validDescriptors, ...change }).success).toBe(false);
    });

    it("JSON Schema の URL の項目すべてに、スキームを限る pattern を出す", () => {
      const urls: unknown[] = [];
      const walk = (node: unknown): void => {
        if (typeof node !== "object" || node === null) return;
        if ("format" in node && node.format === "uri") urls.push(node);
        Object.values(node).forEach(walk);
      };
      walk(toJsonSchema(microCredentialProfile));
      // targetUrl、qualityAssurance の internal と external、levels、prerequisites、stackableInto
      expect(urls).toHaveLength(6);
      for (const url of urls) expect(url).toMatchObject({ pattern: HTTP_URL_PATTERN.source });
    });
  });

  describe("単位／その他の認定", () => {
    it('kind が "none" の 1 件だけなら通す', () => {
      expect(validate({ ...validDescriptors, recognitions: [{ kind: "none" }] }).success).toBe(
        true,
      );
    });

    it('kind が "none" をほかの認定と並べたら落とす', () => {
      const result = validate({
        ...validDescriptors,
        recognitions: [{ kind: "none" }, { kind: "credit", scheme: "UCTS", amount: 2 }],
      });
      expect(result.success).toBe(false);
    });

    it('kind が "none" に単位数があれば落とす', () => {
      const result = validate({
        ...validDescriptors,
        recognitions: [{ kind: "none", amount: 2 }],
      });
      expect(result.success).toBe(false);
    });

    it("1 件も無ければ落とす", () => {
      expect(validate({ ...validDescriptors, recognitions: [] }).success).toBe(false);
    });
  });

  describe("項目どうしの関係と重複", () => {
    it("授業時間が総学習時間を超えたら落とす", () => {
      const result = validate({
        ...validDescriptors,
        learnerEffort: { totalHours: 10, contactHours: 500 },
      });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.issues[0]?.path).toEqual(["learnerEffort", "contactHours"]);
    });

    it("授業時間が総学習時間と同じなら通す", () => {
      expect(
        validate({ ...validDescriptors, learnerEffort: { totalHours: 10, contactHours: 10 } })
          .success,
      ).toBe(true);
    });

    it("授業言語が重なっていたら落とす", () => {
      const result = validate({ ...validDescriptors, languages: ["ja", "ja"] });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.issues[0]?.path).toEqual(["languages"]);
    });

    it("授業言語が大文字小文字だけ違って重なっていたら落とす", () => {
      expect(validate({ ...validDescriptors, languages: ["ja", "JA"] }).success).toBe(false);
      expect(validate({ ...validDescriptors, languages: ["zh-Hant", "zh-hant"] }).success).toBe(
        false,
      );
    });

    it("テキストに大文字小文字だけ違うキーがあれば落とす", () => {
      const result = validate({ ...validDescriptors, certification: { ja: "A", JA: "B" } });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.issues[0]?.path).toEqual(["certification"]);
    });

    it("テキストのキーは書かれたとおりに扱う", () => {
      // 大文字を含むタグも、重ならなければ通す
      expect(
        validate({ ...validDescriptors, certification: { ja: "A", "zh-Hant": "B" } }).success,
      ).toBe(true);
    });
  });
});

describe("eu-microcredential", () => {
  it("11 項目そろったメタデータを通す", () => {
    expect(validateMetadata(euMicrocredentialProfile, validEuMicrocredential).success).toBe(true);
  });

  it("必須 11 項目をすべて持つ", () => {
    expect(Object.keys(euMicrocredentialProfile.schema.shape)).toHaveLength(11);
  });

  it("項目が欠けていたら落とす", () => {
    const { qualityAssurance: _, ...missing } = validEuMicrocredential;
    const result = validateMetadata(euMicrocredentialProfile, missing);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.issues[0]?.path).toEqual(["qualityAssurance"]);
  });

  it("国コードの書式を確かめる", () => {
    const result = validateMetadata(euMicrocredentialProfile, {
      ...validEuMicrocredential,
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

describe("組織の識別子（Organization.id）", () => {
  const withProviderId = (id: string): unknown => ({
    ...validCompletionCertificate,
    provider: { name: { ja: "サンプル大学" }, id },
  });

  it("値を書き換えずに返す", () => {
    const result = validateMetadata(
      completionCertificateProfile,
      withProviderId("did:web:example.ac.jp"),
    );
    expect(result.success && result.data.provider.id).toBe("did:web:example.ac.jp");
  });

  it("使えないスキームの識別子を、id の位置で落とす", () => {
    const result = validateMetadata(
      completionCertificateProfile,
      withProviderId("javascript:alert(1)"),
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.issues[0]?.path).toEqual(["provider", "id"]);
  });

  it("JSON Schema に、スキームを限る pattern を出す", () => {
    const schema: any = toJsonSchema(completionCertificateProfile);
    const provider = schema.properties.provider;
    expect(provider.properties.id).toMatchObject({ pattern: ORGANIZATION_ID_PATTERN.source });
  });
});

describe("JSON Schema", () => {
  it.each(profiles.map((p) => [p.id, p] as const))("%s の JSON Schema を作れる", (_, profile) => {
    const schema = toJsonSchema(profile);
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.type).toBe("object");
  });

  describe("microcredential の項目どうしの関係と重複", () => {
    const validateJson = new Ajv2020({ strict: false, validateFormats: false }).compile(
      toJsonSchema(microCredentialProfile),
    );

    it("書かれたとおりに同じ授業言語の重複を落とす", () => {
      expect(validateJson({ ...validDescriptors, languages: ["ja", "ja"] })).toBe(false);
    });

    // 次の 3 つは JSON Schema で書けないので、validateMetadata() だけが落とす
    it.each([
      ["授業時間が総学習時間を超える", { learnerEffort: { totalHours: 10, contactHours: 500 } }],
      ["授業言語が大文字小文字だけ違って重なる", { languages: ["ja", "JA"] }],
      ["テキストに大文字小文字だけ違うキーがある", { certification: { ja: "A", JA: "B" } }],
    ])("%s値は確かめない", (_, change) => {
      const input = { ...validDescriptors, ...change };
      expect(validate(input).success).toBe(false);
      expect(validateJson(input)).toBe(true);
    });
  });

  it("プロファイル id が重複しない", () => {
    const ids = profiles.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
