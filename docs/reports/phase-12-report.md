# Phase 12 — Support · Completion report

**Date:** 2026-09-05 · **Status:** Implemented; automated acceptance green; physical AR/EN visual sign-off pending

**Plan:** [`../plan.md`](../plan.md) Phase 12 · **Architecture:** [`../architecture.md`](../architecture.md)

> **Order note.** Phase 12 depends on Phase 9, not on Phase 10 or 11. It was taken while Phase 10
> (wallet, gifts and payment result) is still open. With this phase done, **Phase 10 is the only
> customer feature left before Phase 13.**

## What was implemented

- A **support domain slice**: `TicketCategory`, `TicketPriority`, `TicketStatus`, `TicketAuthor`,
  `TicketMessage`, `Ticket` and `TicketDraft`; the `SupportRepository` port; `GetTicketsUseCase`,
  `GetTicketUseCase`, `CreateTicketUseCase` and `ReplyToTicketUseCase`; and two pure functions —
  `ticketDraftErrors` and `ticketThread` — that carry the two rules the screens depend on.
- **Data layer on the real contract** (D19): DTOs and Zod schemas, a mapper that narrows every
  server enum, `SupportRemoteDataSource` over the four contracted routes, and
  `HttpSupportRepository`.
- **Two screens**, matched to `design-reference/BRANDHUB App.dc.html`: the support screen (six
  category pills, three priority blocks, the related-order select, subject, description, submit,
  and the my-tickets list with its status pill and meta line) and the ticket screen (number and
  status in the header, subject, category / priority / order chips, the last-update line, the
  two-sided thread, and the reply bar).
- **The order-detail entry point is live**: `onSupport` already navigated to `Support` with the
  order id; the screen now receives it and preselects that order (AC12.10).
- **Mock host**: tickets are seeded with the prototype's three real tickets and their two-sided
  threads, the list is localised and ordered newest-updated first, and `POST /support/tickets`
  stores the description as the thread's opening message.
- **Documentation**: `INVENTED_ENDPOINTS.md` records the support field set, the enum questions and
  the two things deliberately not built.

## Architectural decisions

1. **Support is HTTP from the start — the plan's task list was stale.** Phase 12 task 2 says to
   build "against the mock's invented endpoints", which was written before the expanded collection
   landed. **D19 closed GAP-2**: `/support/tickets` and its messages route are contracted, so the
   repository is `HttpSupportRepository`, not a mock. The plan has been amended in place rather
   than followed as written. What remains provisional is the _field set_ — the collection carries
   no response example — and that is documented where the other shaped-but-contracted routes are.
2. **Both required fields are validated together.** AC12.3 asks for "field messages", plural.
   `ticketDraftErrors` returns every empty required field and `CreateTicketUseCase` carries them in
   `details.fields`, so a customer who left both blank is told once instead of being sent round the
   form twice. The screen turns field names into copy; the rule stays in the domain.
3. **The description is the thread's first message, and that is fixed at the source.** The
   contracted create body has a `description` and no message array, while the prototype's thread
   opens with exactly that text as the customer's first bubble. The mock now stores it as a
   message, so a replied-to ticket cannot lose the complaint it was raised with. The client still
   tolerates a server that does not — `ticketThread` synthesises the opening bubble when `messages`
   is empty — and the reply cache-write runs through `ticketThread` for the same reason.
4. **The thread's two sides use logical alignment, not a locale check.**
   `alignSelf: 'flex-start' | 'flex-end'` is resolved by Yoga against the reading direction, so the
   customer's bubbles sit at the reading start and support's at the reading end in both languages
   with no conditional. Asserted directly rather than left to a visual check.
5. **Anyone who is not the customer is support.** The collection has one customer message route and
   a separate admin one, and the admin side may label its sender `ADMIN`, `AGENT` or `SUPPORT`. The
   mapper decides by exclusion, so the thread has two sides whatever the server calls the second.
6. **Every server enum narrows rather than rejects.** An unrecognised category becomes `OTHER`, an
   unrecognised priority `NORMAL`, an unrecognised status `UNKNOWN` — which renders as a neutral
   "under review" row. A page of tickets is never lost to one value the app has not met.
