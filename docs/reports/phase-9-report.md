# Phase 9 — Account, orders and addresses · Completion report

**Date:** 2026-09-04 · **Status:** Implemented; automated acceptance green; physical AR/EN visual sign-off pending

**Plan:** [`../plan.md`](../plan.md) Phase 9 · **Architecture:** [`../architecture.md`](../architecture.md)

## What was implemented

- An **addresses domain slice**: the `Address` entity with its `City` value object and
  `AddressDraft`/`AddressInput` pair, the `AddressRepository` port, and `SaveAddressUseCase`,
  `SetDefaultAddressUseCase` and `DeleteAddressUseCase`. The entity is exactly what the UI
  collects — label, recipient name, phone, details and city — so nothing visible is lost against an
  API that has fields for neither the label nor the area (D13).
- **Orders domain completed**: `orderTimeline` maps a status onto the prototype's four steps,
  `ReturnReason` names the five fixed reasons, and `GetOrdersUseCase`, `GetOrderDetailUseCase` and
  `RequestReturnUseCase` join the existing `PlaceOrderUseCase`. BR8 lives in the return use case,
  which re-reads the order rather than trusting the status the screen was holding.
- **Identity extended** with `UpdateProfileUseCase` and an `AccountMetricsRepository` port for the
  wallet balance, ticket count and return count the account hub's rows show.
- **Data layer** for all of it: address DTO/schema/mapper/data source/repository over the real
  `/users/me/addresses` contract, paged `GET /orders`, `POST /returns` on the real contract (D19),
  `PUT /users/me`, and an account-metrics data source that reads three counters in one port.
- **Six screens**, each matched to `design-reference/BRANDHUB App.dc.html`: the account hub
  (profile header with masked phone, three stats, the prototype's nine rows with live counts,
  language switch, sign-out), the orders list (status pills, paging), order detail (vertical
  four-step timeline, delivery-OTP panel, item rows, shipping address, totals, return and support
  actions), the return form (five reason radios, note, submit), the addresses list (default ring
  and badge, edit / set-default / delete with confirmation) and the address form (create and edit,
  city select driven by `/areas`).
- **Language persistence**: the chosen locale is stored through the existing key-value port and
  read back before the root component registers, so a direction change survives the restart it
  requires (AC9.18).
- **Navigation**: the eight account-stack routes are wired to real screens in place of the Phase 5
  placeholder, order detail hands the order to Support, and the tab bar hides on all of them.

## Architectural decisions

1. **BR7 is a statement about the list, so the use case returns the list.**
   `SetDefaultAddressUseCase` calls `setDefault`, re-reads, and normalises exclusivity locally
   before handing the list back. The screen writes that straight into the cache, so it can never
   render two default badges while a refetch is in flight — and the rule has a direct unit test
   that does not depend on the server behaving.
2. **The address label rides in `addressLine2` behind a namespaced marker.** The API has no field
   for it and D13 forbids losing it. Free text already in that field is read back as part of
   `details`, so a seeded record round-trips its content rather than being silently overwritten.
   The marker and `labelOf` are the only two things to delete when the backend adds a real field.
3. **The city select is driven by `/areas`.** Address-to-area resolution stays the single mapper
   §34.4 requires, but an address the app itself saved now always matches an area _by name_, so the
   delivery price is exact rather than approximate. The governorate arm only covers records created
   elsewhere.
4. **`resolveAddressArea` prefers a name match over a governorate match across the whole list.**
   The previous field-by-field scan handed a Muscat address to Seeb's price, because Seeb's
   governorate is Muscat and Seeb is listed first. Found by the mapper test; fixed in the resolver,
   which checkout shares.
5. **The account hub names a destination, the navigator decides what it means.** Eight rows are
   screens in the account stack; `Following` is the influencers tab. Keeping the mapping in
   `AppNavigator` let the screen keep the prototype's nine rows without inventing a route.
6. **The language switch is injected.** `changeLanguage` lives in `@infrastructure/i18n`, which
   presentation may not import (DR2), so the screen takes an `onChangeLanguage` callback and the
   composition root supplies it.
7. **The delivery OTP is shown only while it is still usable.** A delivered or cancelled order
   keeps its code in the payload but has no use for it, and a spent code on screen is only a
   disclosure. It is never logged and never auto-copied.

## Tests added

- **Domain — addresses (9):** Omani phone rejection before the port is touched, blank
  name/details/city, BR7 first-address-becomes-default, trimming and normalisation, edit updating
  in place without demoting the default, BR7 exclusivity after a set-default, delete delegation.
- **Domain — orders (12 new):** the timeline for every status including `CANCELLED`/`UNKNOWN`
  completing nothing, BR8 refusal for a non-delivered order, AC9.10 missing-reason block, a valid
  submission's arguments, and the default page request.
- **Domain — identity (5 new):** profile validation for names, email and phone, and the normalised
  payload that reaches the port.
- **Data (11):** address mapper field-by-field, label fallback, a seeded second line surviving as
  details, area resolution by name and by governorate, `null` rather than a guess, the D13 payload
  omitting `state`/`postalCode`, and a full save→list round trip; plus the orders repository paging,
  mapping page content, reporting a contract mismatch as a failed result, surfacing a 404, and
  turning the five reasons into free text with and without a note.
- **Presentation (28):** the return form (block, five radios, submitted arguments, failure), the
  addresses screen (one default, the badge moving, delete asking first and deleting only on
  confirm, edit target, empty state), the address form (phone and city validation, `/areas` as the
  city options, create, edit pre-fill), the orders screen (pills and totals, open, empty, paging,
  retry), order detail (timeline/totals/address, the OTP for four statuses, no panel without a
  code, return only when delivered, support, not-found), the account hub (masked phone, nine rows,
  live counts, stats, navigation, language and sign-out) and the profile screen.
