/**
 * ESLint flat configuration.
 *
 * The important part of this file is not the style rules — it is the mechanical
 * enforcement of the Clean Architecture boundaries described in
 * `docs/architecture.md` §9. A boundary violation is a build failure, not a
 * review comment.
 */
const js = require('@eslint/js');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');
const boundaries = require('eslint-plugin-boundaries');

/** The six layers, plus the test kit. Every path under src/ resolves to one type. */
const ELEMENT_TYPES = [
  { type: 'core', pattern: 'src/core/**', partialMatch: false },
  { type: 'domain', pattern: 'src/domain/**', partialMatch: false },
  { type: 'data', pattern: 'src/data/**', partialMatch: false },
  {
    type: 'infrastructure',
    pattern: 'src/infrastructure/**',
    partialMatch: false,
  },
  { type: 'presentation', pattern: 'src/presentation/**', partialMatch: false },
  { type: 'app', pattern: 'src/app/**', partialMatch: false },
  { type: 'test', pattern: 'src/test/**', partialMatch: false },
];

const to = (...types) => ({ to: { element: { types: { anyOf: types } } } });

/**
 * The allowed edges (DR1–DR6). The rule defaults to `disallow`, so an edge that
 * is not listed here is an error.
 */
const LAYER_POLICIES = [
  // DR5 — core imports nothing outside core.
  { from: { element: { type: 'core' } }, allow: to('core') },
  // DR1 — domain sees only domain and core.
  { from: { element: { type: 'domain' } }, allow: to('domain', 'core') },
  // DR3 — data implements domain ports using infrastructure.
  {
    from: { element: { type: 'data' } },
    allow: to('data', 'domain', 'core', 'infrastructure'),
  },
  // DR4 — infrastructure is self-contained.
  {
    from: { element: { type: 'infrastructure' } },
    allow: to('infrastructure', 'core'),
  },
  // DR2 — presentation never touches data or infrastructure.
  {
    from: { element: { type: 'presentation' } },
    allow: to('presentation', 'domain', 'core'),
  },
  // DR6 — the composition root may see everything.
  {
    from: { element: { type: 'app' } },
    allow: to(
      'app',
      'presentation',
      'domain',
      'data',
      'infrastructure',
      'core',
      'test',
    ),
  },
  // The test kit may model any layer.
  {
    from: { element: { type: 'test' } },
    allow: to(
      'test',
      'app',
      'presentation',
      'domain',
      'data',
      'infrastructure',
      'core',
    ),
  },
  // A test file may reach across layers, because assembling a scenario is the
  // job. The production module it sits beside is still bound by the rules above.
  {
    from: { file: { path: 'src/**/*.test.{ts,tsx}' } },
    allow: to(
      'test',
      'app',
      'presentation',
      'domain',
      'data',
      'infrastructure',
      'core',
    ),
  },
];

/**
 * DR1, second half — the domain and core layers must stay runnable in plain Node.
 *
 * These two layers deny external packages by default (see the dedicated config
 * block below), so this policy exists to give the packages we most expect someone
 * to reach for a message that explains why they cannot.
 */
const RUNTIME_FREE_LAYERS = {
  from: { element: { types: { anyOf: ['domain', 'core'] } } },
  disallow: {
    to: {
      module: {
        origin: ['external', 'core'],
        source: [
          'react',
          'react-dom',
          'react-native',
          'react-native/**',
          'expo',
          'expo-*',
          '@react-navigation/**',
          '@tanstack/**',
          'axios',
          '@react-native-async-storage/**',
          'node:*',
          'fs',
          'path',
        ],
      },
    },
  },
  message:
    'Domain and core stay free of React, React Native, Expo and I/O so they remain ' +
    'testable in plain Node. See architecture.md §8.1.',
};

/**
 * The externals the domain and core layers may use. Deliberately empty: those two
 * layers are plain TypeScript today. Adding an entry here is an architectural
 * decision and belongs in a review, which is exactly the friction we want.
 */
const DOMAIN_ALLOWED_EXTERNALS = [];

/**
 * DR7 — a DTO may never escape the data layer.
 * Expressed as a boundaries policy so it uses the same resolver as every other edge.
 */
const DTO_CONTAINMENT = {
  from: { element: { type: '!data' } },
  disallow: { to: { file: { path: 'src/data/*/dto/**' } } },
  message:
    'DTOs are data-layer types and must not escape it. Map to a domain entity first. ' +
    'See architecture.md §20.2.',
};

/** Physical box properties that do not mirror under RTL. */
const PHYSICAL_STYLE_PROPS = [
  'left',
  'right',
  'marginLeft',
  'marginRight',
  'paddingLeft',
  'paddingRight',
  'borderLeftWidth',
  'borderRightWidth',
  'borderLeftColor',
  'borderRightColor',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
];

const RTL_MESSAGE =
  'Physical layout properties do not mirror under RTL. Use the logical equivalent ' +
  '(start/end, marginStart, paddingEnd, borderStartWidth, borderTopStartRadius, …). ' +
  'See architecture.md §14.4.';

const HEX_COLOUR_MESSAGE =
  'Colour literals belong in src/presentation/theme. Import a token instead. ' +
  'See architecture.md §23.2.';

const HEX_COLOUR_RULE = {
  selector:
    'Literal[value=/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]',
  message: HEX_COLOUR_MESSAGE,
};

