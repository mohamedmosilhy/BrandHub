# Phase 6 — Catalogue and discovery · Completion report

**Date:** 2026-09-03 · **Status:** Implemented; automated acceptance green; physical visual/performance sign-off pending

**Plan:** [`../plan.md`](../plan.md) Phase 6 · **Architecture:** [`../architecture.md`](../architecture.md)

## What was implemented

- Immutable catalogue entities for products, variants, categories and sellers; neutral pages and
  normalized search criteria; BR11 discount derivation; rating validation; four deterministic sort
  comparators; and search, category-products and home-sections use cases.
- Strict Zod DTOs for products, variants, images and Spring pages, plus mappers that convert all
  prices to `Money`, preserve response-provided ratings/review counts and resolve relative image
  paths at the composition root.
- `HttpProductRepository` and expanded category repository behavior covering search, detail
  prefetch, related products, category pages, featured products, new arrivals and best sellers.
- Contract query translation for query, category, seller, sort, in-stock, min/max price, minimum
  rating, sorting and zero-based pagination. The mock applies the same filters before paging and
  resolves image alt text through `Accept-Language`.
- Canonical Home UI in reference order: delivery location, notification dot, search entry,
  influencer rail, approved promotional banner, eight category tiles and the deals rail. Category
  and deal queries have independent loading/error/content boundaries.
- Browse with a synchronized vertical root-category rail, child-category chips, virtualized
  product grid and incremental paging.
- Category with localized hero, product count and image, subcategory chips, live in-stock control,
  filter sheet, virtualized infinite grid, empty recovery and all-products reset.
- Search with a 250 ms live query, trending terms, removable seller scope, result count, four sort
  chips, stock/price/rating filtering, live filter match count, clear-filters recovery and infinite
  result pages.
- One memoized `ProductCard` with `rail`, `grid`, `list` and `compact` geometry. It renders OMR to
  three decimals, sale/original prices, BR11 discount, rating/review count and optional action
  callbacks. Card press-in prefetches the Phase 7 detail query.
- FlashList 2.0.2 for long grids/results and locale-scoped TanStack Query keys that include every
  criterion and page size, so language changes refetch catalogue content without cache collisions.

## Architectural decisions

1. Search and category pages share one query-key factory and common infinite-query mapping, while
   retaining the API's narrow `/search/products` and `/products/category/{id}` repository methods.
2. Asset URL resolution is injected at composition. Domain entities receive usable URLs without
   learning the API base URL or importing infrastructure.
3. The Express and Hub Express controls/badges are not shown. The domain/query contract retains an
   `express` placeholder, but D21 and GAP-15 provide no backing field; the mock returns zero matches
   if a diagnostic client sends `express=true`.
4. The Home influencer rail remains a reference-aligned discovery preview. Full social repository
   behavior, follow state and shoppable content stay in Phase 11.
5. The established project primitives and tokens were reused. A 21st catalogue search was
   unavailable with HTTP 401, so no external UI component was pulled; the final local 21st review
   returned 0 findings across 21 changed UI files.

## Tests added

- Domain coverage for discount derivation, criteria normalization and all sort directions.
- Query-parameter and product-mapper coverage, including exact baisa conversion, card rating
  metadata, variants, URL resolution and successful empty pages.
- HTTP/MSW repository coverage for mapped search results, `ServerError` and empty content.
- Live mock schema validation for paginated product search, plus contract coverage for combined
  category/seller/stock/price/rating filtering, descending sort and pagination.
- Product-card coverage for content, badges, detail prefetch, open, wishlist and add callbacks.
- Filter-sheet interaction coverage for sort, stock, price range, rating and live-count apply.
- Search state coverage for pre-query, trending results, empty results and seller-scope removal.
- Home partial-content coverage proving a category failure does not blank successful deals.

## Verification

