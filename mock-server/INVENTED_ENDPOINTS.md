# Invented endpoints pending backend contracts (FA1)

Only three feature areas remain uncontracted. These mock routes are isolated here so the backend
team can adopt or replace them explicitly. All responses use `{ "success": true, "data": ... }`.
Section 1b adds one route to a resource that is otherwise contracted.

## 1. Influencers, shoppable posts and follows

The whole feature area. The shapes below are the specification handed to the backend team: the
client's Zod schemas in `src/data/social/dto` are strict against exactly these fields, so a
mismatch fails loudly at the boundary rather than rendering as `undefined`. The client binds them
through `MockInfluencerRepository`, named to keep its provisional status visible in the container.

- `GET /influencers?page=0&size=20` → Spring page of
  `{ id, name, handle, bio, avatarUrl, followerCount, postCount, productCount,
taggedProductIds[], isFollowing }`.
  - `name` and `bio` are resolved from `Accept-Language` (D9), as the catalogue's are.
  - `handle` carries its own leading `@`; the client normalises it into a `Handle` value object
    regardless.
  - `postCount` and `productCount` are the profile's two non-follower stats. **The server owns
    them.** The client never derives a count from a page it happens to be holding.
  - `isFollowing` is resolved for the bearer token on the request. Browsing is public (D3), so a
    request without a token reads `false` — the route must accept an **optional** session rather
    than ignoring one.
- `GET /influencers/{id}` → the same influencer entity.
- `GET /posts?influencerId={id}&page=0&size=20` → Spring page of
  `{ id, influencerId, imageUrl, caption, likeCount, commentCount, productIds[], products[],
createdAt }`.
  - `caption` is resolved from `Accept-Language`.
  - **`products` embeds the tagged products in full**, in the same shape `GET /products` returns.
    A feed is one request; without the embed, opening a profile would fan out into one product
    request per tagged item — the N+1 D14 already rejected for card ratings. `productIds` remains
    the membership statement, so a tagged product the server cannot resolve narrows the card
    instead of leaving a broken tile.
  - `influencerId` filters the feed. Omitted, the route answers every post.
- `POST /influencers/{id}/follow` with no body →
  `{ id, userId, influencerId, createdAt }`. Bearer token required. **Idempotent**: following an
  influencer already followed returns the existing relationship rather than creating a second row.
- `DELETE /influencers/{id}/follow` → `204`. Bearer token required.

Not built, and deliberately: **direct messaging**. The prototype's influencer profile carries a
`Message` action beside `Follow`. Nothing in the collection describes a conversation, so the button
says messaging is out of v1 rather than opening a dead screen. It is a product question, not an
oversight.

## 1b. Marking notifications read

`GET /notifications?isRead=&page=&size=` **is** contracted (see the last section of this file for
the field set the mock had to shape). Nothing that marks one read is, and the prototype's list
carries a mark-all-read action, so one route is invented for it:

- `POST /notifications/read-all` with no body → `{ updated: <number of rows changed> }`.
  Bearer token required. Returning the count lets the client tell a no-op from a change.

The client's `HttpNotificationRepository` is named `Http`, not `Mock`, because reading is
contracted; this one write is the provisional part and is confined to
`NotificationRemoteDataSource.markAllRead`.

**To replace:** if the backend prefers per-row marking (`PATCH /notifications/{id}`), the client
change is that one data-source method plus the `MarkAllReadUseCase` that calls it.

## 2. Delivery time slots and express flag

- `GET /delivery/slots?areaId={id}` → array of
  `{ id, label, areaId, surcharge, express }`. `label` is resolved from `Accept-Language`.

The contracted `/areas` resource remains authoritative for the base delivery charge, free-delivery
minimum and estimated days. A selected slot's `surcharge` is additive; `express` is descriptive.

## 3. Phone OTP

- `POST /auth/phone/send-otp` with `{ phone }` →
  `{ challengeId, expiresInSeconds }`.
- `POST /auth/phone/verify-otp` with `{ challengeId, code }` →
  `{ verified, phone }`; invalid or expired codes return `401`.

The local-only verification code is `123456`. Production must rate-limit both routes, never return
or log the code, expire challenges after five minutes, and cap verification attempts.

---

# Client-side conventions the contract has no field for (Phase 9)

Neither of these is a mock route — both are shapes the **app** puts into contracted fields, recorded
here so the backend team can replace them with real fields.

## The address label

