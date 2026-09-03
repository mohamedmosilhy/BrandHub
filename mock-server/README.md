# BRANDHUB contract mock

This Express host mounts JSON Server at `/api/v1`, but custom handlers own the public contract. It
therefore speaks the Spring API's paths, bearer authentication, mixed response envelopes and
zero-based `page`/`size` pagination instead of exposing JSON Server conventions to the app.

## Run and reset

```bash
npm run mock          # http://localhost:3001/api/v1
npm run mock:reset    # rebuild db.json deterministically
```

Port `3001` deliberately avoids Metro's `8081`. Override the host and port with `MOCK_HOST` and
`MOCK_PORT`. For a phone on the same Wi-Fi, use the computer's LAN address—for example
`http://192.168.1.20:3001/api/v1`—as `EXPO_PUBLIC_API_BASE_URL`. The firewall must permit inbound
connections to 3001.

The seeded customer signs in with `customer@brandhub.om` / `Password123!`. Access tokens live for
five minutes; refresh tokens live for one day and can be revoked by logout.

Phone onboarding uses the mock-only `/auth/phone/send-otp` and `/auth/phone/verify-otp` pair; every
challenge accepts `123456`. Seller registration returns `PENDING_APPROVAL` without tokens, and a
pending seller login is rejected until a future admin flow changes that status.

## Fault controls

Every route accepts these headers:

| Header                            | Effect                                                |
| --------------------------------- | ----------------------------------------------------- |
| `x-mock-latency: 500`             | Wait 500 ms (the global default is a visible 120 ms). |
| `x-mock-fail: 401\|404\|409\|500` | Return that status with the API error shape.          |
| `x-mock-fail: timeout`            | Hold the request, then return 504.                    |
| `x-mock-fail: network`            | Close the socket to simulate transport loss.          |
| `x-mock-empty: true`              | Return an empty Spring page for a GET.                |

`POST /orders`, `/wallet/charge` and `/wallet/transfers` persist the first response for each
`Idempotency-Key`. Retrying the same operation with the same key returns that response without a
second write.

## Data and localisation

`seed/data.ts` owns the deterministic source data; `db.json` is its generated, committed output.
Product and category content is stored as `{ ar, en }`. Responses use `Accept-Language` to expose
only a single `name`/`description` string. Areas and their shipping economics are plain database
records, so changing and restarting `db.json` changes the API without a code edit.

Catalogue discovery accepts `q`, `categoryId`, `sellerId`, `sort`, `inStock`, `minPrice`,
`maxPrice`, `minRating`, `page` and `size`. The supported sort values are `relevance`, `top-rated`,
`price-asc` and `price-desc`. `express=true` intentionally yields no matches because no delivery
express field exists in the authoritative contract (D21 / GAP-15); the v1 UI does not expose it.

Only the endpoints in [`INVENTED_ENDPOINTS.md`](./INVENTED_ENDPOINTS.md) are not backed by the
authoritative Postman collection.
