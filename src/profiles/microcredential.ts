import { z } from "zod";
import {
  AssessmentMethod,
  hasCaseInsensitiveDuplicate,
  HttpUrl,
  LanguageTag,
  LocalizedText,
  ParticipationMode,
  TextValue,
} from "../common.ts";
import { defineProfile, type ProfileMetadata } from "../profile.ts";

/**
 * マイクロクレデンシャル記述子（構造化データ）。
 *
 * 国内の「マイクロクレデンシャルのフレームワーク 1.0」の記述子のうち、
 * 「デジタル発行するためのガイドライン 3.0」が criteria.narrative に文章で入れる 11 個を、
 * 値として取り出せる形にしたもの。バッジの中では
 * credentialSubject.achievement.microCredentialDescriptors に入れる。
 *
 * 決まりは docs/storage-rule.md の 4 章に対応する。
 * 発行機関、発行日、学習者、名称、内容、発行国は OB 3.0 本体の項目に入るので、ここには持たない。
 */

/** 型を示す値。JSON-LD のコンテキストで、この中の項目名を定義する手がかりになる */
export const DESCRIPTORS_TYPE = "MicroCredentialDescriptors";

/*
 * refine で書いた決まりは z.toJSONSchema() の出力に入らない。
 * 配信する JSON Schema が validateMetadata() / validateBadge() と同じ結果になるよう、
 * refine のすぐ後に、同じ決まりを JSON Schema の書き方で .meta() に添える。
 */

/**
 * OB 3.0 の Alignment。OB 3.0 が定める 7 項目だけを通す（strictObject）。
 * OB 3.0 の JSON-LD コンテキストに定義の無い項目があると、署名の前処理（JSON-LD としての処理）で
 * 失敗するか、黙って捨てられて署名の対象から外れるため。
 * 学修成果の alignment と、バッジ本体の achievement.alignment の両方に使う。
 */
export const Alignment = z.strictObject({
  type: z
    .array(z.string())
    .refine((t) => t.includes("Alignment"), { message: "type に Alignment を含めてください" })
    .meta({ contains: { const: "Alignment" } }),
  targetName: TextValue,
  targetUrl: HttpUrl,
  targetCode: TextValue.optional(),
  targetDescription: TextValue.optional(),
  targetFramework: TextValue.optional(),
  targetType: TextValue.optional(),
});

/** 同期型か非同期型か */
export const ParticipationTiming = z.enum(["synchronous", "asynchronous", "mixed"]);
export type ParticipationTiming = z.infer<typeof ParticipationTiming>;

/** 認定の種類。none は「単位もポイントも出ない」を表す */
export const RecognitionKind = z.enum(["credit", "continuingEducation", "other", "none"]);
export type RecognitionKind = z.infer<typeof RecognitionKind>;

/** 名前と、任意の URL */
const NamedReference = z.strictObject({
  name: LocalizedText,
  url: HttpUrl.optional(),
});

/** 数値（時間数、単位やポイントの数）の刻み。小数は .25、.5、.75 だけ */
export const QUANTITY_STEP = 0.25;

/** 数値（時間数、単位やポイントの数）の上限 */
export const QUANTITY_MAX = 100000;

/**
 * 時間数や、単位やポイントの数（docs/storage-rule.md の 4 章）。
 * 0.25 は 2 進数で正確に表せるので、zod と JSON Schema の multipleOf の結果が揃う
 * （0.1 の刻みは、0.3 などで検証ツールによって結果が割れる）。
 * 刻みと上限があるので、文章に入れるとき指数表記や丸めの誤差が出ない（6 章）。
 */
const Quantity = z.number().multipleOf(QUANTITY_STEP).max(QUANTITY_MAX);

/** JSON Schema で「kind が none の認定」を表す */
const NONE_RECOGNITION = {
  type: "object",
  required: ["kind"],
  properties: { kind: { const: "none" } },
};

/**
 * 項目名の打ち間違いを見逃さないよう、決まりに無い項目は通さない（strictObject）。
 * 選択の配列は、値が無ければ項目ごと省く。空の配列は通さない。
 */
