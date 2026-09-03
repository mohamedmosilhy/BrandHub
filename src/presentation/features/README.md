# Features

**May contain:** One folder per feature: `screens/`, `components/`, `hooks/` and a public `index.ts`.

**May not contain:** Cross-feature deep imports. Import a feature through its barrel.

Implemented feature folders currently include onboarding, auth, Home, Browse, Category, Search and
the shared catalogue presentation slice. Catalogue screens receive repository ports/use cases from
the app composition root and own only UI/view-model state.
