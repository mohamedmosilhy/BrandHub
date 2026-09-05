/** @jest-environment node */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import request from 'supertest';

import { createMockApp } from '../app';
import { issueToken } from '../middleware/auth';
import { buildSeedDatabase } from '../seed/data';
import { writeSeedDatabase } from '../seed/generate';

type TestApp = ReturnType<typeof createMockApp>;

let app: TestApp;
let temporaryDirectory: string;
let databasePath: string;

beforeEach(() => {
  temporaryDirectory = mkdtempSync(join(tmpdir(), 'brandhub-mock-'));
  databasePath = join(temporaryDirectory, 'db.json');
  writeSeedDatabase(databasePath);
  app = createMockApp({
    databasePath,
    defaultLatencyMs: 0,
    timeoutFaultMs: 5,
  });
});

afterEach(() => {
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

async function signIn() {
  const response = await request(app).post('/api/v1/auth/login').send({
    email: 'customer@brandhub.om',
    password: 'Password123!',
  });
  expect(response.status).toBe(200);
  return {
    accessToken: response.body.accessToken as string,
    refreshToken: response.body.refreshToken as string,
    authorization: `Bearer ${response.body.accessToken as string}`,
  };
}

describe('catalogue contract', () => {
  it('serves a complete Spring page and product card metadata', async () => {
    const response = await request(app).get('/api/v1/products?page=0&size=20');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      totalElements: 220,
      totalPages: 11,
      number: 0,
      size: 20,
      first: true,
      last: false,
    });
    expect(response.body.content).toHaveLength(20);
    for (const product of response.body.content) {
      expect(product).toEqual(
        expect.objectContaining({
          name: expect.any(String),
          averageRating: expect.any(Number),
          reviewCount: expect.any(Number),
        }),
      );
    }
  });

  it('resolves Arabic and English into the same single-language field', async () => {
    const [arabic, english] = await Promise.all([
      request(app)
        .get('/api/v1/products/product-1')
        .set('Accept-Language', 'ar'),
      request(app)
        .get('/api/v1/products/product-1')
        .set('Accept-Language', 'en'),
    ]);

    expect(arabic.body.name).toContain('سماعات');
    expect(english.body.name).toContain('headphones');
    expect(arabic.body.name).not.toEqual(english.body.name);
    expect(arabic.body.name).not.toEqual(
      expect.objectContaining({ ar: expect.anything() }),
    );
  });

  it('searches both stored languages', async () => {
    const [arabic, english] = await Promise.all([
      request(app)
        .get('/api/v1/search/products?q=سماعات&page=0&size=20')
        .set('Accept-Language', 'ar'),
      request(app)
        .get('/api/v1/search/products?q=headphones&page=0&size=20')
        .set('Accept-Language', 'en'),
    ]);
    expect(arabic.body.totalElements).toBeGreaterThan(0);
    expect(english.body.totalElements).toBe(arabic.body.totalElements);
    expect(
      arabic.body.content.every((item: { name: string }) =>
        item.name.includes('سماعات'),
      ),
    ).toBe(true);
    expect(
      english.body.content.every((item: { name: string }) =>
        item.name.includes('headphones'),
      ),
    ).toBe(true);
  });

  it('filters, sorts and paginates catalogue discovery criteria', async () => {
    const response = await request(app)
      .get(
        '/api/v1/search/products?categoryId=cat-electronics&sellerId=seller-a2&inStock=true&minPrice=5&maxPrice=60&minRating=4&sort=price-desc&page=0&size=5',
      )
      .set('Accept-Language', 'en');

    expect(response.status).toBe(200);
    expect(response.body.content.length).toBeLessThanOrEqual(5);
    expect(
      response.body.content.every(
        (product: {
          categoryId: string;
          sellerId: string;
          stock: number;
          averageRating: number;
          basePrice: number;
          salePrice: number | null;
        }) => {
          const price = product.salePrice ?? product.basePrice;
          return (
            product.categoryId === 'cat-electronics' &&
            product.sellerId === 'seller-a2' &&
            product.stock > 0 &&
            product.averageRating >= 4 &&
            price >= 5 &&
            price <= 60
          );
        },
      ),
    ).toBe(true);
    const prices = response.body.content.map(
      (product: { basePrice: number; salePrice: number | null }) =>
        product.salePrice ?? product.basePrice,
    );
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  it('returns a nested category tree covering every product category', async () => {
    const [treeResponse, productsResponse] = await Promise.all([
      request(app).get('/api/v1/categories/tree'),
      request(app).get('/api/v1/products?page=0&size=220'),
    ]);
    const ids = new Set<string>();
    const collect = (nodes: { id: string; children: unknown[] }[]) => {
      for (const node of nodes) {
        ids.add(node.id);
        collect(node.children as { id: string; children: unknown[] }[]);
      }
    };
    collect(treeResponse.body);

    expect(ids.size).toBe(8);
    expect(
      treeResponse.body.some(
        (node: { children: unknown[] }) => node.children.length > 0,
      ),
    ).toBe(true);
    expect(
      productsResponse.body.content.every((product: { categoryId: string }) =>
        ids.has(product.categoryId),
      ),
    ).toBe(true);
  });

  it('keeps shipping economics in database records', async () => {
    const response = await request(app).get('/api/v1/areas');
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          governorate: 'Muscat',
          shippingPrice: expect.any(Number),
          minOrderAmount: expect.any(Number),
          estimatedDeliveryDays: expect.any(Number),
        }),
      ]),
    );
    expect(buildSeedDatabase().products).toHaveLength(220);
  });
});

