import type { RequestHandler } from 'express';

import { apiError } from './envelope';
import { emptyPage } from './pagination';

const statusFaults = new Set(['401', '404', '409', '500']);

export function faults(timeoutMs = 30_000): RequestHandler {
  return (request, response, next) => {
    const fault = request.header('x-mock-fail');
    if (fault && statusFaults.has(fault)) {
      const status = Number(fault);
      response
        .status(status)
        .json(apiError(status, 'MOCK_FAULT', `Injected ${status} fault`));
      return;
    }
    if (fault === 'network') {
      request.socket.destroy();
      return;
    }
    if (fault === 'timeout') {
      setTimeout(() => {
        if (!response.headersSent) {
          response
            .status(504)
            .json(apiError(504, 'MOCK_TIMEOUT', 'Injected timeout'));
        }
      }, timeoutMs);
      return;
    }
    if (request.header('x-mock-empty') === 'true' && request.method === 'GET') {
      response.json(emptyPage(request));
      return;
    }
    next();
  };
}
