# BRANDHUB Mobile — Technical Architecture

**Status:** **Approved and implemented through Phase 8** · **Date:** 2026-09-04
**Author:** AI agent acting as architect · **Reviewer / decision maker:** repository owner
**Decision record:** all 17 open questions were reviewed and approved as recommended on 2026-09-02.

> This document is the technical architecture for the BRANDHUB React Native application.
> It is derived **only** from what is present in `design-reference/`.
> Every question this document raised has been decided; §34 now records those decisions as
> **D1–D22**, and the work they hand to other teams as **FA1–FA5**.
> The technical foundation, shared UI system, contract mock, reusable data spine, identity/session
> shell, catalogue/discovery, product/wishlist and cart/checkout slices now exist. Phase 9 of
> `plan.md` is cleared to begin; phase reports live in `docs/reports/`.

---

## Table of contents

1. [Project overview](#1-project-overview)
2. [Goals and constraints](#2-goals-and-constraints)
3. [Reference analysis](#3-reference-analysis)
4. [Application features](#4-application-features)
5. [Screen inventory](#5-screen-inventory)
6. [User flows](#6-user-flows)
7. [Architecture overview](#7-architecture-overview)
8. [Clean Architecture layers](#8-clean-architecture-layers)
9. [Dependency rules](#9-dependency-rules)
10. [Project / folder structure](#10-project--folder-structure)
11. [Domain layer](#11-domain-layer)
12. [Presentation layer](#12-presentation-layer)
13. [Data layer](#13-data-layer)
14. [Infrastructure layer](#14-infrastructure-layer)
15. [Navigation architecture](#15-navigation-architecture)
16. [State management strategy](#16-state-management-strategy)
17. [API / data-access architecture](#17-api--data-access-architecture)
18. [JSON Server architecture](#18-json-server-architecture)
19. [Future REST API migration strategy](#19-future-rest-api-migration-strategy)
20. [DTO / domain model strategy](#20-dto--domain-model-strategy)
21. [Error-handling strategy](#21-error-handling-strategy)
22. [Loading / empty / error state strategy](#22-loading--empty--error-state-strategy)
23. [UI component architecture](#23-ui-component-architecture)
24. [Reusability strategy](#24-reusability-strategy)
25. [Form strategy](#25-form-strategy)
26. [Configuration / environment strategy](#26-configuration--environment-strategy)
27. [Testing architecture](#27-testing-architecture)
28. [Security considerations](#28-security-considerations)
29. [Performance considerations](#29-performance-considerations)
30. [Accessibility considerations](#30-accessibility-considerations)
31. [Scalability considerations](#31-scalability-considerations)
32. [Architectural decisions and rationale](#32-architectural-decisions-and-rationale)
33. [Known limitations](#33-known-limitations)
34. [Decisions on open questions](#34-decisions-on-open-questions)

---

## 1. Project overview

BRANDHUB is a **multi-vendor marketplace for the Sultanate of Oman** with a social-commerce layer.
Customers browse a catalogue supplied by verified sellers, shop influencer posts, pay by wallet,
card, Thawani or cash on delivery, and track orders to the door. Prices are in Omani Rial (OMR),
the interface is **Arabic-first and right-to-left**, with an English mirror.

The reference contains an entire product ecosystem (nine prototypes). Exactly **two of them are
mobile applications**; the rest are web dashboards for internal roles.

| Prototype file                      | Surface                                          | Mobile? | In scope for this project      |
| ----------------------------------- | ------------------------------------------------ | ------- | ------------------------------ |
| `BRANDHUB App.dc.html`              | Customer app, 27 screens, iOS + Android, AR + EN | Yes     | **Yes — primary scope**        |
| `BRANDHUB Seller App.dc.html`       | Seller app, 7 screens                            | Yes     | Deferred to a later track (D1) |
| `BRANDHUB Admin.dc.html`            | Admin dashboard                                  | No      | No                             |
| `BRANDHUB Super Admin.dc.html`      | Super-admin dashboard                            | No      | No                             |
| `BRANDHUB Super Admin App.dc.html`  | Super-admin, mobile-shaped                       | Partly  | No                             |
| `BRANDHUB Seller.dc.html`           | Seller web dashboard                             | No      | No                             |
| `BRANDHUB Delivery.dc.html`         | Courier dashboard                                | No      | No                             |
| `BRANDHUB Support Desk.dc.html`     | Support agent dashboard                          | No      | No                             |
| `BRANDHUB Customer Account.dc.html` | Customer account, web                            | No      | Cross-check only               |
| `BRANDHUB System.dc.html`           | Login, access gate, 404                          | No      | Cross-check only               |

**Approved v1 scope: the customer mobile application (D1).** The seller app is documented here so
the architecture can absorb it later; it is planned as a separate track (`plan.md` Phase 14) and is
not part of v1.

---

## 2. Goals and constraints

### Goals

| #   | Goal                                                                                                                          |
| --- | ----------------------------------------------------------------------------------------------------------------------------- |
| G1  | Reproduce the customer app's UI and interaction behaviour as closely as React Native allows.                                  |
| G2  | Clean Architecture with enforced, machine-checkable layer boundaries.                                                         |
| G3  | Run against a JSON Server dummy backend today; swap to the real REST API with a config change and new repository wiring only. |
| G4  | Arabic-first RTL with a complete English mirror, switchable in-app.                                                           |
| G5  | Every async surface handles loading, success, empty and error explicitly.                                                     |
| G6  | Business rules testable without React Native, a device, or a network.                                                         |

### Constraints

| #   | Constraint                                                                                                                   | Source                                                         |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| C1  | React Native.                                                                                                                | Requirement.                                                   |
| C2  | JSON Server is the only backend for this phase, and must be invisible above the data layer.                                  | Requirement.                                                   |
| C3  | The real backend already exists as a Spring Boot REST API; its contract is fixed by `ECommerce_API_Postman_Collection.json`. | Reference.                                                     |
| C4  | Currency is OMR, displayed to **three** decimal places.                                                                      | `money()` in the prototype uses `minimumFractionDigits: 3`.    |
| C5  | VAT is 5%.                                                                                                                   | `vat = subtotal * 0.05`.                                       |
| C6  | RTL is the default direction; layout must mirror.                                                                            | `dir="rtl"`, `marginInlineStart`, `insetInlineEnd` throughout. |
| C7  | No real backend work in this project.                                                                                        | Requirement.                                                   |
| C8  | Brand palette, type scale and spacing are fixed by `tokens.css`.                                                             | Reference.                                                     |
| C9  | Minimum supported platforms are iOS 16.4 and Android 8.0 (API 26).                                                           | Decision D15, amended for Expo SDK 57.                         |
| C10 | Arabic renders in Noto Kufi Arabic; GE Dinar One is a drop-in only if its licence is obtained.                               | Decision D16.                                                  |
| C11 | Sign-in is email and password in v1. Phone + OTP is built against mock-only endpoints.                                       | Decision D12.                                                  |
| C12 | Notifications are an in-app list only. No push delivery in v1.                                                               | Decision D17.                                                  |

### Non-goals

Real payment integration, push notification delivery infrastructure (D17), a working phone + OTP
sign-in against a real backend (D12), the richer `app-home-live.jsx` home screen (D5, held for
v1.1), the seller/admin/delivery/support dashboards, backend implementation, analytics, and
CMS-driven merchandising.

---

## 3. Reference analysis

### 3.1 What the reference actually is

`design-reference/` holds a **Design-Canvas prototype**, not production code. Two distinct
representations of the customer app exist:

1. **`BRANDHUB App.dc.html`** — a single-file clickable prototype. A `DCLogic` component holds all
   state, a `renderVals()` method computes every value the markup binds to, and `<sc-if>` / `<sc-for>`
   template tags select the visible screen. This file is **the authoritative source** for the screen
   inventory, navigation model, data shown per screen, and interaction behaviour.
2. **`uploads/BRAND HUB (6)/`** — an earlier React/JSX web storefront plus mobile mock-ups
   (`app-screens.jsx` HomeA/HomeB, `app-home-live.jsx` AppHome). These are richer visually
   (stories rail, auto-rotating hero, live countdown, shoppable feed) but are **web-storefront
   artefacts**, not the app prototype. They are treated as **secondary visual reference** for the
   home screen only.

**`design-reference/_ds/modernist-…/`** is an unrelated design system (red mono, Archivo, zero
corner radius). It contradicts the BRANDHUB brand in every token. It is **excluded** as a stray
asset (D6).

### 3.2 Design tokens (from `tokens.css`)

| Role                                 | Value                                                      |
| ------------------------------------ | ---------------------------------------------------------- |
| Accent / accent hover / accent light | `#7F77DD` / `#6860CC` / `#EEEDF9`                          |
| Pink (badges, gradient end)          | `#D4537E`, light `#FCEEF3`                                 |
| Gold (logo basket handle only)       | `#C8A84B`                                                  |
| Ink                                  | `#1A1A2E`                                                  |
| Background / surface / border        | `#F5F5F7` / `#FFFFFF` / `#E8E8EC`                          |
| Text primary / secondary / muted     | `#1A1A2E` / `#5A5A72` / `#9A9AAF`                          |
| Success / warning / danger           | `#22A06B` / `#E6A817` / `#D94F4F` (each with a light tint) |
| Brand gradient                       | `linear-gradient(135deg, #7F77DD, #D4537E)`                |
| Arabic font                          | GE Dinar One → GE SS Two → Noto Kufi Arabic                |
| Latin font                           | Plus Jakarta Sans → DM Sans                                |
| Arabic line height                   | `1.75` — mandatory for Arabic body copy                    |
| Radius                               | 6 / 10 / 16 / 24 / 9999                                    |
| Spacing                              | 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80         |

The token file explicitly warns: neutrals carry ~80% of the chrome, gold appears **only** in the
logo, and pink is limited to badges and the gradient. These are rules, not suggestions.

**Font decision (D16):** GE Dinar One is named by the tokens but is not present in the reference and
has no licence in hand. **Noto Kufi Arabic is the shipped Arabic face** — it is what the prototype
actually renders with. The theme exposes the Arabic face as a single token, so swapping in GE Dinar
One later is a one-line change if the licence arrives (FA4).

### 3.3 Seed data in the prototype

12 products (`p1`–`p12`, each with Arabic + English title, price, old price, discount %, rating,
review count, category index), 8 categories, 6 influencers (each with 2 tagged product ids),
4 orders, 3 addresses, 3 support tickets with message threads, 5 wallet transactions, 3 reviews,
5 specification rows, 5 notifications. Product imagery lives in `design-reference/assets/`
(`p1.jpg`–`p12.jpg`, `hero-1.jpg`).

### 3.4 The real API contract

Two copies of the Postman collection exist. **The authoritative one is
`docs/ECommerce_API_Postman_Collection.json`**, which carries 198 distinct endpoints. The copy under
`design-reference/uploads/BRAND HUB (6)/uploads/` is an earlier, smaller export and is superseded
(decision D18).

The API is Spring Boot at `http://localhost:8081/api/v1`, JWT bearer auth, role-based across
`ROLE_ADMIN`, `ROLE_SELLER`, `ROLE_SUPPORT`, a delivery role, and customer.

**Endpoints the customer app consumes**

| Area               | Endpoints                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth               | `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/verify-email` |
| Catalogue          | `GET /products`, `/products/featured`, `/products/new-arrivals`, `/products/best-sellers`, `/products/search?q=`, `/products/{id}`, `/products/category/{id}`             |
| Categories         | `GET /categories/tree`, `/categories/{id}`, `/categories/slug/{slug}`                                                                                                     |
| Search             | `GET /search/products?q=&page=&size=`                                                                                                                                     |
| Images             | `GET {appUrl}{productImageUrl}`, `{categoryImageUrl}`, `{appUrl}{sellerProfileImageUrl}`, `GET /users/{userId}/profile-image`                                             |
| Sellers            | `GET /sellers`, `GET /sellers/{id}/products`, `GET /sellers/{id}/profile-image`                                                                                           |
| Cart               | `GET /cart`, `POST /cart/items`, `PUT /cart/items/{id}?quantity=`, `DELETE /cart/items/{id}`, `DELETE /cart`                                                              |
| Orders             | `POST /orders`, `GET /orders`, `GET /orders/{id}`, `POST /orders/{id}/cancel?reason=`                                                                                     |
| Areas and shipping | `GET /areas`, `GET /areas/governorate/{name}`, `GET /areas/{id}`, `GET /shipping-rates`                                                                                   |
| Returns            | `POST /returns`, `GET /returns`, `GET /returns/{id}`                                                                                                                      |
| Support            | `POST /support/tickets`, `GET /support/tickets`, `GET /support/tickets/{id}`, `POST /support/tickets/{id}/messages`, and attachment upload and listing                    |
| Wallet             | `GET /wallet`, `POST /wallet/charge`, `GET /wallet/transactions`                                                                                                          |
| Wallet transfers   | `GET /wallet/transfers/settings`, `POST /wallet/transfers/recipient-preview`, `POST /wallet/transfers`, `GET /wallet/transfers`, `GET /wallet/transfers/{id}`             |
| Gifts              | `POST /gifts`, `GET /gifts/sent`, `GET /gifts/received`, `POST /gifts/{id}/claim`, `POST /gifts/{id}/cancel`                                                              |
| Payments           | `GET /payments/PAYMOB/status?orderId=`, plus a server-side PAYMOB webhook                                                                                                 |
| Profile            | `GET /users/me`, `PUT /users/me`, `PATCH /users/me/password`                                                                                                              |
| Addresses          | `GET` and `POST` on `/users/me/addresses`, `PUT` and `DELETE` on `/users/me/addresses/{id}`, `POST /users/me/addresses/{id}/set-default`                                  |
| Wishlist           | `GET /wishlist`, `POST` and `DELETE` on `/wishlist/{productId}`                                                                                                           |
| Reviews            | `GET /reviews/product/{id}`, `POST /reviews`                                                                                                                              |
| Coupons            | `GET /coupons`, `POST /coupons/validate`                                                                                                                                  |
| Notifications      | `GET /notifications?isRead=&page=&size=`                                                                                                                                  |

**Request shapes that constrain the UI**

| Endpoint                   | Body                                                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `POST /cart/items`         | `{ productId, variantId, quantity }`. `variantId` is required, which is what forces D8                                 |
| `POST /orders`             | `{ shippingAddressId, couponCode?, paymentMethod?, walletPayment?, notes? }`                                           |
| `POST /reviews`            | `{ productId, rating, comment }`                                                                                       |
| `POST /returns`            | `{ orderId, reason }`. The reason is free text, not an enum                                                            |
| `POST /support/tickets`    | `{ orderId?, category, priority, subject, description }`. Category and priority are enums such as `ORDER` and `NORMAL` |
| `POST /gifts`              | `{ recipient, amount, currency, occasion, message, deliveryMethod, senderMode, scheduledAt }`. The currency is `OMR`   |
| `POST /wallet/charge`      | `{ amount, paymentMethod }` where the method is `PAYMOB`                                                               |
| `POST /wallet/transfers`   | `{ recipientEmail, amount, message, password }`. The sender re-enters their password                                   |
| `POST /users/me/addresses` | `{ fullName, phone, addressLine1, addressLine2?, city, state?, postalCode?, country, isDefault }`                      |

**Conventions that shape the data layer**

- **Idempotency.** `POST /orders`, `POST /wallet/charge` and `POST /wallet/transfers` accept an
  `Idempotency-Key` header. Every money-moving mutation must send one.
- **Envelopes are mixed.** Newer endpoints return `{ success, data }`, where `data` may itself be a
  Spring `Page` with a `content` array. Older endpoints return the `Page` or the entity directly.
  The DTO layer normalises both at the boundary (decision D22).
- **Auth.** Login returns `{ accessToken, refreshToken, user: { id, … } }`.
- **Delivery OTP.** The order object carries `deliveryOtp`. The courier submits it to
  `POST /delivery/orders/{id}/delivered` and the server compares.
- **Areas carry the shipping economics.** An area is
  `{ name, governorate, shippingPrice, minOrderAmount, estimatedDeliveryDays }`, with real Omani
  governorates such as Muscat. This supplies the delivery fee and the free-delivery threshold that
  the prototype only hinted at.
- **No `Accept-Language` anywhere**, and no `nameAr` or `nameEn` fields. Catalogue content is
  single-language, so GAP-7 remains open.

**This contract is the single most valuable artefact in the reference.** It means the DTO layer can
be written against the _real_ API today, and JSON Server can be shaped to serve that same contract.
Migration then reduces to a base-URL change. See §18 and §19.

### 3.5 Gaps between the UI and the API contract

Reassessed against the expanded collection on 2026-09-02. **Four of the six features that previously
had no contract now have one.** One feature remains entirely uncontracted.

| #      | UI shows                                                           | API provides                                                                                                 | Resolution                                                                                                                                                                           |
| ------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GAP-1  | Influencers, follows, shoppable posts, stories                     | Nothing                                                                                                      | **Still open.** The only feature with no contract at all. Domain port with a mock-only implementation, and endpoints specified for the backend (FA1).                                |
| GAP-2  | Support tickets with threads                                       | `/support/tickets` with messages and attachments                                                             | **Closed.** A real HTTP repository from the start. Category and priority become domain enums mapped onto the server's.                                                               |
| GAP-3  | Return requests with reasons                                       | `POST /returns`, `GET /returns`, `GET /returns/{id}`                                                         | **Closed**, with one caveat: the API takes a free-text `reason` while the prototype offers five fixed choices. The five map to text on the way out.                                  |
| GAP-4  | Gift-money to a recipient                                          | `/gifts` with sent, received, claim and cancel                                                               | **Closed.** The API also offers `/wallet/transfers`, a distinct person-to-person transfer the prototype does not show.                                                               |
| GAP-5  | Delivery OTP on order detail                                       | `order.deliveryOtp`                                                                                          | **Closed.** The field is on the order the customer already fetches.                                                                                                                  |
| GAP-6  | Delivery slots and the "Hub Express" badge                         | `/areas` and `/shipping-rates` give price, minimum order and `estimatedDeliveryDays` per area                | **Partly closed.** Cost and expected days are contracted. Time slots are not: nothing expresses "within 2 hours" against "tomorrow 9am to 2pm", and no express flag exists. See D21. |
| GAP-7  | Bilingual product titles                                           | Single `name` and `description`, no `Accept-Language`                                                        | **Still open.** D9 stands, tracked as FA3.                                                                                                                                           |
| GAP-8  | Onboarding leads with phone plus OTP, and Apple and Google sign-in | Email and password only                                                                                      | **Still open.** D12 stands: email and password ship, the OTP screen runs on mock endpoints.                                                                                          |
| GAP-9  | PDP shows four colour swatches, no size picker                     | `POST /cart/items` still requires `variantId`                                                                | **Unchanged.** D8 stands: the PDP gains a variant selector.                                                                                                                          |
| GAP-10 | Product cards show rating and review count                         | No `averageRating` or `reviewCount` on any product response                                                  | **Still open.** D14 stands, tracked as FA2.                                                                                                                                          |
| GAP-11 | Prices in OMR and Omani cities                                     | Address sample data is Saudi, but `/areas` uses Omani governorates and `POST /gifts` sends `currency: "OMR"` | **Closed on currency and market.** The address shape is unchanged, so D13 stands.                                                                                                    |
| GAP-12 | Cart total excludes VAT while checkout adds it                     | Nothing either way                                                                                           | **Unchanged.** D10 applies BR3 once, consistently.                                                                                                                                   |
| GAP-13 | Free-shipping hint is a fixed string                               | `area.minOrderAmount`                                                                                        | **Closed.** The threshold is real server data, not a configured guess. D11 is amended and FA6 closes.                                                                                |
| GAP-14 | Slot fee and cash-on-delivery fee are displayed                    | `area.shippingPrice` supplies the delivery fee. No payment-method fee exists                                 | **Partly closed.** Delivery cost is contracted. A cash-on-delivery surcharge is not.                                                                                                 |
| GAP-15 | Filters include "in stock" and "express only"                      | Variants carry stock. No express flag                                                                        | **Partly closed.** Stock is real. Express is not, and follows GAP-6.                                                                                                                 |

---

## 4. Application features

Verified against the prototype. Nothing here is invented.

**F1 Onboarding & authentication** — hero onboarding, phone entry, Apple/Google buttons, guest
entry, email sign-in / sign-up with a customer/seller account-type switch, password visibility
toggle, remember-me, forgot-password link, and a seller-pending notice.

**F2 Home** — delivery-location header, notifications bell with unread dot, search entry, influencer
avatar rail, promotional gradient banner, 8 category tiles, "today's deals" product row.

**F3 Browse & category** — categories tab with a vertical category rail plus a product grid; a
category detail screen with hero, sub-filter chips, in-stock toggle, filter entry, product grid,
empty state, and "all products".

**F4 Search** — live query input, trending-term chips, seller-scoped search with a removable chip,
result count, sort chips, result list, empty state with a clear-filters action.

**F5 Filter sheet** — bottom sheet with sort, in-stock and express toggles, min/max price, rating
chips, clear-all, and an apply button that shows the live match count.

**F6 Product detail** — image hero with pager dots, express + discount badges, title, rating and
review count, price with strikethrough, colour swatches, seller strip linking to the store,
delivery and returns lines, related products, wishlist toggle, and a sticky add-to-cart / buy-now bar.

**F7 Cart** — item list with quantity stepper, free-shipping hint, promo-code row, totals block,
empty state, checkout button.

**F8 Checkout** — three-step indicator, delivery address with change action, two delivery slots,
four payment methods (Thawani, card, Apple Pay, cash on delivery), order summary with VAT,
place-order action.

> The API contracts delivery by **area**, not by time slot: an area carries a shipping price, a
> minimum order for free delivery, and an estimated number of days. The prototype's two-hour and
> next-morning slots have no counterpart. D21 resolves this by showing the area's cost and estimated
> days in the slot's place for v1.

**F9 Order confirmation** — success mark, order number, four-step tracking timeline, courier card,
continue-shopping.

**F10 Wishlist** — saved-product grid with remove and add-to-cart per card.

**F11 Influencers** — influencer list, influencer profile with bio, follow/message, post/follower/
product stats, and shoppable posts carrying a tagged product that opens the PDP.

**F12 Seller store** — store header, verified meta, rating/sales/products stats, product grid,
view-all into a seller-scoped search.

**F13 Notifications** — list with icon token, title, body, timestamp, unread background, mark-all-read.

**F14 Account** — profile header, three order stats, nine navigation rows with counts, language
switch, sign out.

**F15 Orders** — order list with thumbnail, number, status pill, date, item count, total; order
detail with a four-step timeline, delivery OTP panel, item list, shipping address, totals,
payment status, and request-return / contact-support actions.

**F16 Returns** — reason radio list, free-text note, submit with confirmation toast.

**F17 Addresses** — address cards with default badge, edit / set-default / delete, and an
add-address form with name, phone, city select and details textarea.

**F18 Wallet** — balance card, quick top-up amounts, custom amount, "top up via Paymob" action,
transaction history with signed amounts.

**F19 Gift money** — recipient, amount, occasion chips, message, send, and a gift history list.

**F20 Support** — new-ticket form (category chips, priority chips, related-order select, subject,
description), my-tickets list, and a ticket detail with a two-sided message thread and a reply box.

**F21 Payment result** — success / failed / pending variants with amount, back-to-wallet, and a
retry action on failure only.

**F22 Cross-cutting** — global toast, cart badge on the tab bar, AR/EN switch, platform-aware chrome.

---

## 5. Screen inventory

27 screens plus one overlay. IDs match the prototype's `screen` state values.

| #   | ID              | Arabic           | English         | Tab root        | Auth         | Key data                             |
| --- | --------------- | ---------------- | --------------- | --------------- | ------------ | ------------------------------------ |
| 1   | `onboarding`    | الدخول           | Onboarding      | —               | Public       | Static copy, hero image              |
| 2   | `login`         | تسجيل الدخول     | Login / Sign up | —               | Public       | Auth form state                      |
| 3   | `home`          | الرئيسية         | Home            | **Home**        | Public       | Influencers, categories, deals       |
| 4   | `cats`          | الفئات           | Browse          | **Browse**      | Public       | Category rail, sub-chips, products   |
| 5   | `category`      | صفحة الفئة       | Category        | —               | Public       | Category, filtered products          |
| 6   | `search`        | البحث            | Search          | —               | Public       | Query, trending, results, filters    |
| 7   | `pdp`           | المنتج           | Product         | —               | Public       | Product, related, wishlist state     |
| 8   | `cart`          | العربة           | Cart            | **Cart**        | Public       | Cart items, totals                   |
| 9   | `checkout`      | الدفع            | Checkout        | —               | **Required** | Address, slot, payment, summary      |
| 10  | `confirm`       | تأكيد الطلب      | Confirmation    | —               | Required     | Order number, tracking, courier      |
| 11  | `wishlist`      | المفضلة          | Wishlist        | —               | Required     | Saved products                       |
| 12  | `influencers`   | المؤثرون         | Influencers     | **Influencers** | Public       | Influencer list                      |
| 13  | `influencer`    | ملف مؤثر         | Influencer      | —               | Public       | Profile, stats, posts                |
| 14  | `seller`        | متجر البائع      | Seller store    | —               | Public       | Store, stats, products               |
| 15  | `notifications` | الإشعارات        | Notifications   | —               | Required     | Notification list                    |
| 16  | `account`       | حسابي            | Account         | **Account**     | Required     | User, stats, menu rows               |
| 17  | `orders`        | طلباتي           | My orders       | —               | Required     | Order list                           |
| 18  | `orderDetail`   | تفاصيل الطلب     | Order detail    | —               | Required     | Order, steps, OTP, items, totals     |
| 19  | `returnForm`    | طلب إرجاع        | Return request  | —               | Required     | Order ref, reasons, note             |
| 20  | `addresses`     | العناوين         | Addresses       | —               | Required     | Address list, default                |
| 21  | `addrForm`      | إضافة عنوان      | Address form    | —               | Required     | Address fields, cities               |
| 22  | `wallet`        | المحفظة          | Wallet          | —               | Required     | Balance, amounts, transactions       |
| 23  | `gifts`         | إهداء رصيد       | Gift money      | —               | Required     | Recipient, amount, occasion, history |
| 24  | `supportHome`   | الدعم            | Support         | —               | Required     | Ticket form, ticket list             |
| 25  | `ticket`        | تذكرة الدعم      | Ticket detail   | —               | Required     | Ticket meta, thread, reply           |
| 26  | `profileEdit`   | الملف الشخصي     | Profile         | —               | Required     | First/last name, phone, email        |
| 27  | `payResult`     | نتيجة الدفع      | Payment result  | —               | Required     | Status, amount                       |
| —   | `filterSheet`   | الفلاتر والترتيب | Filter sheet    | Overlay         | Public       | Sort, toggles, price, rating         |

**The auth column is decision D3, approved.** The prototype lets a guest reach every screen; the
mapping above applies the ordinary marketplace rule. Browsing is public. **The cart is fully usable
as a guest**, including adding, changing quantity and removing, so the sign-in prompt arrives at
checkout rather than at the first tap. Everything bound to an identity requires a session.

### Screen states present in the reference

| Screen     | Empty                                                     | Error | Loading |
| ---------- | --------------------------------------------------------- | ----- | ------- |
| `cart`     | Yes — "your cart is empty" + shop-now                     | No    | No      |
| `category` | Yes — no results + try-other                              | No    | No      |
| `search`   | Yes — no results + clear filters; plus a pre-query prompt | No    | No      |
| `wishlist` | String exists (`emptyWish`) but no rendered branch        | No    | No      |
| All others | No                                                        | No    | No      |

**Loading and network-error states do not exist anywhere in the reference.** They must be designed.
§22 specifies them from the reference's existing visual vocabulary rather than inventing a new one.

---

## 6. User flows

### UF1 — First run to home

`onboarding` → phone / Apple / Google / guest → `home`. Alternatively `onboarding` → "email" →
`login` → sign-in or sign-up → `home`. Choosing the **seller** account type on sign-up raises a
toast ("seller accounts are reviewed by an admin") and does **not** navigate.

### UF2 — Browse to purchase (primary revenue flow)

`home` → category tile → `category` → product → `pdp` → add to cart → `cart` → checkout →
`checkout` → place order → `confirm` → continue shopping → `home`.
"Buy now" on the PDP adds the item and jumps straight to `checkout`.

### UF3 — Search to purchase

Any screen → search entry → `search` → type or tap a trending term → optionally open the filter
sheet, set sort / toggles / price / rating → apply → result → `pdp` → …UF2.

### UF4 — Social commerce

`home` influencer avatar **or** Influencers tab → `influencers` → `influencer` → shoppable post →
tagged product → `pdp` → …UF2.

### UF5 — Seller discovery

`pdp` → seller strip → `seller` → product grid or "view all" → `search` scoped to that seller
(chip removable to clear the scope).

### UF6 — Order tracking and after-sales

`account` → `orders` → `orderDetail`. Delivered orders expose "request return" → `returnForm` →
submit → toast + back to `orders`. Any order exposes "contact support" → `supportHome`.

### UF7 — Wallet top-up

`account` → `wallet` → pick a quick amount or type one → "top up via Paymob" → `payResult`
(success / failed / pending) → back to `wallet`, or retry on failure.

### UF8 — Support

`account` → `supportHome` → fill category, priority, related order, subject, description → submit
(toast) — or open an existing ticket → `ticket` → read thread → reply (toast).

### UF9 — Address management

`account` → `addresses` → add / edit / set default / delete. Reached from checkout via "change".

### UF10 — Wishlist

Heart on any product card or the PDP toggles membership. `account` → `wishlist` → remove or add
to cart.

### Global interactions

Every mutation raises a **toast** for ~1.9 s. The cart tab badge shows the summed quantity.
Back pops a navigation stack. Selecting a tab resets to that tab's root.

---

## 7. Architecture overview

```
┌───────────────────────────────────────────────────────────────┐
│  PRESENTATION            screens · components · navigation    │
│                          view-models (hooks) · theme · i18n   │
└───────────────────────────┬───────────────────────────────────┘
                            │ calls use cases, receives entities
┌───────────────────────────▼───────────────────────────────────┐
│  DOMAIN                  entities · value objects · use cases  │
│  (zero dependencies)     repository PORTS · business rules     │
└───────────────────────────▲───────────────────────────────────┘
                            │ implements ports
┌───────────────────────────┴───────────────────────────────────┐
│  DATA                    repository impls · data sources       │
│                          DTOs · mappers                        │
└───────────────────────────┬───────────────────────────────────┘
                            │ uses
┌───────────────────────────▼───────────────────────────────────┐
│  INFRASTRUCTURE          HTTP client · secure storage · config │
│                          logger · device APIs                  │
└───────────────────────────┬───────────────────────────────────┘
                            ▼
                JSON Server today  →  Spring REST API later
```

A single request travels:

```
Screen → useProductDetail() → GetProductDetailUseCase → ProductRepository (port)
       → HttpProductRepository (impl) → ProductRemoteDataSource → HttpClient → server
                                       ← ProductDto ← JSON
       ← Product (entity) ← ProductMapper
```

**The composition root** (`src/app/di/`) is the only place that knows which repository
implementation is bound to which port. Swapping JSON Server for the real API is a change to that
file plus configuration — nothing else.

---

## 8. Clean Architecture layers

### 8.1 Domain — the centre

Contains entities, value objects, use cases, repository interfaces, domain errors, and business
rules. **Zero imports** from React, React Native, Axios, TanStack Query, navigation, storage, or any
DTO. Every file is plain TypeScript, runnable in Node.

### 8.2 Data — implements the domain's ports

Repository implementations, remote and local data sources, DTOs (exact server shapes), mappers
(DTO ↔ entity), and DTO validation. Knows about HTTP and about the domain; knows nothing about
React or screens.

### 8.3 Infrastructure — external technical concerns

HTTP client and interceptors, token storage, key-value preferences, environment configuration,
logging, and device APIs. Exposes small interfaces (`HttpClient`, `SecureStore`, `KeyValueStore`)
so the data layer depends on abstractions rather than on Axios or Expo modules.

### 8.4 Presentation — everything the user sees

Screens, feature components, shared components, navigation, theme, i18n, and **view-model hooks**.
A view-model hook is the only place in the presentation layer that touches a use case. Components
receive data and callbacks as props.

### 8.5 App — composition root

Provider tree, dependency wiring, the navigation container, and the root error boundary. This is
the one layer allowed to import from all others.

### 8.6 Core — shared kernel

`Result<T, E>`, the error base types, `Money`, and small pure utilities. Depended on by everything,
depends on nothing. Kept deliberately tiny; it is not a dumping ground.

---

## 9. Dependency rules

```
app  ──────────▶ presentation ──▶ domain ◀── data ──▶ infrastructure
 │                    │              ▲        │             │
 │                    └──────────────┘        └─────────────┘
 └────────────▶ all layers (composition root only)

core ◀── every layer.   core imports nothing.
```

**The rules, in order of importance**

| #   | Rule                                                                                                        |
| --- | ----------------------------------------------------------------------------------------------------------- |
| DR1 | `domain` imports only from `domain` and `core`. Never React, RN, HTTP, storage, or DTOs.                    |
| DR2 | `presentation` imports from `domain`, `core` and `presentation`. **Never** from `data` or `infrastructure`. |
| DR3 | `data` imports from `domain`, `core`, `infrastructure` and `data`. Never from `presentation`.               |
| DR4 | `infrastructure` imports from `core` and `infrastructure` only.                                             |
| DR5 | `core` imports nothing outside `core`.                                                                      |
| DR6 | Only `app` may import from every layer.                                                                     |
| DR7 | A DTO type may never escape `data`. Presentation types are entities or view models.                         |
| DR8 | A React component may never import a repository, a data source, or an HTTP client.                          |
| DR9 | Cross-feature imports go through a feature's public `index.ts` barrel, never deep paths.                    |

**Enforcement is mechanical, not cultural.** `eslint-plugin-boundaries` defines the layers and the
allowed edges; violations fail lint, and lint fails CI. A `dependency-cruiser` rule additionally
forbids cycles. A boundary violation is a build failure, not a review comment.

---

## 10. Project / folder structure

```
BrandHub/
├── architecture.md
├── plan.md
├── app.config.ts                 # Expo config, reads .env
├── package.json  tsconfig.json  .eslintrc.cjs  jest.config.ts
├── .env.development  .env.staging  .env.production
├── design-reference/             # untouched
├── mock-server/                  # JSON Server + contract middleware
│   ├── db.json                   # seeded from the reference
│   ├── server.ts                 # Express host wrapping json-server
│   ├── middleware/               # envelope, pagination, auth, latency, faults
│   └── seed/                     # generators that build db.json
├── e2e/                          # Maestro flows
└── src/
    ├── app/
    │   ├── App.tsx
    │   ├── di/                   # container.ts — the ONLY wiring file
    │   ├── providers/            # Query, Theme, I18n, Session, SafeArea, ErrorBoundary
    │   └── navigation/           # navigators, linking, param lists, guards
    ├── core/
    │   ├── result/               # Result<T,E>, ok(), err()
    │   ├── errors/               # AppError hierarchy
    │   ├── money/                # Money value object (OMR, 3 dp)
    │   └── types/
    ├── domain/
    │   ├── catalog/              # Product, Category, Review, ports, use cases
    │   ├── cart/
    │   ├── checkout/
    │   ├── orders/
    │   ├── identity/
    │   ├── addresses/
    │   ├── wallet/
    │   ├── wishlist/
    │   ├── social/               # Influencer, Post  (no API contract — GAP-1)
    │   ├── support/              # Ticket, Message   (no API contract — GAP-2)
    │   └── notifications/
    ├── data/
    │   └── <same slices>/
    │       ├── dto/              # exact server shapes
    │       ├── mappers/          # DTO → entity, entity → request DTO
    │       ├── datasources/      # remote (HTTP) and local (cache/prefs)
    │       └── repositories/     # implement the domain ports
    ├── infrastructure/
    │   ├── http/                 # HttpClient port + Axios adapter, interceptors
    │   ├── storage/              # SecureStore + KeyValueStore ports and adapters
    │   ├── config/               # typed env access
    │   ├── i18n/                 # i18next setup, AR/EN resources, RTL bootstrap
    │   └── logging/
    ├── presentation/
    │   ├── theme/                # tokens, typography, spacing, ThemeProvider
    │   ├── components/           # shared, feature-agnostic UI
    │   │   ├── primitives/       # Text, Box, Pressable, Icon, Image
    │   │   ├── controls/         # Button, IconButton, Input, Select, Chip,
    │   │   │                     # Switch, Radio, Stepper, SearchField
    │   │   ├── surfaces/         # Card, Sheet, Modal, Divider, Badge, Pill
    │   │   ├── feedback/         # Toast, Skeleton, Spinner, EmptyState,
    │   │   │                     # ErrorState, RetryBanner
    │   │   └── layout/           # Screen, Header, Section, Rail, Grid, StickyBar
    │   ├── features/
    │   │   └── <feature>/
    │   │       ├── screens/
    │   │       ├── components/
    │   │       ├── hooks/        # view-models
    │   │       └── index.ts      # public barrel
    │   └── formatting/           # price, date, number formatters (locale-aware)
    └── test/
        ├── builders/             # entity + DTO test builders
        ├── doubles/              # in-memory repositories, fake clock
        ├── msw/                  # HTTP handlers for integration tests
        └── render.tsx            # RNTL render with all providers
```

**Slice inside layer, not layer inside slice.** Layers are the top-level split because the boundary
rules are per-layer and lint enforces them per-layer. Feature slices repeat inside each layer, so a
feature is still greppable as three sibling folders.

---

## 11. Domain layer

### 11.1 Entities and value objects

| Slice           | Entities                                                    | Value objects                                      |
| --------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| `catalog`       | `Product`, `ProductVariant`, `Category`, `Review`, `Seller` | `ProductId`, `Rating`, `Discount`, `Slug`          |
| `cart`          | `Cart`, `CartLine`                                          | `Quantity`                                         |
| `checkout`      | `CheckoutDraft`                                             | `PaymentMethod`, `DeliverySlot`                    |
| `orders`        | `Order`, `OrderLine`, `OrderTimeline`, `ReturnRequest`      | `OrderNumber`, `OrderStatus`, `DeliveryOtp`        |
| `identity`      | `User`, `Session`                                           | `Email`, `PhoneNumber`, `AccountType`              |
| `addresses`     | `Address`                                                   | `AddressLabel`, `City`                             |
| `wallet`        | `Wallet`, `WalletTransaction`, `Gift`                       | `TransactionType`                                  |
| `wishlist`      | `WishlistItem`                                              | —                                                  |
| `social`        | `Influencer`, `ShoppablePost`                               | `Handle`, `FollowerCount`                          |
| `support`       | `Ticket`, `TicketMessage`                                   | `TicketCategory`, `TicketPriority`, `TicketStatus` |
| `notifications` | `AppNotification`                                           | `NotificationKind`                                 |
| `core`          | —                                                           | `Money`                                            |

Entities are immutable readonly types with pure helper functions, not classes with setters. Only
`Money` and a few genuinely rule-bearing value objects use a class with a private constructor and a
static factory that returns `Result`.

### 11.2 `Money` — the one value object that must not be shortcut

OMR is a **three-decimal** currency (1 rial = 1000 baisa). Floating-point arithmetic on prices is a
correctness bug, not a style preference — the prototype already shows it: `subtotal * 0.05` for VAT
on float prices. `Money` stores an **integer count of baisa**, exposes `plus`, `minus`,
`times(qty)`, `percentage(n)`, `compare`, and formats through the presentation layer's locale
formatter. Rounding is half-up at the baisa. No arithmetic on prices happens outside `Money`.

### 11.3 Business rules that belong in the domain

| Rule | Statement                                                                                                        | Source                                                        |
| ---- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| BR1  | Cart subtotal = Σ(unit price × quantity).                                                                        | Prototype.                                                    |
| BR2  | VAT = 5% of subtotal.                                                                                            | Prototype.                                                    |
| BR3  | Order total = subtotal + VAT + area shipping price + payment-method fee − coupon discount.                       | Decision D10, amended by D21.                                 |
| BR4  | Decrementing a line to zero removes it.                                                                          | `bump()`.                                                     |
| BR5  | A cart with zero lines cannot proceed to checkout.                                                               | Prototype.                                                    |
| BR6  | Wishlist membership toggles; it never duplicates.                                                                | `toggleWish()`.                                               |
| BR7  | Exactly one address is the default; setting a new one clears the previous.                                       | Prototype.                                                    |
| BR8  | Returns may be requested only for delivered orders.                                                              | `canReturn: o.step === 3`.                                    |
| BR9  | Order status advances Created → Processing → Shipped → Delivered.                                                | Prototype.                                                    |
| BR10 | Seller sign-up creates a pending account and does not grant a session.                                           | `submitAuth()`.                                               |
| BR11 | A discount percentage is derived from base and sale price, not stored independently.                             | Reconciles prototype `disc` with API `basePrice`/`salePrice`. |
| BR12 | Checkout requires an authenticated session, a shipping address and a payment method.                             | Decision D3.                                                  |
| BR13 | Delivery is free at or above the shipping area's `minOrderAmount`; below it the cart shows the remaining amount. | Decision D11, amended by D21.                                 |

### 11.4 Repository ports

One port per aggregate, named for the domain concept, returning entities and `Result`:
`ProductRepository`, `CategoryRepository`, `ReviewRepository`, `SellerRepository`,
`CartRepository`, `OrderRepository`, `AuthRepository`, `UserRepository`, `AddressRepository`,
`WalletRepository`, `WishlistRepository`, `InfluencerRepository`, `SupportRepository`,
`NotificationRepository`, `CouponRepository`.

`SellerRepository` was added in Phase 7 for the seller store screen. The contract has
`GET /sellers`, `GET /sellers/{id}/products` and the profile image but **no `GET /sellers/{id}`**,
so `getById` is a lookup over the seller directory page inside `SellerRemoteDataSource` rather than
a request of its own. The port is the shape the screen needs, so a real single-seller endpoint later
changes one method in one implementation.

Ports are **narrow**: `ProductRepository` exposes `search(criteria)`, `getById(id)`,
`getRelated(id)`, `getByCategory(categoryId, page)`, `getBestSellers()`, `getNewArrivals()`,
`getFeatured()` — no generic `query(anything)` escape hatch, because a generic hatch is how server
concerns leak upward.

### 11.5 Use cases

One class or function per meaningful operation, with a single `execute` method returning
`Promise<Result<T, AppError>>`. A use case exists when there is a rule, a policy, an orchestration,
or a guard. A use case that only forwards to a repository is **not** created; the view-model calls
the repository port directly through the container. Examples that earn their existence:

`AddToCartUseCase` (quantity and stock guards), `CalculateCartTotalsUseCase` (BR1–BR3),
`PlaceOrderUseCase` (BR5, BR12, then create), `ToggleWishlistUseCase` (BR6),
`RequestReturnUseCase` (BR8), `SetDefaultAddressUseCase` (BR7), `SignInUseCase` /
`SignUpUseCase` (BR10, session persistence), `TopUpWalletUseCase`, `ApplyCouponUseCase`,
`SearchProductsUseCase` (filter and sort criteria assembly),
`GetProductDetailUseCase` (D8 variant resolution) and `GetRelatedProductsUseCase` (excludes the
product being viewed).

There is deliberately **no** `GetProductReviewsUseCase` or `GetSellerStoreUseCase`: neither carries
a rule, so the PDP and the seller store call `ReviewRepository` and `SellerRepository` through the
container directly, as §11.5's first paragraph requires.

---

## 12. Presentation layer

### 12.1 The four-part split

Every feature screen decomposes into exactly four kinds of file. This is how §4's "no giant screens"
rule is made concrete.

| Part                   | Responsibility                                                                            | Forbidden                                                               |
| ---------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Screen**             | Compose sections, read route params, wire the view-model to components, own nothing else. | JSX longer than ~120 lines; any `fetch`; any calculation.               |
| **View-model hook**    | Call use cases, expose `{ status, data, error, actions }`, map entities to view models.   | Rendering; navigation side effects beyond calling a passed-in navigate. |
| **Feature components** | Render one section, take props, emit callbacks.                                           | Data fetching; importing a use case.                                    |
| **View models**        | Plain display-ready shapes (already formatted strings).                                   | Any behaviour.                                                          |

A screen that grows past roughly 150 lines is a signal that a section wants to become a feature
component. A view-model hook past roughly 120 lines is a signal that it holds more than one
responsibility and should split (for example `useCartItems` + `useCartTotals`).

### 12.2 Feature inventory

`onboarding`, `auth`, `home`, `browse`, `category`, `search`, `product`, `cart`, `checkout`,
`orderConfirmation`, `wishlist`, `influencers`, `sellerStore`, `notifications`, `account`,
`orders`, `returns`, `addresses`, `wallet`, `gifts`, `support`, `profile`, `paymentResult`.

### 12.3 Formatting

All user-visible formatting lives in `presentation/formatting/`: `formatPrice` (3 decimals, LTR
numerals inside RTL text, currency label placement per locale), `formatDate`, `formatCount`
(`2.4K`), `formatRelativeTime`. Entities never carry pre-formatted strings; view models do.

**Numeric direction matters.** The prototype wraps every price and handle in `direction: 'ltr'`
inside an RTL page. React Native equivalents must set `writingDirection: 'ltr'` on those `Text`
nodes or Arabic layout will reorder the digits.

---

## 13. Data layer

### 13.1 Composition

```
Repository impl   orchestrates data sources, maps DTO → entity, converts errors to AppError
   ├── RemoteDataSource   one method per endpoint; returns DTOs; knows URLs and query params
   ├── LocalDataSource    cache and preferences; optional per slice
   └── Mapper             pure functions, unit-tested, no I/O
```

### 13.2 Rules

- A data source method maps 1:1 to an endpoint and returns a **DTO**, never an entity.
- A repository never returns a DTO and never throws; it returns `Result<Entity, AppError>`.
- Mappers are pure and total: given a DTO they always produce an entity or a mapping error.
- Every DTO is **validated at the boundary** with Zod. An unexpected server shape becomes a
  `ContractError` at the edge, not a `undefined is not an object` crash three screens later.
- Where the API has no contract (GAP-1 only, since the expanded collection landed), the repository is still defined by a domain port;
  only the implementation is JSON-Server-specific, and it is named so (`MockInfluencerRepository`).

### 13.3 Caching and offline

TanStack Query holds the server cache in memory with configurable staleness. A thin persistence
layer (`AsyncStorage`) persists only two things: the session and the user's locale. Catalogue
caching to disk is deliberately **not** in v1 — it adds invalidation complexity with no requirement
behind it.

---

## 14. Infrastructure layer

### 14.1 `HttpClient` port

```ts
interface HttpClient {
  request<T>(config: RequestConfig): Promise<HttpResponse<T>>;
}
```

The Axios adapter implements it. The data layer depends on the interface. Interceptors handle: base
URL from config, `Authorization: Bearer` from the token store, `Accept-Language` from the locale
store, request id for tracing, a 15-second timeout, and one automatic refresh-and-retry on 401 with
a single-flight guard so concurrent 401s do not fire N refresh calls.

**Why Axios behind a port:** interceptors, cancellation and error normalisation are mature and would
otherwise be hand-rolled. The port keeps the dependency swappable and keeps the data layer testable
against a fake client. This is the only case where a third-party runtime dependency sits behind an
abstraction, and it earns it.

### 14.2 Storage ports

`SecureStore` (`expo-secure-store`, Keychain / Keystore) holds access and refresh tokens only.
`KeyValueStore` (`AsyncStorage`) holds locale, onboarding-seen and the last delivery location.

### 14.3 Configuration

`infrastructure/config/env.ts` reads `app.config.ts` `extra` values, validates them with Zod at
startup, and exposes a typed frozen object. A missing or malformed variable fails fast in
development with a readable message. No `process.env` access anywhere else in the codebase.

### 14.4 i18n and RTL

`i18next` + `react-i18next`. Arabic is the default and fallback language. Resource files are split
per feature namespace, seeded from `STR` and `EXTRA` in the prototype, which already contain the
complete AR and EN copy for every screen.

RTL is bootstrapped before the first render: `I18nManager.allowRTL(true)` and
`forceRTL(locale === 'ar')`. **Changing direction at runtime requires an app reload on both
platforms** — the app must show a confirm-and-restart flow when the language switch crosses the
direction boundary. This is a platform constraint, not a design choice.

Layout uses **logical properties everywhere**: `start`/`end`, `paddingStart`/`paddingEnd`,
`marginStart`/`marginEnd`, `textAlign: 'left'` only where the prototype means physical-left.
`left`/`right` in a style is a lint error.

---

## 15. Navigation architecture

### 15.1 What the prototype does

`nav(screen)` pushes the current screen onto a single global stack unless the target is one of the
five tab roots (`home`, `cats`, `influencers`, `cart`, `account`), in which case the stack is
cleared. `goBack()` pops. Tabs are hidden on every non-tab screen; the PDP shows a sticky buy bar
in the tab bar's place.

### 15.2 Proposed React Navigation structure

```
RootNavigator (native stack, headerless)
├── AuthStack                  when no session and onboarding not completed
│   ├── Onboarding
│   └── Login
├── MainTabs (bottom tabs)
│   ├── HomeTab       → stack: Home · Category · Search · Product · Seller · Influencer · Notifications
│   ├── BrowseTab     → stack: Browse · Category · Search · Product
│   ├── InfluencersTab→ stack: Influencers · Influencer · Product
│   ├── CartTab       → stack: Cart
│   └── AccountTab    → stack: Account · Orders · OrderDetail · ReturnForm · Addresses ·
│                              AddressForm · Wallet · Gifts · Support · Ticket · Profile ·
│                              Wishlist · Notifications
└── ModalStack (presentation: modal / transparentModal)
    ├── Checkout      (full-screen modal — leaves the tab context)
    ├── OrderConfirmation
    ├── PaymentResult
    └── FilterSheet   (bottom sheet, transparentModal)
```

**Approved deviation from the prototype (D4):** React Navigation preserves each tab's stack when you
switch tabs; the prototype clears the stack. Per-tab state is the platform convention and the better
experience, so **stacks are preserved**, and a tab resets to its root only when the user taps the
already-active tab.

**Product appears in three tab stacks.** That is intentional and standard: a product opened from
Home stays in the Home tab. The screen is registered once and reused; the route is duplicated in
each stack's param list.

### 15.3 Route parameters

| Route               | Params                                                                               |
| ------------------- | ------------------------------------------------------------------------------------ |
| `Category`          | `{ categoryId: string; categoryName?: string }`                                      |
| `Search`            | `{ query?: string; sellerId?: string; categoryId?: string }`                         |
| `Product`           | `{ productId: string }`                                                              |
| `Influencer`        | `{ influencerId: string }`                                                           |
| `Seller`            | `{ sellerId: string }`                                                               |
| `OrderDetail`       | `{ orderId: string }`                                                                |
| `ReturnForm`        | `{ orderId: string }`                                                                |
| `AddressForm`       | `{ addressId?: string }` — absent means create                                       |
| `Ticket`            | `{ ticketId: string }`                                                               |
| `PaymentResult`     | `{ status: 'success' \| 'failed' \| 'pending'; amount: string; reference?: string }` |
| `OrderConfirmation` | `{ orderId: string }`                                                                |
| `FilterSheet`       | `{ initial: SearchCriteria; returnTo: string }`                                      |

Params carry **ids, never entities**. A screen fetches what it needs from its id, which keeps deep
links and state restoration working for free.

### 15.4 Authentication boundary

A `SessionProvider` exposes `status: 'loading' | 'authenticated' | 'guest'`. The root navigator
renders `AuthStack` or `MainTabs` from that status; it does not imperatively navigate. Individual
gated screens are wrapped by a `RequireAuth` guard that redirects to `Login` with a `returnTo`
param, so a guest tapping "checkout" signs in and lands back on checkout.

### 15.5 Deep linking

A linking configuration is defined from the start even though nothing consumes it yet, because
retrofitting it later forces param-shape changes. Proposed scheme `brandhub://` with paths
`product/:productId`, `category/:categoryId`, `order/:orderId`, `influencer/:handle`,
`payment/result`. The payment-result path matters: a real Paymob/Thawani redirect returns to the app
through exactly this mechanism.

---

## 16. State management strategy

### 16.1 Classification

| Kind                    | Examples                                                                                | Owner                                    |
| ----------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------- |
| **Server state**        | products, categories, cart, orders, wallet, addresses, tickets, notifications, wishlist | **TanStack Query**                       |
| **Global client state** | session, locale + direction, delivery location, toast queue                             | **Zustand**, one small store per concern |
| **Screen state**        | search criteria before apply, checkout draft, active tab index                          | `useReducer` in the view-model hook      |
| **Form state**          | every form in §25                                                                       | **React Hook Form**                      |
| **Local UI state**      | pressed, expanded, carousel index, sheet open                                           | `useState` in the component              |

### 16.2 Why TanStack Query

Nearly all state in this app is a cached copy of server data. Query gives caching, deduplication,
background refetch, retry with backoff, mutation with optimistic updates and rollback, and — most
relevant here — a first-class `status`/`error` model that maps directly onto §22's four render
states. Hand-rolling that in Zustand or Redux means reimplementing it worse.

**Trade-off:** Query is a presentation-layer dependency that caches _entities_, which puts a cache
in front of the repository. That is accepted deliberately: query keys are derived from use-case
inputs, and the `queryFn` calls a use case, so the domain remains unaware of Query. The alternative
— caching inside repositories — would push cache-invalidation policy into the data layer where it
has no UI context.

### 16.3 Why Zustand for the small global slices

Session and locale are read by many screens and change rarely. Zustand is ~1 KB, has no provider
boilerplate, and its stores are plain objects that can be reset between tests. Redux Toolkit would
add ceremony for perhaps three slices; Context alone would re-render the tree on every change.

### 16.4 Rejected

- **Redux Toolkit** — the store would be nearly empty once Query owns server state.
- **Cart as global client state** — the cart is server state (`GET /cart`); mirroring it locally
  creates two sources of truth. Optimistic Query mutations give the same instant feedback.
- **Context for server data** — no caching, no invalidation, whole-tree re-renders.
- **MobX / Jotai / Recoil** — no requirement they answer that the pair above does not.

### 16.5 Optimistic updates

Used for exactly three interactions, because each has instant visual feedback in the prototype and a
cheap rollback: wishlist toggle, cart quantity stepper, and mark-notification-read. Everything else
(place order, top up, submit ticket, save address) is pessimistic — a failed order that briefly
looked successful is far worse than a spinner.

---

## 17. API / data-access architecture

### 17.1 Path of a request

```
Screen
  → view-model hook (useQuery / useMutation)
    → use case .execute()
      → repository port
        → repository impl        maps DTO → entity, error → AppError
          → remote data source   knows the URL, the query params, the method
            → HttpClient         base URL, auth header, locale header, timeout, retry
              → JSON Server  |  Spring REST API
```

### 17.2 What each layer is allowed to know

| Layer              | Knows                                          |
| ------------------ | ---------------------------------------------- |
| Screen / component | View models and callbacks                      |
| View-model hook    | Use cases, entities, query keys                |
| Use case           | Entities, ports, rules                         |
| Repository         | Ports, DTOs, mappers, data sources, `AppError` |
| Data source        | URLs, HTTP verbs, query strings, DTOs          |
| HttpClient         | Transport, headers, status codes               |

The UI never sees a URL, a status code, a JSON field name, or a pagination cursor.

### 17.3 Pagination

The API returns Spring `Page` objects. The domain exposes a neutral
`Page<T> = { items: T[]; page: number; size: number; total: number; hasNext: boolean }`.
Infinite lists (search results, category grids, orders, notifications) use
`useInfiniteQuery` driven by `hasNext`. JSON Server's `X-Total-Count` header is translated into the
same shape by the mock middleware, so the presentation code is identical against both backends.

### 17.4 Response envelopes

The API is not uniform. Newer endpoints answer with `{ success, data }`, where `data` is either the
entity or a Spring `Page` carrying `content`. Older endpoints answer with the `Page` or the entity
directly. Rather than let that inconsistency spread, **one unwrapping helper sits in the data
layer** and every data source runs its response through it before Zod validation. The DTO schemas
therefore describe the payload only, never the envelope, and a future server-side clean-up changes
one file. See decision D22.

### 17.5 Idempotency (D20)

`POST /orders`, `POST /wallet/charge` and `POST /wallet/transfers` accept an `Idempotency-Key`
header, and every one of them moves money. The rule is: **a mutation that moves money or creates an
order generates a key once, at the start of the user's attempt, and reuses that same key across
every retry of that attempt.** The key is generated in the use case, not the interceptor, because
only the use case knows where one logical attempt begins and ends. A user who taps "place order",
loses signal and taps again gets one order.

This is what makes AC8.18 achievable rather than aspirational.

### 17.6 Query key convention

`[feature, operation, params]`, for example `['catalog', 'search', { q, sort, filters, page }]` and
`['cart']`. Keys are produced by a `queryKeys` factory per feature so invalidation after a mutation
is a single, greppable call.

---

## 18. JSON Server architecture

### 18.1 The decision

Plain `json-server` serves `/products`, `/carts` and so on, with its own filter syntax
(`?_page=`, `?q=`, `?_sort=`) and its own response shape (bare arrays). The real API serves
`/api/v1/products?page=&size=`, returns `{ content, totalElements }`, and requires JWT.

If the app is written against plain JSON Server, the DTOs, the pagination and the auth flow all have
to change at migration — exactly what this project is trying to avoid.

**Decision: run JSON Server inside a thin Express host that adapts it to the real contract.**

```
mock-server/
├── server.ts              Express app; mounts json-server router under /api/v1
├── db.json                seeded from the reference data
├── middleware/
│   ├── auth.ts            issues and verifies fake JWTs; enforces bearer on protected routes
│   ├── envelope.ts        rewrites json-server output into Page / { data } envelopes
│   ├── pagination.ts      maps page/size → _page/_limit; reads X-Total-Count
│   ├── rewrite.ts         maps real routes onto json-server collections
│   ├── latency.ts         configurable delay so loading states are visible
│   └── faults.ts          forces 401 / 500 / timeout / network-down on demand
└── seed/                  scripts that build db.json from design-reference data
```

### 18.2 Route mapping (illustrative)

| Real contract                         | Mock host                     | Notes                                                                    |
| ------------------------------------- | ----------------------------- | ------------------------------------------------------------------------ |
| `POST /api/v1/auth/login`             | custom handler                | Validates against `users`, returns `{ accessToken, refreshToken, user }` |
| `GET /api/v1/products?page=0&size=20` | `/products?_page=1&_limit=20` | Envelope middleware builds `Page`                                        |
| `GET /api/v1/products/search?q=`      | `/products?q=`                |                                                                          |
| `GET /api/v1/categories/tree`         | custom handler                | Builds the tree from a flat collection                                   |
| `GET /api/v1/cart`                    | custom handler                | Joins `cartItems` to `products`                                          |
| `POST /api/v1/orders`                 | custom handler                | Creates the order, clears the cart, computes totals                      |
| `GET /api/v1/influencers`             | `/influencers`                | **Invented** — no real contract (GAP-1)                                  |
| `GET /api/v1/support/tickets`         | `/tickets`                    | **Invented** — no real contract (GAP-2)                                  |

Every invented endpoint is listed in one file, `mock-server/INVENTED_ENDPOINTS.md`, so the backend
team receives an exact list of what still needs specifying.

### 18.3 Fault and latency injection

The mock host reads `x-mock-latency`, `x-mock-fail` and `x-mock-empty` request headers, and a
developer menu in debug builds can set them globally. This is how loading, empty and error states
get tested by hand and in E2E, rather than being asserted only in unit tests.

### 18.4 Trade-off, stated plainly

The middleware host is more work than `json-server --watch db.json` — roughly one phase's worth. It
buys DTOs that never change at migration, a realistic auth flow including refresh, realistic
pagination, and a fault switch. Given that §2/G3 is a stated project goal, the trade is worth it.
The alternative (plain JSON Server, adaptation inside a `JsonServerXRepository`) keeps DTOs
divergent and moves the throwaway work into `src/` where it is harder to delete. **Approved as
decision D2.**

---

## 19. Future REST API migration strategy

### 19.1 What changes

| Item                       | Change                                                                        |
| -------------------------- | ----------------------------------------------------------------------------- |
| `EXPO_PUBLIC_API_BASE_URL` | Points at the Spring API                                                      |
| `src/app/di/container.ts`  | Mock repositories for GAP-1…GAP-6 swap to HTTP ones, when the contracts exist |
| Nothing else in `src/`     | —                                                                             |

### 19.2 What makes that true

1. DTOs and mappers are written against the **real** contract from day one.
2. Auth is a real bearer-token flow with refresh from day one.
3. Pagination uses the real `Page` shape from day one.
4. Errors are normalised from real HTTP status codes from day one.
5. No screen, view-model, use case or entity references a URL, a header or a JSON field.

### 19.3 Migration procedure

1. Point staging at the real API; run the contract test suite (§27.5) against it.
2. Fix any DTO drift **in `data/dto` and `data/mappers` only**. If a fix requires touching
   `presentation` or `domain`, the boundary has leaked and that is a defect to file, not to patch.
3. Migrate slice by slice behind a per-slice flag in the container: catalogue → cart → orders →
   wallet → identity. Both implementations can coexist during the switch.
4. Run the E2E journeys (§27.4) against the real API.
5. Delete `mock-server/` and its container bindings when every slice is migrated.

### 19.4 The contract test suite

One suite of tests runs the **same assertions** against the mock host and, when available, the real
API: shapes validate against the Zod DTO schemas, pagination envelopes match, auth failures return
401, and unknown ids return 404. Green against both means migration is safe. Red against the real
API is a precise, small bug report for the backend team.

---

## 20. DTO / domain model strategy

### 20.1 Why DTOs are separate

The server's shape and the app's shape differ in ways that matter:

| Server                                             | Domain                                                                      |
| -------------------------------------------------- | --------------------------------------------------------------------------- |
| `basePrice: 999.99`, `salePrice: 899.99` (floats)  | `price: Money`, `originalPrice: Money`, `discountPercent: number` (derived) |
| `name: string`, resolved by `Accept-Language` (D9) | `title: string`, already resolved; query keys are locale-scoped             |
| `variants[].attributes: Record<string,string>`     | `ProductVariant` with typed options                                         |
| `addressLine1/2, state, postalCode`                | `Address` with the fields the UI collects (GAP-11)                          |
| `createdAt: "2026-08-22T10:08:00Z"`                | `createdAt: Date`                                                           |
| `status: "PENDING"`                                | `OrderStatus` union                                                         |

### 20.2 Rules

- One DTO file per endpoint response, typed **exactly** as the server sends it, `readonly`, no
  optional-chaining guesswork.
- One Zod schema per DTO. Parsing happens in the data source. A parse failure is a `ContractError`
  carrying the endpoint and the Zod issue path.
- Mappers are pure, in `data/<slice>/mappers/`, unit-tested with a fixture captured from the mock
  host. A mapper never reads config, clocks or storage.
- Request DTOs are separate from response DTOs even when they look alike; they change for different
  reasons.
- **`data/**/dto` is import-restricted to `data/**` by lint.** This is the mechanical guarantee
  behind DR7.
- DTOs describe the **payload**, never the transport envelope. The `{ success, data }` wrapper is
  removed by the shared unwrapping helper in §17.4 before a schema ever sees the body, so a server
  that later standardises its envelopes costs one edit rather than forty.

### 20.3 Handling unknown enum values

A server enum the app does not recognise maps to a domain `Unknown` variant and logs a warning; it
never throws. A new order status added by the backend must not crash the orders list.

---

## 21. Error-handling strategy

### 21.1 Taxonomy

```
AppError
├── NetworkError        no connectivity, DNS, timeout
├── HttpError           the server answered with a failure status
│   ├── UnauthorizedError   401  → refresh once, then sign out
│   ├── ForbiddenError      403  → "you don't have access"
│   ├── NotFoundError       404  → screen-level empty/not-found
│   ├── ValidationError     400/422 → field-level messages
│   ├── ConflictError       409  → e.g. out of stock
│   └── ServerError         5xx  → "something went wrong", retry
├── ContractError       response failed DTO validation
├── DomainError         a business rule refused: EmptyCart, InsufficientStock,
│                       ReturnNotAllowed, InvalidCoupon, InsufficientBalance
└── UnknownError        the catch-all; always logged with a stack
```

### 21.2 Rules

- Repositories **catch and convert**; they never let an Axios error escape.
- Use cases return `Result<T, AppError>`; they do not throw for expected failures.
- View-models translate `AppError` into a **user message key**, never a raw message. The mapping
  lives in `presentation/errors/errorMessage.ts` and is i18n'd in both languages.
- Unexpected render-time errors are caught by a root `ErrorBoundary` and a per-tab boundary, so one
  broken screen does not blank the app.
- Every error carries a correlation id from the request interceptor, logged with the failure.

### 21.3 Retry policy

| Error               | Behaviour                                                                    |
| ------------------- | ---------------------------------------------------------------------------- |
| `NetworkError`      | Query auto-retries twice with backoff; then an inline retry affordance       |
| `ServerError`       | One retry, then a full-screen `ErrorState` with retry                        |
| `UnauthorizedError` | Silent refresh once; on failure, sign out and route to Login with `returnTo` |
| `ValidationError`   | No retry; map to form fields                                                 |
| `DomainError`       | No retry; show as a toast or inline message                                  |
| `ContractError`     | No retry; generic message to the user, full detail to the log                |

Retries of a money-moving mutation reuse the attempt's `Idempotency-Key` (§17.5), so an automatic
retry after a network failure cannot create a second order, charge or transfer.

---

## 22. Loading / empty / error state strategy

The reference has empty states on three screens and **no loading or error states at all**. The
strategy below is built from the reference's own visual language rather than a new one.

### 22.1 The four states

Every async surface renders exactly one of `loading | empty | error | content`. The
`<AsyncBoundary>` component takes a query result and slot props and makes forgetting a state
impossible.

### 22.2 Loading

- **First load of a list or grid** → skeletons matching the real card geometry (image block,
  two title lines, a price line). Never a centred spinner on a full screen; the reference's layouts
  are card-dense and skeletons preserve the scroll position and perceived speed.
- **Pagination** → a small footer spinner.
- **Pull to refresh** → the platform `RefreshControl`.
- **Mutation in a button** → in-place spinner, button disabled, label retained for width stability.
- **Screen-level blocking** → only when there is genuinely nothing to show, e.g. `payResult`.

### 22.3 Empty

The reference's own pattern: a short bold line, a muted explanatory line, and one action.
Per-screen copy already exists in `STR`/`EXTRA` for cart (`cartEmpty` + `shopNow`), category and
search (`noResultsFound` + `tryOther` + `clearFilters`), and wishlist (`emptyWish` + `discover`).
Screens without reference copy — orders, notifications, tickets, addresses, wallet transactions —
need new AR/EN copy, drafted in Phase 2 and natively reviewed before release (D7, FA5).

### 22.4 Error

- **Full-screen** when the primary content failed: icon, title, one-line explanation, retry button.
- **Inline banner** when part of a screen failed but the rest is usable (e.g. "related products
  couldn't load").
- **Toast** for failed mutations, matching the existing toast component and its ~1.9 s duration.
- **Field-level** for validation.
- **Offline** shows a persistent bar under the header, and queued mutations are not silently lost.

### 22.5 Content and partial content

A screen composed of several independent queries (Home has four) renders each section's own state.
A failed deals rail must not blank the categories grid.

---

## 23. UI component architecture

### 23.1 Levels

**App level** (`src/app`) — `App`, provider tree, navigators, error boundary, toast host.

**Primitives** (`components/primitives`) — `Text` (locale-aware font, Arabic line height, no naked
RN `Text` anywhere), `Box`, `Pressable` (44×44 minimum hit area, feedback), `Icon` (single registry
matching the prototype's stroke set, auto-flipping directional glyphs in RTL), `Image` (placeholder,
fade, error fallback).

**Controls** (`components/controls`) — `Button` (`primary` `secondary` `ghost` `danger` ×
`sm` `md` `lg`, loading, disabled, full-width, icon), `IconButton`, `Input`, `PasswordInput`,
`TextArea`, `Select`, `SearchField`, `Chip` (selectable / removable), `SegmentedControl`, `Switch`,
`Radio`, `Checkbox`, `QuantityStepper`, `RatingStars`, `PriceText`.

**Surfaces** (`components/surfaces`) — `Card`, `Sheet` (bottom sheet), `Modal`, `Divider`, `Badge`,
`Pill`, `StatusPill`, `Avatar`, `GradientPanel`.

**Feedback** (`components/feedback`) — `Toast` + `ToastProvider`, `Skeleton`, `Spinner`,
`EmptyState`, `ErrorState`, `OfflineBanner`, `AsyncBoundary`.

**Layout** (`components/layout`) — `Screen` (safe area, background, keyboard avoidance),
`ScreenHeader` (back button, title, actions), `SectionHeader` (title + "view all"),
`HorizontalRail`, `Grid`, `StickyBottomBar`, `TabBar`.

**Feature components** — live inside their feature: `ProductCard`, `ProductGrid`, `CategoryTile`,
`InfluencerAvatar`, `ShoppablePostCard`, `CartLineRow`, `OrderCard`, `OrderTimeline`,
`AddressCard`, `WalletTransactionRow`, `TicketCard`, `TicketMessageBubble`, `NotificationRow`,
`PaymentMethodOption`, `DeliverySlotOption`, `FilterSheetContent`.

**Screens** — compose the above. They contain no styling beyond layout composition.

### 23.2 Component rules

1. A shared component never imports a use case, a repository or a query hook.
2. A shared component reads colour, spacing, radius and type from the theme; a literal hex or a
   magic number is a lint error.
3. Props are explicit and typed; no `...rest` spreading of unknown props into shared components.
4. `ProductCard` is one component with a `variant` prop (`rail | grid | list | compact`), not four
   near-duplicate components — it appears in six different layouts in the prototype with the same
   data and behaviour.
5. Every interactive element sets `accessibilityRole`, `accessibilityLabel` and, where relevant,
   `accessibilityState`.

---

## 24. Reusability strategy

Abstraction is created when **behaviour or responsibility** is shared, not when JSX looks similar.

**Extract when:** the same interaction contract appears three or more times (`ProductCard`); a
concern is cross-cutting (`AsyncBoundary`, `Screen`); a rule must not be duplicated (`Money`,
`formatPrice`); or a design token would otherwise be copied.

**Do not extract when:** two screens merely share a header shape; a "generic" component would need
more than two boolean props to serve both callers; or the shared thing is one line of styling.

Anti-patterns explicitly banned: a `utils/` folder of unrelated helpers, `helpers.ts` inside a
feature, a `common/` component folder without a stated responsibility, a `BaseRepository` that
exists only to share a `try/catch`, and a hook that both fetches and renders.

Duplication is preferred over the wrong abstraction. The rule of three applies to components; it
does not apply to business rules, which are never duplicated.

---

## 25. Form strategy

### 25.1 Forms in the reference

| Form           | Fields                                                  | Validation implied                                      |
| -------------- | ------------------------------------------------------- | ------------------------------------------------------- |
| Sign in        | email, password, remember                               | email format, password required                         |
| Sign up        | account type, name / store name, email, phone, password | all required, phone `+968 9xxx xxxx`, password strength |
| Phone entry    | `+968` prefix + phone                                   | Oman mobile format                                      |
| Search         | query                                                   | none                                                    |
| Filter sheet   | sort, in-stock, express, min/max price, rating          | min ≤ max, non-negative                                 |
| Address        | full name, phone, city (select), details                | required except line 2                                  |
| Profile        | first name, last name, phone, email                     | required, email + phone format                          |
| Return         | reason (radio), note                                    | reason required                                         |
| Support ticket | category, priority, related order, subject, description | subject and description required                        |
| Wallet top-up  | quick amount or custom                                  | positive, minimum, maximum                              |
| Gift           | recipient, amount, occasion, message                    | recipient email-or-phone, positive amount               |
| Ticket reply   | message                                                 | non-empty                                               |
| Promo code     | code                                                    | non-empty                                               |

### 25.2 Approach

**React Hook Form + Zod**, uncontrolled by default. RHF keeps re-renders local to the changed field,
which matters on the 6-field forms; Zod schemas are shared with the DTO layer's validation
vocabulary, and one resolver wires them together.

Rules: one schema per form in the feature folder; validate on blur and on submit, not on every
keystroke; server `ValidationError` field paths map onto form fields via `setError`; the submit
button shows a spinner and is disabled while submitting; a form component never calls a use case
directly — it calls a submit callback the view-model provides.

**Schema messages are i18n keys, not English strings**, because every message renders in Arabic by
default.

---

## 26. Configuration / environment strategy

Three environments — `development` (JSON Server on the LAN), `staging` (deployed mock or real API),
`production` (real API). Configuration is supplied by `.env.<environment>` files consumed by
`app.config.ts` and exposed as typed values through `infrastructure/config`.

| Variable                         | Purpose                            |
| -------------------------------- | ---------------------------------- |
| `EXPO_PUBLIC_API_BASE_URL`       | API root                           |
| `EXPO_PUBLIC_ENV`                | environment name                   |
| `EXPO_PUBLIC_ENABLE_DEV_MENU`    | mock fault switches, screen jumper |
| `EXPO_PUBLIC_DEFAULT_LOCALE`     | `ar`                               |
| `EXPO_PUBLIC_REQUEST_TIMEOUT_MS` | default 15000                      |

`.env.*` files are git-ignored; `.env.example` is committed. **No secret is ever placed in an
`EXPO_PUBLIC_` variable** — everything under that prefix is embedded in the shipped bundle and is
readable by anyone with the app. Payment keys and similar belong on the server.

Build profiles are defined in `eas.json` (`development`, `preview`, `production`) so the environment
cannot drift from the build.

---

## 27. Testing architecture

Tests verify **behaviour and contracts**. A test that asserts a component's internal state, a hook's
call order, or a private method is not written.

### 27.1 Unit — the largest tier

Domain entities and value objects (`Money` arithmetic and rounding above all), every business rule
BR1–BR12, every use case against in-memory fake repositories, every mapper against captured
fixtures, and the formatters (including Arabic-locale price rendering).

Runs in Node with no React Native, no emulator, no network. Fast enough to run on save.
**Target: ≥ 90% line coverage of `src/domain` and `src/data/**/mappers`.** Coverage is not a target
anywhere else, because chasing it elsewhere produces tests that assert implementation.

### 27.2 Integration

Repository implementation + data source + mapper + a fake `HttpClient`, and view-model hooks +
use case + repository against **MSW** handlers that mirror the mock host. These prove that a screen
gets the right data and the right error for a given server response, without a device.

### 27.3 Component

React Native Testing Library. Priority list: `AsyncBoundary` renders the right state for each query
status; `Button` disables and spins while loading; `QuantityStepper` removes at zero;
`ProductCard` fires open, wishlist and add callbacks; `FilterSheetContent` produces the right
criteria; each form validates, shows messages and blocks an invalid submit; each of `EmptyState`,
`ErrorState`, `Toast` renders and acts; and `ProductCard` in RTL places the badge at the visual start.

Queries are by accessible role and label, which doubles as accessibility coverage.

### 27.4 End-to-end (Maestro)

Chosen over Detox: YAML flows, works with Expo Dev Client, far less maintenance. Journeys, in
priority order:

1. **Guest browse to order** — onboarding → home → category → PDP → add to cart → cart → checkout → confirmation.
2. **Search with filters to PDP** — search → term → filter sheet → apply → open result.
3. **Sign in → account → order detail → request return.**
4. **Wallet top-up → payment result → back to wallet.**
5. **Wishlist add from PDP → wishlist screen → add to cart.**
6. **Influencer → shoppable post → PDP.**
7. **Language switch AR → EN with the restart prompt, and the layout mirrors.**
8. **Offline: airplane mode → error state → restore → retry succeeds.**

### 27.5 Contract tests

Zod schemas run against live responses from the mock host (and later the real API), asserting shape,
pagination envelope, 401 on missing auth, and 404 on unknown ids. This suite is the migration
safety net described in §19.4.

### 27.6 What is not tested

Third-party library behaviour, styling values, navigator internals, and any single-line pass-through.

---

## 28. Security considerations

| #   | Concern               | Approach                                                                                                                                               |
| --- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| S1  | Token storage         | Access and refresh tokens in `expo-secure-store` (Keychain / Keystore). Never `AsyncStorage`, never Redux, never a log line.                           |
| S2  | Token lifetime        | Short-lived access token, refresh on 401 with single-flight, refresh rotation if the server supports it, full sign-out on refresh failure.             |
| S3  | Transport             | HTTPS only in staging and production. Cleartext HTTP allowed **only** for the LAN mock server in development builds, gated by build type.              |
| S4  | Secrets in the bundle | Nothing sensitive in `EXPO_PUBLIC_*`. Payment credentials stay server-side.                                                                            |
| S5  | Logging               | A redaction list covers `password`, `token`, `authorization`, `otp`, `cardNumber`, `iban`. Verbose logging is stripped from release builds.            |
| S6  | Payments              | The app opens a hosted payment page and handles a deep-link return; card data never enters the app. Matches the reference's Paymob/Thawani/QPay model. |
| S7  | Delivery OTP          | Displayed but never logged, never copied to the clipboard automatically, and hidden from screenshots where the platform allows.                        |
| S8  | Input handling        | All input validated client-side and treated as untrusted server-side. No `dangerouslySetInnerHTML` equivalent; no `eval`.                              |
| S9  | Deep links            | Every param validated before use; an unknown or malformed link routes to Home rather than crashing.                                                    |
| S10 | Screen protection     | `FLAG_SECURE` on Android for wallet and OTP screens; consider iOS screenshot blur.                                                                     |
| S11 | Dependency risk       | Lockfile committed, `npm audit` in CI, no unpinned transitive additions.                                                                               |
| S12 | PII at rest           | Only the session and locale persist. Addresses, orders and wallet data are fetched, not cached to disk, in v1.                                         |
| S13 | Authorisation         | The server is the authority. Client-side gating is UX, never a security control.                                                                       |

---

## 29. Performance considerations

| #   | Area         | Approach                                                                                                                                                              |
| --- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | Long lists   | `FlashList` for the product grid, search results, orders and notifications. The prototype's home alone renders six rails.                                             |
| P2  | Images       | `expo-image` with memory + disk cache, explicit dimensions, blurhash or tint placeholder, and correctly sized remote assets. Product imagery is the dominant payload. |
| P3  | Re-renders   | View models are memoised; list rows are `React.memo` with stable callbacks; context is split so a locale change does not re-render the catalogue.                     |
| P4  | Navigation   | `react-native-screens` enabled; heavy screens lazily registered.                                                                                                      |
| P5  | Animation    | Reanimated on the UI thread for the sheet, toast and hero pager. No `setInterval`-driven layout.                                                                      |
| P6  | Query tuning | Catalogue `staleTime` of minutes, cart and wallet near-zero, prefetch the PDP on card press-in.                                                                       |
| P7  | Startup      | Defer non-critical providers; keep the splash until the session and locale are resolved; avoid synchronous storage reads on the JS thread at boot.                    |
| P8  | Bundle       | Hermes on; tree-shakeable icon imports; no moment.js-class dependencies.                                                                                              |
| P9  | Budgets      | Cold start < 3 s on a mid-range Android device; list scroll ≥ 55 fps; PDP interactive < 1 s on a warm cache. Measured, not assumed.                                   |

---

## 30. Accessibility considerations

| #   | Area           | Approach                                                                                                                                                                                               |
| --- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1  | Screen readers | Every interactive element has a role and a label, in the active language. Product cards announce title, price and rating as one unit rather than five fragments.                                       |
| A2  | Touch targets  | 44×44 pt minimum. Several prototype controls (the 30 pt wishlist circle, the 30 pt tab icons) are below it and need a larger hit slop.                                                                 |
| A3  | Contrast       | Text meets WCAG AA (4.5:1). `--color-text-muted` `#9A9AAF` on white measures ≈2.6:1 — **it fails**, and the prototype uses it for 8.5–10 pt meta text. Muted text must darken or grow. Flagged in §33. |
| A4  | Dynamic type   | Font scaling respected up to a cap; no fixed-height text containers. The prototype uses many 9–11 px sizes that will clip when scaled.                                                                 |
| A5  | RTL            | Full mirroring, logical properties only, directional icons flipped, numerals kept LTR inside RTL text.                                                                                                 |
| A6  | Motion         | Honour `reduce motion` for the hero pager, toast and sheet.                                                                                                                                            |
| A7  | Forms          | Labels tied to inputs, errors announced, focus moved to the first invalid field.                                                                                                                       |
| A8  | Colour alone   | Status is never conveyed by colour only — the status pills carry text, and the tracking timeline needs an icon or text state in addition to the filled dot.                                            |

---

## 31. Scalability considerations

**Code** — feature slices are added without touching existing ones: a new domain folder, a new data
folder, a new presentation feature, and one line in the container and the navigator. The layer rules
keep that true as the codebase grows.

**Team** — feature slices are natural ownership units with low overlap. Only the container, the
navigator and shared components are contended, and each is small.

**Product** — the architecture already anticipates: the seller app (a second presentation layer over
much of the same domain), multi-language beyond AR/EN (i18n from day one), multi-currency (`Money`
carries a currency), and richer merchandising (home sections are data-driven components, so a
CMS-driven layout is a data-layer change).

**Data volume** — pagination everywhere, `FlashList` for every long list, and no unbounded in-memory
accumulation.

**Where it will strain** — if the backend adds GraphQL, or if offline-first with a local write queue
becomes a requirement. Both are absorbable (the repository port is the seam) but both are real
projects, not refactors.

---

## 32. Architectural decisions and rationale

All decisions below are **approved** as of 2026-09-02. The final column records whether the decision
was one the reviewer explicitly signed off (§34) or a consequence of the architecture itself.

| ID    | Decision                                                                                                                                               | Alternatives rejected                                 | Rationale                                                                                                                                                       | Sign-off           |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| AD-1  | Scope v1 to the **customer** app                                                                                                                       | Both apps; customer + seller                          | The seller app is a distinct product with its own domain (payouts, approvals, variant authoring). Bundling doubles v1 and delays the revenue flow.              | **D1**             |
| AD-2  | **Expo** (with Dev Client and prebuild available)                                                                                                      | Bare React Native                                     | Faster iteration, EAS builds, first-class `expo-image` / `expo-secure-store` / `expo-localization`. Prebuild is the escape hatch if a native module demands it. | Approved           |
| AD-3  | **TypeScript strict**                                                                                                                                  | JavaScript                                            | Layer boundaries, DTO/entity separation and `Result` are unenforceable without types.                                                                           | Architectural      |
| AD-4  | **Layers at the top, slices inside**                                                                                                                   | Slices at the top                                     | Boundary lint rules are per-layer; this makes them expressible and greppable.                                                                                   | Architectural      |
| AD-5  | **TanStack Query** for server state                                                                                                                    | Redux Toolkit Query, hand-rolled, Zustand             | Caching, retry, invalidation and a status model that maps onto §22 for free.                                                                                    | Approved           |
| AD-6  | **Zustand** for session, locale, toast                                                                                                                 | Redux Toolkit, Context                                | Three tiny slices; RTK is ceremony, Context re-renders.                                                                                                         | Approved           |
| AD-7  | **React Navigation** with tabs + per-tab stacks + a modal group                                                                                        | Expo Router                                           | The reference's model is imperative and stack-based; React Navigation maps to it directly and its typed param lists suit id-only params.                        | **D4**             |
| AD-8  | **JSON Server behind an Express contract adapter**                                                                                                     | Plain `json-server`                                   | Makes the DTOs, auth and pagination identical to the real API, which is the whole point of G3.                                                                  | **D2**             |
| AD-9  | **DTOs validated with Zod at the boundary**                                                                                                            | Trusting the response                                 | A contract break becomes a precise error at the edge instead of a crash in a screen.                                                                            | Architectural      |
| AD-10 | **`Result<T, E>`** from use cases                                                                                                                      | Throwing                                              | Expected failures are values; exceptions are reserved for bugs.                                                                                                 | Architectural      |
| AD-11 | **`Money` as integer baisa**                                                                                                                           | `number`                                              | OMR is 3-decimal; float arithmetic on prices is a defect.                                                                                                       | Architectural      |
| AD-12 | **Axios behind an `HttpClient` port**                                                                                                                  | Bare `fetch`                                          | Interceptors, cancellation, error normalisation — with the port keeping it swappable.                                                                           | Approved           |
| AD-13 | **StyleSheet + typed theme**                                                                                                                           | NativeWind, styled-components, Tamagui                | The reference is token-driven; a typed theme maps 1:1, keeps RTL logical properties explicit, and adds no runtime cost.                                         | Approved           |
| AD-14 | **RHF + Zod** for forms                                                                                                                                | Formik, controlled state                              | Fewer re-renders; schemas shared with validation vocabulary.                                                                                                    | Approved           |
| AD-15 | **Maestro** for E2E                                                                                                                                    | Detox                                                 | Simpler flows, Expo-friendly, much lower maintenance.                                                                                                           | Approved           |
| AD-16 | **`eslint-plugin-boundaries` + dependency-cruiser** enforce §9                                                                                         | Convention and review                                 | A rule nobody can violate beats a rule everyone agrees with.                                                                                                    | Architectural      |
| AD-17 | **i18next**, Arabic default, AR/EN from the reference's own strings                                                                                    | Hard-coded Arabic, later i18n                         | Every string already exists in both languages in the prototype; retrofitting i18n is far costlier.                                                              | Architectural      |
| AD-18 | **`FlashList` + `expo-image`** for lists and imagery                                                                                                   | `FlatList` + `Image`                                  | The app is a grid-and-rail product browser; these are the components that hold 60 fps.                                                                          | Architectural      |
| AD-19 | Contract test suite runs against mock **and** real API                                                                                                 | Manual verification at migration                      | Converts migration risk into a test result.                                                                                                                     | Architectural      |
| AD-20 | Features with no API contract get **domain ports and mock-only implementations**, listed in `INVENTED_ENDPOINTS.md`                                    | Skipping them; hard-coding in the UI                  | The UI stays real and the backend team gets an exact specification. After the expanded collection this applies to social commerce alone.                        | **D1 / D19 / FA1** |
| AD-21 | **Noto Kufi Arabic** ships as the Arabic face, behind a single theme token                                                                             | Blocking on the GE Dinar One licence                  | The prototype already renders with it, and the token makes a later swap a one-line change.                                                                      | **D16**            |
| AD-22 | **Guest cart**: adding, editing and removing work without a session; the gate is at checkout                                                           | Gating the cart entirely; gating nothing              | Fewest steps before a user sees value, and one clear point where identity is needed.                                                                            | **D3**             |
| AD-23 | **Locale-scoped query keys**; the server resolves catalogue language from `Accept-Language`                                                            | A `LocalizedText` value object in the domain          | Keeps the DTO single-language and identical to the real API; the cost is a refetch on language change, which already requires a restart.                        | **D9**             |
| AD-24 | **Delivery economics are data, not code** — `area.shippingPrice` and `area.minOrderAmount` come from `/areas` and cache like any other resource        | A hard-coded threshold constant                       | Merchandising rules change more often than releases do.                                                                                                         | **D11**            |
| AD-25 | **Expo-native Phase 2 UI dependencies**: Expo Font/Image/Gradient/Splash/Updates, React Native SVG, i18next, and the two approved Google font packages | A UI framework; hand-drawn bitmap icons; system fonts | These packages directly implement AD-13, AD-17, AD-18 and D16 while keeping StyleSheet and the typed theme as the component API.                                | Architectural      |

---

## 33. Known limitations

These survive the decisions in §34. Each is accepted, not open.

1. **The prototype is not a specification.** Motion, gesture behaviour, error copy, loading
   behaviour and edge cases are absent. Reasonable choices are made and flagged; some will be wrong.
2. **One feature runs on invented endpoints.** Influencers and shoppable posts (GAP-1) have no
   contract at all. Support tickets, returns, gift money and the delivery OTP were in the same
   position until the expanded collection arrived; they now run on the real API (D19). Social
   commerce works against the mock host and stops at migration until the backend implements FA1.
   That is a scheduling dependency on another team, not a defect in the app.
3. **A language change requires an app restart**, and under D9 it also refetches catalogue content
   because query keys are locale-scoped. The restart makes the refetch invisible, but it is real.
4. **The PDP variant selector is an addition to the reference** (D8). The prototype's four colour
   swatches are decorative; the shipped screen will have a functioning selector the prototype does
   not show. This is a deliberate, visible deviation.
5. **The cart total will not match the prototype's number** (D10). BR3 is implemented once and
   consistently, so the cart shows VAT where the prototype omitted it.
6. **Delivery slots are not what the prototype draws** (D21). The API contracts delivery by area,
   giving a price, a free-delivery minimum and an estimated number of days. It has no concept of a
   two-hour window against a next-morning window, so checkout shows the area's cost and estimated
   days instead. The "Hub Express" badge and its search filter are held back with them.
7. **Muted text fails WCAG AA** at the sizes the prototype uses (§30 A3). Accessibility wins, which
   means a visible visual deviation from the reference in meta and caption text.
8. **The express filter has no data behind it** (GAP-15). Stock is real, carried on product
   variants. "Hub Express" is not, and follows the delivery-slot gap above.
9. **No design assets beyond the prototype.** No icon export, no image specification, no motion
   spec. Icons are redrawn from the prototype's inline SVGs.
10. **The brand Arabic face is not the one the tokens name** (D16). Noto Kufi Arabic ships; GE Dinar
    One waits on FA4.
11. **Offline support is a read-through cache only** in v1. There is no write queue, so a mutation
    attempted offline fails with a message rather than queueing.
12. **The seller app is out of scope** (D1), so the shared-domain reuse the architecture is designed
    for remains unproven until Phase 14.
13. **An address does not yet resolve to a shipping area by contract** (D13, amended). The app
    matches the address city against the area name and governorate, which is correct for the seeded
    Omani data and wrong the moment the backend introduces an explicit link. It is contained in one
    mapper.
14. **A review's author name is a mock addition.** The collection contracts the review routes but
    shows no response body, and a review has to be rendered with a name. The mock resolves
    `userName` server-side rather than letting the client fan out one user request per review — the
    N+1 D14 already rejected for card ratings. If the backend never adds it, the PDP falls back to
    an anonymous reviewer label. Recorded in `mock-server/INVENTED_ENDPOINTS.md`.
15. **A seller is fetched from the seller directory, not by id.** There is no `GET /sellers/{id}`
    in the collection, so `SellerRemoteDataSource.getById` pages `/sellers` and selects from it.
    That is one request either way at today's seller count, and it is wrong at a scale the seeded
    data never reaches. It is contained in one method.
16. **The PDP's specification table and review list have no counterpart in the reference.** The
    prototype's product page ends at the related-products rail. Phase 7's plan requires both, so
    they are built from the PDP's own vocabulary — the delivery panel's block treatment and the
    card border — rather than from a design that does not exist.
17. **Wallet-to-wallet transfers exist in the API but not in the UI.** `/wallet/transfers` is a
    distinct feature from gifts, with a recipient preview and a password confirmation. The prototype
    never shows it, so it is not built. Worth raising as a product question rather than assuming it
    was an oversight.
18. **Notifications have no push delivery** (D17), so the list only updates when the app is opened
    or refreshed.

---

## 34. Decisions on open questions

All 17 questions raised in Phase 0 were reviewed and **approved as recommended on 2026-09-02**.
They are recorded here as decisions **D1–D17**. Nothing in this section is open.

**Amended the same day**, after an expanded API collection was added to `docs/`. It carries 198
endpoints against the 153 requests in the copy under `design-reference/`, and it closes four of the
six features that previously had no contract. The consequences are **D18–D22** in §34.4, where D11
and D13 are amended as well.

Where a decision hands work to someone outside this project, it is tracked as a follow-up action
**FA1–FA5** in §34.2. A follow-up action does not block implementation; each one has a defined
interim behaviour that lets the app be built and tested now.

### 34.1 Decisions

| ID                          | Decision                                                                                                                    | What it means in practice                                                                                                                                                                                                                                                                                         | Affects                |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **D1**                      | **v1 is the customer app only.** The seller app is a separate later track.                                                  | `plan.md` Phases 1–13 cover the customer app. Phase 14 holds the seller app and is not scheduled. The domain and design system are built so a second presentation layer can reuse them.                                                                                                                           | Whole plan             |
| **D2**                      | **JSON Server runs behind an Express contract adapter.**                                                                    | The mock serves the real API's routes, Spring `Page` envelopes, bearer auth with refresh, and real status codes. The app's DTOs are written against the real contract and do not change at migration.                                                                                                             | §18, Phase 3           |
| **D3**                      | **Browsing is public; the cart is fully usable as a guest; checkout and every identity-bound screen require a session.**    | A guest can add, change quantity and remove cart lines. The sign-in prompt appears once, at checkout, and returns the user to checkout with the cart intact. Wishlist, orders, addresses, wallet, gifts, support, notifications and profile are gated.                                                            | §5, §15.4, Phase 5     |
| **D4**                      | **Per-tab navigation stacks are preserved.** Re-tapping the active tab resets that tab to its root.                         | Standard platform behaviour, and a deliberate deviation from the prototype, which cleared the stack on every tab switch.                                                                                                                                                                                          | §15.2, Phase 5         |
| **D5**                      | **The `BRANDHUB App.dc.html` home is canonical for v1.**                                                                    | The richer `app-home-live.jsx` home — stories rail, auto-rotating hero, live countdown, shoppable feed, trust strip — is recorded as a v1.1 backlog item and is not built now.                                                                                                                                    | §4 F2, Phase 6         |
| **D6**                      | **`_ds/modernist-…/` is ignored.**                                                                                          | It is an unrelated design system that contradicts every BRANDHUB token. It is not referenced anywhere in the build.                                                                                                                                                                                               | §3.1, Phase 2          |
| **D7**                      | **Missing AR/EN copy is drafted now and reviewed by a native Arabic speaker before release.**                               | Loading, error and empty-state copy for the screens the prototype never covered — orders, notifications, tickets, addresses, wallet transactions — is drafted in both languages during Phase 2. The native review is a release gate in Phase 13 (FA5).                                                            | §22.3, Phases 2 and 13 |
| **D8**                      | **The PDP gains a variant selector.** A product with exactly one variant resolves automatically and the selector is hidden. | This closes GAP-9: `POST /cart/items` requires a `variantId`, and the prototype's decorative colour swatches could not supply one. Add-to-cart is blocked until a variant is resolved.                                                                                                                            | §4 F6, Phase 7         |
| **D9**                      | **Catalogue content is resolved server-side from `Accept-Language`.**                                                       | The client sends the header, the server returns one already-resolved language, the DTO stays single-language and identical to the real API, and the mapper never branches on locale. **Query keys include the locale**, so changing language refetches. The mock stores `{ ar, en }` and resolves on the way out. | §13, §20, Phase 3      |
| **D10**                     | **The order total includes delivery and payment-method fees, and subtracts the coupon discount.**                           | BR3 becomes `subtotal + VAT + shippingPrice + paymentFee − discount`, implemented once in the domain and used by both cart and checkout. The shipping price comes from the resolved area (D21). The cart screen will therefore show a different number from the prototype, which omitted VAT there.               | BR3, §4 F8, Phase 8    |
| **D11** ⚠️ _amended by D21_ | **Free delivery is a threshold served as data, not a constant.**                                                            | The threshold is `area.minOrderAmount`, supplied per shipping area by `GET /areas`. The cart hint computes the remaining amount from the resolved area. Changing it is a data change with no release, and no value had to be invented.                                                                            | BR13, §4 F7, Phase 8   |
| **D12**                     | **Email and password ship in v1.** The phone + OTP screen is built against mock-only endpoints.                             | The onboarding screen is faithful to the reference, including the `+968` phone field and the Apple and Google buttons, but only the email path reaches a real backend. The OTP endpoints the backend would need are specified in `INVENTED_ENDPOINTS.md` (FA1).                                                   | §4 F1, Phase 5         |
| **D13**                     | **The UI's address shape is the domain entity.**                                                                            | `Address` carries label, recipient name, phone, details and city. The mapper fills the API's `addressLine1`, `city`, `country` and leaves `state` and `postalCode` optional, defaulting `country` to Oman. Nothing the UI collects is lost, and nothing the API needs is missing.                                 | §11.1, Phase 9         |
| **D14**                     | **`averageRating` and `reviewCount` belong on the product DTO.**                                                            | The mock serves both on every product, so cards and the PDP render ratings from a single request. The backend is asked to add them (FA2). There is no N+1 fetch and no fallback path that issues one.                                                                                                             | §13, Phase 6           |
| **D15**                     | **Minimum platforms: iOS 16.4 and Android 8.0 (API 26).**                                                                   | Expo SDK 57 raises the iOS native deployment floor to 16.4; Android remains deliberately pinned to API 26. This sets the library floor, the performance budget's reference device, and the CI simulator matrix.                                                                                                   | §29, Phases 1 and 5    |
| **D16**                     | **Noto Kufi Arabic is the shipped Arabic face.**                                                                            | It is what the prototype actually renders with, and GE Dinar One is neither present in the reference nor licensed. The theme exposes the Arabic face as one token, so a later swap is a one-line change (FA4).                                                                                                    | §3.2, Phase 2          |
| **D17**                     | **Notifications are an in-app list only.**                                                                                  | No push infrastructure, no permission prompt, no device-token registration in v1. The list refreshes on open and on pull-to-refresh.                                                                                                                                                                              | §4 F13, Phase 11       |

### 34.2 Follow-up actions owned outside this project

Each has an interim behaviour, so none of them blocks Phase 1.

| ID          | Action                                                                                                                                                                                                                                                                                            | Owner         | Interim behaviour                                                                                              | Consequence if it never lands                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **FA1**     | Support tickets, returns, gift money, the delivery OTP and stock are **delivered** in the expanded collection. What remains: **influencers and shoppable posts**, **delivery time slots and the express flag**, **phone OTP sign-in**, and confirming how an address resolves to a shipping area. | Backend team  | Mock-only repository implementations behind real domain ports, named to make their provisional status obvious. | Only the social-commerce feature stops at migration. Everything else now runs on the real contract. |
| **FA2**     | Add `averageRating` and `reviewCount` to product list and detail responses.                                                                                                                                                                                                                       | Backend team  | The mock serves both.                                                                                          | Ratings disappear from cards, or an N+1 fetch has to be added.                                      |
| **FA3**     | Honour `Accept-Language` for catalogue content.                                                                                                                                                                                                                                                   | Backend team  | The mock resolves from a stored `{ ar, en }` pair.                                                             | Arabic product titles fall back to whatever single language the API stores.                         |
| **FA4**     | Obtain the GE Dinar One licence, if the brand face is required.                                                                                                                                                                                                                                   | Brand / legal | Noto Kufi Arabic ships.                                                                                        | The app ships in the fallback face, which is what the prototype shows anyway.                       |
| **FA5**     | Native Arabic review of the new loading, error and empty-state copy.                                                                                                                                                                                                                              | Content       | Drafted placeholders in both languages.                                                                        | Release gate in Phase 13 does not clear.                                                            |
| ~~**FA6**~~ | ~~Confirm the free-delivery threshold value.~~ **Closed:** the API supplies it as `area.minOrderAmount`.                                                                                                                                                                                          | Closed        | Closed                                                                                                         | Closed                                                                                              |

### 34.3 Recorded as v1.1 backlog

Not decisions to make, but scope deliberately deferred and worth keeping visible.

| Item                                                                                                                              | Source                  |
| --------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| The richer home screen: stories rail, auto-rotating hero slider, live flash-sale countdown, in-feed shoppable posts, trust strip. | D5, `app-home-live.jsx` |
| Push notification delivery.                                                                                                       | D17                     |
| Phone + OTP sign-in against a real backend.                                                                                       | D12                     |
| The seller mobile app.                                                                                                            | D1, `plan.md` Phase 14  |
| Offline write queue.                                                                                                              | §33 item 11             |

### 34.4 Amendments from the expanded API contract

Added 2026-09-02, after `docs/ECommerce_API_Postman_Collection.json` superseded the earlier export.
These follow from the contract rather than from taste, so they are recorded as decisions rather than
re-opened as questions.

| ID      | Decision                                                                                                | What it means in practice                                                                                                                                                                                                                                                                                                                                                             | Affects                               |
| ------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| **D18** | **`docs/ECommerce_API_Postman_Collection.json` is the authoritative contract.**                         | The copy under `design-reference/uploads/` is superseded and is not used for DTO work. Where the two disagree, the newer one wins.                                                                                                                                                                                                                                                    | §3.4, Phase 3                         |
| **D19** | **Support tickets, returns, gift money and the delivery OTP move from mock-only to the real contract.** | Their repositories are HTTP implementations from the start rather than provisional ones. Two small mismatches are absorbed in mappers: the API takes a free-text return `reason` where the UI offers five fixed choices, and ticket category and priority are server enums the domain maps onto.                                                                                      | §4 F16, F19, F20; Phases 3, 9, 10, 12 |
| **D20** | **Every money-moving mutation sends an `Idempotency-Key`.**                                             | Applies to placing an order, charging the wallet and transferring to another wallet. The key is minted in the use case at the start of an attempt and reused across retries, so a retry after a lost connection cannot create a second order.                                                                                                                                         | §17.5, §21.3; Phases 4, 8, 10         |
| **D21** | **Delivery cost and the free-delivery threshold come from `/areas`. Time slots are deferred.**          | `area.shippingPrice` feeds BR3 and `area.minOrderAmount` feeds BR13, both as live server data. The prototype's two-hour and next-morning slots have no contract, so checkout shows the area's cost and `estimatedDeliveryDays` in their place for v1, and the "Hub Express" badge and its filter are held back with them. This is a visible, deliberate deviation from the reference. | BR3, BR13, §4 F7, F8; Phase 8         |
| **D22** | **The data layer normalises mixed response envelopes.**                                                 | Newer endpoints answer `{ success, data }`, older ones answer bare. One unwrapping helper runs before Zod validation, so DTO schemas describe payloads only and a future server-side clean-up costs one edit.                                                                                                                                                                         | §17.4, §20.2; Phases 3, 4             |

**Amendments to earlier decisions**

| ID      | Was                                                                                                               | Now                                                                                                                                                                               |
| ------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D11** | A configurable `deliveryPolicy` threshold seeded at OMR 20.000, value to be confirmed by product.                 | The threshold is `area.minOrderAmount`, supplied per area by the API. No invented value, and FA6 closes.                                                                          |
| **D13** | The UI's address shape is the domain entity, mapped onto the API's fields with `state` and `postalCode` optional. | Unchanged in shape, but an address must now resolve to a **shipping area**, because that is what carries the delivery price. How it resolves is not in the collection. See below. |

**One residual question, narrow enough not to block anything.** The collection exposes `/areas` and
it exposes addresses, but nothing links them: there is no `areaId` on the address payload and no
lookup from a city to an area. Until that is settled the app resolves the area by matching the
address `city` against `area.name` and `area.governorate`, which works for the seeded Omani data and
is contained in a single mapper. Confirming the real linkage is folded into FA1.

---

_End of architecture.md. The implementation roadmap is in `plan.md`._
