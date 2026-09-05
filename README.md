# BRANDHUB Mobile

React Native application for the BRANDHUB marketplace. Arabic-first, right-to-left, Omani Rial.

Design and planning live in [`docs/architecture.md`](docs/architecture.md) and
[`docs/plan.md`](docs/plan.md). The UI/UX source of truth is `design-reference/`, which is read-only
and never modified.

**Current state: every customer feature is implemented — Phases 1–12.** Phase 13 (integration, QA
and release preparation) is next. The app opens on Arabic
onboarding, supports the Phase 5 identity/navigation shell, and browses a live catalogue through
Home, Browse, Category and Search. A product opens a real detail page — image pager, variant
selector, seller strip, specifications, reviews, related products and a sticky buy bar — with the
seller store and the wishlist behind it. The complete guest-cart purchase path persists cart lines,
merges them after sign-in, applies coupons and shipping/payment economics, places one idempotent
order, and ends on the reference-aligned confirmation timeline. After the sale, the account hub now
carries live counts into order history and detail with its delivery-OTP panel, the return request,
full address management and profile editing, and a language switch that survives a restart. The
social layer is live too: an influencer directory, a profile with its shoppable feed whose tagged
products open the PDP, a persisted follow, and an in-app notification list with mark-all-read
behind the home bell's unread dot. Support closes the after-sales path: a ticket form with the
prototype's six categories and three priorities, a related-order select that order detail can
preselect, and a two-sided thread with a reply box. The wallet closes the set: a balance card,
quick amounts, a hosted Paymob top-up that never sees a card number inside the app, a payment
result that resolves a pending charge by polling, and gift money that debits the same balance.

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

Phase 6 adds the product/search domain, strict catalogue DTO validation, HTTP repositories, query
parameter translation and the four public discovery screens. Search supports live text, trending
terms, seller scope, four sort orders, stock/price/rating filters and infinite pages. Product cards
share rail, grid, list and compact geometry, format OMR to three decimals, render response-provided
ratings and prefetch detail data on press-in. See
[`docs/reports/phase-6-report.md`](docs/reports/phase-6-report.md).

Phase 7 adds reviews, sellers and a wishlist slice, and the screens that use them. A product with
one variant resolves it silently; anything else has to be chosen before the buy bar unlocks (D8).
The wishlist is optimistic and lives in one cache above the navigator, so every heart in the app
agrees and a failed toggle rolls back with an error toast. See
[`docs/reports/phase-7-report.md`](docs/reports/phase-7-report.md).

Phase 11 adds the social and notification slices. Influencers, shoppable posts and follows are the
one feature area with **no backend contract** (GAP-1 / FA1): they run through
`MockInfluencerRepository` against routes specified in full for the backend in
[`mock-server/INVENTED_ENDPOINTS.md`](mock-server/INVENTED_ENDPOINTS.md), and nothing above the
repository knows it. A post carries its tagged products inline, so opening a profile is one request
rather than one per product. Notifications are an in-app list only — no push, no permission prompt,
no device token (D17). See
[`docs/reports/phase-11-report.md`](docs/reports/phase-11-report.md).

Phase 12 adds support. Unlike social commerce it is on the **real contract** (D19), so
`HttpSupportRepository` speaks to `/support/tickets` from the start; what the collection lacks is a
response example, so the field set and the two open enum questions are recorded in
`INVENTED_ENDPOINTS.md`. The thread's two sides align by reading direction rather than by a locale
check, so they swap correctly in Arabic without a conditional. See
[`docs/reports/phase-12-report.md`](docs/reports/phase-12-report.md).

Phase 10 adds the wallet, gifts and the payment result. The top-up opens PAYMOB's hosted page in a
browser session — card details never enter BRANDHUB's own process — and handles the return on both
paths: caught by the session when the app was backgrounded, and delivered by the OS as
`brandhub://payment/result?…` when it was killed. A dismissed browser reads as _pending_, never as
failed, and the result screen asks the gateway rather than guessing. The charge carries an
`Idempotency-Key` that a retry reuses (D20). See
[`docs/reports/phase-10-report.md`](docs/reports/phase-10-report.md).

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
