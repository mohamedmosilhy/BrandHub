/**
 * AC7.11: the PDP and the seller store draw their own bottom furniture — the buy bar, a
 * full-bleed grid — so the tab bar stands down for them. The focused route of the active tab's
 * own stack is what decides, so a deep link into a product hides the tabs just as a tap does.
 *
 * It lives apart from `AppNavigator` because that module builds the DI container on import;
 * the rule itself is worth asserting without a running app.
 */
const FULL_SCREEN_ROUTES = new Set(['Product', 'Seller']);

export function hidesTabBar(focusedRouteName: string | undefined): boolean {
  return Boolean(focusedRouteName && FULL_SCREEN_ROUTES.has(focusedRouteName));
}
