export {
  defineProfile,
  toJsonSchema,
  validateMetadata,
  type ProfileDefinition,
  type ProfileMetadata,
  type ValidationResult,
} from "./profile.ts";
export {
  AssessmentMethod,
  CountryCode,
  HTTP_URL_PATTERN,
  HttpUrl,
  IsoDate,
  LanguageTag,
  LocalizedText,
  Organization,
  ParticipationMode,
} from "./common.ts";
export {
  Alignment,
  DESCRIPTORS_TYPE,
  MicroCredentialDescriptors,
  ParticipationTiming,
  RecognitionKind,
  microCredentialProfile,
} from "./profiles/microcredential.ts";
export { NARRATIVE_HEADINGS, renderText, toCriteriaNarrative } from "./narrative.ts";
export { MicroCredentialBadge, toCredentialJsonSchema, validateBadge } from "./badge.ts";
export { jsonLdContext } from "./context.ts";
export { narrativeTestVectors, type NarrativeTestVector } from "./vectors.ts";
export {
  ACHIEVEMENT_TYPE,
  CONTEXT_URL,
  CREDENTIAL_SCHEMA_URL,
  FRAMEWORK_URLS,
  OB_CONTEXT_URL,
  OB_CREDENTIAL_SCHEMA_URL,
  OB_EXTENSIONS_CONTEXT_URL,
  RULE_BASE_URL,
  RULE_VERSION,
  SCHEMA_VALIDATOR_TYPE,
  VC_CONTEXT_URL,
  VOCAB_URL,
} from "./rule.ts";
export { EuMicrocredentialMetadata, euMicrocredentialProfile } from "./profiles/eu-microcredential.ts";
export {
  CompletionCertificateMetadata,
  completionCertificateProfile,
} from "./profiles/completion-certificate.ts";

import { completionCertificateProfile } from "./profiles/completion-certificate.ts";
import { euMicrocredentialProfile } from "./profiles/eu-microcredential.ts";
import { microCredentialProfile } from "./profiles/microcredential.ts";

/** このパッケージが定めるプロファイルの一覧 */
export const profiles = [
  microCredentialProfile,
  euMicrocredentialProfile,
  completionCertificateProfile,
] as const;
