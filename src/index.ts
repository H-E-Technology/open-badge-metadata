export {
  defineProfile,
  toJsonSchema,
  validateMetadata,
  type ProfileDefinition,
  type ProfileMetadata,
  type ValidationResult,
} from "./profile.ts";
export { CountryCode, IsoDate, LocalizedText, Organization } from "./common.ts";
export {
  AssessmentType,
  MicrocredentialMetadata,
  ParticipationForm,
  microcredentialProfile,
} from "./profiles/microcredential.ts";
export {
  CompletionCertificateMetadata,
  completionCertificateProfile,
} from "./profiles/completion-certificate.ts";

import { completionCertificateProfile } from "./profiles/completion-certificate.ts";
import { microcredentialProfile } from "./profiles/microcredential.ts";

/** このパッケージが定めるプロファイルの一覧 */
export const profiles = [microcredentialProfile, completionCertificateProfile] as const;
