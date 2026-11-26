import { Ajv2019 } from "ajv/dist/2019.js";
import { describe, expect, it } from "vitest";
import exampleBadge from "../examples/microcredential-badge.json" with { type: "json" };
import {
  CONTEXT_URL,
  CREDENTIAL_SCHEMA_URL,
  OB_EXTENSIONS_CONTEXT_URL,
  toCredentialJsonSchema,
  toCriteriaNarrative,
  validateBadge,
  type MicroCredentialDescriptors,
} from "../src/index.ts";
import { unsafeUrlDescriptors } from "./fixtures.ts";

/** 記載例の写しを作り、一部を書き換える */
const withChange = (change: (badge: typeof exampleBadge) => void): unknown => {
  const copy = structuredClone(exampleBadge);
  change(copy);
  return copy;
};

/** 記載例の構造化データを差し替え、文章もそれに合わせて作り直す */
const withDescriptors = (descriptors: unknown): unknown =>
  withChange((b) => {
    const achievement = b.credentialSubject.achievement as Record<string, unknown>;
    achievement.microCredentialDescriptors = descriptors;
    achievement.criteria = {
      narrative: toCriteriaNarrative(descriptors as MicroCredentialDescriptors),
    };
  });

/** 落ちた項目の場所を、ドットでつないだ文字列にする */
const failedPaths = (input: unknown): string[] => {
  const result = validateBadge(input);
  return result.success ? [] : result.issues.map((issue) => issue.path.join("."));
};

describe("validateBadge", () => {
  it("記載例のバッジを通す", () => {
    const result = validateBadge(exampleBadge);
    expect(result.success ? [] : result.issues).toEqual([]);
  });

  it("記載例の文章は、構造化データから作ったものと一致している", () => {
    const { criteria, microCredentialDescriptors } = exampleBadge.credentialSubject.achievement;
    const parsed = validateBadge(exampleBadge);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(
        toCriteriaNarrative(parsed.data.credentialSubject.achievement.microCredentialDescriptors),
      ).toBe(criteria.narrative);
    }
    expect(microCredentialDescriptors.learnerEffort.totalHours).toBe(90);
  });

  it("文章だけを書き換えたバッジを落とす", () => {
    const tampered = withChange((b) => {
      b.credentialSubject.achievement.criteria.narrative =
        b.credentialSubject.achievement.criteria.narrative.replace("90 時間", "120 時間");
    });
    expect(failedPaths(tampered)).toEqual(["credentialSubject.achievement.criteria.narrative"]);
  });

  it("構造化データだけを書き換えたバッジを落とす", () => {
    const tampered = withChange((b) => {
      b.credentialSubject.achievement.microCredentialDescriptors.learnerEffort.totalHours = 120;
    });
    expect(failedPaths(tampered)).toEqual(["credentialSubject.achievement.criteria.narrative"]);
  });

  it("このルールのコンテキストが無ければ落とす", () => {
    const missing = withChange((b) => {
      b["@context"] = b["@context"].filter((c) => c !== CONTEXT_URL);
    });
    expect(failedPaths(missing)).toEqual(["@context"]);
  });

  it("credentialSchema の type を定義するコンテキストが無ければ落とす", () => {
    const missing = withChange((b) => {
      b["@context"] = b["@context"].filter((c) => c !== OB_EXTENSIONS_CONTEXT_URL);
    });
    expect(failedPaths(missing)).toEqual(["@context"]);
  });

  it("@context の 1 番目と 2 番目が決まりどおりでなければ落とす", () => {
    const swapped = withChange((b) => {
      const [vc = "", ob = "", ...rest] = b["@context"];
      b["@context"] = [ob, vc, ...rest];
    });
    expect(failedPaths(swapped)).toEqual(["@context.0", "@context.1"]);
  });

  it("@context の拡張用とこのルールのコンテキストは、3 番目以降なら順を問わない", () => {
    const reversed = withChange((b) => {
      const [vc = "", ob = "", ext = "", rule = "", ...rest] = b["@context"];
      b["@context"] = [vc, ob, rule, ext, ...rest];
    });
    expect(failedPaths(reversed)).toEqual([]);

    const separated = withChange((b) => {
      const [vc = "", ob = "", ext = "", rule = "", ...rest] = b["@context"];
      b["@context"] = [vc, ob, ext, "https://example.org/other-context.json", rule, ...rest];
    });
    expect(failedPaths(separated)).toEqual([]);
  });

  it("type に OpenBadgeCredential も AchievementCredential も無ければ、両方を挙げて落とす", () => {
    const result = validateBadge(withChange((b) => (b.type = ["VerifiableCredential"])));
    expect(result.success ? [] : result.issues.map((issue) => issue.message)).toEqual([
      "type に VerifiableCredential と、OpenBadgeCredential（または AchievementCredential）を入れてください",
    ]);
  });

  it("credentialSchema にこのルールの JSON Schema が無ければ落とす", () => {
    const missing = withChange((b) => {
      b.credentialSchema = b.credentialSchema.filter((s) => s.id !== CREDENTIAL_SCHEMA_URL);
    });
    expect(failedPaths(missing)).toEqual(["credentialSchema"]);
  });

  it("achievementType が MicroCredential でなければ落とす", () => {
    const wrong = withChange((b) => {
      b.credentialSubject.achievement.achievementType = "Certificate";
    });
    expect(failedPaths(wrong)).toEqual(["credentialSubject.achievement.achievementType"]);
  });

  it("alignment にフレームワークが無ければ落とす", () => {
    const wrong = withChange((b) => {
      b.credentialSubject.achievement.alignment = [
        { type: ["Alignment"], targetName: "別の枠組み", targetUrl: "https://example.org/other" },
      ];
    });
    expect(failedPaths(wrong)).toEqual(["credentialSubject.achievement.alignment"]);
  });

  it("学習者を識別する情報が無ければ落とす", () => {
    const { id: _, ...subject } = exampleBadge.credentialSubject;
    expect(failedPaths({ ...exampleBadge, credentialSubject: subject })).toEqual([
      "credentialSubject",
    ]);
  });

  it("発行機関の名前や発行日が無ければ落とす", () => {
    const { name: _, ...issuer } = exampleBadge.issuer;
    const { validFrom: __, ...rest } = exampleBadge;
    expect(failedPaths({ ...rest, issuer })).toEqual(["issuer.name", "validFrom"]);
  });

  it("構造化データの形が決まりに合わなければ落とす", () => {
    const wrong = withChange((b) => {
      b.credentialSubject.achievement.microCredentialDescriptors.learnerEffort.totalHours = 5;
    });
    // 記載例の授業時間（30 時間）が総学習時間を超えるので、contactHours も落ちる
    expect(failedPaths(wrong)).toEqual([
      "credentialSubject.achievement.microCredentialDescriptors.learnerEffort.totalHours",
      "credentialSubject.achievement.microCredentialDescriptors.learnerEffort.contactHours",
    ]);
  });
});

