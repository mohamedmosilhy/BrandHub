# Features

**May contain:** One folder per feature: `screens/`, `components/`, `hooks/` and a public `index.ts`.

**May not contain:** Cross-feature deep imports. Import a feature through its barrel.

Implemented feature folders currently include onboarding, auth, Home, Browse, Category, Search,
Product, Seller store, Wishlist and the shared catalogue presentation slice. Screens receive
repository ports/use cases from the app composition root and own only UI/view-model state.

`wishlist` is the one feature that also publishes a provider. Membership has to be identical on
every heart in the app — cards, the PDP, the wishlist grid — so `WishlistProvider` is mounted once
above the navigator and the screens read it through `useWishlistCardProps`.