7. **Creating is not optimistic; replying is written through on success.** The server mints the
   ticket number and the status the list renders, so an optimistic row would show a placeholder
   number a customer might quote back to support. The created ticket is written into the list cache
   on success instead, which satisfies AC12.4 without inventing data. A reply is appended to the
   open thread the same way, and the list is invalidated because the reply moved `updatedAt`.
8. **The list is ordered by the server, not the client.** The prototype's my-tickets list is
   ordered by last update; sorting in the mock keeps that true across pages, which sorting in the
   screen would not.
9. **The status tints are the prototype's three, mapped onto the contract's three statuses.** The
   prototype also draws a "Waiting on you" state that no contracted status expresses;
   `IN_PROGRESS` takes that slot and its amber tint, with copy that says what the contract actually
   means rather than what the mock-up guessed.

## Files and modules

**New**

- `src/domain/support/{entities,SupportRepository,useCases,index}.ts`, `support.test.ts`
- `src/data/support/{dto,mappers,datasources,repositories}/**`, `index.ts`,
  `HttpSupportRepository.test.ts`
- `src/presentation/features/support/**` — `SupportScreen`, `TicketScreen`, `ticketStatus`,
  `useSupportQueries`, `index.ts`, two test files
- `docs/reports/phase-12-report.md`

**Changed**

- `src/presentation/theme/tokens.ts` / `tokens.test.ts` — `mobile.support`, pinned to the prototype
- `src/infrastructure/i18n/resources.ts` — fourteen Phase 12 strings in both languages
- `src/app/di/container.ts`, `src/app/navigation/AppNavigator.tsx` — the two placeholder account
  routes replaced by real screens
- `mock-server/{routes.ts,seed/data.ts,db.json,INVENTED_ENDPOINTS.md,__tests__/contract.test.ts}`
- `docs/plan.md`, `docs/architecture.md`, `README.md`

## Tests

**Added** — 33 assertions across four suites:

- `src/domain/support/support.test.ts` — every empty field named at once, the create blocked with
  both names, trimming, `ticketThread` synthesising the opening bubble and never duplicating it,
  the empty-reply block, and the API failure passed through.
- `src/data/support/repositories/HttpSupportRepository.test.ts` — page mapping with a two-sided
  thread, enum narrowing (`BILLING_DISPUTE` → `OTHER`, `URGENT` → `NORMAL`, `ESCALATED` →
  `UNKNOWN`), contract mismatch as a failed `Result`, the contracted create body with and without
  an order, the `{ message }` reply body, and a not-found surfaced rather than thrown.
- `src/presentation/features/support/SupportScreen.test.tsx` — AC12.1, AC12.2, AC12.3, AC12.4
  against a **stateful** fake so the new ticket really lands at the top, AC12.5, AC12.6, AC12.10,
  AC12.11, a failed create that keeps what was typed, and retry.
- `src/presentation/features/support/TicketScreen.test.tsx` — AC12.6, AC12.7 including the two
  sides' alignment, AC12.8 against a stateful fake, AC12.9, a failed reply that keeps the draft,
  the description-only thread, and retry.
- `mock-server/__tests__/contract.test.ts` — the Phase 12 shapes end to end: ordering, the
  three seeded statuses, the localised subject, create → opening message → reply → reread → the
  ticket back at the top of the list, and a 400 on a ticket with no subject.
- `src/presentation/theme/tokens.test.ts` — the support geometry pinned to the prototype.

**Executed**

```
npm run verify   # typecheck, lint (0 warnings), format:check, boundaries, jest
```

- TypeScript: clean.
- ESLint: clean at `--max-warnings=0`.
- Prettier: clean.
- dependency-cruiser: no violations.
- Jest: **78 suites, 382 tests, all passing** (up from 74 / 347).

## Acceptance criteria

