import type { IdempotencyKey } from '@core/types';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestConfig = Readonly<{
  method: HttpMethod;
  endpoint: string;
  query?: Readonly<Record<string, string | number | boolean | undefined>>;
  body?: unknown;
  headers?: Readonly<Record<string, string>>;
  idempotencyKey?: IdempotencyKey;
  signal?: AbortSignal;
}>;

export type HttpResponse<T> = Readonly<{
  data: T;
  status: number;
  headers: Readonly<Record<string, string>>;
  correlationId: string;
}>;

export interface HttpClient {
  request<T>(config: RequestConfig): Promise<HttpResponse<T>>;
}
