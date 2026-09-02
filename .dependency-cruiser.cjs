/**
 * dependency-cruiser configuration.
 *
 * Two jobs. First, forbid cycles — ESLint's boundary rules say nothing about
 * them. Second, re-state the layer graph independently of ESLint, so a mistake
 * in one tool's configuration cannot silently disable the architecture check in
 * both. See docs/architecture.md §9.
 */

/** Path prefixes for each layer, used by the rules below. */
const LAYER = {
  core: '^src/core/',
  domain: '^src/domain/',
  data: '^src/data/',
  infrastructure: '^src/infrastructure/',
  presentation: '^src/presentation/',
  app: '^src/app/',
  test: '^src/test/',
};

/** Builds a "from X, only to Y" rule. */
const allowOnly = (name, from, allowed, comment) => ({
  name,
  comment,
  severity: 'error',
  from: { path: from },
  to: {
    path: '^src/',
    pathNot: allowed.join('|'),
  },
});

module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      comment:
        'A dependency cycle makes modules impossible to reason about or test in isolation.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans-in-domain',
      comment:
        'A domain module nothing imports is either dead code or a missing wiring step.',
      severity: 'warn',
      from: {
        path: '^src/domain/.+\\.ts$',
        pathNot: '\\.(test|spec)\\.ts$|/index\\.ts$',
        orphan: true,
      },
      to: {},
    },
    allowOnly(
      'core-imports-nothing',
      LAYER.core,
      [LAYER.core],
      'DR5 — core is the shared kernel and depends on no other layer.',
    ),
    allowOnly(
      'domain-sees-domain-and-core',
      LAYER.domain,
      [LAYER.domain, LAYER.core],
      'DR1 — the domain layer stays free of every implementation detail.',
    ),
    allowOnly(
      'data-sees-domain-core-infrastructure',
      LAYER.data,
      [LAYER.data, LAYER.domain, LAYER.core, LAYER.infrastructure],
      'DR3 — data implements domain ports using infrastructure.',
    ),
    allowOnly(
      'infrastructure-is-self-contained',
      LAYER.infrastructure,
      [LAYER.infrastructure, LAYER.core],
      'DR4 — infrastructure knows nothing about the domain or the UI.',
    ),
    allowOnly(
      'presentation-never-sees-data-or-infrastructure',
      LAYER.presentation,
      [LAYER.presentation, LAYER.domain, LAYER.core],
      'DR2 — the UI talks to the domain, never to a repository or an HTTP client.',
    ),
    {
      name: 'dtos-stay-in-data',
      comment:
        'DR7 — a DTO is a data-layer type. Map to a domain entity before it leaves.',
      severity: 'error',
      from: { path: '^src/', pathNot: LAYER.data },
      to: { path: '^src/data/[^/]+/dto/' },
    },
    {
      name: 'domain-has-no-runtime-dependencies',
      comment:
        'DR1 — the domain and core layers must stay runnable in plain Node.',
      severity: 'error',
      from: { path: `${LAYER.domain}|${LAYER.core}` },
      to: {
        dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer', 'core'],
      },
    },
  ],

  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: {
      path: '\\.(test|spec)\\.(ts|tsx)$|^src/test/|^design-reference/',
    },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },
    reporterOptions: {
      dot: { collapsePattern: '^src/[^/]+/[^/]+' },
    },
  },
};
