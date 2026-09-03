# Phase 3 — Mock backend and API contract · Completion report

**Date:** 2026-09-03 · **Status:** Implemented; automated acceptance green
**Plan:** [`../plan.md`](../plan.md) Phase 3 · **Architecture:** [`../architecture.md`](../architecture.md)

## What was implemented

- An Express contract adapter on port 3001 with JSON Server mounted beneath `/api/v1` as its
  persistence fallback. App-facing handlers use the real route names, zero-based pagination, auth
  behavior, response envelopes and error statuses.
- A deterministic generator and committed database containing 220 bilingual products with variants,
  images, five specifications, ratings and review counts across all eight nested categories; six
  influencers and posts; four orders; three addresses and support threads; wallet, review,
  notification, coupon, wishlist, Omani area and shipping data.
- Fake signed bearer access and refresh tokens, a five-minute access lifetime, protected-route
  enforcement, refresh exchange, logout revocation, registration conflicts and the remaining auth
  flows.
- All customer routes in `architecture.md` §3.4, including cart joins, BR3 order totals, order cart
  clearing, wallet deduction/refund, category trees, search, sellers and images, profile and
  addresses, wishlist, reviews, notifications, support messages and attachments, returns, wallet
  operations and transfers, gifts,
  delivery OTP confirmation, areas, shipping rates and PAYMOB status.
- Idempotency persistence for order placement, wallet charging and wallet transfers. A retry with the
  same key returns the original response and makes no second business record.
- `Accept-Language` response localization that resolves internal `{ ar, en }` catalogue values into a
  single field, while search matches both stored languages.
- Global 120 ms default latency plus per-request latency, status, timeout, network-disconnect and
  empty-response injection.
- Exact proposed contracts for only the three uncontracted areas in
  [`INVENTED_ENDPOINTS.md`](../../mock-server/INVENTED_ENDPOINTS.md): social commerce, delivery slots/
  express, and phone OTP.

## Architectural decisions

1. JSON Server remains mounted last as a development persistence fallback; explicit Express handlers
   own the app contract so JSON Server query syntax and envelopes cannot leak into client DTOs.
2. Mutations write through to `db.json`, making reset behavior deterministic while preserving state
   across mock restarts during a development session.
3. Newer feature families use `{ success, data }`; established catalogue, cart, order and wallet
   routes deliberately remain bare, exercising D22 rather than hiding the mixed upstream contract.
4. Fault injection runs after authentication. It can exercise every authorized API route without
   allowing `x-mock-empty` to bypass protection.

## Tests added

`mock-server/__tests__/contract.test.ts` covers catalogue pagination and metadata, Arabic/English
resolution and search, nested category integrity, data-driven Omani areas, bearer enforcement, login,
refresh and expiry, all fault states except the intentionally socket-closing network case, observable
default latency, BR3 totals, delivery OTP, cart clearing, all three idempotent operations, every
customer read route, contracted feature mutations, and all three invented areas.

## Verification

```text
npm run verify
  TypeScript                 pass
  ESLint                     pass, zero warnings
  Prettier                   pass
  dependency-cruiser         pass, zero violations/cycles
  Jest                       pass, 17 suites / 80 tests

npm run mock
  Bind                       pass, 0.0.0.0:3001 (not Metro's 8081)
  GET /api/v1/products       200, 120 ms default latency observed
  Seed                       220 products; rating metadata present
```

## Acceptance criteria

| Criterion | Status | Evidence                                                                                                     |
| --------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| AC3.1     | Pass   | One-command server startup and live product smoke request succeeded.                                         |
| AC3.2     | Pass   | Inventory test covers every §3.4 read family; mutation tests cover every declared behavior and verb family.  |
| AC3.3     | Pass   | Page tests assert `content` and all six Spring metadata fields.                                              |
| AC3.4     | Pass   | Cart and profile return 401 without a bearer token.                                                          |
| AC3.5     | Pass   | Login test asserts access token, refresh token and customer id.                                              |
| AC3.6     | Pass   | Refresh success, invalid token, expired token and logout revocation are tested.                              |
| AC3.7     | Pass   | Arabic `سماعات` and English `headphones` searches return matching products only.                             |
| AC3.8     | Pass   | Tree test finds eight ids, nesting and a valid category for all 220 products.                                |
| AC3.9     | Pass   | Status, empty and timeout injection are tested; network injection closes the request socket by construction. |
| AC3.10    | Pass   | Runtime smoke measured 137 ms with the 120 ms default.                                                       |
| AC3.11    | Pass   | Invented document contains exactly social commerce, delivery slots/express and phone OTP.                    |
| AC3.12    | Pass   | Deterministic seed and contract test assert 220 products across eight categories.                            |
| AC3.13    | Pass   | All 17 suites and 80 tests pass.                                                                             |
| AC3.14    | Pass   | Detail and search tests assert one resolved string in each locale.                                           |
| AC3.15    | Pass   | Every product-card result is asserted to carry `averageRating` and `reviewCount`.                            |
| AC3.16    | Pass   | `/areas` exposes the three economics fields directly from generated database records.                        |
| AC3.17    | Pass   | Phone challenge and verification routes are tested and documented.                                           |
| AC3.18    | Pass   | Ticket create/list/detail/message/attachment handlers and `ticketNumber` are tested.                         |
| AC3.19    | Pass   | Return payload and order `deliveryOtp` are tested, including successful delivery confirmation.               |
| AC3.20    | Pass   | Full OMR gift creation plus sent/received/claim/cancel routes respond.                                       |
| AC3.21    | Pass   | Repeated order, charge and transfer keys return the first result; record counts remain singular.             |
| AC3.22    | Pass   | Products answer bare while areas and newer feature families answer `{ success, data }`.                      |
| AC3.23    | Pass   | Mock binds to 3001; Metro remains free to use 8081.                                                          |

## Known issues and remaining risks

- The mock dependencies are development-only. JSON Server 0.17 is intentionally used because it
  exposes the embeddable Express router required by D2; npm reports transitive development audit
  findings that are not shipped in the mobile bundle.
- The authoritative Postman collection contains no saved example responses. Field names are derived
  from its request bodies, scripts, documented conventions and architecture inventory; Phase 4's Zod
  contract fixtures remain the point where any real-backend drift will be isolated.
- Physical-device LAN access was documented and the server binds all interfaces, but a phone/firewall
  smoke test was not available on this machine.

## Handoff

Phase 4 can start. The mock contract, mixed envelopes, bearer flow, localization and deterministic
fault controls are stable inputs for the HTTP client, DTO schemas and repository implementations.