```text
npm run verify
  TypeScript                 pass
  ESLint                     pass, zero warnings
  Prettier                   pass
  dependency-cruiser         pass, zero violations/cycles
  Jest                       pass, 44 suites / 163 tests

npx expo-doctor --verbose
  Expo checks                pass, 21 / 21

npx expo install --check
  SDK dependencies           up to date

npx expo export --platform ios --platform android
  iOS bundle                 pass
  Android bundle             pass

npx @21st-dev/cli review <Phase 6 UI paths>
  UI review                  pass, 21 files / 0 findings
```

## Acceptance criteria

| Criterion | Status                               | Evidence                                                                                                                                               |
| --------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC6.1     | Pass                                 | Home composes the canonical header, search, creator rail, D5 promo, eight tiles and deals in reference order.                                          |
| AC6.2     | Pass                                 | Independent category/deal queries render geometry-matched skeletons and scoped retry states; partial-content test is green.                            |
| AC6.3     | Pass                                 | Category tiles pass id/name into the existing typed Category route; the screen resolves its localized entity and live count.                           |
| AC6.4     | Pass                                 | Browse owns separate root/selected ids; rail selection resets and refetches the grid, while child chips scope it further.                              |
| AC6.5     | Pass                                 | Search renders trending chips and the pre-query prompt without starting a result query.                                                                |
| AC6.6     | Pass                                 | Debounced text becomes query criteria; tests assert the product list and result count.                                                                 |
| AC6.7     | Pass                                 | Trending-chip interaction populates the input and produces results in the component test.                                                              |
| AC6.8     | Pass                                 | A draft-criteria preview query supplies the apply label's live total; page size is isolated in its query key.                                          |
| AC6.9     | Pass                                 | Mock contract and domain comparator tests cover relevance, rating and both price directions.                                                           |
| AC6.10    | Pass                                 | In-stock filtering is exercised in the filter component and combined live mock contract; Express is withheld per D21.                                  |
| AC6.11    | Pass                                 | Min/max values map to exact `Money`, empty pages are content, and ProductGrid exposes clear-filter recovery.                                           |
| AC6.12    | Pass                                 | Both search and category reset the complete filter draft/applied criteria to relevance defaults.                                                       |
| AC6.13    | Pass                                 | Seller scope is rendered as a removable chip; the test verifies removal and unscoped results.                                                          |
| AC6.14    | Pass                                 | Search/category/browse use `hasNext`-driven FlashList paging and render a footer spinner only during the next fetch.                                   |
| AC6.15    | Pass                                 | Cards format Latin-direction prices to exactly three decimals with the localized OMR label.                                                            |
| AC6.16    | Implemented; manual sign-off pending | All layout is logical-direction/token based and both platform bundles pass; final AR/EN device comparison remains.                                     |
| AC6.17    | Pending physical measurement         | FlashList virtualization and stable memoized rows are implemented for 220 seeded products; 55 fps must still be measured on a mid-range Android phone. |
| AC6.18    | Pass                                 | ESLint and dependency-cruiser pass; no presentation file imports `data`.                                                                               |
| AC6.19    | Pass                                 | Rating and review count are mandatory DTO fields and no review request exists in any card/screen path.                                                 |
| AC6.20    | Pass                                 | `Accept-Language` resolves catalogue strings and every catalogue query key is locale-scoped; contract and query-key behavior are covered.              |

## Known issues and remaining risks

- Final side-by-side visual approval and the 55 fps measurement require physical iOS/Android
  hardware. They are not inferred from passing bundles or FlashList usage.
- Product and category mock assets are one-pixel contract placeholders. Layout/error fallback is
  implemented, but final merchandising imagery depends on backend/CDN data.
- The influencer rail is intentionally preview-only until Phase 11 implements the social domain and
  live follow/shoppable-post behavior.
- Hub Express remains absent from UI and data by D21. It must not be enabled until the backend adds
  a trustworthy product/delivery capability field.

## Handoff

Phase 7 can consume `productRepository.getById`, `getRelated`, the locale-scoped detail query key,
the prewarmed card cache, product variants, ratings and BR11 prices without changing the discovery
screens or transport contracts.
