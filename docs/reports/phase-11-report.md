# Phase 11 — Social commerce and notifications · Completion report

**Date:** 2026-09-05 · **Status:** Implemented; automated acceptance green; physical AR/EN visual sign-off pending

**Plan:** [`../plan.md`](../plan.md) Phase 11 · **Architecture:** [`../architecture.md`](../architecture.md)

> **Order note.** Phase 11 depends on Phase 6, not on Phase 10. It was taken while Phase 10 (wallet,
> gifts and payment result) is still open, at the repository owner's request. Nothing in this phase
> touches the wallet, and nothing in Phase 10 is blocked by it.

## What was implemented

- A **social domain slice**: `Handle` and `FollowerCount` value objects, the `Influencer`,
  `ShoppablePost` and `InfluencerProfile` entities, the `InfluencerRepository` port, and
  `GetInfluencersUseCase`, `GetInfluencerProfileUseCase` and `FollowInfluencerUseCase`.
- A **notifications domain slice**: `NotificationKind`, `AppNotification`, an `unreadCount`
  function, the `NotificationRepository` port, and `GetNotificationsUseCase` and
  `MarkAllReadUseCase`.
- **Data layer for both**: strict DTOs and Zod schemas, mappers, remote data sources and
  repositories. `MockInfluencerRepository` is named for its provisional status (AD-20);
  `HttpNotificationRepository` keeps its `Http` name because reading notifications is contracted,
  and its single invented write is isolated in one data-source method.
- **Three screens**, each matched to `design-reference/BRANDHUB App.dc.html`: the influencers
  directory (52 px gradient-ringed avatar, name, handle · followers, outline follow pill), the
  influencer profile (tinted `#EEEDF9 → #FCEEF3` band, 78 px avatar, bio, follow and message
  actions, three unboxed stats, and the shoppable feed), and the notifications list (38 px icon
  token, title, body, relative time, unread tint, mark-all-read, empty state).
- **Home wired to real data**: the influencer rail is read from the repository instead of six
  hard-coded names, and the bell's unread dot is driven by the notification cache rather than being
  always on.
- **Mock host extended**: the invented influencer, post and follow routes now serve the full shape
  the profile needs, resolve `isFollowing` per bearer token, filter a feed by influencer, embed each
  post's tagged products, and treat a repeated follow as the same relationship. `GET /notifications`
  is localised, and `POST /notifications/read-all` is added and documented as invented.
- **Documentation**: `INVENTED_ENDPOINTS.md` now carries the complete social specification for the
  backend team, plus the read-all route and the notification field set the mock had to shape.

## Architectural decisions

1. **A post carries its tagged products, not their ids.** `GET /posts` embeds the products in the
   same shape `GET /products` returns, so opening a profile is one request rather than one request
   per tagged item — the N+1 that D14 already rejected for card ratings. `productIds` is kept as the
   membership statement, and the mapper intersects the two: a product the server tagged but could
   not resolve narrows the card rather than leaving a broken tile. Since these endpoints are
   invented anyway, the embed is part of the specification handed to the backend rather than a
   client workaround.
2. **The profile is one query, because it is one thing on screen.**
   `GetInfluencerProfileUseCase` loads the influencer and the feed together and fails as a unit. A
   header that has loaded beside a feed that has not would show one influencer's follower count over
   another's posts during a fast back-and-forward.
3. **Following toggles on the relationship the caller is showing**, exactly as `ToggleWishlistUseCase`
   does for BR6, and returns the new state rather than assuming it. The mutation is optimistic
   across **both** caches — the directory row and the open profile — so following from the profile
   cannot leave the list behind it reading "Follow" until the next refetch.
4. **A public route now reads an optional session.** `GET /influencers` is public (D3) and still has
   to report whether the signed-in customer follows each row. The mock's `bearerAuth` previously
   short-circuited public requests before populating `response.locals`, so `isFollowing` was always
   `false` for a signed-in user browsing the directory. Public now means "does not require a token",
   not "ignores one". Found by the new contract test.
5. **Mark-all-read is invented, and named as such.** The collection contracts reading notifications
   and nothing that marks one read. Rather than inventing a client-side convention that the backend
   could never adopt, `POST /notifications/read-all` is specified as a route, documented in
   `INVENTED_ENDPOINTS.md`, and confined to `NotificationRemoteDataSource.markAllRead`. It answers
   the number of rows it changed, so a no-op is distinguishable from a change.
