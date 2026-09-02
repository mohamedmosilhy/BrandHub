# Phase 1 — Technical foundation · Completion report

**Date:** 2026-09-02 · **Status:** Complete, with two criteria unverifiable on this machine
**Plan:** [`../plan.md`](../plan.md) Phase 1 · **Architecture:** [`../architecture.md`](../architecture.md)

---

## What was implemented

A running Expo SDK 57 / React Native 0.86 / TypeScript application whose Clean Architecture
boundaries are enforced by tooling before any feature code exists. The app builds for both
platforms, reads validated configuration, and renders it on a diagnostics screen.

The point of this phase was not the placeholder screen. It was to make the architecture in
`architecture.md` §9 mechanically unbreakable, and then to prove the enforcement actually works
rather than assuming it.

## Files and modules created

**Toolchain**
`package.json`, `package-lock.json`, `tsconfig.json`, `app.config.ts`, `eslint.config.js`,
`.prettierrc`, `.prettierignore`, `.dependency-cruiser.cjs`, `jest.config.js`, `jest.setup.ts`,
`eas.json`, `.gitignore`, `.lintstagedrc.json`, `.husky/pre-commit`, `.husky/pre-push`,
`.github/workflows/ci.yml`, `README.md`

**Environment**
`.env.example` (committed), `.env.development`, `.env.staging`, `.env.production` (git-ignored)

**Source**

- `index.ts` — root entry, registers `src/app/App`
- `src/app/App.tsx` — composition root
- `src/infrastructure/config/{schema,env,index}.ts` — the only module that reads raw configuration
- `src/presentation/theme/{tokens,index}.ts` — Phase 1 token stub, replaced in Phase 2
- `src/presentation/features/diagnostics/**` — the screen that proves the pipeline
- `src/test/render.tsx` — the render helper every component test will use
- `src/test/architecture/boundaries.test.ts` — proves the architecture rules fire
- 57 directories, each with a `README.md` stating what may and may not live in it

## Architectural decisions made during implementation

These are new, small, and all reversible. None contradicts `architecture.md`.

| #   | Decision                                                                                                                                                                     | Why                                                                                                                                                                              |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Layer edges are expressed with `eslint-plugin-boundaries` v7's `boundaries/dependencies` rule and its `policies` API, not the deprecated `element-types` / `external` rules. | The deprecated form emitted eight warnings on every lint run. The current API expresses the same graph with no noise.                                                            |
| 2   | Domain and core deny **all** external packages and Node built-ins by default, via a second config block with `checkAllOrigins: true`. The allowlist is deliberately empty.   | Stronger than the plan asked for, and a truer reading of DR1. Adding a package to `DOMAIN_ALLOWED_EXTERNALS` becomes a visible, reviewable act.                                  |
| 3   | The DTO-containment rule (DR7) is a `boundaries` policy rather than `import/no-restricted-paths`.                                                                            | It then uses the same module resolver as every other edge, so the two cannot disagree.                                                                                           |
| 4   | Test files may import across layers; the production modules beside them may not.                                                                                             | Assembling a scenario is what a test does. The rule still binds the module under test.                                                                                           |
| 5   | Architecture rules are proven by a Jest suite that writes real files into each layer, lints them, and deletes them.                                                          | A synthetic import of a module that does not exist is silently ignored by the resolver, so a naive version of this test passes for the wrong reason. It did, until it was fixed. |
| 6   | The diagnostics screen receives configuration as props from `App`; it imports nothing from `infrastructure`.                                                                 | The placeholder demonstrates the pattern every feature follows from Phase 5 onward.                                                                                              |
| 7   | `react-native-safe-area-context` replaces React Native's `SafeAreaView`.                                                                                                     | The built-in is deprecated and warned on every render. The architecture already listed SafeArea as a provider.                                                                   |
| 8   | `NODE_OPTIONS=--experimental-vm-modules` is set in the test scripts.                                                                                                         | ESLint 9 loads its flat config through a dynamic import, and the architecture tests run ESLint inside Jest's VM.                                                                 |
| 9   | `baseUrl` removed from `tsconfig.json`; path targets are relative.                                                                                                           | TypeScript 6 deprecates `baseUrl` and errors on it.                                                                                                                              |

## Tests added

| Suite                                             | Tests  | What it covers                                                                                                       |
| ------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------- |
| `src/test/architecture/boundaries.test.ts`        | 19     | Every forbidden edge errors; every permitted edge does not; the RTL and colour-token rules fire and do not over-fire |
| `src/infrastructure/config/schema.test.ts`        | 9      | Valid config parses and freezes; each invalid field fails with a message naming it                                   |
| `src/presentation/.../EnvironmentScreen.test.tsx` | 4      | Renders its data, exposes a header role, labels each row for screen readers, handles an empty list                   |
| `src/app/App.test.tsx`                            | 3      | The app renders the environment and base URL resolved from configuration                                             |
| **Total**                                         | **35** |                                                                                                                      |

## Tests executed and results

```
npm run verify
  typecheck     tsc --noEmit                     pass
  lint          eslint . --max-warnings=0        pass
  format:check  prettier --check                 pass
  boundaries    depcruise src                    pass — 0 violations, 0 cycles, 13 modules
  test          jest                             pass — 4 suites, 35 tests

npx expo export --platform ios --platform android
  Android bundled  690 modules → 2.1 MB Hermes bytecode
  iOS     bundled  690 modules → 2.1 MB Hermes bytecode
```

