import { describe, expect, it } from "vitest";
import {
  NARRATIVE_HEADINGS,
  escapeMarkdown,
  formatNumber,
  microCredentialProfile,
  narrativeTestVectors,
  renderText,
  toCriteriaNarrative,
  toJsonSchema,
  validateMetadata,
  type MicroCredentialDescriptors,
} from "../src/index.ts";
import { minimalDescriptors, validDescriptors, validDescriptorsNarrative } from "./fixtures.ts";

/** 文章から見出しの行だけを取り出す */
const headingsOf = (narrative: string): string[] =>
  narrative.split("\n\n").map((section) => (section.split("\n")[0] ?? "").replace(/:$/, ""));

describe("toCriteriaNarrative", () => {
  it("記載例の構造化データから、決まった文章を作る", () => {
    expect(toCriteriaNarrative(validDescriptors)).toBe(validDescriptorsNarrative);
  });

  it.each(narrativeTestVectors.map((v) => [v.name, v] as const))(
    "照合用データ「%s」の構造化データは検証を通り、期待どおりの文章になる",
    (_, vector) => {
      const result = validateMetadata(microCredentialProfile, vector.descriptors);
      expect(result.success ? [] : result.issues).toEqual([]);
      expect(toCriteriaNarrative(vector.descriptors)).toBe(vector.narrative);
    },
  );

  it.each(
    narrativeTestVectors
      .filter((v) => v.descriptorsJson !== undefined)
      .map((v) => [v.name, v] as const),
  )("照合用データ「%s」の JSON のテキストは、構造化データと同じ値になり、同じ文章になる", (_, vector) => {
    const parsed: unknown = JSON.parse(vector.descriptorsJson ?? "");
    expect(parsed).toEqual(vector.descriptors);
    const result = validateMetadata(microCredentialProfile, parsed);
    expect(result.success ? [] : result.issues).toEqual([]);
    expect(toCriteriaNarrative(parsed as MicroCredentialDescriptors)).toBe(vector.narrative);
  });

  it("照合用データには、構造化データのすべての項目が入っている", () => {
    // JSON Schema の properties をたどって、項目のパス（配列は []、テキストの中は数えない）を集める
    type Schema = { properties?: Record<string, Schema>; items?: Schema };
    const schemaPaths = (schema: Schema, prefix: string): string[] =>
      Object.entries(schema.properties ?? {}).flatMap(([key, child]) => {
        const path = `${prefix}${key}`;
        const inner = child.items ?? child;
        const suffix = child.items === undefined ? "" : "[]";
        return [path, ...schemaPaths(inner, `${path}${suffix}.`)];
      });
    const valuePaths = (value: unknown, prefix: string, into: Set<string>): void => {
      if (Array.isArray(value)) {
        for (const item of value) valuePaths(item, `${prefix}[]`, into);
      } else if (typeof value === "object" && value !== null) {
        for (const [key, child] of Object.entries(value)) {
          const path = prefix === "" ? key : `${prefix}.${key}`;
          into.add(path);
          valuePaths(child, path, into);
        }
      }
    };
    const used = new Set<string>();
    for (const vector of narrativeTestVectors) valuePaths(vector.descriptors, "", used);
    const all = schemaPaths(toJsonSchema(microCredentialProfile) as Schema, "");
    expect(all.filter((path) => !used.has(path))).toEqual([]);
  });

  it("同じ入力からは同じ文章を作る", () => {
    expect(toCriteriaNarrative(validDescriptors)).toBe(toCriteriaNarrative(validDescriptors));
  });

  it("値の無い選択記述子は、見出しごと省く", () => {
    expect(headingsOf(toCriteriaNarrative(minimalDescriptors))).toEqual([
      NARRATIVE_HEADINGS.learningOutcomes,
      NARRATIVE_HEADINGS.participation,
      NARRATIVE_HEADINGS.learnerEffort,
      NARRATIVE_HEADINGS.assessments,
      NARRATIVE_HEADINGS.qualityAssurance,
      NARRATIVE_HEADINGS.recognitions,
    ]);
  });

  it("必須の記述子だけの文章を作る", () => {
    expect(toCriteriaNarrative(minimalDescriptors)).toBe(`学修成果 (Learning Outcomes):
- 表形式のデータを集計できる

授業の方法 (Form of participation):
対面（Onsite）

学習量（総学習時間） (Learner effort):
10 時間（10 hours）

評価の方法 (Type of assessment):
- 試験（Exam）

質保証 (Type of quality assurance):
- 内部質保証（Internal）: 教務委員会による審査

単位/その他認定 (Credit/Other recognition):
- なし（None）`);
  });

  it("11 記述子がそろうと、ガイドライン 3.0 の順に見出しが並ぶ", () => {
    const full: MicroCredentialDescriptors = {
      ...validDescriptors,
      certification: { ja: "修了証をデジタル発行" },
      stackableInto: [{ name: { ja: "データサイエンス・マイクロクレデンシャル" } }],
    };
    expect(headingsOf(toCriteriaNarrative(full))).toEqual(Object.values(NARRATIVE_HEADINGS));
  });

  it("説明、URL、スキル標準への対応を本文に入れる", () => {
    const detailed: MicroCredentialDescriptors = {
      ...minimalDescriptors,
      learningOutcomes: [
        {
          description: { ja: "統計手法を適用する", en: "Apply statistical methods" },
          alignment: {
            type: ["Alignment"],
            targetName: "ITSS+ データサイエンス領域",
            targetUrl: "https://example.org/skills/ds-1",
          },
        },
      ],
      languages: ["ja", "en", "fr"],
      participation: {
        mode: "hybrid",
        timing: "mixed",
        description: { ja: "講義は録画、演習は教室で行う" },
      },
      assessments: [{ method: "project", description: { ja: "最終成果物を提出する" } }],
      qualityAssurance: {
        internal: { name: { ja: "質保証委員会による審査" }, url: "https://example.ac.jp/qa" },
        external: [{ name: { ja: "サンプル認証機構の認証" } }],
      },
      levels: [{ framework: "EQF", value: "6", url: "https://example.org/eqf/6" }],
      recognitions: [
        { kind: "credit", scheme: "UCTS", amount: 2, description: { ja: "卒業要件に算入できる" } },
        { kind: "other", description: { ja: "業界団体による認定" } },
      ],
    };

    expect(toCriteriaNarrative(detailed)).toBe(`学修成果 (Learning Outcomes):
- 統計手法を適用する（Apply statistical methods） [ITSS\\+ データサイエンス領域](<https://example.org/skills/ds-1>)

授業言語 (Language):
日本語（Japanese）、英語（English）、fr

授業の方法 (Form of participation):
対面とオンラインの併用、同期と非同期の併用（Hybrid, mixed）
講義は録画、演習は教室で行う

学習量（総学習時間） (Learner effort):
10 時間（10 hours）

評価の方法 (Type of assessment):
- プロジェクト・成果物（Project）: 最終成果物を提出する

質保証 (Type of quality assurance):
- 内部質保証（Internal）: 質保証委員会による審査 <https://example.ac.jp/qa>
- 外部質保証（External）: サンプル認証機構の認証

レベル (Level):
- EQF: 6 <https://example.org/eqf/6>

単位/その他認定 (Credit/Other recognition):
- 単位（Credit）: UCTS 2、卒業要件に算入できる
- その他の認定（Other recognition）: 業界団体による認定`);
  });
});

