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
 * 数値の書き方は formatNumber() に、テキストの値のエスケープは escapeMarkdown() にまとめている。
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

/**
 * 言語名。キーは言語タグの言語の部分（primaryLanguage()）。
 * 言語の部分がここに無い言語タグは、タグのまま書く。
 */
const LANGUAGE_LABEL: Record<string, Label> = {
  ja: ["日本語", "Japanese"],
  en: ["英語", "English"],
  zh: ["中国語", "Chinese"],
  ko: ["韓国語", "Korean"],
};

const both = ([ja, en]: Label): string => `${ja}（${en}）`;

/**
 * 言語タグの言語の部分（最初の `-` の前）を小文字にしたもの。
 * 例: "ja-JP" → "ja"、"EN-us" → "en"、"zh-Hant-TW" → "zh"
 */
const primaryLanguage = (tag: string): string => (tag.split("-")[0] ?? "").toLowerCase();

/** 日本語、英語、ほかの言語の順に並べたときの順位。言語の部分で判定する */
function languageRank(tag: string): number {
  const language = primaryLanguage(tag);
  if (language === "ja") return 0;
  if (language === "en") return 1;
  return 2;
}

/** CommonMark でバックスラッシュエスケープできる ASCII の記号（U+0021–002F、003A–0040、005B–0060、007B–007E） */
const MARKDOWN_PUNCTUATION = /[\x21-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e]/g;

/**
 * テキストの値を、Markdown の中でそのままの文字として読まれるようにする（docs/storage-rule.md の 6 章）。
 * ASCII の記号すべての前に `\` を付ける（CommonMark のバックスラッシュエスケープ）。
 * 見出し（`#`）、箇条書き（`-`、`+`、`1.`）、強調（`*`、`_`）、リンク（`[`、`]`）、
 * HTML（`<`、`&`）などとして読まれない。
 * 例: "C++ <入門>" → "C\+\+ \<入門\>"
 *
 * 値に改行が無いこと（TextValue）を前提にしている。
 */
export const escapeMarkdown = (text: string): string =>
  text.replace(MARKDOWN_PUNCTUATION, "\\$&");

/**
 * 多言語テキストを 1 つの文字列にする。
 * 日本語、英語、ほかの言語の順に並べ、2 つ目以降を括弧に入れる。
 * 日本語か英語かは言語タグの言語の部分で判定する（"ja-JP" は日本語）。
 * 同じ順位の中は、言語タグの文字コードの順（大文字小文字を区別する）に並べる。
 * それぞれの値は escapeMarkdown() でエスケープする。
 * 例: { ja: "統計学の基礎知識", en: "Basic statistics knowledge" }
 *     → "統計学の基礎知識（Basic statistics knowledge）"
 */
export function renderText(text: LocalizedText): string {
  const tags = Object.keys(text).sort((a, b) => {
    const diff = languageRank(a) - languageRank(b);
    if (diff !== 0) return diff;
    return a < b ? -1 : a > b ? 1 : 0;
  });
  const [main = "", ...rest] = tags.map((tag) => escapeMarkdown(text[tag] ?? ""));
  return rest.length > 0 ? `${main}（${rest.join(" / ")}）` : main;
}

/**
 * URL を本文に入れるときは `<URL>` の形にする（Markdown の自動リンク）。
 * URL の中の `[` `]` `(` `)` が Markdown のリンクとして読まれないようにするため。
 * 自動リンクの中ではバックスラッシュエスケープが効かないので、URL は escapeMarkdown() を通さない。
 * URL に空白や `<` `>` が無いことは、検証（HttpUrl）で確かめている。
 */
const autolink = (url: string): string => `<${url}>`;

const withUrl = (text: string, url: string | undefined): string =>
  url === undefined ? text : `${text} ${autolink(url)}`;

/**
 * 数値を本文に入れる文字にする（docs/storage-rule.md の 6 章）。
 * - 10 進で書き、指数表記と桁区切りは使わない
 * - 小数部が 0 なら整数で書く（JSON の `90.0` は `"90"`）
 * - 小数部は末尾の 0 を付けない（`10.50` は `"10.5"`）
 *
 * 数値の言語ごとの文字列化（JavaScript の `String()`、Dart の `toString()` など）は
 * 結果が揃わないので、本文にはこの書き方で入れる。
 * 検証を通る値（0.25 の倍数、100000 以下。4 章）は 10 進で正確に表せるので、
 * どの言語でも丸めの誤差なしにこの書き方にできる。
 */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) throw new RangeError(`数値として書けない値です: ${n}`);
  // String() は、元の値に戻せる最短の 10 進の桁を返す。-0 は "0" になる
  const text = String(n);
  const m = /^(-?)(\d)(?:\.(\d+))?e([+-]\d+)$/.exec(text);
  if (m === null) return text;
  // 指数表記（1e+21、1e-7 など）を、指数を使わない形に直す
  const [, sign = "", head = "", tail = "", exp = "0"] = m;
  const digits = head + tail;
  const point = 1 + Number(exp); // 整数部の桁数
  if (point <= 0) return `${sign}0.${"0".repeat(-point)}${digits}`;
  if (point >= digits.length) return sign + digits + "0".repeat(point - digits.length);
  return `${sign}${digits.slice(0, point)}.${digits.slice(point)}`;
}

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
  const total = formatNumber(e.totalHours);
  const head =
    e.contactHours === undefined
      ? `${total} 時間（${total} ${hours(e.totalHours)}）`
      : `${total} 時間、うち授業時間 ${formatNumber(e.contactHours)} 時間` +
        `（${total} ${hours(e.totalHours)}, including ${formatNumber(e.contactHours)} contact ${hours(e.contactHours)}）`;
  return e.description === undefined ? [head] : [head, renderText(e.description)];
}

function recognitionLine(r: MicroCredentialDescriptors["recognitions"][number]): string {
  const amount = [
    r.scheme === undefined ? undefined : escapeMarkdown(r.scheme),
    r.amount === undefined ? undefined : formatNumber(r.amount),
  ]
    .filter((v) => v !== undefined)
    .join(" ");
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
          : `- ${text} [${escapeMarkdown(o.alignment.targetName)}](${autolink(o.alignment.targetUrl)})`;
      }),
    ],
    [
      NARRATIVE_HEADINGS.languages,
      d.languages === undefined
        ? []
        : [
            d.languages
              .map((tag) => {
                const label = LANGUAGE_LABEL[primaryLanguage(tag)];
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
      (d.levels ?? []).map(
        (l) => `- ${withUrl(`${escapeMarkdown(l.framework)}: ${escapeMarkdown(l.value)}`, l.url)}`,
      ),
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
