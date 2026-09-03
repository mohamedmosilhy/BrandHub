# Invented endpoints pending backend contracts (FA1)

Only three feature areas remain uncontracted. These mock routes are isolated here so the backend
team can adopt or replace them explicitly. All responses use `{ "success": true, "data": ... }`.

## 1. Influencers, shoppable posts and follows

- `GET /influencers?page=0&size=20` → Spring page of
  `{ id, name, handle, followerCount, taggedProductIds[] }`.
- `GET /influencers/{id}` → the same influencer entity.
- `GET /posts?page=0&size=20` → Spring page of
  `{ id, influencerId, caption, productIds[], createdAt }`; `caption` is resolved from
  `Accept-Language`.
- `POST /influencers/{id}/follow` with no body →
  `{ id, userId, influencerId, createdAt }`. Bearer token required.
- `DELETE /influencers/{id}/follow` → `204`. Bearer token required.

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

# Contracted routes the mock had to shape (Phase 7)

These routes **are** in `docs/ECommerce_API_Postman_Collection.json`, but it carries no response
example for them, so the mock defines their payloads. They are listed here separately from the
invented endpoints above: the backend owns the routes already, and only the field set is at stake.

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
