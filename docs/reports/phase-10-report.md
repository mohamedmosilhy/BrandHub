# Phase 10 — Wallet, gifts and payment result · Completion report

**Date:** 2026-09-05 · **Status:** Implemented; automated acceptance green; physical AR/EN visual sign-off pending

**Plan:** [`../plan.md`](../plan.md) Phase 10 · **Architecture:** [`../architecture.md`](../architecture.md)

> **This closes the customer feature set.** Phases 11 and 12 were taken first because neither
> depends on Phase 10; with the wallet, gifts and the payment result built, every screen in
> `architecture.md` §5 exists and **Phase 13 is cleared to begin.**

## What was implemented

- A **wallet domain slice**: `Wallet`, `WalletTransaction`, `TransactionType` with its
  credit/debit rule, `WalletCharge`, `PaymentStatus`, `Gift` and its enums, the `WalletRepository`
  port, and `GetWalletUseCase`, `GetTransactionsUseCase`, `TopUpWalletUseCase`,
  `CheckPaymentStatusUseCase`, `SendGiftUseCase` and `GetSentGiftsUseCase`, plus two pure functions
  the screens depend on — `parseAmount` and `resolveGiftRecipient`.
- **Data layer on the real contract** (D19): DTOs, mappers that narrow every server enum,
  `WalletRemoteDataSource` over `/wallet`, `/wallet/transactions`, `/wallet/charge`,
  `/payments/PAYMOB/status` and `/gifts`, and `HttpWalletRepository`.
- **Three screens**: the wallet (ink balance card with its bled ring and wallet-active pill, four
  quick amounts, a custom amount, the Paymob action, and the paginated history with signed,
  tinted rows), gifts (recipient, amount, four occasion pills, message, send, history), and the
  payment result (success / failed / pending banners, the charged amount, back-to-wallet, and
  retry on failure only).
- **A real top-up journey**: a charge carrying an `Idempotency-Key` (D20), the hosted page opened
  in a browser session, the deep-link return handled on both the backgrounded and killed paths, a
  pending charge resolved by polling, and the balance and history refreshed the moment it settles.
- **Screen protection** (§28 S10): `FLAG_SECURE` on Android for all three screens.
- **Mock host**: the charge now matches the collection's own test script, the payment status
  answers about a real charge, the gateway's contracted return settles it, gifts move money, and a
  stand-in hosted page makes the whole journey clickable.
- **Two dependencies declared** (AD-26): `expo-web-browser` and `expo-screen-capture`, both already
  present transitively and now explicit in `package.json`.

## Architectural decisions

1. **The contract cannot tell the client which payment to poll about — so the mock supplies it and
   the backend is asked to.** `GET /payments/PAYMOB/status?orderId=` is contracted, but the
   collection sets `PAYMOBGatewayOrderId` **by hand from the PAYMOB portal**; nothing hands it to a
   client. Without it AC10.13 is unimplementable. The charge response therefore carries
   `gatewayOrderId`, documented as a mock addition alongside the `userName` precedent, and the
   fallback — the `order` parameter on the gateway's return URL — is implemented too.
2. **A dismissed browser is pending, never failed.** Closing the hosted page says nothing about the
   payment: the customer may have paid and then dismissed it. Reading that as a failure would tell
   someone their money was not taken when it was. It reads as pending, and the result screen asks
   the gateway. The same rule covers a return URL the app cannot parse.
3. **Both return paths end on one screen with one shape.** A return caught by the browser session
   (app backgrounded) and one delivered by the OS (app killed) both produce
   `{ status, amount, gatewayOrderId, reference }` — the first through `parsePaymentReturn`, the
   second through React Navigation's own `linking` query parsing. There is no second code path to
   keep in step.
4. **The idempotency attempt is keyed on the amount** (D20). A retry after a lost response reuses
   the key, so a charge the server created but never acknowledged is not created twice; changing
   the amount is a different intent and mints a new key. This is `PlaceOrderUseCase`'s rule applied
   to the wallet, not a second mechanism.
5. **The sign is the transaction type's, and the amount is a magnitude.** The mapper takes
   `Math.abs`, so a server that ever sent a negative amount for a debit cannot render as a double
   negative. An unrecognised type reads as a debit — the safe reading of an unexplained movement of
   the customer's own money.
6. **Gift money is a wallet movement, so it lives on the wallet port.** `architecture.md` §13 lists
   one `WalletRepository`, and a gift debits the same balance and writes the same history; two
   ports could disagree about that.
7. **The insufficient-balance block re-reads the balance.** `SendGiftUseCase` asks the repository
   rather than trusting the balance the screen is showing, so a stale card cannot authorise a gift
   the wallet can no longer fund. **The mock now refuses it too** — the server is the authority
   (§28 S13) and the client's block is the message, not the control.