export const MicroCredentialDescriptors = z.strictObject({
  type: z
    .array(z.string())
    .refine((t) => t.includes(DESCRIPTORS_TYPE), {
      message: `type に ${DESCRIPTORS_TYPE} を含めてください`,
    })
    .meta({ contains: { const: DESCRIPTORS_TYPE } }),

  /** 学修成果（必須） */
  learningOutcomes: z
    .array(
      z.strictObject({
        description: LocalizedText,
        /** スキル標準などへの対応 */
        alignment: Alignment.optional(),
      }),
    )
    .min(1),

  /** 授業言語（選択）。同じ言語（大文字小文字を無視して比べる）を重ねない */
  languages: z
    .array(LanguageTag)
    .min(1)
    .refine((tags) => !hasCaseInsensitiveDuplicate(tags), {
      message: "同じ言語を重ねて書かないでください（大文字小文字は区別しません）",
    })
    // JSON Schema では、書かれたとおりに同じ値の重複だけを落とす
    .meta({ uniqueItems: true })
    .optional(),

  /** 授業の方法（必須） */
  participation: z.strictObject({
    mode: ParticipationMode,
    timing: ParticipationTiming.optional(),
    description: LocalizedText.optional(),
  }),

  /** 学習量（必須）。フレームワーク 1.0 の条件で、総学習時間は 10 時間以上 */
  learnerEffort: z.strictObject({
    totalHours: Quantity.min(10),
    /** 授業時間 */
    contactHours: Quantity.nonnegative().optional(),
    description: LocalizedText.optional(),
  })
    // JSON Schema では確かめない（2 つの項目の値の比較は JSON Schema で書けない）
    .refine((e) => e.contactHours === undefined || e.contactHours <= e.totalHours, {
      message: "授業時間（contactHours）は総学習時間（totalHours）以下にしてください",
      path: ["contactHours"],
    }),

  /** 評価の方法（必須） */
  assessments: z
    .array(
      z.strictObject({
        method: AssessmentMethod,
        description: LocalizedText.optional(),
      }),
    )
    .min(1),

  /** 質保証（必須）。内部質保証は必ず書く。第三者による評価・認証があれば external に書く */
  qualityAssurance: z.strictObject({
    internal: NamedReference,
    external: z.array(NamedReference).min(1).optional(),
  }),

  /** レベル（選択） */
  levels: z
    .array(
      z.strictObject({
        /** 枠組みの名前 */
        framework: TextValue,
        /** その枠組みでの値 */
        value: TextValue,
        url: HttpUrl.optional(),
      }),
    )
    .min(1)
    .optional(),

  /** 証明書（選択） */
  certification: LocalizedText.optional(),

  /** 単位／その他の認定（必須）。単位もポイントも出ない講座は kind: "none" を 1 件だけ入れる */
  recognitions: z
    .array(
      z.strictObject({
        kind: RecognitionKind,
        /** 単位やポイントの制度名。語彙は未決 */
        scheme: TextValue.optional(),
        amount: Quantity.positive().optional(),
        description: LocalizedText.optional(),
      }),
    )
    .min(1)
    .refine((items) => !items.some((r) => r.kind === "none") || items.length === 1, {
      message: 'kind が "none" のときは、ほかの認定と並べず 1 件だけにしてください',
    })
    .refine(
      (items) =>
        items.every((r) => r.kind !== "none" || (r.scheme === undefined && r.amount === undefined)),
      { message: 'kind が "none" のときは、scheme と amount を書かないでください' },
    )
    .meta({
      allOf: [
        { if: { contains: NONE_RECOGNITION }, then: { maxItems: 1 } },
        {
          not: {
            contains: {
              ...NONE_RECOGNITION,
              anyOf: [
                { type: "object", required: ["scheme"] },
                { type: "object", required: ["amount"] },
              ],
            },
          },
        },
      ],
    }),

  /** （受講）前提条件（選択） */
  prerequisites: z
    .array(
      z.strictObject({
        description: LocalizedText,
        url: HttpUrl.optional(),
      }),
    )
    .min(1)
    .optional(),

  /** 積み上げ可能性（選択）。積み上げ先を書く */
  stackableInto: z.array(NamedReference).min(1).optional(),
});

export const microCredentialProfile = defineProfile({
  id: "microcredential",
  version: "0.1.0",
  title: "マイクロクレデンシャル記述子",
  description:
    "国内フレームワーク 1.0 の記述子のうち、ガイドライン 3.0 が文章で入れる 11 個を、値として取り出せる形にした構造化データ",
  references: [
    "https://micro-credentials.jp/wp-content/uploads/2024/04/MC_frameworkver1.0.pdf",
    "https://micro-credential-jwg.org/wp-content/uploads/2025/05/Guideline-for-issuing-micro-credentials-digitally-3.0-20250527.pdf",
  ],
  schema: MicroCredentialDescriptors,
});

export type MicroCredentialDescriptors = ProfileMetadata<typeof microCredentialProfile>;