`POST` and `PUT /users/me/addresses` carry the prototype's HOME/WORK/OTHER label in the optional
`addressLine2` as the literal string `brandhub-label:HOME` (or `WORK`, `OTHER`). The API has no
field for it and D13 forbids losing anything the UI collects. The app reads any _other_ text in
that field back as part of the address details, so a record seeded with a real second line keeps
its content.

**To replace:** add a `label` field to the address payload. The client change is two functions in
`src/data/addresses/mappers/addressMapper.ts`.

## The address-to-area link

Nothing in the collection joins an address to the shipping area that carries its delivery price.
The app matches the address `city` against `area.name` first and `area.governorate` second, across
the whole `/areas` list. The address form's city select is populated from `/areas`, so an address
the app saved always matches by name.

**To replace:** add `areaId` to the address payload. `resolveAddressArea` already returns an
explicit `areaId` unchanged when one is present, so the function can then be deleted.

# Contracted routes the mock had to shape (Phases 7, 11 and 12)

These routes **are** in `docs/ECommerce_API_Postman_Collection.json`, but it carries no response
example for them, so the mock defines their payloads. They are listed here separately from the
invented endpoints above: the backend owns the routes already, and only the field set is at stake.

## `GET /notifications` (Phase 11)

Spring page — **unwrapped**, like `GET /orders` — of
`{ id, userId, type, title, body, isRead, createdAt }`.

- `title` and `body` are resolved from `Accept-Language`.
- `type` is one of `ORDER`, `DELIVERY`, `PROMOTION`, `SOCIAL`, `PRICE_DROP` — the five icon tokens
  the prototype's list draws. The client narrows an unrecognised value to `UNKNOWN` and renders a
  neutral row, so a kind the backend adds later still reaches the customer.
- `isRead=` filters; the client reads the whole list and counts unread itself for the home bell.

## `GET /support/tickets` and `GET /support/tickets/{id}` (Phase 12)

Spring page (and single object) of
`{ id, ticketNumber, userId, orderId, category, priority, subject, description, status, messages[],
createdAt, updatedAt }`, where a message is
`{ id, senderType, message, createdAt }`.

- `subject`, `description` and each `message` are resolved from `Accept-Language`.
- **The list is ordered newest-updated first.** The prototype's my-tickets list is ordered by last
  update, and a ticket the customer has just opened has to appear at the top of it.
- **`POST /support/tickets` stores the `description` as the thread's opening customer message.**
  The contracted body has `description` and no message array, but the prototype's thread opens with
  exactly that text as the customer's first bubble. Storing it as a message keeps a replied-to
  ticket from losing the complaint it was raised with. The client also tolerates a server that does
  **not** do this — `ticketThread` in `src/domain/support` synthesises the opening bubble from
  `description` when `messages` is empty — so either behaviour renders correctly.
- **`status`.** The collection's admin routes set `OPEN`, `IN_PROGRESS` and `RESOLVED`; the mock
  seeds one ticket in each. The client also accepts `CLOSED`, and narrows anything else to a
  neutral "under review" row rather than dropping the ticket.
- **`category`.** Only `ORDER` appears anywhere in the collection. The prototype's form offers six
  choices, so the client sends `ORDER`, `PAYMENT`, `DELIVERY`, `RETURN`, `WALLET` and `OTHER`.
  **The backend is asked to confirm this set.** An unrecognised category maps to `OTHER` on the way
  in, so a narrower server enum degrades rather than breaks.
- **`priority`.** `NORMAL` is the contract's middle value (the prototype labels it "Medium"); the
  client sends `LOW`, `NORMAL` and `HIGH`.

Not built, and deliberately: **ticket attachments**. `POST` and `GET
/support/tickets/{id}/attachments` are contracted and the mock serves them, but the prototype's
ticket screen has no attach control, and D13 is about not losing what the UI collects — not about
adding controls the reference does not have. Raise it as a product question if support needs it.

## `GET /reviews/product/{productId}`

Spring page of `{ id, userId, productId, userName, rating, comment, createdAt }`.

- **`userName` is a mock addition.** A review is rendered with its author's name, so the mock
  resolves it from the user record on the way out. Without it the client would have to issue one
  user request per review — the N+1 that D14 already rejected for card ratings. The backend is
  asked to include it; if it does not, the PDP shows the anonymous-reviewer fallback string.
- **Readable without a session.** Browsing is public (D3) and a guest can open a product page, so
  the reviews on that page are public too. `POST /reviews` still requires a bearer token.

## `GET /sellers`

There is **no `GET /sellers/{id}`** anywhere in the collection. The seller store screen therefore
reads the directory page and selects its seller from it — see `SellerRemoteDataSource.getById`,
which is the single place a real single-seller endpoint would replace.
