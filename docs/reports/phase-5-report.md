# Phase 5 — Identity, session and navigation shell · Completion report

**Date:** 2026-09-03 · **Status:** Implemented; automated acceptance green

**Plan:** [`../plan.md`](../plan.md) Phase 5 · **Architecture:** [`../architecture.md`](../architecture.md)

## What was implemented

- Identity domain entities and value objects for users, sessions, account types, Omani phone
  numbers and normalized email addresses; an `AuthRepository` port and the sign-in, sign-up,
  sign-out, restore, refresh and mock-phone-OTP use cases.
- Zod auth DTOs, DTO-to-domain mappers, an HTTP auth data source and `HttpAuthRepository`.
  Successful customer authentication is stored securely; seller registration returns pending
  approval without tokens or a session.
- A secure local session data source. Access token, refresh token and the restorable user record use
  the SecureStore abstraction; no identity data is written to AsyncStorage.
- A Zustand session store with `loading`, `authenticated` and `guest` states, plus a
  `SessionProvider` that restores the session before hiding the native splash. Failed token refresh
  resets the navigation shell to onboarding.
- A typed React Navigation tree: root native stack, nested auth stack, five bottom-tab stacks and
  modal/transparent-modal groups. Each tab owns and preserves its own stack; pressing the active tab
  pops that stack to its root.
- A centralized `RequireAuth` boundary with typed `returnTo` handling. Product discovery and the
  entire cart remain public; checkout, account and the D3 identity-bound routes redirect to login
  and resume at the requested destination.
- A reusable five-item tab bar with Arabic labels, accent state, Android active pill, iOS tint and
  cart-badge support.
- Reference-aligned onboarding with the supplied hero asset, `+968` phone entry, mock OTP, Apple and
  Google placeholders, email registration entry and guest continuation.
- A bilingual React Hook Form/Zod auth screen with sign-in/sign-up and customer/seller segments,
  conditional name/store and phone fields, localized inline errors, password visibility,
  remember-me, forgot-password, phone and admin affordances, and pending-seller feedback.
- Sign-out cleanup for the remote/local session, query cache and navigation state, plus typed
  `brandhub://` product, category, order, influencer and payment-result links.
- Mock seller registration and fixed-code phone OTP contracts. Pending sellers receive no tokens and
  cannot sign in until an administrator approves them.

## Expo SDK 57 upgrade

The phone runtime constraint changed from SDK 54 to SDK 57, so the application toolchain was moved
as one compatible set:

| Package / setting     | Before                    | Now                                      |
| --------------------- | ------------------------- | ---------------------------------------- |
| Expo                  | 54.0.37                   | 57.0.19                                  |
| React Native          | 0.81.5                    | 0.86.3                                   |
| React                 | 19.1.0                    | 19.2.3                                   |
| TypeScript            | 5.9                       | 6.0.3                                    |
| Jest Expo             | 54.0.18                   | 57.0.5                                   |
| Expo native modules   | SDK 54 family             | SDK 57 family selected by `expo install` |
| iOS deployment target | 15.1                      | 16.4, the SDK 57 minimum                 |
| Android minimum       | API 26                    | API 26, unchanged                        |
| Default Metro target  | custom development client | Expo Go (`npm start`)                    |

React Navigation 7, React Hook Form, the Zod resolver, gesture handler and screens were added for
Phase 5. `npm run start:dev-client` keeps the custom-client workflow available.

## Architectural decisions

1. The auth stack is a real nested navigator rather than two loose root screens. The root remains
   the only navigator that owns main/modal transitions, while auth-local back navigation stays
   inside `AuthStack`.
2. Session restoration and font loading both hold the native splash. There is no intermediate React
   loading screen and therefore no flash of onboarding before a stored session resolves.
3. Seller sign-up cannot call the customer auto-login path. The mock also rejects login for a
   `PENDING_APPROVAL` seller, making BR10 true at the repository and contract boundaries.
4. Phone verification proves number ownership only and enters guest mode. This is explicitly marked
   mock-only because FA1 still lacks a real phone-auth session response.
5. Route params carry identifiers and small navigation intent only. Future feature phases can
   replace shell screens without changing link or navigation contracts.
6. SDK packages are selected by Expo's compatibility resolver. The architecture's D15 iOS floor was
   amended to 16.4 because SDK 57 rejects lower deployment targets.

## Tests added

- Identity value objects, use-case delegation and seller-pending behavior.
- Auth mapper coverage for customer and seller response shapes.
- Repository coverage for sign-in persistence/restart restoration, empty restoration, invalid
  credentials, network errors, customer registration, seller pending, refresh, sign-out and OTP.
