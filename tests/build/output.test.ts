import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import packageJson from "../../package.json" with { type: "json" };
import {
  CONTEXT_URL,
  CREDENTIAL_SCHEMA_URL,
  RULE_BASE_URL,
  RULE_VERSION,
  jsonLdContext,
  narrativeTestVectors,
  profiles,
  toCredentialJsonSchema,
  toJsonSchema,
} from "../../src/index.ts";

/*
 * ビルドの出力を確かめる。pnpm build と scripts/build-site.ts の後に動かす（pnpm test:build）。
 * - dist/ の JSON が、ソースの値と同じ内容であること
 * - site/ に、公開先の URL と同じ並びでファイルが置かれていること
 * - package.json の exports が指すファイルが存在すること
 */

const root = join(import.meta.dirname, "..", "..");
const dist = join(root, "dist");
const site = join(root, "site");

const readJson = (file: string): unknown => JSON.parse(readFileSync(file, "utf8"));

/** JSON に書き出して読み直した値（undefined の項目などが落ちた形） */
const asJson = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

const TEST_VECTORS_URL = CONTEXT_URL.replace(/context\.json$/, "test-vectors.json");

/** 公開するファイル。URL と、ソースの値 */
const published: [url: string, value: unknown][] = [
  [CONTEXT_URL, jsonLdContext],
  [CREDENTIAL_SCHEMA_URL, toCredentialJsonSchema()],
  [TEST_VECTORS_URL, narrativeTestVectors],
];

describe("dist/rule/microcredential/<版>/", () => {
  const ruleDir = join(dist, "rule", "microcredential", RULE_VERSION);

  it.each(published)("%s の中身が、ソースの値と同じ", (url, value) => {
    const name = url.split("/").at(-1) ?? "";
    expect(readJson(join(ruleDir, name))).toEqual(asJson(value));
  });
});

describe("dist/schemas/", () => {
  it.each(profiles.map((p) => [p.id, p] as const))("%s.json が toJsonSchema() と同じ", (id, profile) => {
    expect(readJson(join(dist, "schemas", `${id}.json`))).toEqual(asJson(toJsonSchema(profile)));
  });
});

describe("site/", () => {
  /** GitHub Pages のルートは /<リポジトリ名>/ なので、URL のパスの 1 つ目を除いた残りが site/ の中の置き場所 */
  const sitePathOf = (url: string): string => {
    const [, , ...rest] = new URL(url).pathname.split("/");
    return join(site, ...rest);
  };

  it("公開する URL は、RULE_BASE_URL の下にある", () => {
    for (const [url] of published) expect(url.startsWith(`${RULE_BASE_URL}/`)).toBe(true);
  });

  it.each(published)("%s が、URL と同じ並びで置かれている", (url, value) => {
    const file = sitePathOf(url);
    expect(existsSync(file)).toBe(true);
    expect(readJson(file)).toEqual(asJson(value));
  });

  it("index.html があり、3 つのファイルの URL を載せている", () => {
    const html = readFileSync(join(site, "index.html"), "utf8");
    for (const [url] of published) expect(html).toContain(`href="${url}"`);
  });
});

describe("package.json の exports", () => {
  /** パッケージ名から、Node.js と同じ方法で解決したファイル（自分自身のパッケージを名前で参照する） */
  const resolve = (specifier: string): string => {
    const url = execFileSync(
      process.execPath,
      ["--input-type=module", "-e", `console.log(import.meta.resolve(${JSON.stringify(specifier)}))`],
      { cwd: root, encoding: "utf8" },
    ).trim();
    return fileURLToPath(url);
  };

  const specifiers = [
    packageJson.name,
    ...profiles.map((p) => `${packageJson.name}/schemas/${p.id}.json`),
    ...published.map(
      ([url]) => `${packageJson.name}/rule/${url.slice(`${RULE_BASE_URL}/`.length)}`,
    ),
  ];

  it.each(specifiers)("%s が、存在するファイルに解決される", (specifier) => {
    const file = resolve(specifier);
    expect(file.startsWith(`${dist}/`)).toBe(true);
    expect(existsSync(file)).toBe(true);
  });

  it("型定義のファイルがある", () => {
    expect(existsSync(join(root, packageJson.exports["."].types))).toBe(true);
  });

  it("パッケージの入口から、主な関数を読み込める", async () => {
    const entry = (await import(resolve(packageJson.name))) as Record<string, unknown>;
    for (const name of ["toCriteriaNarrative", "validateBadge", "validateMetadata", "escapeMarkdown"]) {
      expect(typeof entry[name]).toBe("function");
    }
  });

  it("exports の * を含まない行き先は、すべて存在する", () => {
    const targets = Object.values(packageJson.exports).flatMap((t) =>
      typeof t === "string" ? [t] : Object.values(t),
    );
    for (const target of targets.filter((t) => !t.includes("*"))) {
      expect(existsSync(join(root, target)), target).toBe(true);
    }
  });
});
