declare module 'json-server' {
  import type { RequestHandler, Router } from 'express';

  type Database = Record<string, unknown[]>;

  const jsonServer: {
    create(): import('express').Express;
    defaults(options?: Record<string, unknown>): RequestHandler[];
    router(source: string | Database): Router;
    rewriter(routes: Record<string, string>): RequestHandler;
    bodyParser: RequestHandler;
  };

  export default jsonServer;
}