const THEME_PIXEL_VALUES = [
  4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 44, 48, 64, 80, 9999,
];
const THEME_PIXEL_PROP_RULES = THEME_PIXEL_VALUES.map((value) => ({
  selector:
    `Property[key.name=/^(gap|rowGap|columnGap|width|height|minWidth|minHeight|maxWidth|maxHeight|` +
    `padding|paddingHorizontal|paddingVertical|paddingStart|paddingEnd|paddingTop|paddingBottom|` +
    `margin|marginHorizontal|marginVertical|marginStart|marginEnd|marginTop|marginBottom|` +
    `borderRadius|borderTopStartRadius|borderTopEndRadius|borderBottomStartRadius|borderBottomEndRadius)$/] ` +
    `> Literal[value=${value}]`,
  message:
    `The ${value}px value already exists in the theme. Import and use the spacing, radius, or layout token. ` +
    'See architecture.md §23.2.',
}));

const PHYSICAL_PROP_RULE = {
  selector: `Property[key.name=/^(${PHYSICAL_STYLE_PROPS.join('|')})$/]`,
  message: RTL_MESSAGE,
};

const PHYSICAL_TEXT_ALIGN_RULE = {
  selector: "Property[key.name='textAlign'] > Literal[value=/^(left|right)$/]",
  message: RTL_MESSAGE,
};

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'design-reference/**',
      'coverage/**',
      '.expo/**',
      'dist/**',
    ],
  },

  js.configs.recommended,
  ...expoConfig,
  prettierConfig,

  // ── Import hygiene ─────────────────────────────────────────────────────────
  // The `import` plugin is already registered by eslint-config-expo/flat.
  {
    files: ['**/*.{ts,tsx}'],
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
    },
    rules: {
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          pathGroups: [
            { pattern: '@core/**', group: 'internal', position: 'before' },
            { pattern: '@domain/**', group: 'internal', position: 'before' },
            { pattern: '@data/**', group: 'internal', position: 'before' },
            {
              pattern: '@infrastructure/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@presentation/**',
              group: 'internal',
              position: 'before',
            },
            { pattern: '@app/**', group: 'internal', position: 'before' },
            { pattern: '@test/**', group: 'internal', position: 'before' },
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../../*'],
              message:
                'Reach across folders with a path alias (@domain, @core, …), not a relative climb.',
            },
          ],
        },
      ],
    },
  },

  // ── Layer boundaries (DR1–DR7) ─────────────────────────────────────────────
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': ELEMENT_TYPES,
      'boundaries/include': ['src/**/*'],
      'boundaries/dependency-nodes': ['import', 'dynamic-import', 'require'],
    },
    rules: {
      // Local (in-repo) dependencies only. External packages are unrestricted
      // for these layers, which is correct: presentation needs React Native,
      // data needs the HTTP client, infrastructure needs Expo modules.
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [...LAYER_POLICIES, DTO_CONTAINMENT],
        },
      ],
    },
  },

  // ── DR1 — domain and core are plain TypeScript ─────────────────────────────
  // Same local edges as above, plus `checkAllOrigins`, so external packages and
  // Node built-ins are denied by default in these two layers only.
  {
    files: ['src/domain/**/*.{ts,tsx}', 'src/core/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': ELEMENT_TYPES,
      'boundaries/include': ['src/**/*'],
      'boundaries/dependency-nodes': ['import', 'dynamic-import', 'require'],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          checkAllOrigins: true,
          policies: [
            ...LAYER_POLICIES,
            DTO_CONTAINMENT,
            RUNTIME_FREE_LAYERS,
            ...(DOMAIN_ALLOWED_EXTERNALS.length > 0
              ? [
                  {
                    from: { element: { types: { anyOf: ['domain', 'core'] } } },
                    allow: {
                      to: {
                        module: {
                          origin: 'external',
                          source: DOMAIN_ALLOWED_EXTERNALS,
                        },
                      },
                    },
                  },
                ]
              : []),
          ],
        },
      ],
    },
  },

  // ── RTL safety and design tokens ───────────────────────────────────────────
  // One block owns `no-restricted-syntax` for all of src/, so the rules compose
  // predictably. The theme block re-declares it without the colour rule, because
  // tokens are exactly where colour literals belong.
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        HEX_COLOUR_RULE,
        PHYSICAL_PROP_RULE,
        PHYSICAL_TEXT_ALIGN_RULE,
      ],
    },
  },
  {
    files: ['src/presentation/theme/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        PHYSICAL_PROP_RULE,
        PHYSICAL_TEXT_ALIGN_RULE,
      ],
    },
  },
  {
    files: ['src/presentation/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        HEX_COLOUR_RULE,
        PHYSICAL_PROP_RULE,
        PHYSICAL_TEXT_ALIGN_RULE,
        ...THEME_PIXEL_PROP_RULES,
      ],
    },
  },

  // ── Tests ──────────────────────────────────────────────────────────────────
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  },

  // ── Node-side tooling ──────────────────────────────────────────────────────
  {
    files: [
      '*.config.{js,cjs,ts}',
      'eslint.config.js',
      '.dependency-cruiser.cjs',
    ],
    languageOptions: {
      globals: {
        module: 'writable',
        require: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
      },
    },
  },
];
