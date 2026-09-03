import type { RequestHandler } from 'express';

export function latency(defaultMs: number): RequestHandler {
  return (request, _response, next) => {
    const requested = Number(request.header('x-mock-latency'));
    const duration = Number.isFinite(requested)
      ? Math.max(0, Math.min(requested, 10_000))
      : defaultMs;
    setTimeout(next, duration);
  };
}
