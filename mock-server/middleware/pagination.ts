import type { Request } from 'express';

export type SpringPage<T> = Readonly<{
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}>;

function nonNegativeInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

export function pageOf<T>(
  items: T[],
  request: Pick<Request, 'query'>,
): SpringPage<T> {
  const number = nonNegativeInteger(request.query['page'], 0);
  const size = Math.max(1, nonNegativeInteger(request.query['size'], 20));
  const totalElements = items.length;
  const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / size);
  return {
    content: items.slice(number * size, number * size + size),
    totalElements,
    totalPages,
    number,
    size,
    first: number === 0,
    last: totalPages === 0 || number >= totalPages - 1,
  };
}

export function emptyPage(request: Pick<Request, 'query'>): SpringPage<never> {
  return pageOf([], request);
}
