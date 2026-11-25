/**
 * 格納ルール（docs/storage-rule.md）が使う URL と決まった値。
 */

/**
 * コンテキスト、JSON Schema、語彙の公開先。
 *
 * ⚠️ 仮の URL。発行したバッジに書き込まれる値なので、公開した後は変えられない。
 *    公開先が決まったら、ここを差し替える（docs/open-questions.md）。
 */
export const RULE_BASE_URL = "https://example.org/open-badge-metadata";

/** ルールの版。項目や語彙を変えて、古い版と読み方が変わるときに上げる */
export const RULE_VERSION = "v1";

/** バッジの @context に入れる、このルールの JSON-LD コンテキスト */
export const CONTEXT_URL = `${RULE_BASE_URL}/microcredential/${RULE_VERSION}/context.json`;

/** バッジの credentialSchema に入れる、このルールの JSON Schema */
export const CREDENTIAL_SCHEMA_URL = `${RULE_BASE_URL}/microcredential/${RULE_VERSION}/schema.json`;

/** このルールが足す項目名の IRI の先頭 */
export const VOCAB_URL = `${RULE_BASE_URL}/vocab#`;

/** W3C Verifiable Credentials 2.0 のコンテキスト。@context の 1 番目 */
export const VC_CONTEXT_URL = "https://www.w3.org/ns/credentials/v2";

/** Open Badges 3.0 のコンテキスト。@context の 2 番目 */
export const OB_CONTEXT_URL = "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json";

/** Open Badges 3.0 のコンテキストとして受け付ける URL（3.0.x） */
export const OB_CONTEXT_URL_PATTERN =
  /^https:\/\/purl\.imsglobal\.org\/spec\/ob\/v3p0\/context-3\.0\.\d+\.json$/;

/**
 * Open Badges 3.0 の拡張用コンテキスト。credentialSchema の type
 * （1EdTechJsonSchemaValidator2019）を定義している。
 * これが @context に無いと、署名の前処理（JSON-LD としての処理）で失敗する。
 */
export const OB_EXTENSIONS_CONTEXT_URL = "https://purl.imsglobal.org/spec/ob/v3p0/extensions.json";

/** Open Badges 3.0 本体の JSON Schema。credentialSchema にこのルールのものと並べて入れる */
export const OB_CREDENTIAL_SCHEMA_URL =
  "https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json";

/** credentialSchema の type。Open Badges 3.0 の仕様が定める値 */
export const SCHEMA_VALIDATOR_TYPE = "1EdTechJsonSchemaValidator2019";

/** ガイドライン 3.0 が achievementType に入れるよう求める値 */
export const ACHIEVEMENT_TYPE = "MicroCredential";

/**
 * マイクロクレデンシャルのフレームワーク 1.0 の URL。
 * ガイドライン 3.0 は、achievement.alignment にこのフレームワークを入れるよう求めている。
 * 同じ文書が 2 か所で公開されているので、どちらも受け付ける。
 */
export const FRAMEWORK_URLS = [
  "https://micro-credential-jwg.org/wp-content/uploads/2024/04/MC_frameworkver1.0.pdf",
  "https://micro-credentials.jp/wp-content/uploads/2024/04/MC_frameworkver1.0.pdf",
] as const;
