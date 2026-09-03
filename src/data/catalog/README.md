# Data — catalog

**May contain:** `dto/`, `mappers/`, `datasources/`, `repositories/` for this slice.

**May not contain:** Leaking a DTO past the repository boundary.

Phase 6 validates category trees, individual categories, product lists and Spring pages with Zod.
It maps prices to `Money`, resolves API-relative asset URLs at composition, translates domain
criteria to query parameters and normalizes transport failures to `AppError` results.
