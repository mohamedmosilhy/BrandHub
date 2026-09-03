# BRANDHUB Mobile — Implementation Plan

**Status:** **Implemented through Phase 4 — Phase 5 cleared to begin** · **Companion document:** [`architecture.md`](./architecture.md)
**Date:** 2026-09-03 · **Reviewer / decision maker:** repository owner

> This is the implementation roadmap for the BRANDHUB customer React Native application.
> Phases 1–4 are implemented. Their completion reports are in `docs/reports/`.
> All 17 open questions were approved as recommended on 2026-09-02 and are recorded as decisions
> **D1–D17** in `architecture.md` §34. **Nothing blocks Phase 5.**

---

## How to read this plan

Each phase carries: **Objective**, **Prerequisites**, **Tasks**, **Expected artifacts**,
**Testing**, **Acceptance criteria**, **Review checklist**, **Definition of done**.

**Acceptance criteria are measurable.** "The screen works" is never a criterion; "tapping a category
tile navigates to Category with that category's id and renders its products" is.

**A phase is complete only when every acceptance criterion passes and the definition of done is
met.** Compiling is not completion. A phase with an unresolved critical issue does not hand off; the
issue is reported and the reviewer decides.

**Every phase ends with a completion report** containing: what was implemented, files and modules
changed, architectural decisions made, tests added, tests executed and their results, acceptance
criteria status item by item, known issues, remaining risks, and anything needing human review.

### Decisions in force

Every question this plan once deferred is decided. The full record, with rationale, is
`architecture.md` §34. The seven that change day-to-day implementation work:

| Decision | Effect on the build                                                                                                                       |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **D2**   | The mock serves the real API's routes, envelopes and auth, so DTOs never change at migration.                                             |
| **D3**   | The cart is fully usable by a guest. The only sign-in gate on the purchase path is at checkout.                                           |
| **D8**   | The PDP has a variant selector the prototype does not show. It auto-resolves when a product has one variant.                              |
| **D9**   | Catalogue language is resolved by the server from `Accept-Language`; query keys are locale-scoped.                                        |
| **D10**  | One totals rule, BR3, used by cart and checkout: subtotal + VAT + area shipping price + payment fee − discount.                           |
| **D11**  | Free delivery is the shipping area's `minOrderAmount`, supplied by the API (amended by D21).                                              |
| **D16**  | Noto Kufi Arabic ships, behind a single theme token.                                                                                      |
| **D19**  | Support tickets, returns, gift money and the delivery OTP have a real contract. Their repositories are HTTP from the start, not mocks.    |
| **D20**  | Placing an order, charging the wallet and transferring funds all send an `Idempotency-Key`, minted per attempt and reused across retries. |
| **D21**  | Delivery cost and the free-delivery minimum come from `/areas`. The prototype's time slots have no contract and are deferred.             |
| **D22**  | Responses arrive in two envelope shapes. One unwrapping helper normalises them before validation.                                         |

**Amended 2026-09-02** after an expanded API collection replaced the earlier export. It closes four
of the six previously uncontracted features, which shrinks Phase 3 and moves support, returns, gifts
and the delivery OTP onto real endpoints. The full record is `architecture.md` §34.4.

