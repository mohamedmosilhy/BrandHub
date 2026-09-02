# Phase 2 — Design system and UI foundation · Completion report

**Date:** 2026-09-02 · **Status:** Implemented; automated acceptance green, physical-device visual sign-off deferred
**Plan:** [`../plan.md`](../plan.md) Phase 2 · **Architecture:** [`../architecture.md`](../architecture.md)

## What was implemented

- The complete approved colour, gradient, typography, spacing, layout, radius, shadow, motion and
  z-index token set, plus accessible foreground remedies documented by the contrast audit.
- Noto Kufi Arabic and Plus Jakarta Sans with one family token per script, loaded before the splash
  hides. Arabic body copy uses the required 1.75 line-height multiplier and a 130% font cap.
- Arabic-first i18next resources, fallback behavior, RTL bootstrap, and a confirm/restart path for
  direction-changing language switches.
- All shared primitives, controls, surfaces, feedback components and layout components listed by
  Phase 2, including the SVG icon registry and automatic RTL flipping for directional icons.
- OMR, date, count and relative-time formatters.
- A development-only component gallery with AR/EN and RTL/LTR preview controls.
- Bilingual loading, network/server error, and empty-state copy for orders, notifications, support
  tickets, addresses and wallet transactions. Every drafted state key is tracked in
  `nativeReviewKeys` for FA5.
- Lint enforcement for colour literals, physical direction properties and raw shared theme pixel
  values in components.

## Architectural decisions

1. `expo-font`, the two Expo Google font packages, `expo-splash-screen`, `expo-image`,
   `expo-linear-gradient`, `react-native-svg`, `i18next`, `react-i18next`, and `expo-updates` are the
   smallest dependency set that implements approved AD-13, AD-17, AD-18 and D16 without a parallel
   UI framework.
2. The source palette remains exact. Named accessible foreground tokens are additive remedies for
   the known WCAG failures; they are used only where text needs AA contrast.
3. The gallery can preview direction without restarting, while the real locale API uses the
   platform-required confirm/restart flow. This keeps development review fast without pretending
   the production platform can change direction live.
4. `AsyncBoundary` accepts explicit state slots and renders one branch by construction, leaving
   product-specific copy and geometry to the caller.

## Tests added

The Phase 2 suites cover token parity, AR/EN resource parity and native-review tracking, OMR/count/
relative-time formatting, all button variants and loading behavior, input states, quantity removal,
toast dismissal, empty/error rendering, exclusive async branches, Arabic typography, minimum touch
targets, the RTL header icon, and gallery coverage.

## Verification

Run before commit:

```text
npm run verify
  TypeScript                 pass
  ESLint                     pass, zero warnings
  Prettier                   pass
  dependency-cruiser         pass, zero violations/cycles
  Jest                       pass, 16 suites / 64 tests

npx expo export --platform ios --platform android
  Android bundle            pass, 909 modules / 2.98 MB Hermes bytecode
  iOS bundle                pass, 911 modules / 2.97 MB Hermes bytecode

npx @21st-dev/cli review src/presentation src/app src/infrastructure/i18n
  Review                     pass, 54 files / 0 findings / 0 fixes
```

## Acceptance criteria

| Criterion | Status           | Evidence                                                                                                                                      |
| --------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| AC2.1     | Pass             | Token suite and the typed `tokens.ts` port cover every reference colour, spacing, radius and shadow.                                          |
| AC2.2     | Pass             | ESLint rejects colour literals, physical direction properties and existing theme pixel values inside shared components.                       |
| AC2.3     | Pass             | Gallery test renders every documented family; the screen includes all named Phase 2 components and button/state variants.                     |
| AC2.4     | Pass (automated) | Direction preview drives the theme context; directional SVGs flip; OMR digits are formatted with `en-US`. Device visual review remains below. |
| AC2.5     | Pass             | Gallery strings use i18next; AR/EN namespace key parity is tested.                                                                            |
| AC2.6     | Pass             | Formatter tests assert `38.900` and `0.000`.                                                                                                  |
| AC2.7     | Pass             | Loading-button test proves spinner, disabled state and retained label.                                                                        |
| AC2.8     | Pass             | Table-driven test proves exactly one async branch renders.                                                                                    |
| AC2.9     | Pass             | Shared interactive primitive requires a label and supplies a role/state; control tests query by accessible role and name.                     |
| AC2.10    | Pass             | `Pressable` enforces 44×44 pt and the primitive test asserts it.                                                                              |
| AC2.11    | Pass (automated) | Arabic body test asserts Noto Kufi, 1.75-derived line height and 1.3 font multiplier. Physical clipping review remains below.                 |
| AC2.12    | Pass             | [`phase-2-contrast-audit.md`](./phase-2-contrast-audit.md) records every known failing pair and implemented remedy.                           |
| AC2.13    | Pass             | Font-family token and token test prove Noto Kufi is the single Arabic source.                                                                 |
| AC2.14    | Pass             | Both locales contain every drafted state key and the test proves all are in `nativeReviewKeys`.                                               |

## Known issues and human review

- The machine still has no iOS simulator or Android emulator, so side-by-side device fidelity,
  Arabic diacritic/descender clipping at 130%, and real VoiceOver/TalkBack behavior are not honestly
  claimable here. Both platform bundles and component behavior are verified; physical review stays
  on the Phase 13 device checklist.
- The Phase 2 Arabic state copy remains drafted copy. FA5 still requires a native Arabic review
  before release.
- The 21st catalog inspiration search returned HTTP 401. The implementation therefore used the
  repository's approved design references exclusively.

## Handoff

Phase 3 can start. It depends on Phase 1, not on physical Phase 2 visual sign-off, and the shared
async-state contracts it will need are now stable.
