/** @jest-environment node */

import * as WebBrowser from 'expo-web-browser';

import {
  openHostedPayment,
  parsePaymentReturn,
  PAYMENT_RETURN_URL,
} from './hostedPayment';

const openAuthSessionAsync = WebBrowser.openAuthSessionAsync as jest.Mock;

const fallback = {
  status: 'pending' as const,
  amount: '25.000',
  gatewayOrderId: 'PAYMOB-ORDER-000001',
  reference: 'PAYMOB-REF-000001',
};

beforeEach(() => {
  openAuthSessionAsync.mockReset();
});

describe('parsePaymentReturn', () => {
  it('reads everything the gateway’s return URL carries', () => {
    expect(
      parsePaymentReturn(
        'brandhub://payment/result?status=success&amount=25.000' +
          '&gatewayOrderId=PAYMOB-ORDER-000001&reference=PAYMOB-REF-000001',
      ),
    ).toEqual({
      status: 'success',
      amount: '25.000',
      gatewayOrderId: 'PAYMOB-ORDER-000001',
      reference: 'PAYMOB-REF-000001',
    });
  });

  it('reads a failure as a failure', () => {
    expect(
      parsePaymentReturn(
        'brandhub://payment/result?status=failed&amount=25.000',
      ).status,
    ).toBe('failed');
  });

  it('reads a return it cannot understand as pending, never as failed', () => {
    // The charge may well have succeeded; only the gateway knows, and the result screen asks it.
    expect(parsePaymentReturn('brandhub://payment/result').status).toBe(
      'pending',
    );
    expect(
      parsePaymentReturn('brandhub://payment/result?status=weird').status,
    ).toBe('pending');
  });

  it('decodes escaped values', () => {
    expect(
      parsePaymentReturn(
        'brandhub://payment/result?status=success&reference=REF%2F001',
      ).reference,
    ).toBe('REF/001');
  });
});

describe('openHostedPayment', () => {
  it('opens the gateway page as an auth session against the app’s own return URL', async () => {
    openAuthSessionAsync.mockResolvedValue({ type: 'dismiss' });

    await openHostedPayment('https://paymob.example/checkout/1', fallback);

    expect(openAuthSessionAsync).toHaveBeenCalledWith(
      'https://paymob.example/checkout/1',
      PAYMENT_RETURN_URL,
    );
  });

  it('reports what the caught redirect said', async () => {
    openAuthSessionAsync.mockResolvedValue({
      type: 'success',
      url: 'brandhub://payment/result?status=success&amount=25.000&gatewayOrderId=PAYMOB-ORDER-000001',
    });

    expect(
      await openHostedPayment('https://paymob.example/checkout/1', fallback),
    ).toMatchObject({
      status: 'success',
      gatewayOrderId: 'PAYMOB-ORDER-000001',
    });
  });

  it('treats a dismissed browser as pending, keeping the charge it can poll with', async () => {
    openAuthSessionAsync.mockResolvedValue({ type: 'dismiss' });

    // Closing the browser says nothing about the payment: the customer may have paid first.
    expect(
      await openHostedPayment('https://paymob.example/checkout/1', fallback),
    ).toEqual({ ...fallback, status: 'pending' });
  });

  it('treats a cancelled session the same way', async () => {
    openAuthSessionAsync.mockResolvedValue({ type: 'cancel' });

    expect(
      (await openHostedPayment('https://paymob.example/checkout/1', fallback))
        .status,
    ).toBe('pending');
  });
});
