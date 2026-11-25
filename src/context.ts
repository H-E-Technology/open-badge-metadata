import { VOCAB_URL } from "./rule.ts";

/**
 * このルールの JSON-LD コンテキスト。
 *
 * 足す項目名は microCredentialDescriptors の 1 つだけで、その中で使う項目名は
 * すべて「この項目の中だけで効く定義」（プロパティに付けたコンテキスト）に入れている。
 *
 * - VC 2.0 と OB 3.0 のコンテキストは、name、description、url などの再定義を禁じている。
 *   ただし JSON-LD 1.1 では、プロパティに付けたコンテキストの中に限って再定義できる。
 *   これを使い、name と description を「言語タグをキーにしたテキスト」として定義し直している。
 * - プロパティに付けたコンテキストは入れ子の中まで効くので、
 *   learningOutcomes の要素や participation の中でも同じ定義が使える。
 * - 並び順に意味のある配列（文章にしたときの順番になる）は、@list にしている。
 */

const term = (name: string): string => `${VOCAB_URL}${name}`;
const list = (name: string) => ({ "@id": term(name), "@container": "@list" }) as const;

const XSD_ANY_URI = "http://www.w3.org/2001/XMLSchema#anyURI";

export const jsonLdContext = {
  "@context": {
    "@version": 1.1,
    "@protected": true,
    microCredentialDescriptors: {
      "@id": term("microCredentialDescriptors"),
      "@context": {
        MicroCredentialDescriptors: term("MicroCredentialDescriptors"),

        // テキスト（言語タグをキーにしたオブジェクト）と URL
        description: { "@id": "https://schema.org/description", "@container": "@language" },
        name: { "@id": "https://schema.org/name", "@container": "@language" },
        url: { "@id": "https://schema.org/url", "@type": XSD_ANY_URI },

        // 学修成果。alignment は OB 3.0 の定義をそのまま使う
        learningOutcomes: list("learningOutcomes"),

        // 授業言語
        languages: list("languages"),

        // 授業の方法
        participation: term("participation"),
        mode: term("mode"),
        timing: term("timing"),

        // 学習量
        learnerEffort: term("learnerEffort"),
        totalHours: term("totalHours"),
        contactHours: term("contactHours"),

        // 評価の方法
        assessments: list("assessments"),
        method: term("method"),

        // 質保証
        qualityAssurance: term("qualityAssurance"),
        internal: term("internal"),
        external: list("external"),

        // レベル
        levels: list("levels"),
        framework: term("framework"),
        value: term("value"),

        // 証明書
        certification: { "@id": term("certification"), "@container": "@language" },

        // 単位／その他の認定
        recognitions: list("recognitions"),
        kind: term("kind"),
        scheme: term("scheme"),
        amount: term("amount"),

        // 前提条件、積み上げ可能性
        prerequisites: list("prerequisites"),
        stackableInto: list("stackableInto"),
      },
    },
  },
} as const;
