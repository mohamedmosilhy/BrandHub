import { existsSync } from 'node:fs';

import express, { type Express } from 'express';
import jsonServer from 'json-server';

import { bearerAuth } from './middleware/auth';
import { faults } from './middleware/faults';
import { latency } from './middleware/latency';
import { routeRewrites } from './middleware/rewrite';
import { registerContractRoutes } from './routes';
import { defaultDatabasePath, writeSeedDatabase } from './seed/generate';
import { MockStore } from './store';

export type MockAppOptions = Readonly<{
  databasePath?: string;
  defaultLatencyMs?: number;
  timeoutFaultMs?: number;
  logger?: boolean;
}>;

export function createMockApp(options: MockAppOptions = {}): Express {
  const databasePath = options.databasePath ?? defaultDatabasePath;
  if (!existsSync(databasePath)) writeSeedDatabase(databasePath);

  const store = new MockStore(databasePath);
  const app = jsonServer.create();
  app.disable('x-powered-by');
  app.use(jsonServer.defaults({ logger: options.logger ?? false }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(latency(options.defaultLatencyMs ?? 120));
  app.use('/api/v1', bearerAuth());
  app.use('/api/v1', faults(options.timeoutFaultMs ?? 30_000));

  app.get('/health', (_request, response) => {
    response.json({ status: 'UP', service: 'brandhub-mock' });
  });

  registerContractRoutes(app, store);

  // Keep JSON Server mounted as the persistence fallback. Contract handlers above
  // intentionally own every app-facing route and shape their real Spring responses.
  app.use(jsonServer.rewriter(routeRewrites));
  app.use('/api/v1', jsonServer.router(databasePath));

  return app;
}