describe('auth and developer controls', () => {
  it('enforces bearer auth and returns the documented login shape', async () => {
    expect((await request(app).get('/api/v1/cart')).status).toBe(401);
    expect((await request(app).get('/api/v1/users/me')).status).toBe(401);

    const tokens = await signIn();
    const profile = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', tokens.authorization);
    expect(profile.body).toMatchObject({
      id: 'user-customer',
      email: 'customer@brandhub.om',
    });
    expect(profile.body.password).toBeUndefined();
  });

  it('refreshes a valid token and rejects invalid or expired refresh tokens', async () => {
    const tokens = await signIn();
    const refreshed = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tokens.refreshToken });
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.accessToken).toEqual(expect.any(String));
    expect(refreshed.body.accessToken).not.toBe(tokens.accessToken);

    expect(
      (
        await request(app)
          .post('/api/v1/auth/refresh')
          .send({ refreshToken: 'invalid' })
      ).status,
    ).toBe(401);
    const expired = issueToken('user-customer', 'ROLE_CUSTOMER', 'refresh', -1);
    expect(
      (
        await request(app)
          .post('/api/v1/auth/refresh')
          .send({ refreshToken: expired })
      ).status,
    ).toBe(401);
  });

  it('keeps new seller accounts pending and without a session', async () => {
    const email = 'pending.seller@brandhub.om';
    const registered = await request(app)
      .post('/api/v1/auth/register/seller')
      .send({
        name: 'Pending Store',
        email,
        phoneNumber: '+96899112233',
        password: 'Password123!',
      });

    expect(registered.status).toBe(201);
    expect(registered.body).toMatchObject({
      success: true,
      data: { email, role: 'ROLE_SELLER', status: 'PENDING_APPROVAL' },
    });
    expect(registered.body.data.accessToken).toBeUndefined();
    expect(registered.body.data.refreshToken).toBeUndefined();

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'Password123!' });
    expect(login.status).toBe(403);
    expect(login.body.error).toBe('SELLER_PENDING_APPROVAL');
  });

  it('injects status, empty, timeout and a non-zero default latency', async () => {
    expect(
      (await request(app).get('/api/v1/products').set('x-mock-fail', '500'))
        .status,
    ).toBe(500);
    const empty = await request(app)
      .get('/api/v1/products')
      .set('x-mock-empty', 'true');
    expect(empty.body).toMatchObject({
      content: [],
      totalElements: 0,
      totalPages: 0,
    });
    expect(
      (await request(app).get('/api/v1/products').set('x-mock-fail', 'timeout'))
        .status,
    ).toBe(504);

    const delayed = createMockApp({ databasePath, defaultLatencyMs: 20 });
    const startedAt = Date.now();
    await request(delayed).get('/api/v1/products?size=1');
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(15);
  });
});

