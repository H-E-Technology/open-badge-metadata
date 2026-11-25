import { describe, expect, it } from "vitest";
import {
  NARRATIVE_HEADINGS,
  microCredentialProfile,
  narrativeTestVectors,
  renderText,
  toCriteriaNarrative,
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
- 統計手法を適用する（Apply statistical methods） [ITSS+ データサイエンス領域](<https://example.org/skills/ds-1>)

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
      "- 表形式のデータを集計できる [x\\](https://evil.example/)](<https://example.org/a>)",
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

describe("renderText", () => {
  it("1 言語ならそのまま返す", () => {
    expect(renderText({ en: "Basic statistics knowledge" })).toBe("Basic statistics knowledge");
  });

  it("日本語、英語の順に並べ、2 つ目以降を括弧に入れる", () => {
    expect(renderText({ en: "Basic statistics knowledge", ja: "統計学の基礎知識" })).toBe(
      "統計学の基礎知識（Basic statistics knowledge）",
    );
  });

  it("ほかの言語は、日本語と英語の後に言語タグの順で並べる", () => {
    expect(renderText({ ko: "통계", fr: "Statistiques", en: "Statistics", ja: "統計" })).toBe(
      "統計（Statistics / Statistiques / 통계）",
    );
  });
});