describe("URL のスキーム", () => {
  const validate = new Ajv2019({ strict: false, validateFormats: false }).compile(
    toCredentialJsonSchema(),
  );

  it.each(unsafeUrlDescriptors)(
    "%s のバッジを、validateBadge と JSON Schema の両方で落とす",
    (_, descriptors) => {
      const badge = withDescriptors(descriptors);
      expect(validateBadge(badge).success).toBe(false);
      expect(validate(badge)).toBe(false);
    },
  );

  it("同じ形で https の URL なら、validateBadge と JSON Schema の両方を通す", () => {
    for (const [, descriptors] of unsafeUrlDescriptors) {
      const safe = JSON.parse(
        JSON.stringify(descriptors)
          .replaceAll("javascript:alert(1)", "https://example.org/skills/ds-1")
          .replace("data:text/html,<script>alert(1)</script>", "https://example.ac.jp/qa"),
      ) as unknown;
      const badge = withDescriptors(safe);
      const result = validateBadge(badge);
      expect(result.success ? [] : result.issues).toEqual([]);
      expect(validate(badge)).toBe(true);
    }
  });

  it("achievement.alignment の URL も http と https に限る", () => {
    const wrong = withChange((b) => {
      b.credentialSubject.achievement.alignment.push({
        type: ["Alignment"],
        targetName: "x",
        targetUrl: "javascript:alert(1)",
      });
    });
    expect(failedPaths(wrong)).toEqual(["credentialSubject.achievement.alignment.1.targetUrl"]);
  });
});

describe("toCredentialJsonSchema", () => {
  const schema = toCredentialJsonSchema();
  const validate = new Ajv2019({ strict: false, validateFormats: false }).compile(schema);

  it("このルールの JSON Schema の URL を $id に持つ", () => {
    expect(schema.$id).toBe(CREDENTIAL_SCHEMA_URL);
    expect(schema.$schema).toBe("https://json-schema.org/draft/2019-09/schema");
  });

  it("記載例のバッジを通す", () => {
    expect(validate(exampleBadge)).toBe(true);
  });

  it("構造化データが無いバッジを落とす", () => {
    const { microCredentialDescriptors: _, ...achievement } =
      exampleBadge.credentialSubject.achievement;
    const missing = {
      ...exampleBadge,
      credentialSubject: { ...exampleBadge.credentialSubject, achievement },
    };
    expect(validate(missing)).toBe(false);
  });

  it("決まりに無い項目名や、範囲の外の値を落とす", () => {
    const typo = structuredClone(exampleBadge) as unknown as {
      credentialSubject: {
        achievement: { microCredentialDescriptors: { learnerEffort: Record<string, unknown> } };
      };
    };
    typo.credentialSubject.achievement.microCredentialDescriptors.learnerEffort.totalHour = 90;
    expect(validate(typo)).toBe(false);

    const tooShort = withChange((b) => {
      b.credentialSubject.achievement.microCredentialDescriptors.learnerEffort.totalHours = 5;
    });
    expect(validate(tooShort)).toBe(false);
  });

  it("このルールのコンテキストが無いバッジを落とす", () => {
    const missing = withChange((b) => {
      b["@context"] = b["@context"].filter((c) => c !== CONTEXT_URL);
    });
    expect(validate(missing)).toBe(false);
  });
});
