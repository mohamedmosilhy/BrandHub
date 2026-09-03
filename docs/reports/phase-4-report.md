# Phase 4 — Core infrastructure and data plumbing · Completion report

**Date:** 2026-09-03 · **Status:** Implemented; automated acceptance green
**Plan:** [`../plan.md`](../plan.md) Phase 4 · **Architecture:** [`../architecture.md`](../architecture.md)

## What was implemented

- A dependency-free `Result<T, E>` union with constructors, guards and composition helpers.
- The complete `AppError` taxonomy from architecture §21.1. Every error carries a stable code and
  correlation id, with optional structured details and cause.
- An OMR `Money` value object backed by integer baisa. Decimal ingestion, multiplication and
  percentages round half-up at the baisa; scaled arithmetic uses integers/BigInt rather than binary
  floating-point values.
- A transport-neutral `HttpClient` and Axios adapter with base URL, timeout, bearer token,
  `Accept-Language`, correlation and `Idempotency-Key` handling. Concurrent 401 responses share one
  refresh operation; a failed refresh clears the secure session once and marks it unauthenticated.
- Status/payload/network/timeout normalization into the error taxonomy.
- SecureStore and key-value ports with Expo SecureStore and AsyncStorage adapters. Access and refresh
  tokens have a dedicated secure session store and an in-memory Zustand status store; AsyncStorage
  never receives them.
- Structured logging with recursive redaction for password, token, authorization, OTP, card number
  and IBAN fields, plus bearer/string-pattern redaction and release debug suppression.
- TanStack Query configuration with error-specific retry counts, exponential backoff, cache timings,
  mutation safety and global redacted error logging.
- One readable dependency container, a typed `ContainerProvider`/`useContainer`, and Query provider
  wiring in the application root.
- Shared response unwrapping and Zod validation. DTO schemas see the payload only, and malformed
  responses become endpoint/path-aware `ContractError`s.
- Immutable idempotency attempts whose key is reused by request retries and reminted for a fresh user
  attempt.
- The complete category proof slice: strict recursive DTO, mapper, domain entity, repository port,
  remote data source and repository implementation for `GET /categories/tree`.
- A development-only category diagnostic alongside the existing component gallery. It renders
  loading, empty, error and recursively nested content through a presentation view-model.
- MSW category handlers, deterministic builders and storage doubles, plus a standalone live contract
  suite under `contract-tests/`.

## Architectural decisions

1. The Axios response interceptor owns authentication recovery, while repository implementations own
   the `Result` boundary. This keeps Axios exceptions out of domain and presentation without hiding
   expected failures behind throws at the feature boundary.
2. Refresh uses one shared promise including failure cleanup. All concurrent 401 handlers await it,
   eliminating duplicate refresh calls and duplicate session-clearing races.
3. Session status uses Zustand's vanilla store so HTTP infrastructure can update authentication state
   without importing React. Tokens remain solely in the injected SecureStore port.
4. The response helper unwraps first and validates second. Schemas therefore describe only DTO
   payloads and are identical for bare and `{ success, data }` routes.
5. MSW 1.3 is pinned as a development dependency because its CommonJS runtime is compatible with the
   repository's Jest 29/Expo 54 transform stack. The handlers expose the same behavior needed by the
   current integration slice.

## Tests added

- `Result`: successful composition, error preservation, guards and fallback semantics.
- `Money`: exact decimal addition, VAT, positive/negative half-up boundaries, subtraction,
  multiplication, zero and comparison.
- HTTP: the full status taxonomy, network and timeout errors, required request headers, omitted auth,
  three-request single-flight refresh, failed-refresh cleanup, and idempotency attempt reuse.
- Storage/logging: SecureStore-only tokens, complete session clearing/status, every S5 redaction key
  and release debug suppression.
- Data boundary: bare/enveloped equivalence and endpoint/path-aware contract failure.
- Catalogue: captured recursive mapper fixture, MSW repository integration, category debug rendering,
  and the live mock DTO contract.

## Verification

```text
npm run verify
  TypeScript                 pass
  ESLint                     pass, zero warnings
  Prettier                   pass
  dependency-cruiser         pass, zero violations/cycles
  Jest                       pass, 30 suites / 122 tests

npm run test:coverage -- --runInBand
  Domain/mapper executable coverage  100% statements / branches / functions / lines

npm run test:contract
  GET /categories/tree      pass against live Express/JSON Server mock

npx expo export --platform ios --platform android
  iOS bundle                pass, 1007 modules / 3.31 MB Hermes bytecode
  Android bundle            pass, 1005 modules / 3.32 MB Hermes bytecode

Production construction grep
  Repository implementations constructed only in src/app/di/container.ts
  Presentation imports from data/infrastructure: none
```

## Acceptance criteria

| Criterion | Status | Evidence                                                                                                    |
| --------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| AC4.1     | Pass   | Money tests prove exact baisa arithmetic, half-up edges, negatives and comparison.                          |
| AC4.2     | Pass   | Table-driven tests cover 400, 401, 403, 404, 409, 418, 422 and 5xx plus network/timeout failures.           |
| AC4.3     | Pass   | Adapter tests assert bearer presence with a session and absence without one.                                |
| AC4.4     | Pass   | Three simultaneous 401s produce exactly one refresh request and all retry successfully.                     |
| AC4.5     | Pass   | Failed refresh deletes both secure keys once and sets status to `unauthenticated`.                          |
| AC4.6     | Pass   | Storage tests find both tokens in the secure fake and neither key in the AsyncStorage fake.                 |
| AC4.7     | Pass   | Logger tests prove all S5 secret values and bearer credentials are absent at the sink.                      |
| AC4.8     | Pass   | Malformed `id` produces a `ContractError` containing `/categories/tree`, `id` and its correlation id.       |
| AC4.9     | Pass   | Component and MSW integration tests cover UI → domain port → repository → mapper → validated HTTP response. |
| AC4.10    | Pass   | ESLint/dependency-cruiser pass; direct presentation import grep returns no data/infrastructure edges.       |
| AC4.11    | Pass   | Production grep finds the repository implementation constructor only in `container.ts`.                     |
| AC4.12    | Pass   | Dedicated live contract command validates the actual Phase 3 host response.                                 |
| AC4.13    | Pass   | The same schema test returns identical DTOs for bare and wrapped payloads.                                  |
| AC4.14    | Pass   | Adapter records `attempt-1`, `attempt-1`, then `attempt-2` across retry/fresh requests.                     |

## Known issues and remaining risks

- Physical-device SecureStore persistence and the development diagnostic were bundle-verified but not
  exercised on an iOS simulator, Android emulator or review phone on this machine.
- The category schema is the first contract schema by design. Later feature phases add their DTOs to
  the same harness as each vertical slice is implemented.
- The ignored local `.env.development` was updated to port 3001 in this workspace; clean checkouts get
  the same value from the committed `.env.example`.

## Handoff

Phase 5 can build identity, session restoration and navigation on the established token store,
single-flight refresh path, query provider and dependency container. The category diagnostic remains
behind the development flag and the Phase 2 component gallery is still reachable from the same tool
switcher.