| #       | Criterion                                                    | Status                                                                                                                                                                                                                                      |
| ------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC12.1  | Six categories, three priorities, one selection each         | **Pass** — `SupportScreen.test.tsx`; defaults are the contract's `ORDER` / `NORMAL`.                                                                                                                                                        |
| AC12.2  | The related-order select lists the user's orders             | **Pass** — the select is driven by `GetOrdersUseCase`.                                                                                                                                                                                      |
| AC12.3  | Submitting without a subject or description is blocked       | **Pass** — both fields are named at once, in the domain and on screen.                                                                                                                                                                      |
| AC12.4  | A valid submit toasts and lands at the top of my-tickets     | **Pass** — against a stateful fake, and end to end in the mock contract test.                                                                                                                                                               |
| AC12.5  | Number, status pill in the reference's tint, subject, meta   | **Pass** — the three prototype tints map onto the three contracted statuses.                                                                                                                                                                |
| AC12.6  | Tapping a ticket opens the thread                            | **Pass** — both screen suites.                                                                                                                                                                                                              |
| AC12.7  | The thread renders both sides, aligned, with author and time | **Pass** — alignment asserted, not eyeballed.                                                                                                                                                                                               |
| AC12.8  | A reply appends to the thread and toasts                     | **Pass** — the bubble appears without a refetch, and survives one.                                                                                                                                                                          |
| AC12.9  | An empty reply is blocked                                    | **Pass** — the block is in `ReplyToTicketUseCase`; whitespace never leaves the device.                                                                                                                                                      |
| AC12.10 | Arriving from order detail preselects that order             | **Pass** — `SupportRoute` passes the route's `orderId`; the created payload carries it.                                                                                                                                                     |
| AC12.11 | No tickets shows the empty state                             | **Pass** — `SupportScreen.test.tsx`.                                                                                                                                                                                                        |
| AC12.12 | Both screens render correctly in Arabic RTL and English LTR  | **Partial** — every component test renders in Arabic, the thread's alignment is direction-resolved rather than conditional, and no physical property survives lint (AC1.6). Physical sign-off is a Phase 13 gate, as for Phases 7–9 and 11. |

## Known issues and deviations

1. **The plan's Phase 12 task 2 was stale and has been amended.** It described building against
   "the mock's invented endpoints"; D19 had already moved support onto the real contract. The code
   follows D19 and `plan.md` now says so, rather than leaving the contradiction to be found at
   review.
2. **AC12.12 is not fully closable in this phase** — the same physical AR/EN sign-off Phases 7–9
   and 11 carry into the Phase 13 release gate.
3. **Only one ticket category is evidenced by the contract.** The collection's single example sends
   `ORDER`; the prototype's form offers six. The client sends its six and narrows anything
   unrecognised to `OTHER`, so a narrower server enum degrades rather than breaks — but the set
   needs confirming.
4. **Ticket attachments are contracted but not built.** The prototype's ticket screen has no attach
   control, and adding one would be inventing UI the reference does not have. Raised as a product
   question.
5. **The prototype's "Waiting on you" status has no contracted equivalent.** `IN_PROGRESS` takes
   its amber slot with copy that says what the contract means. If the backend adds a
   customer-action state, it is one entry in `TICKET_STATUS_KEY` and one in `statusTone`.
6. **The ticket list is not paged in the UI.** The repository and the mock both page it; the screen
   renders the first page, which holds every ticket the seeded account has. Paging is a two-line
   change to an infinite query when a real backend makes it necessary — the same position the
   influencer feed is in.

## A note on the test environment

This project's Jest setup does not configure React's `act` — the console warning
"The current testing environment is not configured to support act(...)" appears on every component
suite, and the runner reports a worker that "failed to exit gracefully". Both predate this phase.
The practical consequence, found here: a `useState` update made in response to `fireEvent` lands one
tick after the event returns, so a synchronous assertion straight afterwards reads a stale tree.
Every such assertion in this phase's suites goes through `waitFor`. Worth fixing properly in Phase
13 rather than each suite working around it.

## For human review

1. **The six ticket categories** — confirm the backend's enum, since only `ORDER` is evidenced.
2. **Ticket attachments** — confirm they are genuinely out of v1 rather than missing from the
   reference (§33 item 20).
3. **A customer-action ticket status** — confirm whether the prototype's "Waiting on you" should
   exist as a real status, or whether `IN_PROGRESS` covers it.
