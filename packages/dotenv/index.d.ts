export interface DotenvConfigOptions {
  path?: string;
}

export interface DotenvConfigOutput {
  parsed?: Record<string, string>;
  error?: Error;
}

export declare function config(options?: DotenvConfigOptions): DotenvConfigOutput;
export declare function parse(content: string): Record<string, string>;