6. **The unread dot reads the same cache as the list.** Mark-all-read therefore clears the bell
   without a second request, and a guest — who is never asked for notifications (D3) — simply never
   sees a dot.
7. **An unrecognised notification kind renders, it does not disappear.** `type` is a plain string in
   the schema and the mapper narrows it to `UNKNOWN`, which draws a neutral row. A kind the backend
   adds later reaches the customer instead of silently vanishing from a list they rely on.
8. **Direct messaging is stated as out of scope, not stubbed.** The prototype's profile carries a
   `Message` action beside `Follow`; nothing in the collection describes a conversation. The button
   says so through a toast rather than opening a dead screen. Recorded as a product question in
   `architecture.md` §33 and `INVENTED_ENDPOINTS.md`.
9. **The mock's social and notification seed is the prototype's own data.** Names, handles, bios,
   follower counts, both post captions and all five notification rows are lifted verbatim from
   `design-reference/BRANDHUB App.dc.html`, so the screens can be compared against the reference
   directly rather than against placeholder text.

## Files and modules

**New**

- `src/domain/social/{entities,InfluencerRepository,useCases,index}.ts`, `social.test.ts`
- `src/domain/notifications/{entities,NotificationRepository,useCases,index}.ts`,
  `notifications.test.ts`
- `src/data/social/{dto,mappers,datasources,repositories}/**`, `index.ts`,
  `MockInfluencerRepository.test.ts`
- `src/data/notifications/{dto,mappers,datasources,repositories}/**`, `index.ts`,
  `HttpNotificationRepository.test.ts`
- `src/presentation/features/influencers/**` — `InfluencersScreen`, `InfluencerProfileScreen`,
  `components/{InfluencerAvatar,ShoppablePostCard}`, `useSocialQueries`, `queryKeys`, two test files
- `src/presentation/features/notifications/**` — `NotificationsScreen`, `useNotificationQueries`,
  one test file
- `docs/reports/phase-11-report.md`

**Changed**

- `src/presentation/features/home/HomeScreen.tsx` — real influencer rail, data-driven unread dot
- `src/presentation/theme/tokens.ts` / `tokens.test.ts` — `mobile.influencer`, `mobile.notification`
  and the `influencerCover` gradient, with assertions pinning them to the prototype
- `src/presentation/components/primitives/Icon.tsx` — the prototype's comment-bubble glyph
- `src/infrastructure/i18n/resources.ts` — seven Phase 11 strings in both languages
- `src/app/di/container.ts`, `src/app/navigation/AppNavigator.tsx` — three placeholder routes
  replaced by real screens
- `mock-server/{routes.ts,seed/data.ts,db.json,middleware/auth.ts,INVENTED_ENDPOINTS.md,__tests__/contract.test.ts}`
- `docs/plan.md`, `docs/architecture.md`, `README.md`

## Tests

**Added** — 41 assertions across seven suites:

- `src/domain/social/social.test.ts` — handle normalisation, follower-count flooring, profile
  composition and its all-or-nothing failure, follow/unfollow toggling, paging defaults.
- `src/domain/notifications/notifications.test.ts` — unread counting, paging defaults, the row count
  mark-all-read reports.
- `src/data/social/repositories/MockInfluencerRepository.test.ts` — directory mapping, contract
  mismatch as a failed `Result`, feed scoped to one influencer, tagged-product resolution and the
  untagged-product case, both follow verbs, API errors surfaced rather than thrown.
- `src/data/notifications/repositories/HttpNotificationRepository.test.ts` — read state mapping, the
  `UNKNOWN` fallback, both envelope shapes (D22), a gated read, and the read-all route.
- `src/presentation/features/influencers/InfluencersScreen.test.tsx` — AC11.1, AC11.2, AC11.5 with a
  **stateful** fake so optimistic-only code cannot pass the persistence half, the second-tap
  unfollow, the guest gate, rollback on failure, and retry.
- `src/presentation/features/influencers/InfluencerProfileScreen.test.tsx` — AC11.2, AC11.3, AC11.4,
  AC11.5, the messaging notice, and the whole-profile failure.
- `src/presentation/features/notifications/NotificationsScreen.test.tsx` — AC11.7, AC11.8 with a
  stateful fake, rollback on failure, AC11.9, and retry.
- `src/presentation/features/home/HomeScreen.test.tsx` — AC11.6, the unread dot appearing and not
  appearing, and the guest case.
- `mock-server/__tests__/contract.test.ts` — the Phase 11 shapes end to end: influencer fields,
  embedded tagged products, per-user `isFollowing` through follow → refollow → unfollow, Arabic
  resolution, the notification page, and read-all reporting 2 then 0.
