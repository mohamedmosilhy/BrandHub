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
