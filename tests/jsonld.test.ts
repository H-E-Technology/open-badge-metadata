import { contexts as vcContexts } from "@digitalbazaar/credentials-context";
import { contexts as obContexts } from "@digitalcredentials/open-badges-context";
import jsonld from "jsonld";
import { describe, expect, it } from "vitest";
import exampleBadge from "../examples/microcredential-badge.json" with { type: "json" };
import { CONTEXT_URL, VOCAB_URL, jsonLdContext, narrativeTestVectors } from "../src/index.ts";

/**
 * このルールのコンテキストを、本物の JSON-LD 処理系に通して確かめる。
 * 署名付きのバッジ（Data Integrity）は JSON-LD として処理されるので、
 * ここで通らないコンテキストは、発行時や検証時に失敗する。
 *
 * コンテキストはネットワークから取らず、手元の写しを使う。
 */
const documents = new Map<string, unknown>([
  ...vcContexts,
  ...obContexts,
  [CONTEXT_URL, jsonLdContext],
]);

const documentLoader = async (url: string) => {
  if (!documents.has(url)) throw new Error(`手元に無いコンテキスト: ${url}`);
  return { contextUrl: null, documentUrl: url, document: documents.get(url) };
};

/** safe: true にすると、コンテキストに定義の無い項目があったときに失敗する */
const options = { documentLoader, safe: true };

const OB = "https://purl.imsglobal.org/spec/vc/ob/vocab.html#";
const term = (name: string): string => `${VOCAB_URL}${name}`;

type Node = Record<string, any>;

async function expandDescriptors(badge: unknown): Promise<Node> {
  const [credential] = (await jsonld.expand(badge, options)) as Node[];
  const subject = credential?.["https://www.w3.org/2018/credentials#credentialSubject"]?.[0];
  const achievement = subject?.[`${OB}achievement`]?.[0];
  return achievement?.[term("microCredentialDescriptors")]?.[0];
}

const badgeWith = (descriptors: unknown): unknown => ({
  ...exampleBadge,
  credentialSubject: {
    ...exampleBadge.credentialSubject,
    achievement: {
      ...exampleBadge.credentialSubject.achievement,
      microCredentialDescriptors: descriptors,
    },
  },
});

describe("JSON-LD コンテキスト", () => {
  it("足す項目名は microCredentialDescriptors の 1 つだけ", () => {
    const names = Object.keys(jsonLdContext["@context"]).filter((key) => !key.startsWith("@"));
    expect(names).toEqual(["microCredentialDescriptors"]);
  });

  it("記載例のバッジを、定義の無い項目なしで展開できる", async () => {
    const descriptors = await expandDescriptors(exampleBadge);
    expect(descriptors["@type"]).toEqual([term("MicroCredentialDescriptors")]);

    const effort = descriptors[term("learnerEffort")][0];
    expect(effort[term("totalHours")]).toEqual([{ "@value": 90 }]);
    expect(effort[term("contactHours")]).toEqual([{ "@value": 30 }]);
  });

  it("テキストは言語タグ付きの値になり、配列は順番を保つ", async () => {
    const descriptors = await expandDescriptors(exampleBadge);
    const outcomes = descriptors[term("learningOutcomes")][0]["@list"] as Node[];
    expect(outcomes.map((o) => o["https://schema.org/description"])).toEqual([
      [{ "@value": "データサイエンスの基本概念を理解する", "@language": "ja" }],
      [{ "@value": "統計手法を実世界の問題に適用する", "@language": "ja" }],
    ]);
  });

  it.each(narrativeTestVectors.map((v) => [v.name, v] as const))(
    "照合用データ「%s」の構造化データを展開できる",
    async (_, vector) => {
      const descriptors = await expandDescriptors(badgeWith(vector.descriptors));
      expect(descriptors["@type"]).toEqual([term("MicroCredentialDescriptors")]);
    },
  );

  it("学修成果の中の alignment は、OB 3.0 の Alignment として読める", async () => {
    const full = narrativeTestVectors.find((v) => v.descriptors.learningOutcomes[0]?.alignment);
    const descriptors = await expandDescriptors(badgeWith(full?.descriptors));
    const outcome = descriptors[term("learningOutcomes")][0]["@list"][0];
    const alignment = outcome[`${OB}alignment`][0];
    expect(alignment["@type"]).toEqual(["https://schema.org/AlignmentObject"]);
    expect(alignment["https://schema.org/targetName"]).toEqual([
      { "@value": "サンプルスキル標準 データ分析 1" },
    ]);
  });

  it("署名の前処理（RDF への正規化）ができる", async () => {
    const nquads = await jsonld.canonize(exampleBadge, {
      ...options,
      algorithm: "RDFC-1.0",
      format: "application/n-quads",
    });
    expect(nquads).toContain(term("totalHours"));
  });

  it("定義の無い項目名は、展開の段階で失敗する", async () => {
    const typo = badgeWith({
      ...exampleBadge.credentialSubject.achievement.microCredentialDescriptors,
      learnerEffort: { totalHour: 90 },
    });
    await expect(jsonld.expand(typo, options)).rejects.toThrow();
  });
});
