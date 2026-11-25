import type { AssessmentMethod, LocalizedText, ParticipationMode } from "./common.ts";
import type {
  MicroCredentialDescriptors,
  ParticipationTiming,
  RecognitionKind,
} from "./profiles/microcredential.ts";

/**
 * 構造化データ（microCredentialDescriptors）から、criteria.narrative に入れる文章を作る。
 *
 * 書式は「デジタル発行するためのガイドライン 3.0」の記載例に合わせている。
 * - 記述子ごとに「見出し:」の行と本文を書き、記述子の間は空行で区切る
 * - 配列は箇条書きにする
 * - 値の無い選択記述子は、見出しごと省く
 *
 * 同じ入力からは、いつも同じ文章が出る。バッジの文章と構造化データが
 * 食い違っていないかは、この関数の出力と比べて確かめる。
 *
 * ⚠️ 区分や数値を本文にするときの言い回しは仮のもの（docs/storage-rule.md の 6 章）。
 */

/** 見出し。名前と並び順はガイドライン 3.0 の記載例に合わせている */
export const NARRATIVE_HEADINGS = {
  learningOutcomes: "学修成果 (Learning Outcomes)",
  languages: "授業言語 (Language)",
  participation: "授業の方法 (Form of participation)",
  learnerEffort: "学習量（総学習時間） (Learner effort)",
  assessments: "評価の方法 (Type of assessment)",
  qualityAssurance: "質保証 (Type of quality assurance)",
  levels: "レベル (Level)",
  certification: "証明書 (Certification)",
  recognitions: "単位/その他認定 (Credit/Other recognition)",
  prerequisites: "(受講)前提条件 (Prerequisites needed to enroll)",
  stackableInto: "積み上げ可能性 (Stackability)",
} as const;

type Label = readonly [ja: string, en: string];

const MODE_LABEL: Record<ParticipationMode, Label> = {
  onsite: ["対面", "Onsite"],
  online: ["オンライン", "Online"],
  hybrid: ["対面とオンラインの併用", "Hybrid"],
};

const TIMING_LABEL: Record<ParticipationTiming, Label> = {
  synchronous: ["同期", "synchronous"],
  asynchronous: ["非同期", "asynchronous"],
  mixed: ["同期と非同期の併用", "mixed"],
};

const ASSESSMENT_LABEL: Record<AssessmentMethod, Label> = {
  exam: ["試験", "Exam"],
  assignment: ["課題・レポート", "Assignment"],
  project: ["プロジェクト・成果物", "Project"],
  practical: ["実技", "Practical"],
  portfolio: ["ポートフォリオ", "Portfolio"],
  observation: ["行動の観察", "Observation"],
  "self-assessment": ["自己評価", "Self-assessment"],
  "peer-assessment": ["相互評価", "Peer assessment"],
  other: ["その他", "Other"],
};

const RECOGNITION_LABEL: Record<RecognitionKind, Label> = {
  credit: ["単位", "Credit"],
  continuingEducation: ["継続教育ポイント", "Continuing education"],
  other: ["その他の認定", "Other recognition"],
  none: ["なし", "None"],
};

/** 言語名。ここに無い言語タグは、タグのまま書く */
const LANGUAGE_LABEL: Record<string, Label> = {
  ja: ["日本語", "Japanese"],
  en: ["英語", "English"],
  zh: ["中国語", "Chinese"],
  ko: ["韓国語", "Korean"],
};

const both = ([ja, en]: Label): string => `${ja}（${en}）`;

/** 日本語、英語、ほかの言語（タグの順）に並べたときの順位 */
function languageRank(tag: string): number {
  const lower = tag.toLowerCase();
  if (lower === "ja") return 0;
  if (lower === "en") return 1;
  return 2;
}

/**
 * 多言語テキストを 1 つの文字列にする。
 * 日本語、英語、ほかの言語（タグの順）に並べ、2 つ目以降を括弧に入れる。
 * 例: { ja: "統計学の基礎知識", en: "Basic statistics knowledge" }
 *     → "統計学の基礎知識（Basic statistics knowledge）"
 */
export function renderText(text: LocalizedText): string {
  const tags = Object.keys(text).sort((a, b) => {
    const diff = languageRank(a) - languageRank(b);
    if (diff !== 0) return diff;
    return a < b ? -1 : a > b ? 1 : 0;
  });
  const [main = "", ...rest] = tags.map((tag) => text[tag] ?? "");
  return rest.length > 0 ? `${main}（${rest.join(" / ")}）` : main;
}