Both lint tools were also verified to **fail** correctly, by introducing violations and observing
the errors before removing them: a cycle, a domain-to-infrastructure import, and an external package
in `core` were each reported by dependency-cruiser.

## Acceptance criteria

| #      | Criterion                                                                                          | Status         | Evidence                                                                                                                 |
| ------ | -------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| AC1.1  | `tsc --noEmit` exits 0                                                                             | **Pass**       | `npm run typecheck`                                                                                                      |
| AC1.2  | `npm run lint` exits 0 on a clean tree                                                             | **Pass**       | `npm run lint`                                                                                                           |
| AC1.3  | presentation → data fails lint, naming both layers                                                 | **Pass**       | 2 tests; message reads `no policy allowing dependencies from elements of type "presentation" to elements of type "data"` |
| AC1.4  | domain → `react-native` fails lint                                                                 | **Pass**       | 2 tests; message explains the layer must stay runnable in plain Node                                                     |
| AC1.5  | Hex colour outside `presentation/theme` fails lint                                                 | **Pass**       | 2 tests, including the positive case inside the theme                                                                    |
| AC1.6  | `left:` / `right:` in a style fails lint                                                           | **Pass**       | 4 tests: positioning, margin/padding, `textAlign`, and the logical equivalents passing                                   |
| AC1.7  | `npm test` runs and passes                                                                         | **Pass**       | 35 tests, 0 skipped                                                                                                      |
| AC1.8  | dependency-cruiser reports zero cycles                                                             | **Pass**       | `no dependency violations found`, and a deliberate cycle was reported before removal                                     |
| AC1.9  | App launches on an iOS simulator and an Android emulator and displays the environment and base URL | **Partial**    | Both platforms bundle; `App.test.tsx` asserts the values render. The launch itself is **unverified** — see Known issues  |
| AC1.10 | Switching `.env` changes the base URL with no code edit                                            | **Pass**       | `APP_ENV=…` resolves three distinct base URLs                                                                            |
| AC1.11 | CI passes on a pull request                                                                        | **Unverified** | Workflow written; every step it runs passes locally. No git remote and no commits exist yet                              |
| AC1.12 | Every folder in `src/` has a README stating its rules                                              | **Pass**       | 57 directories, 57 READMEs, 0 missing                                                                                    |

**10 of 12 pass. AC1.9 is partial and AC1.11 is unverified**, both for environment reasons rather
than defects.

## Known issues

1. **AC1.9 cannot be completed on this machine.** Xcode is not installed — only the Command Line
   Tools — and there is no Android SDK, so no simulator or emulator exists to launch on. What was
   verified instead: Metro bundles the app for both platforms with path aliases resolving, and a
   test asserts the app renders the resolved environment name and API base URL. To finish the
   criterion, run `npx expo prebuild` then `npx expo run:ios` and `npx expo run:android` on a
   machine with both toolchains.
2. **AC1.11 cannot be completed either.** The repository has no commits and no remote, so no pull
   request can run the workflow. Every command the workflow invokes passes locally.
3. **Coverage thresholds are currently vacuous.** `collectCoverageFrom` targets `src/domain` and
   `src/data/**/mappers`, which hold no code yet, so `npm run test:coverage` reports 0% and exits 0.
   The thresholds begin enforcing with the first domain module in Phase 4. Noted in `jest.config.js`.
4. **`npm audit` reports advisories in the transitive dependency tree**, inherited from the Expo
   SDK 57 toolchain. None is in a runtime path of the app. Worth a look before release, not now.

## Remaining risks

| Risk                                                                                         | Assessment                                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app` collides with the Expo Router convention, and the bundler says so on every export. | Low. `expo-router` is not a dependency and AD-7 chose React Navigation. The entry point remains `index.ts`. Documented in `src/app/README.md`; revisit only if a future phase ever wants Expo Router. |
| The architecture test writes real files into `src/` while it runs.                           | Low. It cleans up in `afterEach`, sweeps stale folders in `beforeAll`, and the folder names are git-ignored. A crashed run leaves a file that makes `npm run lint` fail loudly rather than silently.  |
| `--experimental-vm-modules` is an unstable Node flag.                                        | Low, but real. If it changes, the architecture suite can move to a standalone Node script. Nothing else depends on it.                                                                                |
| The theme in `src/presentation/theme/tokens.ts` is a stub.                                   | None, by design. Phase 2 replaces it with the full token set.                                                                                                                                         |

## What needs human review

1. **Sign off, or waive, AC1.9 and AC1.11.** Both need a machine with Xcode and the Android SDK, and
   a git remote. If you want them closed before Phase 2 starts, they need to run on your machine.
2. **Confirm decision 2 above** — domain and core denying every external package by default, with an
   empty allowlist. It is stricter than the plan specified. It is easy to relax and hard to
   retrofit, which is why it went in this way.
3. **Confirm the pinned versions.** Expo 57, React Native 0.86.3, React 19.2.3, TypeScript 6.0,
   ESLint 9.39.5. ESLint is held at 9 because `eslint-plugin-import` does not yet support ESLint 10.
4. **Review the layer READMEs.** They are the rules the next twelve phases are written against, and
   they are cheaper to correct now than later.

## Ready for Phase 2?

Yes, subject to the two review items above. Phase 2 (design system and UI foundation) has no
prerequisite that this phase left open: the theme stub is in place and marked for replacement, the
colour-literal rule is live and will force tokens to be used, and the RTL rule is live and will
force logical properties from the first component.
