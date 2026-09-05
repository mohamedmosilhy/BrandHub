import * as WebBrowser from 'expo-web-browser';

/**
 * The scheme the gateway sends the customer back on. It is the same path `linking.ts` maps to the
 * `PaymentResult` route, so a return that arrives while the app is **killed** is handled by React
 * Navigation's own deep-link parsing, and one that arrives while the browser session is still open
 * is handled by `openHostedPayment` below. Both paths end on the same screen with the same params.
 */
export const PAYMENT_RETURN_URL = 'brandhub://payment/result';

export type PaymentReturn = Readonly<{
  status: 'success' | 'failed' | 'pending';
  amount?: string;
  reference?: string;
  gatewayOrderId?: string;
}>;

const OUTCOMES = new Set(['success', 'failed', 'pending']);

/** Reads the return URL's query without assuming `URL` search parsing on every RN engine. */
export function parsePaymentReturn(url: string): PaymentReturn {
  const query = url.slice(url.indexOf('?') + 1);
  const params = new Map<string, string>();
  for (const pair of query.split('&')) {
    const [key, value] = pair.split('=');
    if (key) params.set(key, decodeURIComponent(value ?? ''));
  }
  const status = params.get('status') ?? '';
  return {
    status: OUTCOMES.has(status)
      ? (status as PaymentReturn['status'])
      : // A return the app cannot read is not a failure — the charge may well have succeeded.
        // Pending is the only honest reading, and the result screen resolves it by polling.
        'pending',
    ...(params.get('amount') ? { amount: params.get('amount') as string } : {}),
    ...(params.get('reference')
      ? { reference: params.get('reference') as string }
      : {}),
    ...(params.get('gatewayOrderId')
      ? { gatewayOrderId: params.get('gatewayOrderId') as string }
      : {}),
  };
}

/**
 * Opens the gateway's hosted page in an authentication session and reports what came back.
 *
 * The session is deliberately not a `WebView` inside the app: **card details are never entered in
 * BRANDHUB's own process** (§28 S6). Dismissing the browser tells us nothing about the payment —
 * the customer may have paid and then closed it — so a dismissal reads as `pending` and the result
 * screen asks the gateway rather than guessing.
 */
export async function openHostedPayment(
  paymentUrl: string,
  fallback: PaymentReturn,
): Promise<PaymentReturn> {
  const result = await WebBrowser.openAuthSessionAsync(
    paymentUrl,
    PAYMENT_RETURN_URL,
  );
  if (result.type === 'success' && result.url)
    return { ...fallback, ...parsePaymentReturn(result.url) };
  return { ...fallback, status: 'pending' };
}
