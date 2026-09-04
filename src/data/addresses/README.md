# Data — addresses

Implements the real `/users/me/addresses` contract.

Two things the contract does not have are resolved here and only here:

- **The address label.** The API has no field for it, so `addressMapper` carries it in
  `addressLine2` behind a `brandhub-label:` marker. Free text already in that field is read back as
  part of `details`, so a seeded record round-trips its content (D13).
- **The shipping area.** Nothing links an address to the area that carries its delivery price, so
  `resolveAddressArea` (in `@data/checkout/mappers`, shared with checkout) matches the city against
  the area name and then its governorate. The address form's city select is driven by `/areas`, so
  an address the app saved always matches by name. See `architecture.md` §34.4.

**May not contain:** Leaking a DTO past the repository boundary.
