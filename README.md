# BRANDHUB Mobile

React Native application for the BRANDHUB marketplace. Arabic-first, right-to-left, Omani Rial.

Design and planning live in [`docs/architecture.md`](docs/architecture.md) and
[`docs/plan.md`](docs/plan.md). The UI/UX source of truth is `design-reference/`, which is read-only
and never modified.

**Current state: Phase 5 (identity, session and navigation shell) implemented.** The app opens on
Arabic onboarding, supports guest browsing, email/password customer sign-in and sign-up, pending
seller registration, mock phone OTP, secure session restoration, five persistent tab stacks and
typed deep links.

## Requirements

| Tool           | Version                                         |
| -------------- | ----------------------------------------------- |
| Node           | 22 or newer                                     |
| Expo Go        | An SDK 57 build, to run on a physical phone     |
| Xcode          | Only for the iOS simulator or a local iOS build |
| Android Studio | Only for the Android emulator or a local build  |

The project targets **Expo SDK 57**, React Native 0.86 and React 19.2. Minimum supported platforms
are iOS 16.4 and Android 8.0 (API 26), set by the `expo-build-properties` plugin. The upgrade record
is in [`docs/reports/phase-5-report.md`](docs/reports/phase-5-report.md).

## Running on a physical phone

Put the phone and this machine on the same Wi-Fi, then:

```bash
npm start
```

Scan the QR code with the Camera app on iOS, or from inside Expo Go on Android. If the network
isolates clients from each other, add `--tunnel`.

`npm start` explicitly runs Expo Go. Use `npm run start:dev-client` only when a custom development
build is installed.

## Getting started

```bash
npm install
cp .env.example .env.development
npm run mock             # terminal 1
npm start                # terminal 2; scan the Expo Go QR code
```

On a physical phone, replace `localhost` in `.env.development` with this computer's LAN IP before
starting Metro, for example `http://192.168.1.20:3001/api/v1`. Onboarding and guest mode do not need
the mock; sign-in, registration and OTP do. The seeded login is
`customer@brandhub.om` / `Password123!`, and the mock OTP is `123456`.

A native development client is optional and can be generated when native debugging is needed:

```bash
npx expo prebuild        # generates ios/ and android/
npx expo run:ios         # or: npx expo run:android
npm run start:dev-client
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

| Command                    | What it does                                         |
| -------------------------- | ---------------------------------------------------- |
| `npm run verify`           | Everything below, in order. Run this before pushing. |
| `npm run typecheck`        | TypeScript, no emit                                  |
| `npm run lint`             | ESLint, including the architecture boundary rules    |
| `npm run format`           | Prettier, writing changes                            |
| `npm run boundaries`       | dependency-cruiser: layer graph and cycle detection  |
| `npm test`                 | Unit, component and architecture tests               |
| `npm run test:coverage`    | Same, with coverage for the domain and mappers       |
| `npm run test:contract`    | Validate DTO schemas against the live contract mock  |
| `npm run mock`             | Contract mock at `http://localhost:3001/api/v1`      |
| `npm run mock:reset`       | Rebuild the deterministic mock database              |
| `npm run start:dev-client` | Start Metro for an installed development build       |

Git hooks run lint-staged on commit, and type-check, boundaries and tests on push.

The mock deliberately uses port 3001 so it can run beside Metro on 8081. Its seeded login,
physical-device LAN setup, fault controls and invented endpoint contracts are documented in
[`mock-server/README.md`](mock-server/README.md).

Phase 5 adds the identity domain and HTTP repository, SecureStore-backed session restoration,
onboarding and bilingual RHF/Zod auth, the auth boundary, five-tab React Navigation shell, sign-out
cleanup and the `brandhub://` deep-link map. Future feature screens are typed shell destinations so
subsequent phases can fill them without changing route contracts.

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

- `design-reference/` is excluded from TypeScript, ESLint, Prettier and Jest.
- `npx expo-doctor --verbose` validates the Expo config and SDK dependency matrix; app configuration
  loads `.env.<APP_ENV>` quietly so machine-readable Expo checks are not polluted by dotenv output.