Follow-up actions FA1 to FA5 sit with other teams. None blocks a phase; each has an interim
behaviour. They are collected at the end of this document under
[Follow-up actions](#follow-up-actions-tracked-across-phases).

### Phase map

| Phase | Name                                             | Depends on | Rough size |
| ----- | ------------------------------------------------ | ---------- | ---------- |
| 0     | Discovery, requirements and architecture         | —          | Done       |
| 1     | Technical foundation                             | 0          | Small      |
| 2     | Design system and UI foundation                  | 1          | Medium     |
| 3     | Mock backend and API contract                    | 1          | Medium     |
| 4     | Core infrastructure and data plumbing            | 1, 3       | Medium     |
| 5     | Identity, session and navigation shell           | 2, 4       | Medium     |
| 6     | Catalogue and discovery                          | 5          | **Large**  |
| 7     | Product detail and wishlist                      | 6          | Medium     |
| 8     | Cart and checkout                                | 7          | **Large**  |
| 9     | Account, orders and addresses                    | 5, 8       | **Large**  |
| 10    | Wallet, gifts and payment result                 | 9          | Medium     |
| 11    | Social commerce and notifications                | 6          | Medium     |
| 12    | Support                                          | 9          | Small      |
| 13    | Integration, QA and release preparation          | 1–12       | **Large**  |
| 14    | Seller app — deferred track, not part of v1 (D1) | 13         | Out of v1  |

Phases 6–12 each follow the same internal order: **Domain → Data → Presentation → UI → Tests →
Acceptance**.

---

## Phase 0 — Discovery, requirements and architecture

### Objective

Understand the reference completely, establish verified requirements, and produce the architecture
and this plan. Surface every assumption and unknown before any code exists.

### Prerequisites

`design-reference/` present.

### Tasks

1. Inventory all nine prototypes and classify each as mobile or web.
2. Read the customer app prototype end to end: markup, state, navigation, and seed data.
3. Extract the screen inventory, per-screen data, interactions and existing empty states.
4. Extract the design tokens.
5. Extract the real API contract from the Postman collection.
6. Diff the UI against the API contract and record every gap.
7. Write `architecture.md` and `plan.md`.

### Expected artifacts

- `architecture.md` — 34 sections, 27-screen inventory, 10 user flows, 22 features, 15 documented gaps, 20 decisions, 17 open questions.
- `plan.md` — this document.

### Testing

Documentation phase; no automated tests. Verification is by traceability: every feature, screen and
flow cites the prototype construct it came from.

### Acceptance criteria

- AC0.1 Every screen in the prototype's `screens` array appears in the inventory. **27 of 27.**
- AC0.2 Every prototype `<sc-if value="{{ isX }}">` branch maps to an inventory row.
- AC0.3 Every design token in `tokens.css` is recorded.
- AC0.4 Every customer-relevant endpoint in the Postman collection is listed.
- AC0.5 Every UI feature with no API contract is recorded as a numbered gap.
- AC0.6 Every architectural decision names the alternatives rejected and the reason.
- AC0.7 No requirement appears that cannot be traced to a reference file.

### Review checklist — completed 2026-09-02

- [x] v1 scope is the customer app only (D1).
- [x] Screen inventory complete: 27 screens plus the filter sheet.
- [x] Auth boundaries approved, including the guest cart (D3).
- [x] Layer boundaries and dependency rules approved.
- [x] Library choices approved, including Expo, TanStack Query, Zustand and the JSON Server adapter.
- [x] All 15 gaps confirmed, each with an owner: D-decisions for this project, FA-actions for others.
- [x] All 17 questions answered as recommended; recorded as D1–D17.

### Definition of done

**Met.** Both documents exist and are reviewed; all 17 questions are decided; the phase map is
approved; Phase 1 is cleared to begin.

---

## Phase 1 — Technical foundation

### Objective

A running, typed, linted, tested, empty React Native application whose layer boundaries are already
enforced by tooling — so that no later phase can violate them by accident.

### Prerequisites

Phase 0 approved. Scope is the customer app only (D1); platform floor is iOS 15 and Android 8.0 / API 26 (D15).

### Tasks

1. Create the Expo TypeScript project at the repository root, leaving `design-reference/` untouched.
2. Enable TypeScript `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
3. Configure path aliases: `@app`, `@core`, `@domain`, `@data`, `@infrastructure`, `@presentation`, `@test`.
4. Set up ESLint (TypeScript, React, React Hooks, React Native) and Prettier.
5. Configure **`eslint-plugin-boundaries`** with the six layers and the allowed edges from `architecture.md` §9. Add `import/no-restricted-paths` so `data/**/dto` is unreachable from outside `data`.
6. Add a custom lint rule (or restricted-syntax rule) banning physical `left` / `right` in styles, and banning hex colour literals outside `presentation/theme`.
7. Add `dependency-cruiser` with a no-cycles rule and a layer-graph report.
8. Set up Jest with `jest-expo`, React Native Testing Library, and coverage thresholds scoped to `src/domain` and `src/data/**/mappers`.
9. Create the empty folder tree from `architecture.md` §10 with a one-line `README.md` in each layer stating what may and may not live there.
10. Set up `app.config.ts`, the three `.env.*` files, `.env.example`, and typed config access with Zod validation at startup.
11. Add Husky + lint-staged: type-check, lint and unit tests on commit.
12. Add CI (GitHub Actions): install, type-check, lint, boundary check, unit tests, build.
13. Add `expo-dev-client` and an EAS build configuration with `development`, `preview` and `production` profiles.
14. Render a placeholder root screen that reads and displays the validated config, proving the environment pipeline works end to end.

### Expected artifacts

`package.json`, `tsconfig.json`, `.eslintrc.cjs`, `.prettierrc`, `.dependency-cruiser.js`,
`jest.config.ts`, `jest.setup.ts`, `app.config.ts`, `eas.json`, `.env.example`,
`.github/workflows/ci.yml`, `.husky/`, the full `src/` tree with layer READMEs,
`src/app/App.tsx`, `src/infrastructure/config/env.ts`, `src/test/render.tsx`.

### Testing

- Config validation: valid env parses; a missing required variable fails with a named error.
- A deliberate boundary-violating fixture import fails lint (the rule is proven, then the fixture is deleted or kept as a lint-rule test).
- The placeholder screen renders under `src/test/render.tsx`.

### Acceptance criteria

- AC1.1 `npx tsc --noEmit` exits 0.
- AC1.2 `npm run lint` exits 0 on a clean tree.
- AC1.3 An import from `presentation` to `data` **fails** lint with a boundary error naming both layers.
- AC1.4 An import from `domain` to `react-native` **fails** lint.
- AC1.5 A hex colour literal outside `presentation/theme` **fails** lint.
- AC1.6 `left:` or `right:` in a style object **fails** lint.
- AC1.7 `npm test` runs and passes.
- AC1.8 `dependency-cruiser` reports zero cycles.
- AC1.9 The app launches on an iOS simulator and an Android emulator and displays the resolved environment name and API base URL.
- AC1.10 Switching `.env` files changes the displayed base URL without a code edit.
- AC1.11 CI passes on a pull request.
- AC1.12 Every folder in `src/` contains a README stating its rules.

### Review checklist — audited 2026-09-02

- [x] Expo vs bare RN confirmed (AD-2).
- [x] Boundary rules match `architecture.md` §9 exactly.
- [x] Folder structure matches §10; no extra `utils/` or `common/`.
- [x] `.env` files are git-ignored and `.env.example` is committed.
- [x] Minimum OS versions are iOS 15 and Android 8.0 / API 26 (D15).
- [ ] CI workflow exists and passes locally; a pull-request run was not inspected.

### Definition of done

All twelve acceptance criteria pass; the app runs on both platforms; CI is green; a boundary
violation demonstrably fails the build. No feature code exists yet.

---

## Phase 2 — Design system and UI foundation

### Objective

Every shared visual and interaction primitive the app needs, derived from the reference tokens,
correct in RTL and LTR, in Arabic and English, with loading, empty and error components that make
`architecture.md` §22 mechanically enforceable.

### Prerequisites

Phase 1 done. `_ds/modernist-…/` is ignored (D6); Noto Kufi Arabic is the shipped Arabic face (D16); missing AR/EN copy is drafted here and natively reviewed in Phase 13 (D7, FA5).

### Tasks

1. Port `tokens.css` to a typed theme: colours, gradients, spacing, radii, shadows, z-index, durations, easings.
2. Build the typography scale for both scripts, with Arabic line height 1.75. Ship **Noto Kufi Arabic** as the Arabic face and Plus Jakarta Sans as the Latin face, both behind single theme tokens so GE Dinar One is a one-line swap if FA4 lands. Load fonts at startup behind the splash.
3. Set up i18next with AR and EN namespaces, seeded from the prototype's `STR` and `EXTRA` objects; Arabic default and fallback.
4. Implement the RTL bootstrap: `allowRTL`, `forceRTL`, direction resolution before first render, and the confirm-and-restart flow for a direction-crossing language change.
5. Build primitives: `Text`, `Box`, `Pressable`, `Icon`, `Image`.
6. Build the icon registry from the prototype's inline SVGs via `react-native-svg`, with automatic flipping for directional glyphs in RTL.
7. Build controls: `Button`, `IconButton`, `Input`, `PasswordInput`, `TextArea`, `Select`, `SearchField`, `Chip`, `SegmentedControl`, `Switch`, `Radio`, `Checkbox`, `QuantityStepper`, `RatingStars`, `PriceText`.
8. Build surfaces: `Card`, `Sheet`, `Modal`, `Divider`, `Badge`, `Pill`, `StatusPill`, `Avatar`, `GradientPanel`.
9. Build feedback: `Toast` + `ToastProvider`, `Skeleton`, `Spinner`, `EmptyState`, `ErrorState`, `OfflineBanner`, `AsyncBoundary`.
10. Build layout: `Screen`, `ScreenHeader`, `SectionHeader`, `HorizontalRail`, `Grid`, `StickyBottomBar`, `TabBar`.
11. Implement `presentation/formatting/`: `formatPrice` (3 decimals, LTR numerals in RTL context, locale-correct currency placement), `formatDate`, `formatCount`, `formatRelativeTime`.
12. Build an in-app **component gallery screen**, reachable only in development, listing every component in every variant and state, with AR/EN and RTL/LTR toggles.
13. Run a contrast audit against the token palette and record every failure (§30 A3), with a proposed remedy for each.
14. Draft the AR and EN copy the reference never covered: loading, error and empty states for orders, notifications, tickets, addresses and wallet transactions, plus the generic network and server error messages. Mark every drafted string for native review (D7, FA5).

### Expected artifacts

`src/presentation/theme/**`, `src/presentation/components/**` (primitives, controls, surfaces,
feedback, layout), `src/presentation/formatting/**`, `src/infrastructure/i18n/**`,
`src/presentation/devtools/ComponentGallery.tsx`, component tests alongside each component.

### Testing

- Unit: `formatPrice` renders `38.900` for 38.9 in both locales and keeps digits LTR in Arabic; `formatCount` renders `2.4K`; `formatRelativeTime` matches the prototype's phrasing.
- Component: `Button` renders each variant, disables and spins while loading, and fires `onPress` once; `Input` shows label, error and placeholder; `QuantityStepper` emits remove at zero; `Toast` appears and auto-dismisses; `EmptyState` and `ErrorState` render title, body and action; `AsyncBoundary` renders loading, empty, error and content for the matching query status.
- RTL: a snapshot-free assertion that a `ScreenHeader` places the back chevron at the visual start under `forceRTL(true)`.
- Accessibility: every control exposes a role and a label.

### Acceptance criteria

- AC2.1 Every colour, spacing, radius and shadow in `tokens.css` is present in the theme with the same value.
- AC2.2 No component contains a colour literal or a raw pixel value that the theme already carries; lint proves it.
- AC2.3 The gallery renders every component in every documented variant and state.
- AC2.4 Toggling the gallery to RTL mirrors layout, flips directional icons, and keeps numerals LTR.
- AC2.5 Toggling AR/EN swaps every visible string in the gallery; no untranslated key is shown.
- AC2.6 `formatPrice(38.9)` returns `38.900`; `formatPrice(0)` returns `0.000`.
- AC2.7 `Button` in `loading` shows a spinner, is not pressable, and keeps its width.
- AC2.8 `AsyncBoundary` renders exactly one of loading / empty / error / content, never two.
- AC2.9 Every interactive component exposes `accessibilityRole` and `accessibilityLabel`.
- AC2.10 Every interactive component's hit area is at least 44×44 pt, verified in the gallery.
- AC2.11 Arabic body text renders at line height 1.75 and does not clip at 130% font scale.
- AC2.12 The contrast audit is recorded, with every failing pair listed and a remedy proposed.
- AC2.13 The Arabic face resolves to Noto Kufi Arabic, and changing one theme token changes it everywhere (D16).
- AC2.14 Every new loading, error and empty-state string exists in both AR and EN and is flagged for native review (D7).

### Review checklist — implementation audit 2026-09-02

- [ ] Physical-device side-by-side comparison remains for Phase 13; automated token and gallery checks pass.
- [ ] Physical Arabic clipping review remains for Phase 13; 1.75 line height and 130% cap are tested.
- [x] RTL mirroring is implemented, including directional SVG flipping and logical properties.
- [x] The component set matches the Phase 2 inventory without feature-specific additions.
- [x] Contrast remedies are recorded in `reports/phase-2-contrast-audit.md` and applied to shared text controls.
- [x] Arabic renders in Noto Kufi Arabic and the swap token is in place (D16).
- [x] Drafted Arabic copy is tracked in `nativeReviewKeys` for native review (FA5).

### Definition of done

All twelve criteria pass; the gallery is reviewed side by side with the prototype and signed off;
the contrast audit is filed with decisions recorded. No feature screens exist yet.

---

## Phase 3 — Mock backend and API contract

### Objective

A JSON Server based mock that serves the **real** API's routes, envelopes, auth and error codes, so
that the app's DTOs never change at migration.

### Prerequisites

Phase 1 done. The mock runs behind an Express contract adapter (D2); catalogue language is resolved server-side from `Accept-Language` (D9).

### Tasks

1. Create `mock-server/` as an Express host that mounts `json-server` under `/api/v1`.
2. Write seed generators that build `db.json` from the reference data: 12 products with variants and images, 8 categories as a tree, 6 influencers with tagged products, 4 orders, 3 addresses, 3 tickets with threads, 5 wallet transactions, 3 reviews, 5 specs, 5 notifications, coupons, shipping areas, and one customer user.
3. Expand the seed to a realistic volume, 200 products or more across the 8 categories, so pagination, search and list performance are exercised.
4. Implement the auth middleware: `POST /auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`; fake JWTs with a short access-token lifetime; bearer enforcement on protected routes; correct 401 shapes.
5. Implement the envelope and pagination middleware: `page` and `size` in, Spring `Page` out, with `content`, `totalElements`, `totalPages`, `number`, `size`, `first` and `last`.
6. Implement the route rewrites for every endpoint in `architecture.md` §3.4.
7. Implement custom handlers where JSON Server cannot express the behaviour: `/categories/tree`, `/cart` which joins items to products, `POST /orders` which creates, computes totals and clears the cart, `/coupons/validate`, and `/wallet/charge`.
8. Implement the endpoints the expanded collection now contracts, so the app talks to real shapes from day one (D19): `/support/tickets` with messages and attachments, `/returns`, `/gifts` with sent, received, claim and cancel, `/wallet/transfers` with its recipient preview, `/areas` and `/shipping-rates`, `/sellers` with products and profile image, `GET /payments/PAYMOB/status`, and `deliveryOtp` on the order.
9. Implement only the endpoints that remain invented — influencers, posts and follows, delivery time slots and the express flag, and phone OTP — and document each in `mock-server/INVENTED_ENDPOINTS.md` with the request and response shapes the backend would need (FA1).
10. Honour the `Idempotency-Key` header on `POST /orders`, `POST /wallet/charge` and `POST /wallet/transfers`: a repeated key returns the original result instead of creating a second record (D20).
11. Serve **both** envelope shapes deliberately, `{ success, data }` on the newer routes and bare payloads on the older ones, so the client's unwrapping helper is exercised rather than assumed (D22).
12. Implement **D9 content localisation**: store `{ ar, en }` per product and category, read `Accept-Language`, and return one already-resolved language in a single-language field.
13. Serve `averageRating` and `reviewCount` on every product list and detail response (D14), so cards never need a second request.
14. Seed `/areas` with real Omani governorates carrying `shippingPrice`, `minOrderAmount` and `estimatedDeliveryDays`, which is where BR3 and BR13 now get their numbers (D21).
15. Implement latency injection (`x-mock-latency`, plus a global default so loading states are always visible) and fault injection (`x-mock-fail=401|404|409|500|timeout|network`, `x-mock-empty=true`).
16. Add `npm run mock` and `npm run mock:reset`, and document LAN access for physical devices. **Bind the mock to a port other than 8081**, which Metro's dev server already occupies.
17. Write the mock's own test suite: every route returns the documented shape and status.

### Expected artifacts

`mock-server/server.ts`, `mock-server/db.json`, `mock-server/seed/**`,
`mock-server/middleware/{auth,envelope,pagination,rewrite,latency,faults}.ts`,
`mock-server/routes.json`, `mock-server/INVENTED_ENDPOINTS.md`, `mock-server/README.md`,
`mock-server/__tests__/**`.

### Testing

- Every endpoint returns the documented status and shape.
- `GET /products?page=0&size=20` returns a `Page` with `content.length === 20` and a correct `totalElements`.
- `GET /cart` without a bearer token returns 401.
- A refresh token exchanges for a new access token; an expired refresh token returns 401.
- `POST /orders` reduces the cart to empty and returns an order whose total equals subtotal + 5% VAT.
- `x-mock-fail=500` returns 500 for any route.
- `x-mock-empty=true` returns an empty page with `totalElements: 0`.

### Acceptance criteria

- AC3.1 `npm run mock` starts the server and it answers on `/api/v1/products`.
- AC3.2 Every endpoint listed in `architecture.md` §3.4 responds with the real contract's shape.
- AC3.3 Paged endpoints return a Spring `Page` envelope with all six metadata fields.
- AC3.4 Protected endpoints return 401 without a valid bearer token.
- AC3.5 The login response contains `accessToken`, `refreshToken` and a `user` object with an `id`.
- AC3.6 Refresh returns a new access token; an invalid refresh returns 401.
- AC3.7 Search returns only matching products, in Arabic and in English.
- AC3.8 The category tree is nested and every product's `categoryId` resolves into it.
- AC3.9 Fault headers produce the requested status or condition on any route.
- AC3.10 The default latency is non-zero, so loading states are observable by hand.
- AC3.11 `INVENTED_ENDPOINTS.md` lists only the three areas that remain uncontracted — influencers and posts, delivery time slots and the express flag, and phone OTP — each with request and response shapes (FA1).
- AC3.12 The seed contains at least 200 products spread across all 8 categories.
- AC3.13 The mock test suite passes.
- AC3.14 A request with `Accept-Language: ar` returns Arabic product titles and one with `en` returns English, in the same single-language field (D9).
- AC3.15 Every product response carries `averageRating` and `reviewCount` (D14).
- AC3.16 `GET /areas` returns Omani areas carrying `shippingPrice`, `minOrderAmount` and `estimatedDeliveryDays`, and changing `db.json` changes them with no code edit (D21).
- AC3.17 The phone OTP endpoints respond, and are listed in `INVENTED_ENDPOINTS.md` (D12).
- AC3.18 `POST /support/tickets`, `GET /support/tickets`, `GET /support/tickets/{id}` and `POST /support/tickets/{id}/messages` answer with the collection's shapes, including `ticketNumber` (D19).
- AC3.19 `POST /returns` accepts `{ orderId, reason }` and the order's `deliveryOtp` is present on `GET /orders/{id}` (D19).
- AC3.20 `POST /gifts` accepts the full payload including `currency: "OMR"`, and sent, received, claim and cancel all respond (D19).
- AC3.21 Repeating a request with the same `Idempotency-Key` on `POST /orders`, `POST /wallet/charge` or `POST /wallet/transfers` returns the original result and creates no second record (D20).
- AC3.22 At least one route answers `{ success, data }` and at least one answers a bare payload, so the client's unwrapping helper is exercised against both (D22).
- AC3.23 The mock binds to a port other than 8081, and `npm run mock` and `npm start` run at the same time without a conflict.

### Review checklist

- [x] Do the mock's shapes match the Postman collection, field for field?
- [x] Is the invented-endpoint list complete and precise enough to hand to the backend team?
- [x] Is the seed data realistic — Arabic titles, OMR prices at 3 decimals, plausible ratings?
- [x] Is content localisation implemented per D9, returning one resolved language rather than a pair?
- [x] Does `INVENTED_ENDPOINTS.md` now contain only the three genuinely uncontracted areas, with everything the expanded collection covers moved to real routes?
- [x] Do the idempotency semantics match what the real API promises, rather than a convenient approximation?
- [x] Are the shipping areas genuinely data, changeable without touching code?
- [x] Does the fault switch cover every state the UI must handle?

### Definition of done

**Met.** All twenty-three criteria pass; the mock runs from a clean checkout with one command; the
invented-endpoint document is ready to send to the backend team.

---

## Phase 4 — Core infrastructure and data plumbing

### Objective

The technical spine every feature slice will reuse: `Result`, the error taxonomy, `Money`, the HTTP
client with auth and refresh, storage, the query client, the DI container, and the mapper and
repository conventions — proven by one thin vertical slice.

### Prerequisites

Phases 1 and 3 done.

### Tasks

1. Implement `core/result` (`Result<T,E>`, `ok`, `err`, `map`, `flatMap`, `unwrapOr`, `isOk`).
2. Implement `core/errors`: the full taxonomy from `architecture.md` §21.1, each error carrying a code, a correlation id and optional details.
3. Implement `core/money`: integer baisa, `fromDecimal`, `toDecimal`, `plus`, `minus`, `times`, `percentage`, `compare`, `zero`, with half-up rounding at the baisa.
4. Implement `infrastructure/http`: the `HttpClient` port, the Axios adapter, and interceptors for base URL, bearer token, `Accept-Language`, correlation id, timeout, and single-flight refresh-and-retry on 401.
5. Implement HTTP error normalisation: status code and payload to `AppError`.
6. Implement `infrastructure/storage`: `SecureStore` and `KeyValueStore` ports with Expo adapters.
7. Implement `infrastructure/logging` with the redaction list from §28 S5.
8. Configure the TanStack Query client: retry policy per error type, stale times, and the global error handler.
9. Implement `src/app/di/container.ts` and a typed `useContainer()` accessor, with every binding declared in one place.
10. Implement the shared DTO validation helper that runs a Zod schema and converts a failure to `ContractError`.
    10b. Implement the response-envelope unwrapper: strip `{ success, data }` when present, pass a bare payload through unchanged, and run it before every schema so DTOs describe payloads only (D22).
    10c. Implement idempotency-key minting: a use case that moves money or creates an order generates one key per attempt and reuses it across retries, and the HTTP client sends it as `Idempotency-Key` (D20).
11. Build one thin end-to-end slice to prove the spine — `GET /categories/tree` → `CategoryDto` → `Category` → `CategoryRepository` → a temporary debug screen listing category names.
12. Set up MSW handlers mirroring the mock host for integration tests.
13. Write the contract test harness that runs the Zod schemas against the live mock host.

### Expected artifacts

`src/core/**`, `src/infrastructure/http/**`, `src/infrastructure/storage/**`,
`src/infrastructure/logging/**`, `src/app/di/container.ts`, `src/app/providers/QueryProvider.tsx`,
`src/domain/catalog/{entities,repositories}`, `src/data/catalog/{dto,mappers,datasources,repositories}`,
`src/test/msw/**`, `src/test/doubles/**`, `src/test/builders/**`, `contract-tests/**`.

### Testing

- `Money`: `0.1 + 0.2` in rials equals exactly `0.300`; `percentage(5)` of `64.200` equals `3.210`; rounding is half-up at the baisa; negative amounts and `compare` behave.
- `Result`: map, flatMap and unwrap semantics.
- Error normalisation: 400 → `ValidationError`, 401 → `UnauthorizedError`, 404 → `NotFoundError`, 409 → `ConflictError`, 500 → `ServerError`, a network failure → `NetworkError`, a timeout → `NetworkError`.
- Refresh: a 401 triggers exactly one refresh even when three requests fail concurrently; a failed refresh clears the session.
- Mapper: `CategoryDto` → `Category` against a fixture captured from the mock host.
- Contract: `CategoryDto` schema validates the live mock response.

### Acceptance criteria

- AC4.1 `Money` arithmetic is exact at 3 decimals across the whole test matrix, with no float drift.
- AC4.2 Every HTTP status in the taxonomy maps to its `AppError` subtype.
- AC4.3 A request carries the bearer token when a session exists and omits it when none does.
- AC4.4 Three concurrent 401s trigger exactly one refresh call.
- AC4.5 A failed refresh clears the secure store and sets session status to unauthenticated.
- AC4.6 Tokens are written to `SecureStore` and never to `AsyncStorage`; a test asserts the key is absent from `AsyncStorage`.
- AC4.7 A log line containing a password or a token is redacted; a test asserts the redaction.
- AC4.8 A malformed response produces a `ContractError` naming the endpoint and the failing field path.
- AC4.9 The debug screen lists categories fetched from the mock through the full chain.
- AC4.10 No file in `src/presentation` imports from `src/data` or `src/infrastructure`; lint proves it.
- AC4.11 The container is the only file constructing repository implementations; a grep confirms it.
- AC4.12 The contract test suite passes against the running mock.
- AC4.13 The unwrapper returns the same DTO for `{ success, data: X }` and for a bare `X`, and a schema never sees the envelope (D22).
- AC4.14 Two retries of one logical attempt send the same `Idempotency-Key`, and a fresh attempt sends a different one (D20).

### Review checklist

- [x] Is `Money` correct for OMR, including rounding at the baisa?
- [x] Is the refresh flow free of races and infinite loops?
- [x] Is the error taxonomy complete for the states the UI must show?
- [x] Is the container readable, with every binding visible in one file?
- [x] Does the debug slice pass through every layer without shortcuts?

### Definition of done

**Met.** All fourteen criteria pass; the vertical slice runs against the mock, and the debug screen
is available only when the development menu is enabled.

---

## Phase 5 — Identity, session and navigation shell

### Objective

The complete navigation structure and the authentication boundary, with onboarding and the login /
sign-up screens working end to end against the mock.

### Prerequisites

Phases 2 and 4 done. Auth boundaries are set by D3, including the guest cart; per-tab stacks are preserved (D4); sign-in is email and password, with the OTP screen on mock-only endpoints (D12).

### Tasks

1. Domain: `User`, `Session`, `Email`, `PhoneNumber`, `AccountType`; `AuthRepository` port; `SignInUseCase`, `SignUpUseCase`, `SignOutUseCase`, `RestoreSessionUseCase`, `RefreshSessionUseCase`. Encode BR10 (seller sign-up creates a pending account and grants no session).
2. Data: auth DTOs and schemas, mappers, `AuthRemoteDataSource`, `HttpAuthRepository`, and a `SessionLocalDataSource` over `SecureStore`.
3. Presentation: the session Zustand store with `loading | authenticated | guest`, and a `SessionProvider` that restores on boot behind the splash.
4. Build the navigators from `architecture.md` §15: root stack, auth stack, five tabs with their stacks, and the modal group, with typed param lists.
5. Implement the `RequireAuth` guard with `returnTo`, and apply it per D3: browsing and the cart stay open to guests, and everything identity-bound is gated.
6. Implement the tab bar from the reference: five tabs, Arabic labels, active pill on Android and plain tint on iOS, and a cart badge placeholder.
7. Build the Onboarding screen: hero image, brand mark, title and subtitle, `+968` phone field, send-code button, Apple and Google buttons, email entry, continue-as-guest. The phone path runs against the **mock-only OTP endpoints** and the social buttons are non-functional placeholders in v1 (D12).
8. Build the Login screen: back, title and subtitle that change with the tab, sign-in / sign-up segmented control, customer / seller account-type switch, the conditional fields (name or store name, and phone, only when signing up), email, password with a visibility toggle, remember-me, forgot-password, the seller-pending notice, submit, and the "use phone instead" and "admin login" affordances.
9. Wire form validation with RHF + Zod, with Arabic and English messages.
10. Implement sign-out, returning to Onboarding and clearing the session and the query cache.
11. Implement the deep-linking configuration from §15.5.

### Expected artifacts

`src/domain/identity/**`, `src/data/identity/**`, `src/app/navigation/**`,
`src/app/providers/SessionProvider.tsx`, `src/presentation/features/onboarding/**`,
`src/presentation/features/auth/**`, `src/presentation/components/navigation/TabBar.tsx`.

### Testing

- Unit: sign-in stores the session; seller sign-up returns `SellerPendingApproval` and stores nothing; sign-out clears storage; restore returns guest when no token exists.
- Integration: a 401 from login surfaces `InvalidCredentials`, not a crash; a network failure surfaces `NetworkError`.
- Component: the login form blocks submit on an invalid email; the password toggle switches masking; the account-type switch shows and hides the store-name field and the seller notice.
- E2E: onboarding → guest → home; onboarding → email → sign in → home; sign out → onboarding.

### Acceptance criteria

- AC5.1 A cold start with no session shows Onboarding; with a valid session it shows the Home tab.
- AC5.2 "Continue as guest" navigates to Home with session status `guest`.
- AC5.3 Tapping "email" on Onboarding opens Login with the sign-up tab active, matching the prototype default.
- AC5.4 Selecting the seller account type on sign-up shows the seller notice; submitting raises the pending toast and does **not** navigate.
- AC5.5 Selecting the customer type and submitting valid credentials navigates to Home and persists the session across a restart.
- AC5.6 Invalid credentials show an inline error, not a crash and not a toast alone.
- AC5.7 An invalid email blocks submit and shows a field message in the active language.
- AC5.8 The password visibility toggle switches masking and its icon.
- AC5.9 A guest tapping a gated screen is routed to Login and, after signing in, lands on the originally requested screen.
- AC5.10 The tab bar shows five tabs with the reference's Arabic labels, and the active tab uses the accent colour.
- AC5.11 Switching tabs preserves each tab's stack, and re-tapping the active tab resets it to its root (D4).
- AC5.12 Sign-out returns to Onboarding, clears secure storage, and empties the query cache.
- AC5.13 Tabs are hidden on Onboarding and Login.
- AC5.14 A `brandhub://product/p1` deep link opens the Product screen.
- AC5.15 The whole flow works identically in Arabic RTL and English LTR.
- AC5.16 The phone OTP path completes against the mock and is clearly marked in the code as mock-only, pending FA1 (D12).
- AC5.17 Guest status permits browsing and the cart, and blocks only the screens listed in `architecture.md` §5 (D3).

### Review checklist

- [ ] Compare Onboarding and Login against the prototype: spacing, weight, order, copy.
- [ ] Is the auth boundary applied exactly per D3, with the cart open to guests?
- [ ] Do tabs preserve their stacks, and does re-tapping the active tab reset it (D4)?
- [ ] Is the session restored before the first paint, with no flash of the wrong stack?
- [ ] Are tokens absent from every log?

### Definition of done

All fifteen criteria pass; both screens are approved against the reference; navigation is complete
and typed; the session survives a restart.

---

## Phase 6 — Catalogue and discovery

### Objective

Home, Browse, Category and Search, with the filter sheet, running against the mock, with every
async state handled.

### Prerequisites

Phase 5 done. The `BRANDHUB App.dc.html` home is canonical (D5); `averageRating` and `reviewCount` arrive on the product DTO (D14, FA2).

### Tasks

1. Domain: `Product`, `ProductVariant`, `Category`, `Seller`, `Rating`, `Discount`; `SearchCriteria` (query, category, seller, sort, in-stock, express, price range, min rating); `ProductRepository` and `CategoryRepository` ports; `SearchProductsUseCase`, `GetHomeSectionsUseCase`, `GetCategoryProductsUseCase`. Encode BR11 (discount derived from base and sale price).
2. Data: product and category DTOs with schemas, mappers, remote data sources, `HttpProductRepository`, `HttpCategoryRepository`, and criteria-to-query-param translation.
3. Presentation, Home: location header, notification bell with unread dot, search entry, influencer avatar rail, promo gradient banner, 8 category tiles, deals rail — each an independent section with its own async state.
4. Presentation, Browse: vertical category rail with the active indicator, sub-filter chips, product grid, and rail-to-grid synchronisation.
5. Presentation, Category: hero with name, description, count and image; sub-filter chips; in-stock toggle; filter entry; product grid; empty state; "all products" action.
6. Presentation, Search: the input with live query, trending chips that populate the query, the removable seller-scope chip, result count, sort chips, result list, and the empty state with clear-filters.
7. Presentation, filter sheet: sort, in-stock and express toggles, min/max price, rating chips, clear-all, and the apply button carrying the live match count.
8. Implement `ProductCard` with `rail | grid | list | compact` variants covering all six prototype layouts.
9. Implement infinite scroll on the search and category grids.
10. Implement skeletons matching each list's card geometry.
11. Prefetch the product detail query on card press-in.

### Expected artifacts

`src/domain/catalog/**`, `src/data/catalog/**`,
`src/presentation/features/{home,browse,category,search}/**`,
`src/presentation/features/catalog/components/{ProductCard,ProductGrid,ProductRail,CategoryTile,FilterSheetContent}.tsx`.

### Testing

- Unit: `SearchCriteria` to query params; sort comparators; discount derivation; the product mapper against fixtures.
- Integration: search returns mapped entities via MSW; a 500 yields `ServerError`; an empty page yields an empty result, not an error.
- Component: `ProductCard` renders title, price, old price, discount badge, rating and express badge, and fires open, wishlist and add callbacks; `FilterSheetContent` produces the expected criteria for a given interaction sequence; the search screen shows the pre-query prompt, then results, then the empty state.
- E2E: home → category tile → category → product; search → trending term → filter → apply → result.

### Acceptance criteria

- AC6.1 Home renders every section from the approved reference, in the reference's order.
- AC6.2 Each home section shows its own skeleton while loading and its own error affordance on failure; one failing section does not blank the others.
- AC6.3 Tapping a category tile navigates to Category with that category's id, and the header shows its name and product count.
- AC6.4 The Browse category rail marks the active category and the grid updates to it.
- AC6.5 Search with no query shows trending chips and the pre-query prompt.
- AC6.6 Typing a query updates the result list and the result count.
- AC6.7 Tapping a trending chip fills the query and runs the search.
- AC6.8 The filter sheet's apply button label shows the live match count and applying updates the list.
- AC6.9 Each sort option reorders the list correctly: relevance, top rated, price ascending, price descending.
- AC6.10 The in-stock and express toggles filter the list.
- AC6.11 A min/max price outside every product's price yields the empty state with a working clear-filters action.
- AC6.12 Clear-filters resets every filter and restores the unfiltered list.
- AC6.13 A seller-scoped search shows the removable scope chip; removing it restores the unscoped results.
- AC6.14 Scrolling to the end of a grid loads the next page and shows a footer spinner; the last page shows no spinner.
- AC6.15 Product cards render prices as `NN.NNN` with the OMR label, and digits stay LTR in Arabic.
- AC6.16 Every screen renders correctly in Arabic RTL and English LTR.
- AC6.17 The product grid scrolls at 55 fps or better on a mid-range Android device with 200 products loaded.
- AC6.18 No presentation file imports from `data`; lint proves it.
- AC6.19 Card ratings come from the product response; no screen issues a per-product review request (D14).
- AC6.20 Switching language refetches catalogue content and shows resolved titles in the new language (D9).

### Review checklist

- [ ] Side-by-side visual comparison of all four screens against the prototype.
- [ ] Does home match the `BRANDHUB App.dc.html` reference, with the richer variant correctly left out (D5)?
- [ ] Is `ProductCard` genuinely one component, or four in disguise?
- [ ] Do the filters match the prototype's semantics exactly?
- [ ] Are skeletons shaped like the real cards?
- [ ] Are the Arabic titles legible at the reference's sizes, or did they need to grow?

### Definition of done

All eighteen criteria pass; all four screens are approved against the reference; the filter sheet
behaves identically to the prototype; performance is measured on a real device, not assumed.

---

## Phase 7 — Product detail and wishlist

### Objective

The product detail screen with variant selection resolved, and wishlist end to end.

### Prerequisites

Phase 6 done. The PDP gains a variant selector, auto-resolving for single-variant products (D8).

### Tasks

1. Domain: `Review`, `ProductSpec`; `ReviewRepository` and `WishlistRepository` ports; `GetProductDetailUseCase`, `ToggleWishlistUseCase` (BR6), `GetRelatedProductsUseCase`.
2. Data: review and wishlist DTOs, schemas, mappers, data sources, repositories.
3. Build the PDP: image hero with pager dots, express and discount badges, title, rating and review count, price with strikethrough, variant selector per D8, seller strip, delivery and returns lines, specifications, reviews, related products rail, wishlist toggle, and the sticky add-to-cart / buy-now bar.
4. Build the seller store screen: header, verified meta, rating / sales / products stats, product grid, and "view all" into a seller-scoped search.
5. Build the wishlist screen: grid with per-card remove and add-to-cart, plus the empty state.
6. Implement optimistic wishlist toggling with rollback on failure.
7. Wire the wishlist heart on every product card across the app.

### Expected artifacts

`src/domain/catalog/{Review,ProductSpec}`, `src/domain/wishlist/**`, `src/data/wishlist/**`,
`src/presentation/features/{product,sellerStore,wishlist}/**`.

### Testing

- Unit: `ToggleWishlistUseCase` adds and removes without duplicating; variant resolution picks the single variant when only one exists.
- Integration: a failed toggle rolls the optimistic update back.
- Component: the PDP renders every element for a full product and degrades correctly for a product with no old price, no discount and no reviews; the buy bar is fixed and visible above the safe area.
- E2E: PDP → wishlist heart → wishlist screen shows the item → remove → empty state.

### Acceptance criteria

- AC7.1 Opening a product from any entry point renders that product's data.
- AC7.2 The hero pager shows the image count and the dots track the active image.
- AC7.3 The discount badge shows the derived percentage and matches the strikethrough price.
- AC7.4 A product with no old price shows neither a strikethrough nor a discount badge.
- AC7.5 A multi-variant product shows the selector, and add-to-cart is blocked with a message until a variant is chosen (D8).
- AC7.5b A single-variant product hides the selector, resolves the variant automatically, and adds to cart in one tap (D8).
- AC7.6 The wishlist heart reflects membership immediately and persists after a reload.
- AC7.7 A failed wishlist toggle reverts the heart and shows an error toast.
- AC7.8 Tapping the seller strip opens the seller store for that seller.
- AC7.9 "View all" on the seller store opens Search scoped to that seller.
- AC7.10 The related-products rail excludes the current product.
- AC7.11 The buy bar stays fixed above the safe area while the page scrolls; tabs are hidden on the PDP.
- AC7.12 "Buy now" adds the item and navigates to Checkout; "add to cart" adds and shows the toast without navigating.
- AC7.13 The wishlist screen shows the empty state with a working discover action when nothing is saved.
- AC7.14 Reviews show reviewer, stars, relative time and text; an unreviewed product shows the reviews empty state.
- AC7.15 The whole screen renders correctly in Arabic RTL and English LTR.

### Review checklist

- [ ] PDP compared against the prototype element by element.
- [ ] Does the variant selector read as part of the design rather than bolted on, given it is an addition to the reference (D8)?
- [ ] Does the optimistic wishlist feel instant and recover cleanly?
- [ ] Is the sticky bar correct on a notched device and with the Android gesture bar?

### Definition of done

All fifteen criteria pass; the PDP is approved against the reference; wishlist round-trips through
the mock and survives a restart.

---

## Phase 8 — Cart and checkout

### Objective

The complete purchase flow: cart, promo codes, checkout, order creation and confirmation, with the
totals rules implemented consistently.

### Prerequisites

Phase 7 done. Shipping and payment fees are part of the order total (D10, D21); free delivery is the shipping area's `minOrderAmount`, supplied by the API (D11 as amended, D21).

### Tasks

1. Domain: `Cart`, `CartLine`, `Quantity`, `CheckoutDraft`, `PaymentMethod`, `ShippingArea`, `Coupon`; `CartRepository`, `CouponRepository`, `OrderRepository`, `ShippingAreaRepository` ports; `AddToCartUseCase`, `UpdateCartLineUseCase` (BR4), `RemoveCartLineUseCase`, `CalculateCartTotalsUseCase` (BR1–BR3, BR13, D10, D21), `ApplyCouponUseCase`, `PlaceOrderUseCase` (BR5, BR12, D20).
2. Data: cart, coupon and order DTOs, schemas, mappers, data sources, repositories.
3. Build the cart screen: free-shipping hint driven by the real threshold, line rows with the quantity stepper, promo-code row with apply, the totals block, the empty state, and the checkout button.
4. Build the checkout screen: the three-step indicator, the address card with a change action into address selection, the **shipping area's cost and estimated delivery days in place of the prototype's two time slots** (D21), the four payment methods, the order summary with VAT and shipping, and place-order.
5. Build the confirmation screen: success mark, order number, the four-step tracking timeline, the courier card, and continue-shopping.
6. Implement optimistic quantity changes with rollback.
7. Implement the cart badge on the tab bar, driven by the live cart.
8. Handle checkout failures: out of stock (409), invalid coupon, payment declined, network loss mid-submit.

### Expected artifacts

`src/domain/{cart,checkout,orders}/**`, `src/data/{cart,coupons,orders}/**`,
`src/presentation/features/{cart,checkout,orderConfirmation}/**`.

### Testing

- Unit: BR1 subtotal; BR2 VAT at 5%; BR3 total including slot and payment fees and the coupon discount; BR4 removal at zero; BR5 empty-cart rejection; the free-delivery threshold boundary at exactly the threshold.
- Integration: place-order success returns an order; a 409 returns `InsufficientStock`; a network failure during submit does not create a duplicate order on retry.
- Component: the stepper disables the decrement at 1 or removes at 0 per BR4; the promo row shows applied, invalid and error states; the checkout summary recomputes when the slot or payment method changes.
- E2E: PDP → add → cart → checkout → place order → confirmation → continue shopping.

### Acceptance criteria

- AC8.1 Adding from the PDP increments the tab badge and the cart shows the line.
- AC8.2 Adding the same product twice increments the quantity rather than creating a second line.
- AC8.3 The stepper updates the quantity and every total recomputes immediately.
- AC8.4 Decrementing to zero removes the line; removing the last line shows the empty state.
- AC8.5 The empty cart shows the reference's copy and a working shop-now action.
- AC8.6 Subtotal equals the sum of line totals, to the baisa, across a randomised test set.
- AC8.7 VAT equals exactly 5% of the subtotal, rounded half-up at the baisa.
- AC8.8 The order total matches BR3 exactly: subtotal + VAT + the shipping area's price + payment-method fee − coupon discount (D10, D21).
- AC8.9 The free-shipping hint appears only below the shipping area's `minOrderAmount` and shows the correct remaining amount; changing that value in the mock changes the hint with no rebuild (D11, D21).
- AC8.10 A valid promo code applies the discount and shows it as a summary line; an invalid code shows an inline error and changes no total.
- AC8.11 Checkout as a guest routes to Login and returns to Checkout after signing in.
- AC8.12 Checkout with no address prompts for one and returns to Checkout after saving.
- AC8.13 Checkout shows the resolved shipping area with its price and estimated delivery days, and the total includes that price (D21).
- AC8.14 Selecting a payment method updates the total by that method's fee and marks the selection.
- AC8.15 Place-order shows a loading state, disables the button, and cannot be double-submitted.
- AC8.16 A successful order navigates to Confirmation with the real order number and clears the cart and the badge.
- AC8.17 An out-of-stock failure shows an actionable message naming the affected item and does not clear the cart.
- AC8.18 A network failure during submit shows a retry, and retrying reuses the attempt's `Idempotency-Key` so no duplicate order is created. Verified by asserting the mock received two requests and created one order (D20).
- AC8.19 The confirmation timeline shows four steps with the first two complete, matching the reference.
- AC8.20 Continue-shopping returns to Home with an empty cart.
- AC8.21 The whole flow works in Arabic RTL and English LTR.
- AC8.22 A guest can add, change quantity and remove cart lines without signing in, and the cart survives the sign-in detour at checkout (D3).
- AC8.23 Cart and checkout show the same total for the same cart, computed by one BR3 implementation (D10).

### Review checklist

- [ ] Are the totals correct to the baisa in every combination of fees, VAT and coupon?
- [ ] Is the cart-versus-checkout inconsistency resolved per D10, and is the resulting deviation from the prototype's cart number acceptable on screen?
- [ ] Is double-submission genuinely impossible?
- [ ] Does the guest-to-checkout detour preserve the cart and return correctly?
- [ ] Cart, checkout and confirmation compared against the prototype.

### Definition of done

All twenty-one criteria pass; the money tests cover the fee and coupon matrix; the primary E2E
journey is green; all three screens are approved against the reference.

---

## Phase 9 — Account, orders and addresses

### Objective

The account hub, order history and detail, returns, and full address management.

### Prerequisites

Phases 5 and 8 done. The UI's address shape is the domain entity (D13).

### Tasks

1. Domain: `Order`, `OrderLine`, `OrderStatus`, `OrderTimeline`, `DeliveryOtp`, `ReturnRequest`, `Address`, `AddressLabel`, `City`; `AddressRepository` port; `GetOrdersUseCase`, `GetOrderDetailUseCase`, `RequestReturnUseCase` (BR8), `SaveAddressUseCase`, `SetDefaultAddressUseCase` (BR7), `DeleteAddressUseCase`, `UpdateProfileUseCase`.
2. Data: order, return, address and user DTOs, schemas, mappers, data sources, repositories, with the D13 address mapping. Returns and the delivery OTP run on the **real contract** now: `POST /returns` takes `{ orderId, reason }` and `deliveryOtp` arrives on the order (D19). The five fixed UI reasons map to the API's free-text `reason` in the mapper.
   2b. Data: `ShippingAreaRepository` over `/areas`, plus the mapper that resolves an address to an area by matching city against area name and governorate. This is the contained workaround for the missing link described in `architecture.md` §34.4.
3. Build the account screen: profile header, the three order stats, the nine navigation rows with live counts, the language switch with the restart flow, and sign-out.
4. Build the orders screen: order cards with thumbnail, number, status pill, date, item count and total; pagination; the empty state.
5. Build the order detail screen: the four-step timeline, the delivery OTP panel when present, item rows, shipping address, the totals block, payment status, and the request-return and contact-support actions.
6. Build the return form: reason radios, note textarea, submit with the confirmation toast, and navigation back to orders.
7. Build the addresses screen: cards with the default badge, edit, set-default and delete with confirmation.
8. Build the address form: create and edit modes, name, phone, city select, details, and save.
9. Build the profile edit screen: first name, last name, phone, email, cancel and save.
10. Implement the language switch: persist the locale, and prompt for restart when direction changes.

### Expected artifacts

`src/domain/{orders,addresses}/**`, `src/data/{orders,addresses,users}/**`,
`src/presentation/features/{account,orders,returns,addresses,profile}/**`.

### Testing

- Unit: BR7 default-address exclusivity; BR8 returns allowed only for delivered orders; the timeline maps status to step index; profile validation.
- Integration: order list paginates; order detail 404 shows a not-found state; address save round-trips.
- Component: the return form blocks submit with no reason selected; the address form validates the Oman phone format; delete asks for confirmation.
- E2E: account → orders → order detail → request return → submit → toast and back to orders.

### Acceptance criteria

- AC9.1 Account shows the signed-in user's name and masked phone.
- AC9.2 The nine navigation rows show live counts for orders, wishlist, addresses, wallet balance and tickets.
- AC9.3 Each row navigates to its screen.
- AC9.4 The orders list shows every order with the correct status pill, and delivered orders use the success tint.
- AC9.5 An account with no orders shows the empty state.
- AC9.6 Order detail shows the timeline with steps completed up to the order's status.
- AC9.7 The OTP panel appears only for orders whose `deliveryOtp` is present, and shows the code with its hint (D19).
- AC9.8 Order totals show subtotal, tax, payment status and paid total, matching the order.
- AC9.9 Request-return appears only for delivered orders (BR8).
- AC9.10 Submitting a return without a reason is blocked with a message.
- AC9.11 Submitting a valid return posts to `/returns` with the selected reason as text, shows the confirmation toast, and returns to orders (D19).
- AC9.12 Contact-support opens Support with the order pre-selected.
- AC9.13 The addresses list marks exactly one default; setting a new default clears the previous (BR7).
- AC9.14 Adding an address appends it to the list and it is available at checkout.
- AC9.15 Editing an address pre-fills the form and updates the existing record rather than creating a new one.
- AC9.16 Deleting asks for confirmation and removes the address on confirm only.
- AC9.17 Saving the profile updates the account header.
- AC9.18 Switching the language persists it, and crossing the direction boundary prompts for a restart; after restart the app is fully mirrored.
- AC9.19 Sign-out clears the session and returns to Onboarding.
- AC9.20 Every screen renders correctly in Arabic RTL and English LTR.
- AC9.21 An address saved through the UI round-trips without losing label, recipient name, phone, details or city, and the API request fills `country` as Oman with `state` and `postalCode` omitted (D13).

### Review checklist

- [ ] Are addresses mapped per D13, with no UI field lost and no required API field missing?
- [ ] Is the address-to-area resolution isolated in one mapper, so replacing it when the backend adds an explicit link is a single edit?
- [ ] Is the timeline visually and semantically faithful to the reference?
- [ ] Is the OTP handled securely — not logged, not auto-copied?
- [ ] Is the restart prompt clear and non-destructive?
- [ ] All six screens compared against the prototype.

### Definition of done

All twenty criteria pass; the after-sales E2E journey is green; every screen is approved against the
reference.

---

## Phase 10 — Wallet, gifts and payment result

### Objective

Wallet balance and top-up, the hosted-payment return flow, gift money, and the payment-result screen.

### Prerequisites

Phase 9 done.

### Tasks

1. Domain: `Wallet`, `WalletTransaction`, `TransactionType`, `Gift`; `WalletRepository` port; `GetWalletUseCase`, `TopUpWalletUseCase`, `GetTransactionsUseCase`, `SendGiftUseCase`.
2. Data: wallet, transaction and gift DTOs, schemas, mappers, data sources, repository, all on the **real contract** (D19). `POST /gifts` takes `{ recipient, amount, currency, occasion, message, deliveryMethod, senderMode, scheduledAt }` with `currency` fixed to `OMR`, and sent, received, claim and cancel all exist.
   2b. Wire `GET /payments/PAYMOB/status?orderId=` so the payment-result screen can resolve a pending charge rather than guessing.
3. Build the wallet screen: gradient balance card, the wallet-active pill, quick amounts, custom amount, the top-up action, and the paginated transaction history with signed amounts and their tints.
4. Implement the top-up flow: create a charge carrying an `Idempotency-Key` (D20), open the hosted payment page in a browser session, and handle the deep-link return.
5. Build the payment-result screen with success, failed and pending variants, the amount, back-to-wallet, and retry on failure only.
6. Build the gifts screen: recipient, amount, occasion chips, message, send, and gift history.
7. Refresh the wallet balance after a successful top-up.

### Expected artifacts

`src/domain/wallet/**`, `src/data/wallet/**`,
`src/presentation/features/{wallet,gifts,paymentResult}/**`.

### Testing

- Unit: transaction sign and tint mapping; top-up amount validation at the minimum and maximum boundaries; gift recipient accepted as either an email or an Oman phone number.
- Integration: a charge returns a payment URL and a reference; a pending status polls or waits per the mock's behaviour.
- Component: quick-amount selection is exclusive with the custom field; the result screen shows retry only on failure.
- E2E: wallet → select 25 → top up → mock payment success → result → back to wallet with the balance increased.

### Acceptance criteria

- AC10.1 The wallet shows the balance formatted as `NN.NNN` with the OMR label.
- AC10.2 Transaction history paginates and shows credits and debits with the reference's signs and tints.
- AC10.3 Selecting a quick amount marks it and clears the custom field.
- AC10.4 An amount below the minimum or above the maximum blocks the top-up with a message.
- AC10.5 Top-up opens the hosted payment page and does not accept card details inside the app.
- AC10.6 A successful return shows the success result with the charged amount, and the balance increases by that amount.
- AC10.7 A failed return shows the failure result with a working retry, and the balance is unchanged.
- AC10.8 A pending return shows the pending result with the explanatory copy and no retry.
- AC10.9 Back-to-wallet returns to a wallet showing the refreshed balance.
- AC10.10 Sending a gift posts the full contracted payload including `currency: "OMR"`, shows the toast, and appears in `GET /gifts/sent` (D19).
- AC10.11 A gift larger than the balance is blocked with an insufficient-balance message.
- AC10.12 Both screens render correctly in Arabic RTL and English LTR.
- AC10.13 A pending payment resolves by polling `GET /payments/PAYMOB/status`, and the screen moves from pending to success or failure without a manual refresh.
- AC10.14 Repeating a top-up after a lost connection reuses the attempt's `Idempotency-Key` and charges once (D20).

### Review checklist

- [ ] Does the deep-link return work when the app was backgrounded, and when it was killed?
- [ ] Are wallet screens excluded from screenshots on Android per §28 S10?
- [ ] Do the gift payloads match the contract exactly, including `deliveryMethod` and `senderMode`?
- [ ] Is `/wallet/transfers` deliberately left unbuilt, and is that recorded as a product question rather than an oversight?
- [ ] Wallet, gifts and result screens compared against the prototype.

### Definition of done

All twelve criteria pass; the top-up journey is green end to end including the deep-link return;
the invented gift endpoints are documented for the backend team.

---

## Phase 11 — Social commerce and notifications

### Objective

Influencers, profiles, shoppable posts, and the notifications list — the features that differentiate
BRANDHUB from a plain catalogue, and the ones with no backend contract.

### Prerequisites

Phase 6 done. Notifications are an in-app list only, with no push (D17).

### Tasks

1. Domain: `Influencer`, `ShoppablePost`, `Handle`, `FollowerCount`, `AppNotification`, `NotificationKind`; `InfluencerRepository` and `NotificationRepository` ports; `GetInfluencersUseCase`, `GetInfluencerProfileUseCase`, `FollowInfluencerUseCase`, `GetNotificationsUseCase`, `MarkAllReadUseCase`.
2. Data: DTOs, schemas, mappers, data sources, and repositories implemented against the mock's invented endpoints, named to make their provisional status obvious.
3. Build the influencers screen: the list with avatar, name, handle, followers and a follow button.
4. Build the influencer profile: avatar, name, handle, bio, follow and message, the three stats, and the shoppable posts feed with likes, comments, caption, and the tagged product card that opens the PDP.
5. Build the home influencer rail linking into profiles.
6. Build the notifications screen: rows with icon token, title, body and time, the unread background, mark-all-read, and the empty state.
7. Wire the unread dot on the home bell.

### Expected artifacts

`src/domain/{social,notifications}/**`, `src/data/{social,notifications}/**`,
`src/presentation/features/{influencers,notifications}/**`.

### Testing

- Unit: follower-count formatting (`215K`); post-to-product resolution.
- Integration: the influencer profile loads posts and their tagged products.
- Component: the post card fires the product callback; the notification row reflects read and unread.
- E2E: influencers tab → profile → post → tagged product → PDP.

### Acceptance criteria

- AC11.1 The influencers list shows all influencers with name, handle and formatted follower count.
- AC11.2 Tapping an influencer opens their profile with bio and the three stats.
- AC11.3 The profile shows shoppable posts with likes, comments and caption.
- AC11.4 Tapping a post's tagged product opens that product's PDP.
- AC11.5 The follow button toggles and persists.
- AC11.6 The home influencer rail opens the corresponding profile.
- AC11.7 Notifications show icon, title, body and relative time, with unread rows tinted.
- AC11.8 Mark-all-read clears every unread state and the home bell dot.
- AC11.9 An account with no notifications shows the empty state.
- AC11.10 Both screens render correctly in Arabic RTL and English LTR.
- AC11.11 Every repository backed by an invented endpoint is named and documented as provisional (FA1).
- AC11.12 No push permission is requested and no device token is registered; the list refreshes on open and on pull-to-refresh (D17).

### Review checklist

- [ ] Is the shoppable-post layout faithful to the prototype?
- [ ] Are the provisional repositories obviously provisional in the code and in the container?
- [ ] Is D17 respected — in-app list only, no permission prompt, no device token?
- [ ] Both screens compared against the prototype.

### Definition of done

All eleven criteria pass; the social journey is green; the invented endpoints for this phase are in
`INVENTED_ENDPOINTS.md`.

---

## Phase 12 — Support

### Objective

Ticket creation and the ticket thread, closing the last customer-facing feature.

### Prerequisites

Phase 9 done.

### Tasks

1. Domain: `Ticket`, `TicketMessage`, `TicketCategory`, `TicketPriority`, `TicketStatus`; `SupportRepository` port; `CreateTicketUseCase`, `GetTicketsUseCase`, `GetTicketUseCase`, `ReplyToTicketUseCase`.
2. Data: DTOs, schemas, mappers, data source, repository against the mock's invented endpoints.
3. Build the support screen: the new-ticket form with six category chips, three priority chips, a related-order select, subject and description; the my-tickets list with number, status pill, subject and meta line; and the empty state.
4. Build the ticket detail: header with number and status, meta chips for category, priority and order, last-update line, the two-sided message thread, and the reply box.
5. Accept a pre-selected order from the order-detail entry point.

### Expected artifacts

`src/domain/support/**`, `src/data/support/**`, `src/presentation/features/support/**`.

### Testing

- Unit: ticket validation; status-to-tint mapping.
- Integration: create returns a ticket and it appears in the list; reply appends to the thread.
- Component: the form blocks submit without a subject or description; the thread aligns the user's own messages to the start and support's to the end.
- E2E: order detail → contact support → the order is pre-selected → submit → the ticket appears in the list.

### Acceptance criteria

- AC12.1 The ticket form shows six categories and three priorities, matching the reference, with a single selection each.
- AC12.2 The related-order select lists the user's orders.
- AC12.3 Submitting without a subject or a description is blocked with field messages.
- AC12.4 A valid submit shows the toast and the ticket appears at the top of my-tickets.
- AC12.5 The ticket list shows number, status pill in the reference's tint, subject and the category / priority / updated meta line.
- AC12.6 Tapping a ticket opens the thread.
- AC12.7 The thread renders both sides with the correct alignment, author and time.
- AC12.8 Sending a reply appends it to the thread and shows the toast.
- AC12.9 An empty reply is blocked.
- AC12.10 Arriving from order detail pre-selects that order.
- AC12.11 An account with no tickets shows the empty state.
- AC12.12 Both screens render correctly in Arabic RTL and English LTR.

### Review checklist

- [ ] Thread layout compared against the prototype, including the RTL alignment of the two sides.
- [ ] Are the status tints exactly the reference's?
- [ ] Is the provisional nature of these endpoints documented?

### Definition of done

All twelve criteria pass; the support journey is green; both screens are approved against the
reference.

---

## Phase 13 — Integration, QA and release preparation

### Objective

Take a feature-complete app to release quality: full test suite green, all eight E2E journeys
passing, accessibility and performance verified, error and offline behaviour proven, and a
side-by-side fidelity review against the reference.

### Prerequisites

Phases 1–12 done.

### Tasks

1. Run and stabilise the full unit, integration and component suites; fix flakes rather than retry them.
2. Implement all eight E2E journeys from `architecture.md` §27.4 and run them on both platforms.
3. Run the contract test suite against the mock, and against the real API if it is reachable.
4. Sweep error handling: force every fault (401, 404, 409, 500, timeout, offline) on every screen using the mock's fault switch and verify the state shown.
5. Implement and verify offline behaviour: the offline banner, cached reads, blocked writes with a clear message, and recovery on reconnect.
6. Accessibility pass: VoiceOver and TalkBack on all eight journeys; touch-target audit; contrast fixes; dynamic type at 130%; reduce-motion.
7. Performance pass: measure cold start, list scroll fps and PDP time-to-interactive against §29 P9 on a mid-range Android device and a mid-generation iPhone; fix regressions.
8. RTL and localisation sweep: every screen in both languages, hunting truncation, mirrored icons, LTR numerals and untranslated keys.
9. Full fidelity review: every screen side by side with the prototype; record every intentional deviation with its reason.
10. Production configuration: app icon, splash, bundle identifiers, versioning, EAS production profile, release-build logging stripped, dev tools removed.
11. Verify security: no token in any log, secure store in use, HTTPS enforced in non-development builds, `FLAG_SECURE` on wallet and OTP screens.
12. Produce release builds for both platforms and smoke-test them on physical devices.
13. Complete the **native Arabic copy review** of every string drafted in Phase 2 and every string added since, and apply the corrections (D7, FA5).
14. Review the follow-up actions FA1–FA5: record which have landed, which have not, and what each unlanded one means for the release. FA6 closed when the API supplied the free-delivery minimum.
15. Write the handover documentation: how to run, how to test, how to switch environments, the migration runbook from §19.3, and the final invented-endpoint list for the backend team.

### Expected artifacts

`e2e/**` (eight Maestro flows), `contract-tests/**`, `docs/QA-REPORT.md`,
`docs/ACCESSIBILITY-AUDIT.md`, `docs/PERFORMANCE-REPORT.md`, `docs/FIDELITY-REVIEW.md`,
`docs/MIGRATION-RUNBOOK.md`, `mock-server/INVENTED_ENDPOINTS.md` (final), `eas.json` production
profile, signed builds for both platforms.

### Testing

Everything, on both platforms, on physical devices as well as simulators.

### Acceptance criteria

- AC13.1 The full test suite passes with zero skipped and zero flaky tests.
- AC13.2 Domain and mapper coverage is at least 90% lines.
- AC13.3 All eight E2E journeys pass on iOS and on Android.
- AC13.4 The contract suite passes against the mock.
- AC13.5 Every screen shows a correct loading, empty and error state under forced faults; a matrix of screen × fault is recorded in the QA report.
- AC13.6 Offline shows the banner, serves cached reads, blocks writes with a clear message, and recovers on reconnect.
- AC13.7 All eight journeys are completable with VoiceOver and with TalkBack.
- AC13.8 Every interactive target is at least 44×44 pt.
- AC13.9 Every text-on-background pair meets WCAG AA, with any accepted exception listed and signed off.
- AC13.10 No layout breaks at 130% font scale.
- AC13.11 Cold start is under 3 seconds on the reference mid-range Android device.
- AC13.12 List scrolling holds 55 fps or better on that device.
- AC13.13 PDP is interactive within 1 second on a warm cache.
- AC13.14 Every screen is correct in Arabic RTL and English LTR, with no truncated or untranslated string.
- AC13.15 The fidelity review covers all 27 screens, and every deviation is listed with its reason.
- AC13.16 No token, password or OTP appears in any log in a release build.
- AC13.17 Release builds install and run on physical iOS and Android devices.
- AC13.18 Switching `EXPO_PUBLIC_API_BASE_URL` changes the backend with no code change.
- AC13.19 Zero boundary violations and zero dependency cycles.
- AC13.20 Handover documentation is complete and a fresh checkout can be run from it alone.
- AC13.21 Every Arabic string in the app has passed native review, with corrections applied (D7, FA5).
- AC13.22 The status of FA1–FA5 is recorded, and every unlanded action has a stated release impact.

### Review checklist

- [ ] Walk all eight journeys personally on a physical device in Arabic.
- [ ] Review the fidelity report and accept or reject each deviation.
- [ ] Review the accessibility audit and its exceptions.
- [ ] Review the performance numbers against the budget.
- [ ] Confirm the migration runbook is followable by someone who did not build this.
- [ ] Confirm the invented-endpoint list is complete and ready for the backend team (FA1).
- [ ] Confirm the native Arabic copy review is signed off (FA5).
- [ ] Confirm no secret or endpoint is exposed in the shipped bundle.

### Definition of done

All twenty criteria pass; the reviewer has walked the journeys; every deviation is accepted;
release builds are signed and smoke-tested; the handover documentation is approved.

---

## Phase 14 — Seller app _(deferred track, not part of v1)_

### Objective

Extend the codebase to the seller mobile app, reusing the domain, data and design-system layers.

### Prerequisites

Phase 13 done, and a decision to schedule this track. D1 deferred it out of v1; reversing that is a
scope decision, not a technical one.

### Scope from the reference

Seven screens: access gate, overview (balance, six stat cards, quick actions, recent activity),
products (status filters, product cards with images / edit / delete actions and rejection reasons,
empty state), submit product (a six-step wizard: basics, pricing with the seller-percentage payout
breakdown, variants generated from colours × sizes, tax, media and description, review with
validation errors), orders (grouped by date, status filters, per-order share), earnings (balance,
payout note, transactions with proof), and profile.

### What it reuses

The theme and every shared component, `Money`, the HTTP client and error taxonomy, the session and
auth domain, the i18n setup, and the testing infrastructure.

### What is new

Seller-specific domain (`SellerProduct`, `ProductRequest`, `Payout`, `SellerOrder`), the
`/seller/*` endpoints (which **do** exist in the real API contract), the six-step wizard with
per-step validation, variant generation, and the payout calculation.

### To decide when this track is scheduled

Is it a separate application, or a role-switched mode inside the same binary? The reference's System
prototype states that customers sign in through the app while dashboard roles sign in separately,
which points toward a separate app. This is the one question left deliberately open, because it
depends on product circumstances that do not exist yet. It does not affect v1: the customer app's
domain, data and design-system layers are reusable either way.

---

## Follow-up actions tracked across phases

Six actions sit with people outside this project. **None blocks a phase.** Each has an interim
behaviour that lets the work proceed, and a checkpoint where its absence starts to cost something.

| ID          | Action                                                                                                                                                                                                                                                                        | Owner         | Interim behaviour                                                      | Checkpoint                          | If it never lands                                                                   |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| **FA1**     | Support tickets, returns, gift money, the delivery OTP and stock are **delivered** in the expanded collection. What remains: influencers and shoppable posts, delivery time slots and the express flag, phone OTP, and confirming how an address resolves to a shipping area. | Backend       | Mock-only repositories behind real domain ports, named as provisional. | Phase 13 review, then at migration. | Only social commerce stops at migration. Everything else runs on the real contract. |
| **FA2**     | Add `averageRating` and `reviewCount` to product responses.                                                                                                                                                                                                                   | Backend       | The mock serves both.                                                  | Phase 6 acceptance.                 | Ratings vanish from cards, or an N+1 fetch has to be introduced.                    |
| **FA3**     | Honour `Accept-Language` for catalogue content.                                                                                                                                                                                                                               | Backend       | The mock resolves from a stored `{ ar, en }` pair.                     | Phase 6 acceptance.                 | Arabic titles fall back to whatever single language the API stores.                 |
| **FA4**     | Obtain the GE Dinar One licence.                                                                                                                                                                                                                                              | Brand / legal | Noto Kufi Arabic ships behind a single theme token.                    | Phase 2 review.                     | The app ships in the face the prototype already renders with.                       |
| **FA5**     | Native Arabic review of all drafted copy.                                                                                                                                                                                                                                     | Content       | Placeholders drafted in both languages in Phase 2.                     | **Release gate, Phase 13.**         | Phase 13 does not clear.                                                            |
| ~~**FA6**~~ | ~~Confirm the free-delivery threshold.~~ **Closed:** the API supplies it as `area.minOrderAmount`.                                                                                                                                                                            | Closed        | Closed                                                                 | Closed                              | Closed                                                                              |

---

## Cross-phase working rules

1. **No phase starts before its prerequisites are met.** All 17 Phase 0 questions are decided (D1–D17), and the expanded API contract added D18–D22, so no phase is blocked on a decision. A follow-up action FA1–FA5 is never a reason to stop; each has an interim behaviour.
2. **Every phase produces a completion report** in the structure given at the top of this document.
3. **Smallest safe step.** Within a phase, implement, test and verify one slice before starting the next.
4. **Never leave a failing test silently.** A failure is fixed or reported explicitly as a known issue with a reason.
5. **No new dependency without justification** recorded in `architecture.md` §32.
6. **No new abstraction without a stated responsibility.**
7. **No business rule duplicated.** If it exists in the domain, the UI calls it.
8. **No boundary violation, ever.** Lint enforces it; the fix is the design, never a lint suppression.
9. **The reference is the UI authority.** A deviation is deliberate, recorded and reviewed, never accidental.
10. **Arabic is the primary language.** Every screen is reviewed in Arabic RTL before it is considered done.
11. **Compiling is not completion.** Only the acceptance criteria and the definition of done decide.
12. **A decision is changed in `architecture.md` §34 first, then in the code.** If implementation shows that a decision D1–D22 was wrong, that is reported with the evidence and re-decided, not quietly worked around.

---

_End of plan.md. The architecture it implements is in `architecture.md`._