- `src/presentation/theme/tokens.test.ts` — the new geometry pinned to the prototype.

**Executed**

```
npm run verify   # typecheck, lint (0 warnings), format:check, boundaries, jest
```

- TypeScript: clean.
- ESLint: clean at `--max-warnings=0`.
- Prettier: clean.
- dependency-cruiser: no violations (336 modules, 1167 dependencies).
- Jest: **74 suites, 347 tests, all passing** (up from 71 / 324).

## Acceptance criteria

| #       | Criterion                                                     | Status                                                                                                                                                     |
| ------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC11.1  | List shows name, handle, formatted follower count             | **Pass** — `InfluencersScreen.test.tsx`; `215K` via `formatCount`.                                                                                         |
| AC11.2  | Tapping an influencer opens the profile with bio and stats    | **Pass** — both screen suites.                                                                                                                             |
| AC11.3  | Profile shows posts with likes, comments and caption          | **Pass** — `InfluencerProfileScreen.test.tsx`.                                                                                                             |
| AC11.4  | A post's tagged product opens that product's PDP              | **Pass** — the card fires `onOpenProduct` with the tagged id; the navigator pushes `Product`.                                                              |
| AC11.5  | The follow button toggles and persists                        | **Pass** — asserted against a stateful fake and, end to end, in the mock contract test.                                                                    |
| AC11.6  | The home influencer rail opens the corresponding profile      | **Pass** — `HomeScreen.test.tsx`.                                                                                                                          |
| AC11.7  | Icon, title, body, relative time; unread rows tinted          | **Pass** — `NotificationsScreen.test.tsx`; the tint is announced as `selected` so it is assertable.                                                        |
| AC11.8  | Mark-all-read clears every unread state and the bell dot      | **Pass** — the list and the dot read one cache; both suites cover it.                                                                                      |
| AC11.9  | No notifications shows the empty state                        | **Pass** — `NotificationsScreen.test.tsx`.                                                                                                                 |
| AC11.10 | Both screens render correctly in Arabic RTL and English LTR   | **Partial** — every component test renders in Arabic; no physical property survives lint (AC1.6). Physical sign-off is a Phase 13 gate, as for Phases 7–9. |
| AC11.11 | Every repository on an invented endpoint is named provisional | **Pass** — `MockInfluencerRepository` by name, class comment and container comment; the notification write is confined and documented.                     |
| AC11.12 | No push permission, no device token; refresh on open          | **Pass** — no notification permission API is called, no device token is registered, no push dependency exists.                                             |

## Known issues and deviations

1. **AC11.10 is not fully closable in this phase.** The Arabic path is exercised by every test and
   the RTL lint rule forbids physical properties, but a rendered English LTR comparison against the
   prototype needs a device. This is the same open item Phases 7, 8 and 9 carried into the Phase 13
   release gate.
2. **The plan's definition of done said "all eleven criteria"; there are twelve** (AC11.1–AC11.12).
   Corrected in `plan.md` rather than left to be discovered at review.
3. **`postCount` and `productCount` are server-owned counters the mock seeds with prototype-like
   values.** They are not derived from the page the client happens to hold, which would be wrong the
   moment the feed is paged. The backend owes real counts along with the rest of FA1.
4. **The follow relationship is the only thing in this phase that stops at migration.** Notifications
   keep reading on the real contract; only mark-all-read goes dark until the backend adds a route.
5. **The influencer feed is not paged in the UI.** The repository and the mock both page it; the
   profile renders the first page, which holds the prototype's whole feed. Paging the feed is a
   two-line change to an infinite query when a real backend makes it necessary.

## Risks

- **FA1 remains the schedule risk.** Social commerce is built against routes the backend has not
  agreed to. The specification is now complete and precise, which is the most this project can do
  about it; the exposure is one repository binding in `container.ts`.
- **Notification copy is server-supplied**, so FA5's native Arabic review covers the mock's seed
  rather than the app's strings for this screen. The seven new UI strings are in `resources.ts` and
  are in scope for that review.

## For human review

1. **Direct messaging** — confirm it is genuinely out of v1 rather than an omission from the API
   collection (§33 item 19).
2. **`POST /notifications/read-all`** — confirm the backend prefers a bulk route over per-row
   marking before it is specified to them as such.
3. **The three profile stats** — confirm `postCount` and `productCount` are counts the backend can
   supply, since the client deliberately does not derive them.