- Session-store transitions for restore, authentication, guest entry and onboarding reset.
- Login component coverage for localized invalid-email blocking, inline invalid credentials,
  password masking/icon state and seller-only form/notice/pending behavior.
- Navigation coverage for product deep-link parsing, the exact D3 gated-screen inventory and typed
  guest `returnTo` requests.
- App-shell coverage for cold-start onboarding, email registration in the auth stack and the
  five-tab guest path.
- Contract coverage for pending seller registration/login and the mock OTP endpoints.

## Verification

```text
npm run verify
  TypeScript                 pass
  ESLint                     pass, zero warnings
  Prettier                   pass
  dependency-cruiser         pass, zero violations/cycles
  Jest                       pass, 36 suites / 145 tests

npx expo-doctor --verbose
  Expo checks                pass, 21 / 21

npx expo install --check
  SDK dependencies           up to date

npx expo export --platform ios --platform android
  iOS bundle                 pass
  Android bundle             pass
```

## Acceptance criteria

| Criterion | Status | Evidence                                                                                                                         |
| --------- | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| AC5.1     | Pass   | Session restoration stays behind the splash; app tests cover no-session onboarding and repository tests cover restored sessions. |
| AC5.2     | Pass   | App test enters the five-tab shell through continue-as-guest and the store test asserts `guest`.                                 |
| AC5.3     | Pass   | App test presses email and finds sign-up active inside the headerless auth stack.                                                |
| AC5.4     | Pass   | Login component and repository tests prove pending feedback with no authentication or stored session.                            |
| AC5.5     | Pass   | Customer registration signs in, stores the complete session and restores it through a new repository read.                       |
| AC5.6     | Pass   | HTTP 401 maps to `InvalidCredentialsError`; the component test renders it inline and does not authenticate.                      |
| AC5.7     | Pass   | Invalid-email component test asserts localized Arabic field feedback and no repository call.                                     |
| AC5.8     | Pass   | Component test asserts both `secureTextEntry` and matching hidden/visible icons.                                                 |
| AC5.9     | Pass   | `RequireAuth` emits typed return intent and login resets the root to checkout or the requested account route.                    |
| AC5.10    | Pass   | The app test finds the five Arabic tab labels; component styles implement platform-specific accent state.                        |
| AC5.11    | Pass   | Independent nested navigators preserve stacks; the custom tab handler dispatches targeted `popToTop` on active re-tap.           |
| AC5.12    | Pass   | Repository tests prove secure clearing; the account action also clears Query and resets root/onboarding state.                   |
| AC5.13    | Pass   | App tests find no tab roles on onboarding or login and exactly five after guest entry.                                           |
| AC5.14    | Pass   | Navigation test parses `product/p1` into HomeTab → Product with `productId: p1`.                                                 |
| AC5.15    | Pass   | All new copy has paired Arabic/English resources; screens use the established logical-layout primitives and theme direction.     |
| AC5.16    | Pass   | Repository and mock contract tests complete send/verify with `123456`; code comments identify D12/FA1 mock-only behavior.        |
| AC5.17    | Pass   | The frozen/tested D3 gate list omits Product, Browse and Cart and includes every identity-bound route.                           |

## Known issues and remaining risks

- The automated suite and both production bundles are verified locally, but the final QR-code,
  SecureStore restart and RTL/LTR visual smoke still need to be exercised on the physical SDK 57
  phone. `npm start` is now configured specifically for that test.
- A physical phone cannot reach `localhost` on the development machine. Set
  `EXPO_PUBLIC_API_BASE_URL` in `.env.development` to the machine's LAN address and allow port 3001
  through the firewall before testing login or OTP.
- Apple and Google buttons are intentionally non-functional v1 placeholders. Phone OTP is also a
  mock ownership check, not a real authenticated session, pending FA1.
- Catalogue, product, influencer, cart and account-detail destinations are typed shell screens until
  their planned feature phases. This phase implements their navigation contracts and access rules,
  not their business UI.
- `npm audit --omit=dev` reports 18 moderate transitive advisories and no high or critical runtime
  advisories. Its proposed fixes downgrade Expo/React Navigation outside the SDK 57-compatible set,
  so they were not applied; recheck when those upstream packages publish compatible releases.
- App configuration loads dotenv in quiet mode so Expo's machine-readable dependency checks are not
  polluted by an injection banner.

## Handoff

Phase 6 can replace the Home, Browse, Category and Search shells inside the existing tab stacks. It
inherits a restored session, public guest browsing, typed product/category routes, locale-aware HTTP
and query-cache ownership without reopening the navigation or identity design.
