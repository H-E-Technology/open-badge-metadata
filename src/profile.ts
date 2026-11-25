import { z } from "zod";

/**
 * プロファイル: 「この種類のバッジには、このメタデータを入れる」という決まりごと。
 *
 * 1 つのプロファイルは次をまとめて持つ。
 * - id / version: バッジの中でどの決まりに従ったかを示す識別子
 * - schema: メタデータの形（zod）。型（TypeScript）と JSON Schema はここから作る
 */
export interface ProfileDefinition<S extends z.ZodType = z.ZodType> {
  /** 例: "microcredential" */
  readonly id: string;
  /** プロファイル自体の版（SemVer）。項目を足す・意味を変えるときに上げる */
  readonly version: string;
  /** 人が読む名前 */
  readonly title: string;
  readonly description: string;
  /** 決まりの出典（指針・規格など） */
  readonly references: readonly string[];
  readonly schema: S;
}

export function defineProfile<S extends z.ZodType>(
  definition: ProfileDefinition<S>,
): ProfileDefinition<S> {
  return definition;
}

/** プロファイルが定めるメタデータの型 */
export type ProfileMetadata<P extends ProfileDefinition> = z.infer<P["schema"]>;

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; issues: z.core.$ZodIssue[] };

/** メタデータがプロファイルの決まりを満たすかを調べる */
export function validateMetadata<P extends ProfileDefinition>(
  profile: P,
  input: unknown,
): ValidationResult<ProfileMetadata<P>> {
  const result = profile.schema.safeParse(input);
  return result.success
    ? { success: true, data: result.data as ProfileMetadata<P> }
    : { success: false, issues: result.error.issues };
}

/** プロファイルの JSON Schema（Draft 2020-12）。TypeScript 以外（Flutter など）から使う */
export function toJsonSchema(profile: ProfileDefinition): Record<string, unknown> {
  return {
    $id: `https://github.com/H-E-Technology/open-badge-metadata/schemas/${profile.id}/${profile.version}.json`,
    title: profile.title,
    description: profile.description,
    ...z.toJSONSchema(profile.schema, { target: "draft-2020-12" }),
  };
}