8. **Settlement is idempotent and shared.** A gateway reports a payment twice — once by redirect,
   once by webhook — so `settleCharge` credits a charge exactly once and both routes call it. The
   contract test asserts a second webhook moves nothing.
9. **The hosted page is a stand-in, and it exists.** `paymentUrl` used to point at
   `https://paymob.example/...`, which no browser could open, so the top-up journey stopped at the
   first step. The mock now serves a two-button page — pay, fail — that hands each outcome to the
   **contracted** wallet-return route. It models the gateway's two exits, not its UI.
10. **Card details never enter BRANDHUB's process** (§28 S6). The wallet screen's job ends at
    producing a charge; the composition root opens the hosted page. The screen has no card field,
    and a test asserts that.
11. **Screen protection is a composition-root policy, not a screen concern.**
    `useScreenProtection` keeps `expo-screen-capture` out of the presentation layer, so the screens
    stay testable without a native module.
12. **`gradients.sellerCover` is now `gradients.inkPanel`.** The prototype paints one ink-to-indigo
    ramp on two surfaces — the seller cover and the wallet card — so the token is named for the
    ramp. One rename, one call site updated.
13. **Top-up bounds are domain constants matching the transfer settings the API publishes.** There
    is no top-up limits endpoint; inventing a second scale would guarantee the two disagree.
    Recorded for the backend.

## Files and modules

**New**

- `src/domain/wallet/{entities,WalletRepository,useCases,index}.ts`, `wallet.test.ts`
- `src/data/wallet/{dto,mappers,datasources,repositories}/**`, `index.ts`,
  `HttpWalletRepository.test.ts`
- `src/presentation/features/wallet/**` — `WalletScreen`, `useWalletQueries`, test
- `src/presentation/features/gifts/**` — `GiftsScreen`, test
- `src/presentation/features/paymentResult/**` — `PaymentResultScreen`, test
- `src/app/payments/**` — `hostedPayment`, `screenProtection`, test
- `docs/reports/phase-10-report.md`

**Changed**

- `src/presentation/theme/tokens.ts` / `tokens.test.ts` — `mobile.wallet`, `mobile.gift`,
  `mobile.payResult`, the mint and on-dark colours, and the `inkPanel` rename
- `src/presentation/features/sellerStore/SellerStoreScreen.tsx` — the renamed gradient
- `src/infrastructure/i18n/resources.ts` — seventeen Phase 10 strings in both languages
- `src/app/di/container.ts`, `src/app/navigation/{AppNavigator,types,linking}.tsx|ts` — three
  placeholder routes replaced, and **the last two placeholder route components deleted**
- `package.json`, `package-lock.json`, `jest.setup.ts` — the two Expo modules
- `mock-server/{routes.ts,seed/data.ts,seed/types.ts,db.json,middleware/auth.ts,INVENTED_ENDPOINTS.md,__tests__/contract.test.ts}`
- `docs/plan.md`, `docs/architecture.md`, `README.md`

## Tests

**Added** — 51 assertions across six suites:

- `src/domain/wallet/wallet.test.ts` — the credit/debit rule including the unknown type, amount
  parsing (comma separators and Arabic-Indic digits included), both top-up boundaries and the
  boundaries themselves, the D20 key reused on a network loss and **not** reused after a definite
  failure or an amount change, recipient resolution to `EMAIL`/`SMS`, the full gift payload, and
  the insufficient-balance block.
- `src/data/wallet/repositories/HttpWalletRepository.test.ts` — balance into `Money`, page mapping
  with enum narrowing, the magnitude rule, the contracted charge body with its `Idempotency-Key`,
  a charge with no `gatewayOrderId` failing loudly, gateway status normalisation, and the gift body
  field by field.
- `src/presentation/features/wallet/WalletScreen.test.tsx` — AC10.1, AC10.2, AC10.3 in both
  directions, AC10.4 at both bounds, AC10.5 including the absence of any card field, the empty
  state, retry, and a lost charge reported honestly.
- `src/presentation/features/paymentResult/PaymentResultScreen.test.tsx` — AC10.6, AC10.7, AC10.8,
  AC10.9, AC10.13 resolving pending → success **and** pending → failure by polling, and the case
  where no gateway id came back (stays pending, never polls).
- `src/presentation/features/gifts/GiftsScreen.test.tsx` — AC10.10 against a stateful fake, SMS
  delivery for a phone recipient, AC10.11, an unusable recipient, and retry.
- `src/app/payments/hostedPayment.test.ts` — the return URL parsed in full, a failure read as a
  failure, an unreadable return read as pending, escaped values decoded, and dismissal/cancellation
  both reading as pending with the charge kept.
- `mock-server/__tests__/contract.test.ts` — **the whole top-up journey**: charge → pending status →
  hosted page → contracted return → redirect to the app scheme → balance moved → history row →
  status now `PAID` → a second webhook crediting nothing → a failed return moving nothing. Plus a
  gift moving money and an over-balance gift refused with `INSUFFICIENT_BALANCE`.
