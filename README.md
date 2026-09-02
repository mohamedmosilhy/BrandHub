# BRANDHUB Mobile

React Native application for the BRANDHUB marketplace. Arabic-first, right-to-left, Omani Rial.

Design and planning live in [`docs/architecture.md`](docs/architecture.md) and
[`docs/plan.md`](docs/plan.md). The UI/UX source of truth is `design-reference/`, which is read-only
and never modified.

**Current state: Phase 2 (design system and UI foundation) implemented.** No feature screens exist
yet. Development builds open the bilingual RTL/LTR component gallery; production configuration
keeps the environment diagnostic until the navigation shell arrives in Phase 5.

## Requirements

| Tool           | Version                                         |
| -------------- | ----------------------------------------------- |
| Node           | 22 or newer                                     |
| Expo Go        | An SDK 54 build, to run on a physical phone     |
| Xcode          | Only for the iOS simulator or a local iOS build |
| Android Studio | Only for the Android emulator or a local build  |

The project targets **Expo SDK 54**, held there deliberately so it runs in Expo Go on the review
device. The reasoning is in `docs/reports/phase-1-report.md`. Minimum supported platforms are
iOS 15.1 and Android 8.0 (API 26), set by the `expo-build-properties` plugin.

## Running on a physical phone

Put the phone and this machine on the same Wi-Fi, then:

```bash
npx expo start --go
```

Scan the QR code with the Camera app on iOS, or from inside Expo Go on Android. If the network
isolates clients from each other, add `--tunnel`.

`npm start` is different: it runs `--dev-client` and expects a custom development build, which is
the path from Phase 13 onward.

## Getting started

```bash
npm install
cp .env.example .env.development
npm start
```

`npm start` launches the Expo dev server against a development client. The first run on a device
needs a native build:

```bash
npx expo prebuild        # generates ios/ and android/
npx expo run:ios         # or: npx expo run:android
```

## Environments

Configuration is selected by `APP_ENV`, which picks the matching `.env.<APP_ENV>` file. Nothing in
those files is secret: every value is embedded in the shipped bundle.

```bash
npm start                # development  (default)
npm run start:staging    # staging
npm run start:production # production
```

Values are published through `app.config.ts` `extra` and validated at startup by
`src/infrastructure/config`. A missing or malformed value fails immediately with a message naming
the field. Nothing else in the codebase reads `process.env`.

## Everyday commands

| Command                 | What it does                                         |
| ----------------------- | ---------------------------------------------------- |
| `npm run verify`        | Everything below, in order. Run this before pushing. |
| `npm run typecheck`     | TypeScript, no emit                                  |
| `npm run lint`          | ESLint, including the architecture boundary rules    |
| `npm run format`        | Prettier, writing changes                            |
| `npm run boundaries`    | dependency-cruiser: layer graph and cycle detection  |
| `npm test`              | Unit, component and architecture tests               |
| `npm run test:coverage` | Same, with coverage for the domain and mappers       |

Git hooks run lint-staged on commit, and type-check, boundaries and tests on push.

## Architecture in one screen

```
app  ──────────▶ presentation ──▶ domain ◀── data ──▶ infrastructure
core ◀── every layer.   core imports nothing.
```

The layer edges are enforced by `eslint-plugin-boundaries` and re-checked independently by
dependency-cruiser. A violation fails the build. `src/test/architecture/boundaries.test.ts` proves
the rules actually fire, so they cannot rot into decoration.

Every folder under `src/` carries a README stating what may and may not live in it. Read those
before adding a file.

## Layout

```
src/
  app/             composition root: providers, container, navigation
  core/            Result, AppError, Money — the shared kernel
  domain/          entities, use cases, repository ports (plain TypeScript)
  data/            repository implementations, data sources, DTOs, mappers
  infrastructure/  HTTP, storage, config, i18n, logging
  presentation/    screens, components, theme, formatting
  test/            builders, doubles, render helper, architecture tests
```

## Notes

- `NODE_OPTIONS=--experimental-vm-modules` is set in the test scripts. ESLint 9 loads its flat
  config through a dynamic import, and the architecture tests run ESLint inside Jest's VM.
- `design-reference/` is excluded from TypeScript, ESLint, Prettier and Jest.
