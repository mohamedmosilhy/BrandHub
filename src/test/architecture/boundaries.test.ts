/**
 * @jest-environment node
 *
 * Proves that the architecture rules in `eslint.config.js` actually fire.
 *
 * A dependency rule that only lives in a document is a suggestion. This suite
 * writes real files into each layer, lints them with the project's own ESLint
 * configuration, then deletes them. Real files matter: `boundaries` classifies a
 * dependency by resolving it, so a synthetic import of a module that does not
 * exist is silently ignored and would make this suite pass for the wrong reason.
 *
 * Covers plan.md AC1.3, AC1.4, AC1.5 and AC1.6.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import { ESLint } from 'eslint';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

/** Temp folders are named so a crashed run is obvious and easy to sweep. */
const TMP = '__arch_tmp__';

let eslint: ESLint;
const written: string[] = [];

beforeAll(() => {
  eslint = new ESLint({ cwd: projectRoot });
  sweep();
});

afterEach(() => {
  while (written.length > 0) {
    const file = written.pop();
    if (file !== undefined && fs.existsSync(file)) {
      fs.rmSync(file, { force: true });
    }
  }
});

afterAll(sweep);

/** Removes every temp folder this suite could have left behind. */
function sweep(): void {
  for (const layer of [
    'core',
    'domain',
    'data',
    'infrastructure',
    'presentation',
    'app',
  ]) {
    const dir = path.join(projectRoot, 'src', layer, TMP);
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/** Writes a real source file under `src/` and returns its absolute path. */
function write(relativePath: string, code: string): string {
  const absolute = path.join(projectRoot, relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, code, 'utf8');
  written.push(absolute);
  return absolute;
}

/** A trivial module used as an import target, so the import resolves. */
function writeTarget(relativePath: string): void {
  write(relativePath, 'export const target = 1;\n');
}

async function lint(absolutePath: string): Promise<ESLint.LintResult[]> {
  return eslint.lintFiles([absolutePath]);
}

async function ruleIdsOf(absolutePath: string): Promise<string[]> {
  const results = await lint(absolutePath);
  return results.flatMap((r) => r.messages).map((m) => m.ruleId ?? 'fatal');
}

async function messagesOf(absolutePath: string): Promise<string> {
  const results = await lint(absolutePath);
  return results
    .flatMap((r) => r.messages)
    .map((m) => m.message)
    .join('\n');
}

/** Writes a target module and an importer of it, and lints the importer. */
async function lintImport(
  fromLayer: string,
  toLayer: string,
  targetSubPath = 'target',
): Promise<{ ruleIds: string[]; messages: string }> {
  writeTarget(`src/${toLayer}/${TMP}/${targetSubPath}.ts`);
  const importer = write(
    `src/${fromLayer}/${TMP}/importer.ts`,
    `import { target } from '@${toLayer}/${TMP}/${targetSubPath}';\n\n` +
      `export const value = target;\n`,
  );
  return {
    ruleIds: await ruleIdsOf(importer),
    messages: await messagesOf(importer),
  };
}

describe('layer boundaries (DR1–DR7)', () => {
  it('AC1.3 — rejects an import from presentation into data', async () => {
    const { ruleIds, messages } = await lintImport('presentation', 'data');
    expect(ruleIds).toContain('boundaries/dependencies');
    expect(messages).toContain('"presentation"');
    expect(messages).toContain('"data"');
  });

  it('AC1.3 — rejects an import from presentation into infrastructure', async () => {
    const { ruleIds } = await lintImport('presentation', 'infrastructure');
    expect(ruleIds).toContain('boundaries/dependencies');
  });

  it('rejects an import from the domain into the data layer', async () => {
    const { ruleIds } = await lintImport('domain', 'data');
    expect(ruleIds).toContain('boundaries/dependencies');
  });

  it('rejects an import from the domain into infrastructure', async () => {
    const { ruleIds } = await lintImport('domain', 'infrastructure');
    expect(ruleIds).toContain('boundaries/dependencies');
  });

  it('rejects an import from infrastructure into the domain', async () => {
    const { ruleIds } = await lintImport('infrastructure', 'domain');
    expect(ruleIds).toContain('boundaries/dependencies');
  });

  it('rejects an import from core into any other layer', async () => {
    const { ruleIds } = await lintImport('core', 'domain');
    expect(ruleIds).toContain('boundaries/dependencies');
  });

  it('DR7 — rejects a DTO imported from outside the data layer', async () => {
    const { ruleIds, messages } = await lintImport(
      'presentation',
      'data',
      'dto/ProductDto',
    );
    expect(ruleIds).toContain('boundaries/dependencies');
    expect(messages).toMatch(/DTOs are data-layer types|policy allowing/);
  });

  it('AC1.4 — rejects react-native imported from the domain layer', async () => {
    const importer = write(
      `src/domain/${TMP}/importer.ts`,
      `import { Platform } from 'react-native';\n\nexport const os = Platform.OS;\n`,
    );
    const messages = await messagesOf(importer);
    expect(messages).toMatch(/testable in plain Node/);
  });

  it('AC1.4 — rejects react imported from the core layer', async () => {
    const importer = write(
      `src/core/${TMP}/importer.ts`,
      `import { useMemo } from 'react';\n\nexport const memo = useMemo;\n`,
    );
    const messages = await messagesOf(importer);
    expect(messages).toMatch(/testable in plain Node/);
  });

  it('allows presentation → domain', async () => {
    const { ruleIds } = await lintImport('presentation', 'domain');
    expect(ruleIds).not.toContain('boundaries/dependencies');
  });

  it('allows data → domain, data → infrastructure and data → core', async () => {
    for (const target of ['domain', 'infrastructure', 'core']) {
      const { ruleIds } = await lintImport('data', target);
      expect(ruleIds).not.toContain('boundaries/dependencies');
    }
  });

  it('allows app → every layer', async () => {
    for (const target of [
      'presentation',
      'domain',
      'data',
      'infrastructure',
      'core',
    ]) {
      const { ruleIds } = await lintImport('app', target);
      expect(ruleIds).not.toContain('boundaries/dependencies');
    }
  });

  it('allows react-native in the presentation layer', async () => {
    const importer = write(
      `src/presentation/${TMP}/importer.ts`,
      `import { Platform } from 'react-native';\n\nexport const os = Platform.OS;\n`,
    );
    const messages = await messagesOf(importer);
    expect(messages).not.toMatch(/testable in plain Node/);
  });
});

describe('design tokens and RTL safety', () => {
  it('AC1.5 — rejects a hex colour literal outside the theme', async () => {
    const file = write(
      `src/presentation/${TMP}/colour.ts`,
      `export const brand = '#7F77DD';\n`,
    );
    expect(await messagesOf(file)).toMatch(/Colour literals belong in/);
  });

  it('AC1.5 — allows hex colour literals inside the theme', async () => {
    const file = write(
      'src/presentation/theme/__arch_tmp_palette.ts',
      `export const brand = '#7F77DD';\n`,
    );
    expect(await messagesOf(file)).not.toMatch(/Colour literals belong in/);
  });

  it('AC1.6 — rejects physical left/right positioning', async () => {
    const file = write(
      `src/presentation/${TMP}/style.ts`,
      `export const s = { position: 'absolute', left: 8 } as const;\n`,
    );
    expect(await messagesOf(file)).toMatch(/do not mirror under RTL/);
  });

  it('AC1.6 — rejects physical margin and padding', async () => {
    const file = write(
      `src/presentation/${TMP}/style.ts`,
      `export const s = { marginLeft: 4, paddingRight: 8 } as const;\n`,
    );
    expect(await messagesOf(file)).toMatch(/do not mirror under RTL/);
  });

  it("AC1.6 — rejects textAlign: 'right'", async () => {
    const file = write(
      `src/presentation/${TMP}/style.ts`,
      `export const s = { textAlign: 'right' } as const;\n`,
    );
    expect(await messagesOf(file)).toMatch(/do not mirror under RTL/);
  });

  it('AC1.6 — allows the logical equivalents', async () => {
    const file = write(
      `src/presentation/${TMP}/style.ts`,
      `export const s = { marginStart: 4, paddingEnd: 8 } as const;\n`,
    );
    expect(await messagesOf(file)).not.toMatch(/do not mirror under RTL/);
  });
});
