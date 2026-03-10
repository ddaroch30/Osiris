export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
  error?: { code: string; message: string };
}

export const ok = <T>(data: T, meta?: Record<string, unknown>): ApiResponse<T> => ({ data, meta });
