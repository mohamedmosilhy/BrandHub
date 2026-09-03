import { rest } from 'msw';

import { categoryTreeResponse } from '@test/builders';

export const mockApiBaseUrl = 'https://mock-api.brandhub.test/api/v1';

export const handlers = [
  rest.get(
    `${mockApiBaseUrl}/categories/tree`,
    (request, response, context) => {
      const locale = request.headers.get('accept-language');
      const correlationId = request.headers.get('x-correlation-id');
      if (!locale || !correlationId) {
        return response(
          context.status(400),
          context.json({ message: 'Required headers missing' }),
        );
      }
      return response(
        context.set('x-correlation-id', correlationId),
        context.json(categoryTreeResponse),
      );
    },
  ),
];
