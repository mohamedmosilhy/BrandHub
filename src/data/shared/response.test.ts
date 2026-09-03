import { z } from 'zod';

import { ContractError } from '@core/errors';

import { parseResponse, unwrapEnvelope } from './response';

const schema = z.object({ id: z.string(), name: z.string() });

describe('response boundary', () => {
  it('passes bare payloads through unchanged', () => {
    const payload = { id: '1', name: 'Electronics' };
    expect(unwrapEnvelope(payload)).toBe(payload);
    expect(parseResponse(schema, payload, '/categories/tree', 'cor-1')).toEqual(
      payload,
    );
  });

  it('unwraps success envelopes before validation', () => {
    const payload = { id: '1', name: 'Electronics' };
    expect(
      parseResponse(
        schema,
        { success: true, data: payload },
        '/categories/tree',
        'cor-1',
      ),
    ).toEqual(payload);
  });

  it('names the endpoint and failing field path in ContractError', () => {
    expect(() =>
      parseResponse(
        schema,
        { id: 1, name: 'Electronics' },
        '/categories/tree',
        'cor-9',
      ),
    ).toThrow(ContractError);

    try {
      parseResponse(
        schema,
        { id: 1, name: 'Electronics' },
        '/categories/tree',
        'cor-9',
      );
    } catch (error) {
      expect(error).toMatchObject({
        correlationId: 'cor-9',
        message: expect.stringContaining('/categories/tree'),
        details: expect.objectContaining({ paths: ['id'] }),
      });
    }
  });
});
