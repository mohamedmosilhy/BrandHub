import { readFileSync, writeFileSync } from 'node:fs';

import type { MockDatabase } from './seed/types';

export class MockStore {
  readonly data: MockDatabase;

  constructor(readonly path: string) {
    this.data = JSON.parse(readFileSync(path, 'utf8')) as MockDatabase;
  }

  write(): void {
    writeFileSync(this.path, `${JSON.stringify(this.data, null, 2)}\n`, 'utf8');
  }

  collection(name: keyof MockDatabase): Record<string, unknown>[] {
    return this.data[name];
  }
}