describe("Markdown のエスケープ", () => {
  const outcomeLine = (targetName: string, targetUrl: string): string => {
    const narrative = toCriteriaNarrative({
      ...minimalDescriptors,
      learningOutcomes: [
        {
          description: { ja: "表形式のデータを集計できる" },
          alignment: { type: ["Alignment"], targetName, targetUrl },
        },
      ],
    });
    return narrative.split("\n")[1] ?? "";
  };

  it("リンクの文字の ] と [ に \\ を付け、URL を <> で囲む", () => {
    expect(outcomeLine("x](https://evil.example/)", "https://example.org/a")).toBe(
      "- 表形式のデータを集計できる [x\\]\\(https\\:\\/\\/evil\\.example\\/\\)](<https://example.org/a>)",
    );
    expect(outcomeLine("[第2版]", "https://example.org/a")).toBe(
      "- 表形式のデータを集計できる [\\[第2版\\]](<https://example.org/a>)",
    );
  });

  it("リンクの文字の \\ にも \\ を付け、エスケープを打ち消せないようにする", () => {
    expect(outcomeLine("a\\]b", "https://example.org/a")).toBe(
      "- 表形式のデータを集計できる [a\\\\\\]b](<https://example.org/a>)",
    );
  });

  it("URL の括弧は、<> の中にそのまま入れる", () => {
    expect(outcomeLine("x", "https://example.org/a)(b")).toBe(
      "- 表形式のデータを集計できる [x](<https://example.org/a)(b>)",
    );
  });

  it("名前の後ろに続ける URL も <> で囲む", () => {
    const narrative = toCriteriaNarrative({
      ...minimalDescriptors,
      qualityAssurance: {
        internal: { name: { ja: "審査" }, url: "https://example.ac.jp/[x](y)" },
      },
    });
    expect(narrative).toContain("- 内部質保証（Internal）: 審査 <https://example.ac.jp/[x](y)>");
  });
});