describe('stateful and money-moving contracts', () => {
  it('rejects unavailable cart quantities with a product-specific 409', async () => {
    const tokens = await signIn();
    const response = await request(app)
      .put('/api/v1/cart/items/cart-item-1?quantity=999')
      .set('Authorization', tokens.authorization);

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      error: 'INSUFFICIENT_STOCK',
      details: {
        productId: 'product-1',
        productName: expect.any(String),
        available: expect.any(Number),
      },
    });
    const cart = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', tokens.authorization);
    expect(cart.body.items[0].quantity).toBe(1);
  });

  it('places one idempotent order, computes BR3 totals and clears the cart', async () => {
    const tokens = await signIn();
    const before = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', tokens.authorization);
    const payload = {
      shippingAddressId: 'address-1',
      paymentMethod: 'CREDIT_CARD',
      walletPayment: false,
    };

    const first = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', tokens.authorization)
      .set('Idempotency-Key', 'order-attempt-1')
      .send(payload);
    const repeated = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', tokens.authorization)
      .set('Idempotency-Key', 'order-attempt-1')
      .send(payload);

    expect(first.status).toBe(201);
    expect(repeated.status).toBe(200);
    expect(repeated.body.id).toBe(first.body.id);
    expect(first.body.total).toBeCloseTo(
      first.body.subtotal +
        first.body.vat +
        first.body.shipping +
        first.body.paymentFee -
        first.body.discount,
      3,
    );
    expect(first.body.vat).toBeCloseTo(before.body.subtotal * 0.05, 3);
    expect(first.body.deliveryOtp).toMatch(/^\d{4}$/);
    const cart = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', tokens.authorization);
    expect(cart.body.items).toHaveLength(0);
    const orders = await request(app)
      .get('/api/v1/orders?size=20')
      .set('Authorization', tokens.authorization);
    expect(orders.body.totalElements).toBe(5);
  });

  it('deduplicates wallet charges and wallet transfers', async () => {
    const tokens = await signIn();
    const chargePayload = { amount: 25, paymentMethod: 'PAYMOB' };
    const firstCharge = await request(app)
      .post('/api/v1/wallet/charge')
      .set('Authorization', tokens.authorization)
      .set('Idempotency-Key', 'charge-1')
      .send(chargePayload);
    const secondCharge = await request(app)
      .post('/api/v1/wallet/charge')
      .set('Authorization', tokens.authorization)
      .set('Idempotency-Key', 'charge-1')
      .send(chargePayload);
    expect(secondCharge.body.data.id).toBe(firstCharge.body.data.id);

    const transferPayload = {
      recipientEmail: 'friend@brandhub.om',
      amount: 1,
      message: 'Thanks',
      password: 'Password123!',
    };
    const firstTransfer = await request(app)
      .post('/api/v1/wallet/transfers')
      .set('Authorization', tokens.authorization)
      .set('Idempotency-Key', 'transfer-1')
      .send(transferPayload);
    const secondTransfer = await request(app)
      .post('/api/v1/wallet/transfers')
      .set('Authorization', tokens.authorization)
      .set('Idempotency-Key', 'transfer-1')
      .send(transferPayload);
    expect(secondTransfer.body.data.id).toBe(firstTransfer.body.data.id);
    const transfers = await request(app)
      .get('/api/v1/wallet/transfers')
      .set('Authorization', tokens.authorization);
    expect(transfers.body.data.totalElements).toBe(1);
  });

  it('deducts a wallet order once and restores it on cancellation', async () => {
    const tokens = await signIn();
    const before = await request(app)
      .get('/api/v1/wallet')
      .set('Authorization', tokens.authorization);
    const order = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', tokens.authorization)
      .set('Idempotency-Key', 'wallet-order-1')
      .send({ shippingAddressId: 'address-1', walletPayment: true });
    const afterPurchase = await request(app)
      .get('/api/v1/wallet')
      .set('Authorization', tokens.authorization);
    expect(afterPurchase.body.balance).toBeCloseTo(
      before.body.balance - order.body.total,
      3,
    );

    await request(app)
      .post(`/api/v1/orders/${order.body.id as string}/cancel?reason=Changed`)
      .set('Authorization', tokens.authorization)
      .expect(200);
    const afterRefund = await request(app)
      .get('/api/v1/wallet')
      .set('Authorization', tokens.authorization);
    expect(afterRefund.body.balance).toBeCloseTo(before.body.balance, 3);
  });
});

describe('after-sales contract (Phase 9)', () => {
  it('keeps exactly one default address, clearing the previous one (BR7)', async () => {
    const { authorization } = await signIn();
    const authenticated = () => ({ Authorization: authorization });

    const before = await request(app)
      .get('/api/v1/users/me/addresses')
      .set(authenticated());
    expect(before.status).toBe(200);
    const defaults = (before.body.data as { id: string; isDefault: boolean }[])
      .filter((address) => address.isDefault)
      .map((address) => address.id);
    expect(defaults).toEqual(['address-1']);

    const applied = await request(app)
      .post('/api/v1/users/me/addresses/address-2/set-default')
      .set(authenticated());
    expect(applied.status).toBe(200);

    const after = await request(app)
      .get('/api/v1/users/me/addresses')
      .set(authenticated());
    expect(
      (after.body.data as { id: string; isDefault: boolean }[])
        .filter((address) => address.isDefault)
        .map((address) => address.id),
    ).toEqual(['address-2']);
  });

  it('stores and returns an address in the shape the app sends (D13)', async () => {
    const { authorization } = await signIn();
    const authenticated = () => ({ Authorization: authorization });

    // Exactly what `addressPayload` produces: Oman, no state, no postal code, and the label
    // carried in the second line.
    const created = await request(app)
      .post('/api/v1/users/me/addresses')
      .set(authenticated())
      .send({
        fullName: 'Salim Al Rashdi',
        phone: '+96899112233',
        addressLine1: 'Office 52, Knowledge Oasis',
        addressLine2: 'brandhub-label:WORK',
        city: 'Muscat',
        country: 'OM',
        isDefault: false,
      });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      fullName: 'Salim Al Rashdi',
      addressLine1: 'Office 52, Knowledge Oasis',
      addressLine2: 'brandhub-label:WORK',
      city: 'Muscat',
      country: 'OM',
      isDefault: false,
    });

    const id = created.body.data.id as string;
    const updated = await request(app)
      .put(`/api/v1/users/me/addresses/${id}`)
      .set(authenticated())
      .send({
        fullName: 'Salim Al Rashdi',
        phone: '+96899112233',
        addressLine1: 'Office 61, Knowledge Oasis',
        addressLine2: 'brandhub-label:HOME',
        city: 'Muscat',
        country: 'OM',
        isDefault: false,
      });
    expect(updated.status).toBe(200);
    expect(updated.body.data.id).toBe(id);
    expect(updated.body.data.addressLine1).toBe('Office 61, Knowledge Oasis');

    expect(
      (
        await request(app)
          .delete(`/api/v1/users/me/addresses/${id}`)
          .set(authenticated())
      ).status,
    ).toBe(204);
  });

  it("pages the account's orders and carries the delivery OTP (D19)", async () => {
    const { authorization } = await signIn();

    const page = await request(app)
      .get('/api/v1/orders?page=0&size=2')
      .set({ Authorization: authorization });
    expect(page.status).toBe(200);
    expect(page.body.content).toHaveLength(2);
    expect(page.body.totalElements).toBeGreaterThanOrEqual(4);
    expect(page.body.content[0].deliveryOtp).toEqual(expect.any(String));

    const second = await request(app)
      .get('/api/v1/orders?page=1&size=2')
      .set({ Authorization: authorization });
    expect(second.body.content[0].id).not.toBe(page.body.content[0].id);
  });

  it('takes a return as free text against a real order and rejects an unknown one (D19)', async () => {
    const { authorization } = await signIn();
    const authenticated = () => ({ Authorization: authorization });

    const accepted = await request(app)
      .post('/api/v1/returns')
      .set(authenticated())
      .send({
        orderId: 'order-4',
        reason: 'Arrived damaged: the screen was cracked',
      });
    expect(accepted.status).toBe(201);
    expect(accepted.body.data.reason).toBe(
      'Arrived damaged: the screen was cracked',
    );
    expect(accepted.body.data.status).toBe('PENDING');

    expect(
      (
        await request(app)
          .post('/api/v1/returns')
          .set(authenticated())
          .send({ orderId: 'order-404', reason: 'Arrived damaged' })
      ).status,
    ).toBe(400);
  });

  it('updates the profile through PUT /users/me', async () => {
    const { authorization } = await signIn();

    const updated = await request(app)
      .put('/api/v1/users/me')
      .set({ Authorization: authorization })
      .send({
        firstName: 'Salma',
        lastName: 'Al Rashdi',
        phone: '+96899112244',
      });
    expect(updated.status).toBe(200);
    // This route answers with the bare user, not the `data` envelope; `unwrapEnvelope` in the
    // data layer accepts both shapes.
    expect(updated.body).toMatchObject({
      firstName: 'Salma',
      lastName: 'Al Rashdi',
      phone: '+96899112244',
    });
  });
});

