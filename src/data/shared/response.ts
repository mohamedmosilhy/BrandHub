import { z } from 'zod';

import { ContractError } from '@core/errors';

export function unwrapEnvelope(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  return record['success'] === true && Object.hasOwn(record, 'data')
    ? record['data']
    : value;
}

export function parseResponse<T>(
  schema: z.ZodType<T>,
  response: unknown,
  endpoint: string,
  correlationId: string,
): T {
  const result = schema.safeParse(unwrapEnvelope(response));
  if (result.success) return result.data;

  const paths = result.error.issues.map(
    (issue) => issue.path.join('.') || '(root)',
  );
  throw new ContractError({
    code: 'CONTRACT_INVALID_RESPONSE',
    message: `Response from ${endpoint} failed validation at ${paths.join(', ')}`,
    correlationId,
    details: {
      endpoint,
      paths,
      issues: result.error.issues.map((issue) => issue.message),
    },
  });
}