describe("escapeMarkdown", () => {
  it("ASCII の記号すべての前に \\ を付ける", () => {
    const punctuation = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
    expect(escapeMarkdown(punctuation)).toBe(
      [...punctuation].map((c) => `\\${c}`).join(""),
    );
  });

  it("英数字、空白、ASCII でない文字はそのまま", () => {
    expect(escapeMarkdown("aZ 09　統計（Ｃ＋＋）・＃")).toBe("aZ 09　統計（Ｃ＋＋）・＃");
  });

  it("見出し、箇条書き、HTML として読まれる形を崩す", () => {
    expect(escapeMarkdown("# 見出し")).toBe("\\# 見出し");
    expect(escapeMarkdown("1. 項目")).toBe("1\\. 項目");
    expect(escapeMarkdown("<script>&amp;")).toBe("\\<script\\>\\&amp\\;");
  });
});

describe("テキストの値を本文に入れる", () => {
  const withValues = (overrides: Partial<MicroCredentialDescriptors>): string =>
    toCriteriaNarrative({ ...minimalDescriptors, ...overrides });

  it("値の中の記号は、どの記述子でもエスケープする", () => {
    const narrative = withValues({
      learningOutcomes: [
        {
          description: { ja: "# 統計", en: "*Stats*" },
          alignment: {
            type: ["Alignment"],
            targetName: "<b>",
            targetUrl: "https://example.org/a",
          },
        },
      ],
      participation: { mode: "onsite", description: { ja: "- 教室" } },
      learnerEffort: { totalHours: 10, description: { ja: "=== 10" } },
      assessments: [{ method: "exam", description: { ja: "`試験`" } }],
      qualityAssurance: { internal: { name: { ja: "> 審査" } } },
      levels: [{ framework: "1.", value: "_6_" }],
      certification: { ja: "---" },
      recognitions: [{ kind: "credit", scheme: "C++", amount: 2, description: { ja: "|a|" } }],
      prerequisites: [{ description: { ja: "![x](y)" } }],
      stackableInto: [{ name: { ja: "&lt;" } }],
    });
    expect(narrative).toBe(`学修成果 (Learning Outcomes):
- \\# 統計（\\*Stats\\*） [\\<b\\>](<https://example.org/a>)

授業の方法 (Form of participation):
対面（Onsite）
\\- 教室

学習量（総学習時間） (Learner effort):
10 時間（10 hours）
\\=\\=\\= 10

評価の方法 (Type of assessment):
- 試験（Exam）: \\\`試験\\\`

質保証 (Type of quality assurance):
- 内部質保証（Internal）: \\> 審査

レベル (Level):
- 1\\.: \\_6\\_

証明書 (Certification):
\\-\\-\\-

単位/その他認定 (Credit/Other recognition):
- 単位（Credit）: C\\+\\+ 2、\\|a\\|

(受講)前提条件 (Prerequisites needed to enroll):
- \\!\\[x\\]\\(y\\)

積み上げ可能性 (Stackability):
- \\&lt\\;`);
  });

  it("検証を通る値からは、見出しの行と空行は増えない", () => {
    const heading = `${NARRATIVE_HEADINGS.assessments}:`;
    const descriptors = {
      ...minimalDescriptors,
      learningOutcomes: [{ description: { ja: `a ${heading} - 試験（Exam）` } }],
    };
    expect(validateMetadata(microCredentialProfile, descriptors).success).toBe(true);
    const narrative = toCriteriaNarrative(descriptors);
    expect(headingsOf(narrative)).toEqual(headingsOf(toCriteriaNarrative(minimalDescriptors)));
    expect(narrative.split("\n").filter((line) => line === heading)).toHaveLength(1);
  });
});

