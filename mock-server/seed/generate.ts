import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { buildSeedDatabase } from './data';

export const defaultDatabasePath = resolve(
  process.cwd(),
  'mock-server',
  'db.json',
);

export function writeSeedDatabase(path = defaultDatabasePath): void {
  writeFileSync(
    path,
    `${JSON.stringify(buildSeedDatabase(), null, 2)}\n`,
    'utf8',
  );
}

if (process.argv[1]?.endsWith('mock-server/seed/generate.ts')) {
  writeSeedDatabase();
  console.log(`Reset mock database at ${defaultDatabasePath}`);
}
