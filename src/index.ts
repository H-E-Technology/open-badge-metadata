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