- **Contract (5):** BR7 exclusivity server-side, the D13 address shape through create/update/delete,
  paged orders carrying the delivery OTP, a return accepted as free text and rejected for an
  unknown order, and `PUT /users/me`.
- **Navigation:** the tab-bar rule now asserts every account-stack route stands the bar down while
  the hub itself keeps it.

## Verification

```text
npm run typecheck                 pass
npm run lint                      pass, zero warnings
npm run format:check              pass
npm run boundaries                pass, zero violations/cycles, 299 modules
npm test                          67 suites, 301 tests, all passing
```

## Acceptance criteria

| Criterion | Status                               | Evidence                                                                                                                                                            |
| --------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC9.1     | Pass                                 | `maskPhone` keeps the country code and last two digits; screen test asserts the name and the mask, with the email as fallback.                                      |
| AC9.2     | Pass                                 | Nine rows in the prototype's order; counts for orders, wishlist, addresses, wallet and tickets, each absent until loaded.                                           |
| AC9.3     | Pass                                 | Row press calls `onNavigate` with its destination; the navigator maps eight to stack screens and `Following` to its tab.                                            |
| AC9.4     | Pass                                 | Orders test asserts number, status pill and total per card; delivered uses the success tint, cancelled the danger tint.                                             |
| AC9.5     | Pass                                 | Empty list renders the drafted empty state.                                                                                                                         |
| AC9.6     | Pass                                 | `orderTimeline` unit-tested for every status; the screen renders four steps with the reached ones complete.                                                         |
| AC9.7     | Pass                                 | Panel appears only when `deliveryOtp` is present and the order is neither delivered nor cancelled; hint shown alongside.                                            |
| AC9.8     | Pass                                 | Detail renders subtotal, VAT, shipping, payment fee, discount, payment status and paid total from the order.                                                        |
| AC9.9     | Pass                                 | Return action rendered only for `DELIVERED`; BR8 also enforced in the use case against a re-read order.                                                             |
| AC9.10    | Pass                                 | Submit with no reason is blocked in the use case and surfaced as an inline message; the port is never called.                                                       |
| AC9.11    | Pass                                 | Reason and note reach `POST /returns` as one free-text string; toast shown, then back to Orders.                                                                    |
| AC9.12    | Pass                                 | Detail's support action navigates to `Support` with the order id.                                                                                                   |
| AC9.13    | Pass                                 | Domain test proves exactly one default survives; screen test proves the badge moves; contract test proves the server agrees.                                        |
| AC9.14    | Pass                                 | Create invalidates both the addresses and the checkout-addresses caches, so a new address is selectable at checkout.                                                |
| AC9.15    | Pass                                 | Edit mode pre-fills from the record and calls `update` with the same id; `create` is never called.                                                                  |
| AC9.16    | Pass                                 | Delete opens a confirmation dialog; the port is called only after confirming, and cancelling deletes nothing.                                                       |
| AC9.17    | Pass                                 | Save hands the new session to the store before popping, so the account header reads the updated name.                                                               |
| AC9.18    | Implemented; manual sign-off pending | Locale persisted through the key-value port and applied before registration; the direction prompt is covered by `rtl.ts`, but the restart itself is a device check. |
| AC9.19    | Pass                                 | Sign-out clears the session and query cache and resets the root to Onboarding (unchanged from Phase 5, re-wired here).                                              |
| AC9.20    | Implemented; manual sign-off pending | All copy is in both languages and every screen uses logical layout properties, enforced by lint; physical comparison pending.                                       |
| AC9.21    | Pass                                 | Mapper and repository tests round-trip label, name, phone, details and city, and assert `country: 'OM'` with `state` and `postalCode` absent.                       |

## Known issues and remaining risks

- **The address label and the shipping area are still workarounds, not contract.** Both are
  contained — one marker in `addressMapper`, one function in `checkoutMapper` — and both are
  covered by tests that will fail loudly when the backend adds real fields. They remain part of
  FA1.
- **The third account stat is "under review", not "points".** The prototype's third stat is a
  loyalty-points figure, and there is no points concept anywhere in the domain or the API. Returns
  under review is order-adjacent and has real data behind it. If product wants points, it needs a
  contract first.
- **The address form keeps a label selector the plan's task list did not name.** AC9.21 requires
  the label to round-trip and the addresses list shows it as the card's heading, so it has to be
  collected somewhere. It is a three-option segmented control above the name field.
- **Component tests must not leave work in flight.** This repo's renderer does not enable React's
  act environment, so a test that ends with an unawaited `fireEvent.press` lets its cleanup race
  the next test's mount and unmount it. Every press in the Phase 9 screen tests is awaited, and
  `AccountScreen.test.tsx` carries a comment saying why. Enabling `IS_REACT_ACT_ENVIRONMENT`
  globally was tried and made things worse (overlapping `act` calls); it is a suite-wide change
  that belongs in Phase 13, not here.
- **No device-driving E2E harness**, unchanged from Phase 8. The after-sales journey is wired and
  covered at the domain, data, screen and contract boundaries, but the physical run is still
  recommended before release.
- **Final side-by-side Arabic/English approval on physical hardware remains a human check.** The
  six screens were built against the prototype's declared measurements; this report does not claim
  a visual comparison that was not performed.

## Handoff

Phase 10 can reuse `AccountMetricsRepository` for the wallet balance it already reads, the
`Wallet` and `Gifts` routes already present in the account stack, and the `StatusPill`/totals
patterns from order detail. Phase 12 can reuse the `Support` route's `orderId` parameter, which
order detail already passes. The address slice is complete: checkout's minimal Phase 8 create path
can now be replaced with a link into `AddressForm` whenever that is wanted.