const withUrl = (text: string, url: string | undefined): string =>
  url === undefined ? text : `${text} ${url}`;

const hours = (n: number): string => (n === 1 ? "hour" : "hours");

function participationLines(p: MicroCredentialDescriptors["participation"]): string[] {
  const mode = MODE_LABEL[p.mode];
  const head =
    p.timing === undefined
      ? both(mode)
      : `${mode[0]}、${TIMING_LABEL[p.timing][0]}（${mode[1]}, ${TIMING_LABEL[p.timing][1]}）`;
  return p.description === undefined ? [head] : [head, renderText(p.description)];
}

function learnerEffortLines(e: MicroCredentialDescriptors["learnerEffort"]): string[] {
  const head =
    e.contactHours === undefined
      ? `${e.totalHours} 時間（${e.totalHours} ${hours(e.totalHours)}）`
      : `${e.totalHours} 時間、うち授業時間 ${e.contactHours} 時間` +
        `（${e.totalHours} ${hours(e.totalHours)}, including ${e.contactHours} contact ${hours(e.contactHours)}）`;
  return e.description === undefined ? [head] : [head, renderText(e.description)];
}

function recognitionLine(r: MicroCredentialDescriptors["recognitions"][number]): string {
  const amount = [r.scheme, r.amount].filter((v) => v !== undefined).join(" ");
  const details = [amount, r.description === undefined ? "" : renderText(r.description)].filter(
    (v) => v !== "",
  );
  const label = both(RECOGNITION_LABEL[r.kind]);
  return details.length > 0 ? `- ${label}: ${details.join("、")}` : `- ${label}`;
}

/** 構造化データから、criteria.narrative に入れる文章を作る */
export function toCriteriaNarrative(d: MicroCredentialDescriptors): string {
  const sections: Array<readonly [heading: string, lines: readonly string[]]> = [
    [
      NARRATIVE_HEADINGS.learningOutcomes,
      d.learningOutcomes.map((o) => {
        const text = renderText(o.description);
        return o.alignment === undefined
          ? `- ${text}`
          : `- ${text} [${o.alignment.targetName}](${o.alignment.targetUrl})`;
      }),
    ],
    [
      NARRATIVE_HEADINGS.languages,
      d.languages === undefined
        ? []
        : [
            d.languages
              .map((tag) => {
                const label = LANGUAGE_LABEL[tag.toLowerCase()];
                return label === undefined ? tag : both(label);
              })
              .join("、"),
          ],
    ],
    [NARRATIVE_HEADINGS.participation, participationLines(d.participation)],
    [NARRATIVE_HEADINGS.learnerEffort, learnerEffortLines(d.learnerEffort)],
    [
      NARRATIVE_HEADINGS.assessments,
      d.assessments.map((a) => {
        const label = both(ASSESSMENT_LABEL[a.method]);
        return a.description === undefined
          ? `- ${label}`
          : `- ${label}: ${renderText(a.description)}`;
      }),
    ],
    [
      NARRATIVE_HEADINGS.qualityAssurance,
      [
        `- 内部質保証（Internal）: ${withUrl(renderText(d.qualityAssurance.internal.name), d.qualityAssurance.internal.url)}`,
        ...(d.qualityAssurance.external ?? []).map(
          (e) => `- 外部質保証（External）: ${withUrl(renderText(e.name), e.url)}`,
        ),
      ],
    ],
    [
      NARRATIVE_HEADINGS.levels,
      (d.levels ?? []).map((l) => `- ${withUrl(`${l.framework}: ${l.value}`, l.url)}`),
    ],
    [
      NARRATIVE_HEADINGS.certification,
      d.certification === undefined ? [] : [renderText(d.certification)],
    ],
    [NARRATIVE_HEADINGS.recognitions, d.recognitions.map(recognitionLine)],
    [
      NARRATIVE_HEADINGS.prerequisites,
      (d.prerequisites ?? []).map((p) => `- ${withUrl(renderText(p.description), p.url)}`),
    ],
    [
      NARRATIVE_HEADINGS.stackableInto,
      (d.stackableInto ?? []).map((s) => `- ${withUrl(renderText(s.name), s.url)}`),
    ],
  ];

  return sections
    .filter(([, lines]) => lines.length > 0)
    .map(([heading, lines]) => `${heading}:\n${lines.join("\n")}`)
    .join("\n\n");
}
