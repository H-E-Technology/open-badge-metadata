import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import exampleBadge from "../examples/microcredential-badge.json" with { type: "json" };
import { validateBadge } from "../src/index.ts";

/*
 * 文書の記載例（docs/storage-rule.md の 7 章の JSON）と examples/microcredential-badge.json が
 * 同じ内容であることを確かめる。記載例は文書を読んで実装する人の手本なので、
 * 検証を通らない例が文書に残らないようにする。
 */

const storageRule = readFileSync(join(import.meta.dirname, "..", "docs", "storage-rule.md"), "utf8");

/** 見出し（## で始まる行）で区切った、その章の本文 */
function sectionOf(markdown: string, heading: string): string {
  const lines = markdown.split("\n");
  const start = lines.indexOf(heading);
  if (start === -1) throw new Error(`見出し「${heading}」がありません`);
  const end = lines.findIndex((line, i) => i > start && line.startsWith("## "));
  return lines.slice(start + 1, end === -1 ? undefined : end).join("\n");
}

/** 本文の中の ```json のコードブロック */
const jsonBlocksOf = (markdown: string): string[] =>
  [...markdown.matchAll(/^```json\n([\s\S]*?)^```$/gm)].map((m) => m[1] ?? "");

describe("docs/storage-rule.md の記載例", () => {
  const blocks = jsonBlocksOf(sectionOf(storageRule, "## 7. 記載例"));

  it("7 章に JSON のコードブロックが 1 つある", () => {
    expect(blocks).toHaveLength(1);
  });

  it("examples/microcredential-badge.json と同じ内容", () => {
    expect(JSON.parse(blocks[0] ?? "")).toEqual(exampleBadge);
  });

  it("validateBadge() を通る", () => {
    const result = validateBadge(JSON.parse(blocks[0] ?? ""));
    expect(result.success ? [] : result.issues).toEqual([]);
  });
});