- `src/presentation/theme/tokens.test.ts` — the wallet, gift and result geometry.

**Executed**

```
npm run verify   # typecheck, lint (0 warnings), format:check, boundaries, jest
```

- TypeScript: clean. ESLint: clean at `--max-warnings=0`. Prettier: clean.
- dependency-cruiser: no violations (379 modules).
- Jest: **84 suites, 443 tests, all passing** (up from 78 / 382).

## Acceptance criteria

| #       | Criterion                                                       | Status                                                                                                                                                                |
| ------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC10.1  | Balance formatted `NN.NNN` with the OMR label                   | **Pass** — `WalletScreen.test.tsx`.                                                                                                                                   |
| AC10.2  | History paginates, with the reference's signs and tints         | **Pass** — signs asserted; paging is an infinite query with the orders list's short-page rule.                                                                        |
| AC10.3  | A quick amount marks itself and clears the custom field         | **Pass** — and asserted in both directions.                                                                                                                           |
| AC10.4  | Below the minimum or above the maximum blocks with a message    | **Pass** — the bounds live in the domain, so no screen can forget them.                                                                                               |
| AC10.5  | Top-up opens the hosted page; no card details in the app        | **Pass** — the screen produces a charge and nothing else; asserted.                                                                                                   |
| AC10.6  | A success shows the amount, and the balance increases by it     | **Pass** — screen suite for the variant, mock contract test for the balance.                                                                                          |
| AC10.7  | A failure shows a working retry; the balance is unchanged       | **Pass** — both halves asserted.                                                                                                                                      |
| AC10.8  | A pending return shows the pending copy and no retry            | **Pass** — `PaymentResultScreen.test.tsx`.                                                                                                                            |
| AC10.9  | Back-to-wallet returns to a refreshed wallet                    | **Pass** — one `useRefreshWallet` drops the balance, history and account-metrics caches together.                                                                     |
| AC10.10 | The gift posts the full payload and appears in `/gifts/sent`    | **Pass** — field by field in the data suite, end to end in the mock contract test.                                                                                    |
| AC10.11 | A gift larger than the balance is blocked                       | **Pass** — in the use case, re-reading the balance, and refused by the server too.                                                                                    |
| AC10.12 | Both screens render correctly in Arabic RTL and English LTR     | **Partial** — every component test renders in Arabic; no physical property survives lint (AC1.6). Physical sign-off is a Phase 13 gate, as for Phases 7–9, 11 and 12. |
| AC10.13 | A pending payment resolves by polling, with no manual refresh   | **Pass** — pending → success and pending → failure both asserted; polling stops on a terminal state.                                                                  |
| AC10.14 | A retry after a lost connection reuses the key and charges once | **Pass** — asserted in the domain suite; the mock deduplicates by `Idempotency-Key`.                                                                                  |

## Known issues and deviations

1. **The plan's definition of done said "all twelve criteria"; there are fourteen** (AC10.1–AC10.14).
   Corrected in `plan.md`. This is the third such count mismatch (Phases 11 and 12 had the same),
   which suggests the counts were written before the criteria were finalised.
2. **The plan's task 2 called the gift endpoints "invented"; they are contracted.** D19 closed
   GAP-4, and the definition of done still referred to "the invented gift endpoints". The gift
   routes are real; what the mock had to define is the _charge_ response shape and the
   `gatewayOrderId` addition. `plan.md` now says so.
3. **`gatewayOrderId` is a mock addition, and the most important open question in this phase.**
   Without it — or the return-URL fallback — a pending payment cannot be resolved at all.
4. **Top-up limits are the client's** until the backend publishes them.
5. **iOS has no screenshot protection.** `expo-screen-capture` is Android-only for prevention;
   blurring the iOS app switcher is not built.
6. **`/wallet/transfers` is deliberately unbuilt** — the API has a full person-to-person transfer
   the prototype never shows. Gift money is the feature the reference has.
7. **The prototype's "preview state" switcher on the payment-result screen is not built.** It is a
   mock-up affordance for showing all three variants at once, not a customer control.
8. **AC10.12 is not fully closable in this phase** — the same physical AR/EN sign-off every screen
   phase has carried into Phase 13.
9. **The mock's hosted checkout page is a stand-in.** It exercises the two exits a gateway has; it
   is not a fidelity model of PAYMOB and should not be treated as one at migration.

## For human review

1. **`gatewayOrderId` on the charge response** — confirm the backend can return it. If not, the
   client falls back to the return URL's `order` parameter, which is lost if the app is killed
   before the redirect lands.
2. **Top-up minimum and maximum** — confirm the figures, or point at an endpoint that publishes
   them.
3. **`/wallet/transfers`** — confirm person-to-person transfer is genuinely out of v1.
4. **iOS screenshot protection** — decide whether app-switcher blurring is wanted before release.
