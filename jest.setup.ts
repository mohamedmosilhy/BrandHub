/**
 * Jest setup shared by every suite.
 *
 * Deliberately small. `@testing-library/react-native` is NOT imported here: it
 * registers its matchers and auto-cleanup on import, and pulling it in globally
 * would drag React Native into node-environment suites such as the architecture
 * tests. Component tests get it through `src/test/render`.
 *
 * `react-native-safe-area-context` is mocked because its provider renders
 * nothing until the native layer reports insets, which never happens in a test.
 * The library ships this mock for exactly that reason.
 */
jest.mock(
  'react-native-safe-area-context',
  // The shipped mock uses a default export, so unwrap it into the module shape.
  // A jest.mock factory is hoisted above the import statements, so `require` is
  // the only option here.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  () => require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));
jest.mock('expo-splash-screen', () => ({
  hideAsync: jest.fn(async () => undefined),
  preventAutoHideAsync: jest.fn(async () => undefined),
}));
