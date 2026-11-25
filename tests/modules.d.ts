// 型定義を持たない、テスト用のパッケージ

declare module "jsonld" {
  interface Options {
    documentLoader?: (url: string) => Promise<unknown>;
    safe?: boolean;
    algorithm?: string;
    format?: string;
  }
  const jsonld: {
    expand(input: unknown, options?: Options): Promise<unknown[]>;
    canonize(input: unknown, options?: Options): Promise<string>;
  };
  export default jsonld;
}

declare module "@digitalbazaar/credentials-context" {
  export const contexts: Map<string, unknown>;
}

declare module "@digitalcredentials/open-badges-context" {
  export const contexts: Map<string, unknown>;
}
