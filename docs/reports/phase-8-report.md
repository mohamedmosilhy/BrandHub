# Phase 8 — Cart and checkout · Completion report

**Date:** 2026-09-04 · **Status:** Implemented; automated acceptance green; physical AR/EN visual sign-off pending

**Plan:** [`../plan.md`](../plan.md) Phase 8 · **Architecture:** [`../architecture.md`](../architecture.md)

## What was implemented

- Cart, checkout and order domain slices with immutable `Cart`, `CartLine`, `Quantity`,
  `CheckoutDraft`, `PaymentMethod`, `ShippingArea`, `Coupon` and `Order` entities; repository ports;
  add/update/remove, exact totals, coupon and idempotent place-order use cases.
- One `CalculateCartTotalsUseCase` for cart and checkout. It uses integer `Money` arithmetic for
  subtotal, VAT rounded half-up at 5%, area shipping/free threshold, payment fee and capped coupon
  discount, implementing BR1–BR3, BR13, D10 and D21 once.
- Strict cart, checkout and order DTO schemas, mappers, remote data sources and repositories.
  Guest cart storage uses the existing key-value port; authenticated carts use HTTP.
- A session-aware repository that keeps cart operations available to guests, persists them across
  the sign-in detour, and merges guest lines into the server cart once authentication succeeds.
- A live `CartProvider` above navigation. The PDP adds the resolved variant, buy-now adds before
  checkout, quantity changes are optimistic with rollback, removal updates immediately, and the
  tab badge always reads the same cart cache.
- The cart screen from the reference: live free-delivery notice, 78 pt product rows, 26–28 pt
  stepper, inline removal, promo entry, shared totals, empty discovery action and checkout CTA.
- The checkout screen: three-step indicator, selectable saved addresses, an inline address form
  for first-time users, live area delivery estimate/cost, all four payment methods, shared totals,
  inline failure messages, and a submission lock plus loading state that prevents double orders.
- The confirmation screen: brand-gradient success hero, real order number, four-stage tracking
  timeline with the first two complete, courier card and continue-shopping reset to Home.
- Mock-server stock enforcement on add, update and place-order. Conflicts are HTTP 409 with the
  affected product and available quantity; successful orders decrement variant stock and clear the
  cart. Existing idempotency storage returns the same order for a repeated key.

## Architectural decisions

1. **The cart provider is session-neutral.** It is mounted above navigation and reads a
   `SessionAwareCartRepository`, so D3 does not need a public server cart endpoint or a parallel
   presentation model.
2. **Guest merge is line-by-line and recoverable.** A local line is removed only after its remote
   add succeeds. An interrupted merge leaves the unconfirmed line locally for a later retry.
3. **One totals implementation feeds both screens.** Presentation never performs money
   arithmetic. The cart resolves the shell's Al Khoud location to Seeb; checkout resolves the
   selected address's area.
4. **Idempotency belongs to the user intent.** `PlaceOrderUseCase` retains its key only across
   transport failures for the same cart/draft fingerprint, then clears it after a conclusive
   response. A synchronous screen lock prevents two concurrent calls before React rerenders.
5. **First-address capture stays inside checkout.** Phase 9 still owns full address management;
   Phase 8 supplies only the minimum create path required to complete checkout with no saved
   address.

## Tests added

- Domain: exact subtotal across a varied line set, quantity validation, stock bounds, BR4 removal,
  VAT/shipping/COD/coupon totals, the free-delivery boundary, coupon minimums, BR5 empty-cart
  rejection and idempotency-key reuse after a network failure.
- Data: authenticated guest-cart merge transfers the line and removes it locally only after the
  remote write.
- Presentation: quantity changes appear optimistically and restore the previous server snapshot
  when the mutation fails.
- Contract: unavailable quantity returns product-specific 409 data and leaves the cart unchanged;
  the existing place-order contract proves exact BR3 totals, one order for a repeated key and cart
  clearing.

## Verification

```text
npm run typecheck                 pass
npm run lint                      pass, zero warnings
npm run format:check              pass
npm run boundaries                pass, zero violations/cycles, 273 modules
npm test -- --runInBand --forceExit
                                  pass, 56 suites / 211 tests
npx expo export --platform ios --platform android
                                  pass, iOS and Android bundles
npx @21st-dev/cli review <Phase 8 UI paths>
                                  pass, 11 files / 0 findings
```

The initial 21st component search returned HTTP 401, so no external catalogue component was
pulled. The final review command succeeded; the implementation uses the project's existing
`Screen`, `Button`, `Input`, `Pressable`, `Text`, `Image`, feedback and theme primitives.

## Acceptance criteria

| Criterion | Status                               | Evidence                                                                                                                         |
| --------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| AC8.1–8.5 | Pass                                 | PDP writes the shared cart; badge, merge/add behavior, optimistic stepper, zero-removal and empty recovery all use that cache.   |
| AC8.6–8.8 | Pass                                 | Domain tests assert varied exact subtotal, 5% half-up VAT and BR3 with shipping, COD and discount.                               |
| AC8.9     | Pass                                 | Hint reads `minOrderAmount` from `/areas` and renders the exact remaining `Money`.                                               |
| AC8.10    | Pass                                 | Coupon validation changes shared coupon state only on success and renders inline success/error.                                  |
| AC8.11    | Pass                                 | Existing `RequireAuth` return target restores Checkout; the cart provider survives above navigation.                             |
| AC8.12    | Pass                                 | No-address state renders the minimal create form, saves through the address contract and selects the new record.                 |
| AC8.13–14 | Pass                                 | Selected address resolves area cost/days; payment selection marks the card and recomputes the shared totals.                     |
| AC8.15    | Pass                                 | A synchronous lock and loading/disabled button prevent concurrent place-order calls.                                             |
| AC8.16–20 | Pass                                 | Success clears the cache/badge, opens real-order confirmation, shows two complete of four stages, and resets to Home.            |
| AC8.17    | Pass                                 | Mock 409 carries product name/stock; checkout renders it and retains the cart.                                                   |
| AC8.18    | Pass                                 | Network copy offers safe retry; use-case test proves the same key is reused and contract proves duplicate keys create one order. |
| AC8.21    | Implemented; manual sign-off pending | Copy exists in Arabic/English, logical-direction layout is used, and both platform bundles pass.                                 |
| AC8.22–23 | Pass                                 | Guest repository test proves merge semantics; both screens call the same totals use case.                                        |

## Known issues and remaining risks

- Final side-by-side Arabic/English approval on physical iOS and Android hardware remains a human
  check. The screens were matched to the prototype's declared measurements and passed 21st review,
  but this report does not claim a visual comparison that was not performed.
- The automated suite has no device-driving Expo E2E harness. The complete path is wired and its
  domain, provider, navigation and HTTP boundaries are covered separately; a physical full-flow
  smoke test is still recommended before release.
- Payment-declined handling is implemented for the real `PAYMENT_DECLINED` code. The normal mock
  checkout path intentionally succeeds; the generic mock fault middleware remains available for
  failure exercises.

## Handoff

Phase 9 can reuse `Order`, `OrderRepository`, `ShippingAddress`, the checkout address repository,
the shared totals card and the existing authenticated order/address contracts. It should expand
the deliberately small first-address form into full create/edit/default/delete management without
moving checkout economics back into presentation.