describe('customer endpoint inventory', () => {
  it('answers every read route and both deliberate envelope shapes', async () => {
    const { authorization } = await signIn();
    const publicPaths = [
      '/api/v1/products',
      '/api/v1/products/featured',
      '/api/v1/products/new-arrivals',
      '/api/v1/products/best-sellers',
      '/api/v1/products/search?q=headphones',
      '/api/v1/products/product-1',
      '/api/v1/products/category/cat-electronics',
      '/api/v1/categories/tree',
      '/api/v1/categories/cat-electronics',
      '/api/v1/categories/slug/electronics',
      '/api/v1/search/products?q=headphones',
      '/api/v1/sellers',
      '/api/v1/sellers/seller-a2/products',
      '/api/v1/sellers/seller-a2/profile-image',
      '/api/v1/users/user-customer/profile-image',
      '/api/v1/areas',
      '/api/v1/areas/governorate/Muscat',
      '/api/v1/areas/area-muscat',
      '/api/v1/shipping-rates',
      // A guest can open a PDP, so the reviews on it are readable without a session (D3).
      '/api/v1/reviews/product/product-1',
    ];
    for (const path of publicPaths)
      expect((await request(app).get(path)).status).toBe(200);

    // `GET /payments/PAYMOB/status` is not in this list: it answers about a charge that has to
    // exist first, so it is exercised in the Phase 10 test alongside the charge that creates it.
    const protectedPaths = [
      '/api/v1/cart',
      '/api/v1/orders',
      '/api/v1/orders/order-1',
      '/api/v1/returns',
      '/api/v1/support/tickets',
      '/api/v1/support/tickets/ticket-1',
      '/api/v1/wallet',
      '/api/v1/wallet/transactions',
      '/api/v1/wallet/transfers/settings',
      '/api/v1/wallet/transfers',
      '/api/v1/gifts/sent',
      '/api/v1/gifts/received',
      '/api/v1/users/me',
      '/api/v1/users/me/addresses',
      '/api/v1/wishlist',
      '/api/v1/reviews/product/product-1',
      '/api/v1/coupons',
      '/api/v1/notifications',
    ];
    for (const path of protectedPaths) {
      expect(
        (await request(app).get(path).set('Authorization', authorization))
          .status,
      ).toBe(200);
    }

    const bare = await request(app).get('/api/v1/products?size=1');
    const wrapped = await request(app).get('/api/v1/areas');
    expect(bare.body.success).toBeUndefined();
    expect(wrapped.body).toMatchObject({
      success: true,
      data: expect.any(Array),
    });
  });

  it('answers the contracted support, return, gift, review and profile mutations', async () => {
    const { authorization } = await signIn();
    const authenticated = () => ({ Authorization: authorization });

    const ticket = await request(app)
      .post('/api/v1/support/tickets')
      .set(authenticated())
      .send({
        orderId: 'order-1',
        category: 'ORDER',
        priority: 'NORMAL',
        subject: 'Payment issue',
        description: 'Please investigate.',
      });
    expect(ticket.status).toBe(201);
    expect(ticket.body.data.ticketNumber).toEqual(expect.any(String));
    const ticketId = ticket.body.data.id as string;
    expect(
      (
        await request(app)
          .post(`/api/v1/support/tickets/${ticketId}/messages`)
          .set(authenticated())
          .send({ message: 'Any update?' })
      ).status,
    ).toBe(201);
    expect(
      (
        await request(app)
          .post(`/api/v1/support/tickets/${ticketId}/attachments`)
          .set(authenticated())
          .set('x-file-name', 'photo.png')
      ).status,
    ).toBe(201);
    expect(
      (
        await request(app)
          .get(`/api/v1/support/tickets/${ticketId}/attachments`)
          .set(authenticated())
      ).status,
    ).toBe(200);

    const returnRequest = await request(app)
      .post('/api/v1/returns')
      .set(authenticated())
      .send({ orderId: 'order-1', reason: 'Product arrived damaged' });
    expect(returnRequest.status).toBe(201);
    expect(
      (
        await request(app)
          .get(`/api/v1/returns/${returnRequest.body.data.id as string}`)
          .set(authenticated())
      ).status,
    ).toBe(200);

    const gift = await request(app)
      .post('/api/v1/gifts')
      .set(authenticated())
      .send({
        recipient: 'friend@brandhub.om',
        amount: 1,
        currency: 'OMR',
        occasion: 'Thank you',
        message: 'A small gift',
        deliveryMethod: 'EMAIL',
        senderMode: 'NAMED',
        scheduledAt: null,
      });
    expect(gift.status).toBe(201);
    expect(
      (
        await request(app)
          .post(`/api/v1/gifts/${gift.body.data.id as string}/cancel`)
          .set(authenticated())
      ).status,
    ).toBe(200);

    expect(
      (
        await request(app)
          .post('/api/v1/reviews')
          .set(authenticated())
          .send({ productId: 'product-1', rating: 5, comment: 'Excellent' })
      ).status,
    ).toBe(201);
    const address = await request(app)
      .post('/api/v1/users/me/addresses')
      .set(authenticated())
      .send({
        fullName: 'Salim',
        phone: '+96899112233',
        addressLine1: 'New home',
        city: 'Muscat',
        country: 'OM',
        areaId: 'area-muscat',
        isDefault: false,
      });
    expect(address.status).toBe(201);
    expect(
      (
        await request(app)
          .put(`/api/v1/users/me/addresses/${address.body.data.id as string}`)
          .set(authenticated())
          .send({ city: 'Seeb' })
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .post(
            `/api/v1/users/me/addresses/${address.body.data.id as string}/set-default`,
          )
          .set(authenticated())
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .delete(
            `/api/v1/users/me/addresses/${address.body.data.id as string}`,
          )
          .set(authenticated())
      ).status,
    ).toBe(204);
  });

  it('answers all three documented invented areas', async () => {
    const { authorization } = await signIn();
    const sent = await request(app)
      .post('/api/v1/auth/phone/send-otp')
      .send({ phone: '+96899112233' });
    expect(sent.status).toBe(200);
    expect(
      (
        await request(app)
          .post('/api/v1/auth/phone/verify-otp')
          .send({ challengeId: sent.body.data.challengeId, code: '123456' })
      ).status,
    ).toBe(200);
    expect((await request(app).get('/api/v1/influencers')).status).toBe(200);
    expect((await request(app).get('/api/v1/posts')).status).toBe(200);
    expect(
      (
        await request(app)
          .post('/api/v1/influencers/influencer-1/follow')
          .set('Authorization', authorization)
      ).status,
    ).toBe(201);
    const slots = await request(app)
      .get('/api/v1/delivery/slots?areaId=area-muscat')
      .set('Authorization', authorization);
    expect(slots.body.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ express: true })]),
    );
  });

  it('runs the whole top-up journey Phase 10 renders', async () => {
    const { authorization } = await signIn();
    const authenticated = () => ({ Authorization: authorization });

    const before = await request(app)
      .get('/api/v1/wallet')
      .set(authenticated());
    expect(before.body).toMatchObject({ balance: 125.5, currency: 'OMR' });

    // The collection's own test script reads data.paymentUrl, data.gateway and data.referenceId.
    const charge = await request(app)
      .post('/api/v1/wallet/charge')
      .set(authenticated())
      .set('Idempotency-Key', 'topup-1')
      .send({ amount: 25, paymentMethod: 'PAYMOB' });
    expect(charge.status).toBe(201);
    expect(charge.body.data).toMatchObject({
      gateway: 'PAYMOB',
      status: 'PENDING',
      amount: 25,
    });
    expect(charge.body.data.referenceId).toEqual(expect.any(String));
    const order = charge.body.data.gatewayOrderId as string;

    // Pending until something settles it, and the status route reads the charge's real state.
    const pending = await request(app)
      .get(`/api/v1/payments/PAYMOB/status?orderId=${order}`)
      .set(authenticated());
    expect(pending.body).toMatchObject({ status: 'PENDING' });

    // `paymentUrl` leads to a page a browser can actually open.
    const checkout = await request(app).get(
      `/api/v1/payments/paymob/checkout/${order}`,
    );
    expect(checkout.status).toBe(200);
    expect(checkout.text).toContain('Mock PAYMOB checkout');

    // The contracted return settles the charge and hands the customer back on the app's scheme.
    const returned = await request(app).get(
      `/api/v1/payments/paymob/wallet-return?order=${order}&success=true`,
    );
    expect(returned.status).toBe(302);
    expect(returned.headers['location']).toBe(
      `brandhub://payment/result?status=success&amount=25.000` +
        `&gatewayOrderId=${order}&reference=${charge.body.data.referenceId}`,
    );

    // AC10.6 — the balance really moved, and the history says why.
    const after = await request(app).get('/api/v1/wallet').set(authenticated());
    expect(after.body.balance).toBe(150.5);
    const history = await request(app)
      .get('/api/v1/wallet/transactions')
      .set('Accept-Language', 'en')
      .set(authenticated());
    expect(history.body.content[0]).toMatchObject({
      type: 'CREDIT',
      amount: 25,
      description: 'Wallet top-up',
    });
    expect(
      (
        await request(app)
          .get(`/api/v1/payments/PAYMOB/status?orderId=${order}`)
          .set(authenticated())
      ).body.status,
    ).toBe('PAID');

    // A gateway reports the same payment twice; settling twice must not credit twice.
    await request(app)
      .post('/api/v1/payments/webhook/paymob')
      .send({ orderId: order, status: 'success', amount: 25 });
    expect(
      (await request(app).get('/api/v1/wallet').set(authenticated())).body
        .balance,
    ).toBe(150.5);

    // AC10.7 — a failed return moves no money.
    const failing = await request(app)
      .post('/api/v1/wallet/charge')
      .set(authenticated())
      .set('Idempotency-Key', 'topup-2')
      .send({ amount: 10, paymentMethod: 'PAYMOB' });
    await request(app).get(
      `/api/v1/payments/paymob/wallet-return?order=${failing.body.data.gatewayOrderId}&success=false`,
    );
    expect(
      (await request(app).get('/api/v1/wallet').set(authenticated())).body
        .balance,
    ).toBe(150.5);
  });

  it('moves money when a gift is sent, and refuses one the wallet cannot fund', async () => {
    const { authorization } = await signIn();
    const authenticated = () => ({ Authorization: authorization });
    const payload = {
      recipient: 'friend@brandhub.om',
      amount: 10,
      currency: 'OMR',
      occasion: 'BIRTHDAY',
      message: 'Happy birthday',
      deliveryMethod: 'EMAIL',
      senderMode: 'NAMED',
      scheduledAt: null,
    };

    const sent = await request(app)
      .post('/api/v1/gifts')
      .set(authenticated())
      .send(payload);
    expect(sent.status).toBe(201);
    expect(sent.body.data).toMatchObject({
      status: 'SENT',
      deliveryMethod: 'EMAIL',
      senderMode: 'NAMED',
      currency: 'OMR',
    });

    // AC10.10 — it appears in GET /gifts/sent, and the wallet paid for it.
    const history = await request(app)
      .get('/api/v1/gifts/sent')
      .set(authenticated());
    expect(history.body.data).toHaveLength(1);
    expect(
      (await request(app).get('/api/v1/wallet').set(authenticated())).body
        .balance,
    ).toBe(115.5);

    // AC10.11 — the server refuses an over-balance gift; the client's block is the message.
    const refused = await request(app)
      .post('/api/v1/gifts')
      .set(authenticated())
      .send({ ...payload, amount: 5_000 });
    expect(refused.status).toBe(400);
    expect(refused.body.error).toBe('INSUFFICIENT_BALANCE');
  });

  it('serves the support shapes Phase 12 renders', async () => {
    const { authorization } = await signIn();
    const authenticated = () => ({ Authorization: authorization });

    const tickets = await request(app)
      .get('/api/v1/support/tickets')
      .set('Accept-Language', 'en')
      .set(authenticated());
    expect(tickets.status).toBe(200);
    // Newest first, so a ticket the customer just opened is at the top of the list (AC12.4).
    expect(
      tickets.body.data.content.map(
        (ticket: { status: string }) => ticket.status,
      ),
    ).toEqual(['OPEN', 'IN_PROGRESS', 'RESOLVED']);
    expect(tickets.body.data.content[0]).toMatchObject({
      ticketNumber: 'TKT-2026-0001',
      category: 'DELIVERY',
      priority: 'HIGH',
      subject: 'Order arrived later than promised',
    });
    // The thread has two sides, and it is localised like the rest of the copy.
    expect(
      tickets.body.data.content[0].messages.map(
        (message: { senderType: string }) => message.senderType,
      ),
    ).toEqual(['CUSTOMER', 'SUPPORT', 'CUSTOMER']);
    const arabic = await request(app)
      .get('/api/v1/support/tickets/ticket-1')
      .set('Accept-Language', 'ar')
      .set(authenticated());
    expect(arabic.body.data.subject).toBe('لم يصل الطلب في الوقت المحدد');

    // Creating: the description becomes the opening message, so a replied-to ticket keeps it.
    const created = await request(app)
      .post('/api/v1/support/tickets')
      .set(authenticated())
      .send({
        orderId: 'order-1',
        category: 'PAYMENT',
        priority: 'NORMAL',
        subject: 'Promo code not applying',
        description: 'Code HUB20 errors out at checkout.',
      });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      status: 'OPEN',
      orderId: 'order-1',
      category: 'PAYMENT',
    });
    expect(created.body.data.messages).toEqual([
      expect.objectContaining({
        senderType: 'CUSTOMER',
        message: 'Code HUB20 errors out at checkout.',
      }),
    ]);

    const ticketId = created.body.data.id as string;
    const reply = await request(app)
      .post(`/api/v1/support/tickets/${ticketId}/messages`)
      .set(authenticated())
      .send({ message: 'Any update?' });
    expect(reply.status).toBe(201);
    const reread = await request(app)
      .get(`/api/v1/support/tickets/${ticketId}`)
      .set(authenticated());
    expect(
      reread.body.data.messages.map(
        (message: { message: string }) => message.message,
      ),
    ).toEqual(['Code HUB20 errors out at checkout.', 'Any update?']);
    // The reply moved the ticket to the top of the list, which is what its meta line reports.
    const after = await request(app)
      .get('/api/v1/support/tickets')
      .set(authenticated());
    expect(after.body.data.content[0].id).toBe(ticketId);

    // A ticket with no subject is refused rather than stored half-formed.
    expect(
      (
        await request(app)
          .post('/api/v1/support/tickets')
          .set(authenticated())
          .send({ category: 'OTHER', priority: 'LOW', description: 'Hello' })
      ).status,
    ).toBe(400);
  });

  it('serves the social and notification shapes Phase 11 renders', async () => {
    const { authorization } = await signIn();

    // Browsing the social feed is public (D3); the shape carries everything the profile shows.
    const influencers = await request(app)
      .get('/api/v1/influencers')
      .set('Accept-Language', 'en');
    expect(influencers.status).toBe(200);
    expect(influencers.body.data.content[0]).toMatchObject({
      id: 'influencer-1',
      name: 'Layan Al Maamari',
      handle: '@layan.style',
      followerCount: 215_000,
      postCount: 128,
      productCount: 46,
      isFollowing: false,
    });

    // A post carries its tagged products inline, so a feed is one request, not one per product.
    const posts = await request(app)
      .get('/api/v1/posts?influencerId=influencer-1')
      .set('Accept-Language', 'en');
    expect(posts.body.data.content).toHaveLength(2);
    expect(posts.body.data.content[0]).toMatchObject({
      influencerId: 'influencer-1',
      likeCount: 2_400,
      commentCount: 86,
      productIds: ['product-9'],
    });
    expect(posts.body.data.content[0].products[0].id).toBe('product-9');

    // Following is resolved per user and survives the request that created it.
    await request(app)
      .post('/api/v1/influencers/influencer-1/follow')
      .set('Authorization', authorization);
    const followed = await request(app)
      .get('/api/v1/influencers/influencer-1')
      .set('Authorization', authorization);
    expect(followed.body.data.isFollowing).toBe(true);
    // Following twice is the same relationship, not a second row.
    await request(app)
      .post('/api/v1/influencers/influencer-1/follow')
      .set('Authorization', authorization);
    await request(app)
      .delete('/api/v1/influencers/influencer-1/follow')
      .set('Authorization', authorization);
    expect(
      (
        await request(app)
          .get('/api/v1/influencers/influencer-1')
          .set('Authorization', authorization)
      ).body.data.isFollowing,
    ).toBe(false);

    // Arabic resolves from Accept-Language, exactly as the catalogue does (D9).
    const arabic = await request(app)
      .get('/api/v1/influencers/influencer-1')
      .set('Accept-Language', 'ar');
    expect(arabic.body.data.name).toBe('ليان المعمري');

    const notifications = await request(app)
      .get('/api/v1/notifications')
      .set('Accept-Language', 'en')
      .set('Authorization', authorization);
    expect(notifications.body.content).toHaveLength(5);
    expect(notifications.body.content[0]).toMatchObject({
      type: 'ORDER',
      title: 'Order #BH-284193 is being prepared',
      isRead: false,
    });

    // The invented mark-all-read reports what it changed, and changes nothing on a second call.
    const first = await request(app)
      .post('/api/v1/notifications/read-all')
      .set('Authorization', authorization);
    expect(first.body.data).toEqual({ updated: 2 });
    expect(
      (
        await request(app)
          .post('/api/v1/notifications/read-all')
          .set('Authorization', authorization)
      ).body.data,
    ).toEqual({ updated: 0 });
    const unread = await request(app)
      .get('/api/v1/notifications?isRead=false')
      .set('Authorization', authorization);
    expect(unread.body.content).toHaveLength(0);
  });

  it('serves the product-detail shapes Phase 7 renders', async () => {
    const reviews = await request(app).get('/api/v1/reviews/product/product-1');
    expect(reviews.status).toBe(200);
    expect(reviews.body.content[0]).toMatchObject({
      productId: 'product-1',
      // Resolved server-side so a review list never fans out into per-reviewer requests.
      userName: 'Salim Al Rashdi',
    });

    // D8 needs both shapes present: a colour choice, and a product that resolves on its own.
    const multi = await request(app).get('/api/v1/products/product-1');
    const single = await request(app).get('/api/v1/products/product-5');
    expect(multi.body.variants).toHaveLength(2);
    expect(single.body.variants).toHaveLength(1);
    expect(multi.body.specs.length).toBeGreaterThan(0);

    // The seller store reads the directory page; there is no `GET /sellers/{id}` to read.
    const sellers = await request(app).get('/api/v1/sellers?page=0&size=100');
    expect(
      sellers.body.data.content.map((seller: { id: string }) => seller.id),
    ).toContain('seller-a2');
    expect((await request(app).get('/api/v1/sellers/nope')).status).toBe(404);
  });

  it('covers the remaining auth, cart, account and commerce verbs', async () => {
    const tokens = await signIn();
    const authenticated = () => ({ Authorization: tokens.authorization });

    expect(
      (
        await request(app).post('/api/v1/auth/register').send({
          email: 'new.customer@brandhub.om',
          password: 'Password123!',
          firstName: 'New',
          lastName: 'Customer',
          phone: '+96890000000',
        })
      ).status,
    ).toBe(201);
    expect(
      (
        await request(app).post('/api/v1/auth/register').send({
          email: 'customer@brandhub.om',
          password: 'Password123!',
        })
      ).status,
    ).toBe(409);
    expect(
      (
        await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({ email: 'customer@brandhub.om' })
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .post('/api/v1/auth/reset-password')
          .send({ token: 'local-token', password: 'Password123!' })
      ).status,
    ).toBe(200);
    expect(
      (await request(app).get('/api/v1/auth/verify-email?token=local-token'))
        .status,
    ).toBe(200);

    expect(
      (
        await request(app)
          .put('/api/v1/cart/items/cart-item-1?quantity=3')
          .set(authenticated())
      ).body.items.find((item: { id: string }) => item.id === 'cart-item-1')
        .quantity,
    ).toBe(3);
    expect(
      (
        await request(app)
          .delete('/api/v1/cart/items/cart-item-2')
          .set(authenticated())
      ).status,
    ).toBe(204);
    expect(
      (
        await request(app)
          .post('/api/v1/cart/items')
          .set(authenticated())
          .send({
            productId: 'product-3',
            variantId: 'product-3-default',
            quantity: 1,
          })
      ).status,
    ).toBe(201);

    expect(
      (
        await request(app)
          .post('/api/v1/orders/order-1/cancel?reason=Changed%20mind')
          .set(authenticated())
      ).body.status,
    ).toBe('CANCELLED');
    expect(
      (
        await request(app)
          .post('/api/v1/delivery/orders/order-2/delivered')
          .set(authenticated())
          .send({ otp: '3815' })
      ).body.data.status,
    ).toBe('DELIVERED');

    expect(
      (
        await request(app)
          .post('/api/v1/wallet/transfers/recipient-preview')
          .set(authenticated())
          .send({ email: 'friend@brandhub.om' })
      ).body.data.email,
    ).toBe('friend@brandhub.om');
    expect(
      (
        await request(app)
          .post('/api/v1/coupons/validate')
          .set(authenticated())
          .send({ code: 'WELCOME10' })
      ).body.data.valid,
    ).toBe(true);

    expect(
      (
        await request(app)
          .post('/api/v1/wishlist/product-2')
          .set(authenticated())
      ).status,
    ).toBe(201);
    expect(
      (
        await request(app)
          .delete('/api/v1/wishlist/product-2')
          .set(authenticated())
      ).status,
    ).toBe(204);
    expect(
      (
        await request(app).put('/api/v1/users/me').set(authenticated()).send({
          firstName: 'Salem',
        })
      ).body.firstName,
    ).toBe('Salem');
    expect(
      (
        await request(app)
          .patch('/api/v1/users/me/password')
          .set(authenticated())
          .send({
            currentPassword: 'Password123!',
            newPassword: 'UpdatedPassword123!',
          })
      ).status,
    ).toBe(204);
    expect(
      (await request(app).delete('/api/v1/cart').set(authenticated())).status,
    ).toBe(204);
    expect(
      (
        await request(app)
          .post('/api/v1/payments/webhook/paymob')
          .set(authenticated())
          .send({ type: 'PAYMENT' })
      ).status,
    ).toBe(200);

    await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken: tokens.refreshToken })
      .expect(204);
    await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tokens.refreshToken })
      .expect(401);
  });

  it('supports both gift terminal actions and attachment download', async () => {
    const { authorization } = await signIn();
    const authenticated = () => ({ Authorization: authorization });
    const giftPayload = {
      recipient: 'friend@brandhub.om',
      amount: 1,
      currency: 'OMR',
      occasion: 'Thank you',
      message: 'A small gift',
      deliveryMethod: 'EMAIL',
      senderMode: 'NAMED',
      scheduledAt: null,
    };
    const first = await request(app)
      .post('/api/v1/gifts')
      .set(authenticated())
      .send(giftPayload);
    const second = await request(app)
      .post('/api/v1/gifts')
      .set(authenticated())
      .send(giftPayload);
    expect(
      (
        await request(app)
          .post(`/api/v1/gifts/${first.body.data.id as string}/claim`)
          .set(authenticated())
      ).body.data.status,
    ).toBe('CLAIMED');
    expect(
      (
        await request(app)
          .post(`/api/v1/gifts/${second.body.data.id as string}/cancel`)
          .set(authenticated())
      ).body.data.status,
    ).toBe('CANCELLED');

    const attachment = await request(app)
      .post('/api/v1/support/tickets/ticket-1/attachments')
      .set(authenticated())
      .set('x-file-name', 'proof.png');
    expect(
      (
        await request(app)
          .get(
            `/api/v1/support/tickets/attachments/${attachment.body.data.id as string}`,
          )
          .set(authenticated())
      ).status,
    ).toBe(200);
  });
});
