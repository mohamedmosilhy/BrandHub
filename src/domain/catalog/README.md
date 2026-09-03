# Domain — catalog

**May contain:** Entities, value objects, repository ports and use cases for this slice.

**May not contain:** Any dependency outside `domain` and `core`.

Phase 6 owns immutable products, variants, categories and sellers; locale-neutral search criteria;
neutral pages; BR11 discount derivation; sort comparators; and the search, category and home-section
use cases. Prices remain `Money` in every domain API.
