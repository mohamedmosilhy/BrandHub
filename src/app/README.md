# App — composition root

**May contain:** `App.tsx`, the provider tree, the dependency container and the navigators. The
only layer allowed to import from every other layer.

**May not contain:** Business rules, UI markup beyond composition, or a second place that
constructs repositories.

## Note on the folder name

Expo's bundler reports "Using src/app as the root directory for Expo Router" because `src/app` is
the Expo Router convention. This project uses React Navigation instead (`architecture.md` AD-7) and
does not depend on `expo-router`, so the message is informational and the real entry point stays
`index.ts` at the repository root. Do not add `expo-router`; if a future phase ever needs it, the
folder name has to be revisited first.
