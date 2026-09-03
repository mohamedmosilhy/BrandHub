import { createHmac, timingSafeEqual } from 'node:crypto';

import type { Request, RequestHandler } from 'express';

import { apiError } from './envelope';

type TokenKind = 'access' | 'refresh';

type TokenPayload = Readonly<{
  sub: string;
  role: string;
  kind: TokenKind;
  exp: number;
  nonce: string;
}>;

const SECRET = 'brandhub-local-mock-only';

function encode(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function sign(value: string): string {
  return createHmac('sha256', SECRET).update(value).digest('base64url');
}

export function issueToken(
  userId: string,
  role: string,
  kind: TokenKind,
  lifetimeSeconds = kind === 'access' ? 300 : 86_400,
): string {
  const payload: TokenPayload = {
    sub: userId,
    role,
    kind,
    exp: Math.floor(Date.now() / 1000) + lifetimeSeconds,
    nonce: Math.random().toString(36).slice(2),
  };
  const encoded = encode(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

export function readToken(
  token: string,
  expectedKind: TokenKind,
): TokenPayload | null {
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;
  const expected = Buffer.from(sign(encoded));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as TokenPayload;
    if (
      payload.kind !== expectedKind ||
      payload.exp <= Math.floor(Date.now() / 1000)
    )
      return null;
    return payload;
  } catch {
    return null;
  }
}

const publicGetPrefixes = [
  '/products',
  '/categories',
  '/search/products',
  '/sellers',
  '/areas',
  '/shipping-rates',
  '/mock-assets',
  '/influencers',
  '/posts',
  // D3: browsing is public, and a product's reviews are part of the product page a guest sees.
  // Writing one still needs a session — only the GET prefix is listed here.
  '/reviews/product',
];

function isPublic(request: Request): boolean {
  if (request.path.startsWith('/auth/')) return true;
  if (/^\/users\/[^/]+\/profile-image$/.test(request.path)) return true;
  return (
    request.method === 'GET' &&
    publicGetPrefixes.some((prefix) => request.path.startsWith(prefix))
  );
}

export function bearerAuth(): RequestHandler {
  return (request, response, next) => {
    if (isPublic(request)) {
      next();
      return;
    }
    const header = request.header('authorization');
    const payload = header?.startsWith('Bearer ')
      ? readToken(header.slice('Bearer '.length), 'access')
      : null;
    if (!payload) {
      response
        .status(401)
        .json(
          apiError(401, 'UNAUTHORIZED', 'A valid bearer token is required'),
        );
      return;
    }
    response.locals['userId'] = payload.sub;
    response.locals['role'] = payload.role;
    next();
  };
}

export function authenticatedUserId(response: {
  locals: Record<string, unknown>;
}): string {
  return typeof response.locals['userId'] === 'string'
    ? response.locals['userId']
    : 'user-customer';
}