describe("授業言語", () => {
  const languagesLine = (languages: string[]): string => {
    const narrative = toCriteriaNarrative({ ...minimalDescriptors, languages });
    const lines = narrative.split("\n");
    return lines[lines.indexOf(`${NARRATIVE_HEADINGS.languages}:`) + 1] ?? "";
  };

  it("言語の名前は、言語タグの言語の部分で引く", () => {
    expect(languagesLine(["ja-JP", "EN-us", "zh-Hant-TW", "KO"])).toBe(
      "日本語（Japanese）、英語（English）、中国語（Chinese）、韓国語（Korean）",
    );
  });

  it("言語の部分が表に無い言語タグは、タグのまま書く", () => {
    expect(languagesLine(["fr-CA", "jav"])).toBe("fr-CA、jav");
  });
});

describe("formatNumber", () => {
  it.each([
    [90, "90"],
    [90.0, "90"],
    [10.5, "10.5"],
    [10.25, "10.25"],
    [0.75, "0.75"],
    [100000, "100000"],
    [-0, "0"],
  ])("%s を %s と書く", (n, text) => {
    expect(formatNumber(n)).toBe(text);
  });

  it("指数表記を使わない", () => {
    expect(formatNumber(1e21)).toBe("1000000000000000000000");
    expect(formatNumber(1.5e22)).toBe("15000000000000000000000");
    expect(formatNumber(1e-7)).toBe("0.0000001");
    expect(formatNumber(-1.25e-7)).toBe("-0.000000125");
  });

  it("数値として書けない値は投げる", () => {
    expect(() => formatNumber(Number.NaN)).toThrow(RangeError);
    expect(() => formatNumber(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe("renderText", () => {
  it("1 言語ならそのまま返す", () => {
    expect(renderText({ en: "Basic statistics knowledge" })).toBe("Basic statistics knowledge");
  });

  it("日本語、英語の順に並べ、2 つ目以降を括弧に入れる", () => {
    expect(renderText({ en: "Basic statistics knowledge", ja: "統計学の基礎知識" })).toBe(
      "統計学の基礎知識（Basic statistics knowledge）",
    );
  });

  it("地域や文字の付いた言語タグも、言語の部分で日本語・英語と判定する", () => {
    expect(renderText({ "ja-JP": "統計", en: "Statistics" })).toBe("統計（Statistics）");
    expect(renderText({ "EN-us": "Statistics", "zh-Hant": "統計學", "JA-jp": "統計" })).toBe(
      "統計（Statistics / 統計學）",
    );
  });

  it("同じ順位の中は、言語タグの文字コードの順に並べる", () => {
    expect(renderText({ "en-US": "US", "en-GB": "UK", en: "EN", ja: "日本語" })).toBe(
      "日本語（EN / UK / US）",
    );
    expect(renderText({ "fr-CA": "CA", de: "DE", fr: "FR" })).toBe("DE（FR / CA）");
  });

  it("言語の部分が ja や en で始まるだけの言語タグは、日本語・英語にしない", () => {
    expect(renderText({ jav: "Jawa", enm: "Middle English", ja: "日本語" })).toBe(
      "日本語（Middle English / Jawa）",
    );
  });

  it("ほかの言語は、日本語と英語の後に言語タグの順で並べる", () => {
    expect(renderText({ ko: "통계", fr: "Statistiques", en: "Statistics", ja: "統計" })).toBe(
      "統計（Statistics / Statistiques / 통계）",
    );
  });
});
