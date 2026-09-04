import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import type { Express, Request, Response } from 'express';

import { authenticatedUserId, issueToken, readToken } from './middleware/auth';
import { apiError, envelope } from './middleware/envelope';
import { pageOf } from './middleware/pagination';
import type { MockStore } from './store';

type Row = Record<string, unknown>;
type RouteRequest = Request<Record<string, string>, unknown, Row>;

const placeholderPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

/**
 * Mock imagery.
 *
 * The seed asks for `/mock-assets/product-N.png` and `/mock-assets/category-N.png`. Answering
 * those with a 1x1 pixel is contract-correct but renders as a black square in the app, which
 * makes every catalogue screen unreadable next to the prototype. The prototype's own product
 * illustrations ship in `design-reference/`, so they are served here instead. The 1x1 stays as
 * the fallback for any name that does not resolve to a file, so the route never 404s and the
 * contract is unchanged.
 */
const referenceImageDir = resolve(
  __dirname,
  '..',
  'design-reference',
  'uploads',
  'BRAND HUB (6)',
  'assets',
  'products',
);

/** `CATS` in the app prototype: each category reuses one of the product illustrations. */
const categoryArtwork = [1, 3, 10, 9, 6, 5, 7, 8];

function referenceImagePath(file: string): string | null {
  const product = /^product-(\d+)\.\w+$/.exec(file);
  if (product) {
    const index = Number(product[1]);
    return join(referenceImageDir, `p${((index - 1) % 20) + 1}.jpg`);
  }
  const category = /^category-(\d+)\.\w+$/.exec(file);
  if (category) {
    const index = Number(category[1]) - 1;
    const artwork =
      categoryArtwork[
        ((index % categoryArtwork.length) + categoryArtwork.length) %
          categoryArtwork.length
      ];
    return join(referenceImageDir, `p${artwork}.jpg`);
  }
  return null;
}

function sendMockAsset(file: string, response: Response): void {
  const path = referenceImagePath(file);
  if (path && existsSync(path)) {
    response.type('jpeg').send(readFileSync(path));
    return;
  }
  const fallback = join(referenceImageDir, 'p1.jpg');
  if (existsSync(fallback)) {
    response.type('jpeg').send(readFileSync(fallback));
    return;
  }
  response.type('png').send(placeholderPng);
}

const now = () => new Date().toISOString();
const roundMoney = (value: number) => Number(value.toFixed(3));
const stringValue = (value: unknown) =>
  typeof value === 'string' ? value : '';
const numberValue = (value: unknown) =>
  typeof value === 'number' ? value : Number(value);

function nextId(collection: Row[], prefix: string): string {
  return `${prefix}-${collection.length + 1}`;
}

function localeOf(request: Request): 'ar' | 'en' {
  return request.acceptsLanguages('ar', 'en') === 'ar' ? 'ar' : 'en';
}

function localise(value: unknown, locale: 'ar' | 'en'): unknown {
  if (Array.isArray(value)) return value.map((item) => localise(item, locale));
  if (!value || typeof value !== 'object') return value;
  const record = value as Row;
  if (
    typeof record['ar'] === 'string' &&
    typeof record['en'] === 'string' &&
    Object.keys(record).length === 2
  ) {
    return record[locale];
  }
  return Object.fromEntries(
    Object.entries(record).map(([key, item]) => [key, localise(item, locale)]),
  );
}

function productResponse(product: Row, request: Request): Row {
  return localise(product, localeOf(request)) as Row;
}

function error(
  response: Response,
  status: number,
  code: string,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): void {
  response.status(status).json(apiError(status, code, message, details));
}

function byId(collection: Row[], id: string): Row | undefined {
  return collection.find((item) => item['id'] === id);
}

/** A reviewer, a gift recipient and a ticket author are all shown by name, not by id. */
function displayName(user: Row | undefined): string {
  if (!user) return '';
  return `${stringValue(user['firstName'])} ${stringValue(user['lastName'])}`.trim();
}

function userView(user: Row): Row {
  const { password: _password, walletBalance: _walletBalance, ...safe } = user;
  return safe;
}

function idempotentResult(
  store: MockStore,
  request: Request,
  response: Response,
  scope: string,
): Row | undefined {
  const key = request.header('idempotency-key');
  if (!key) return undefined;
  const record = store.data.idempotency.find(
    (entry) => entry['key'] === key && entry['scope'] === scope,
  );
  if (record) response.json(record['response']);
  return record;
}

function rememberIdempotency(
  store: MockStore,
  request: Request,
  scope: string,
  result: unknown,
): void {
  const key = request.header('idempotency-key');
  if (key) {
    store.data.idempotency.push({
      key,
      scope,
      response: result,
      createdAt: now(),
    });
  }
}

function catalogueMatches(product: Row, query: string): boolean {
  if (!query) return true;
  const normalized = query.toLocaleLowerCase();
  const name = product['name'] as Row;
  const description = product['description'] as Row;
  return [name['ar'], name['en'], description['ar'], description['en']].some(
    (value) => stringValue(value).toLocaleLowerCase().includes(normalized),
  );
}

function cataloguePrice(product: Row): number {
  return numberValue(product['salePrice'] ?? product['basePrice']);
}

function filterCatalogue(products: Row[], request: Request): Row[] {
  const query = stringValue(request.query['q']);
  const categoryId = stringValue(request.query['categoryId']);
  const sellerId = stringValue(request.query['sellerId']);
  const minPrice = numberValue(request.query['minPrice'] ?? 0);
  const maxPrice = numberValue(
    request.query['maxPrice'] ?? Number.MAX_SAFE_INTEGER,
  );
  const minRating = numberValue(request.query['minRating'] ?? 0);
  const inStock = request.query['inStock'] === 'true';
  const express = request.query['express'] === 'true';
  const filtered = products.filter(
    (product) =>
      catalogueMatches(product, query) &&
      (!categoryId || product['categoryId'] === categoryId) &&
      (!sellerId || product['sellerId'] === sellerId) &&
      (!inStock || numberValue(product['stock']) > 0) &&
      !express &&
      cataloguePrice(product) >= minPrice &&
      cataloguePrice(product) <= maxPrice &&
      numberValue(product['averageRating']) >= minRating,
  );
  switch (stringValue(request.query['sort'])) {
    case 'top-rated':
      return filtered.sort(
        (a, b) =>
          numberValue(b['averageRating']) - numberValue(a['averageRating']) ||
          numberValue(b['reviewCount']) - numberValue(a['reviewCount']),
      );
    case 'price-asc':
      return filtered.sort((a, b) => cataloguePrice(a) - cataloguePrice(b));
    case 'price-desc':
      return filtered.sort((a, b) => cataloguePrice(b) - cataloguePrice(a));
    default:
      return filtered;
  }
}

function cartFor(store: MockStore, request: Request, response: Response): Row {
  const userId = authenticatedUserId(response);
  const items = store.data.cartItems
    .filter((item) => item['userId'] === userId)
    .flatMap((item) => {
      const product = byId(store.data.products, stringValue(item['productId']));
      if (!product) return [];
      const variants = product['variants'] as Row[];
      const variant = byId(variants, stringValue(item['variantId']));
      const unitPrice = numberValue(
        variant?.['price'] ?? product['salePrice'] ?? product['basePrice'],
      );
      return [
        {
          ...item,
          product: productResponse(product, request),
          variant,
          unitPrice,
          lineTotal: roundMoney(unitPrice * numberValue(item['quantity'])),
        },
      ];
    });
  return {
    id: `cart-${userId}`,
    userId,
    items,
    subtotal: roundMoney(
      items.reduce((sum, item) => sum + numberValue(item['lineTotal']), 0),
    ),
    currency: 'OMR',
  };
}

function registerAuthRoutes(app: Express, store: MockStore): void {
  app.post('/api/v1/auth/login', (request: RouteRequest, response) => {
    const user = store.data.users.find(
      (item) =>
        item['email'] === request.body['email'] &&
        item['password'] === request.body['password'],
    );
    if (!user)
      return error(
        response,
        401,
        'INVALID_CREDENTIALS',
        'Email or password is incorrect',
      );
    if (user['status'] === 'PENDING_APPROVAL') {
      return error(
        response,
        403,
        'SELLER_PENDING_APPROVAL',
        'Seller account is pending administrator approval',
      );
    }
    const accessToken = issueToken(
      stringValue(user['id']),
      stringValue(user['role']),
      'access',
    );
    const refreshToken = issueToken(
      stringValue(user['id']),
      stringValue(user['role']),
      'refresh',
    );
    store.data.refreshTokens.push({
      token: refreshToken,
      userId: user['id'],
      revoked: false,
    });
    store.write();
    response.json({ accessToken, refreshToken, user: userView(user) });
  });

  app.post('/api/v1/auth/register', (request: RouteRequest, response) => {
    if (
      store.data.users.some((user) => user['email'] === request.body['email'])
    ) {
      return error(
        response,
        409,
        'EMAIL_EXISTS',
        'An account already uses this email',
      );
    }
    const user = {
      id: nextId(store.data.users, 'user'),
      email: request.body['email'],
      password: request.body['password'],
      firstName: request.body['firstName'],
      lastName: request.body['lastName'],
      phone: request.body['phone'],
      role: 'ROLE_CUSTOMER',
      walletBalance: 0,
    };
    store.data.users.push(user);
    store.write();
    response.status(201).json(envelope(userView(user)));
  });

  app.post(
    '/api/v1/auth/register/seller',
    (request: RouteRequest, response) => {
      if (
        store.data.users.some((user) => user['email'] === request.body['email'])
      ) {
        return error(
          response,
          409,
          'EMAIL_EXISTS',
          'An account already uses this email',
        );
      }
      const user = {
        id: nextId(store.data.users, 'seller-user'),
        email: request.body['email'],
        password: request.body['password'],
        firstName: request.body['name'],
        lastName: '',
        name: request.body['name'],
        storeName: request.body['name'],
        phoneNumber: request.body['phoneNumber'],
        role: 'ROLE_SELLER',
        status: 'PENDING_APPROVAL',
        walletBalance: 0,
      };
      store.data.users.push(user);
      store.write();
      response.status(201).json(envelope(userView(user)));
    },
  );

  app.post('/api/v1/auth/refresh', (request: RouteRequest, response) => {
    const token = stringValue(request.body['refreshToken']);
    const payload = readToken(token, 'refresh');
    const saved = store.data.refreshTokens.find(
      (entry) => entry['token'] === token && entry['revoked'] !== true,
    );
    const user = payload ? byId(store.data.users, payload.sub) : undefined;
    if (!payload || !saved || !user) {
      return error(
        response,
        401,
        'INVALID_REFRESH_TOKEN',
        'Refresh token is invalid or expired',
      );
    }
    response.json({
      accessToken: issueToken(payload.sub, payload.role, 'access'),
    });
  });

  app.post('/api/v1/auth/logout', (request: RouteRequest, response) => {
    const saved = store.data.refreshTokens.find(
      (entry) => entry['token'] === request.body['refreshToken'],
    );
    if (saved) saved['revoked'] = true;
    store.write();
    response.status(204).end();
  });

  app.post('/api/v1/auth/forgot-password', (_request, response) => {
    response.json(
      envelope({
        message: 'If the account exists, reset instructions were sent.',
      }),
    );
  });
  app.post('/api/v1/auth/reset-password', (_request, response) => {
    response.json(envelope({ message: 'Password reset.' }));
  });
  app.get('/api/v1/auth/verify-email', (request, response) => {
    if (!request.query['token'])
      return error(
        response,
        400,
        'TOKEN_REQUIRED',
        'Verification token is required',
      );
    response.json(envelope({ verified: true }));
  });

  app.post('/api/v1/auth/phone/send-otp', (request: RouteRequest, response) => {
    const challenge = {
      id: nextId(store.data.otpChallenges, 'otp'),
      phone: request.body['phone'],
      code: '123456',
      expiresAt: new Date(Date.now() + 300_000).toISOString(),
    };
    store.data.otpChallenges.push(challenge);
    store.write();
    response.json(
      envelope({ challengeId: challenge.id, expiresInSeconds: 300 }),
    );
  });
  app.post(
    '/api/v1/auth/phone/verify-otp',
    (request: RouteRequest, response) => {
      const challenge = byId(
        store.data.otpChallenges,
        stringValue(request.body['challengeId']),
      );
      if (!challenge || challenge['code'] !== request.body['code']) {
        return error(response, 401, 'INVALID_OTP', 'OTP is invalid or expired');
      }
      response.json(envelope({ verified: true, phone: challenge['phone'] }));
    },
  );
}

function registerCatalogueRoutes(app: Express, store: MockStore): void {
  const listProducts = (request: Request, products: Row[]) =>
    products.map((product) => productResponse(product, request));

  app.get('/api/v1/products/featured', (request, response) => {
    response.json(
      listProducts(
        request,
        store.data.products
          .filter((item) => item['featured'] === true)
          .slice(0, 12),
      ),
    );
  });
  app.get('/api/v1/products/new-arrivals', (request, response) => {
    response.json(
      listProducts(
        request,
        [...store.data.products]
          .sort((a, b) =>
            stringValue(b['createdAt']).localeCompare(
              stringValue(a['createdAt']),
            ),
          )
          .slice(0, 12),
      ),
    );
  });
  app.get('/api/v1/products/best-sellers', (request, response) => {
    response.json(
      listProducts(
        request,
        [...store.data.products]
          .sort(
            (a, b) =>
              numberValue(b['salesCount']) - numberValue(a['salesCount']),
          )
          .slice(0, 12),
      ),
    );
  });
  app.get('/api/v1/products/search', (request, response) => {
    response.json(
      listProducts(request, filterCatalogue(store.data.products, request)),
    );
  });
  app.get('/api/v1/products/category/:categoryId', (request, response) => {
    const items = store.data.products.filter(
      (product) => product['categoryId'] === request.params.categoryId,
    );
    response.json(
      pageOf(listProducts(request, filterCatalogue(items, request)), request),
    );
  });
  app.get('/api/v1/products/slug/:slug', (request, response) => {
    const product = store.data.products.find(
      (item) => item['slug'] === request.params.slug,
    );
    if (!product)
      return error(response, 404, 'PRODUCT_NOT_FOUND', 'Product was not found');
    response.json(productResponse(product, request));
  });
  app.get('/api/v1/products/:id', (request, response) => {
    const product = byId(store.data.products, request.params.id);
    if (!product)
      return error(response, 404, 'PRODUCT_NOT_FOUND', 'Product was not found');
    response.json(productResponse(product, request));
  });
  app.get('/api/v1/products', (request, response) => {
    const categoryId = stringValue(request.query['categoryId']);
    const filtered = categoryId
      ? store.data.products.filter(
          (product) => product['categoryId'] === categoryId,
        )
      : store.data.products;
    response.json(pageOf(listProducts(request, filtered), request));
  });
  app.get('/api/v1/search/products', (request, response) => {
    response.json(
      pageOf(
        listProducts(request, filterCatalogue(store.data.products, request)),
        request,
      ),
    );
  });

  app.get('/api/v1/categories/tree', (request, response) => {
    const locale = localeOf(request);
    const childrenOf = (parentId: unknown): Row[] =>
      store.data.categories
        .filter((category) => category['parentId'] === parentId)
        .map((category) => ({
          ...(localise(category, locale) as Row),
          children: childrenOf(category['id']),
        }));
    response.json(childrenOf(null));
  });
  app.get('/api/v1/categories/slug/:slug', (request, response) => {
    const category = store.data.categories.find(
      (item) => item['slug'] === request.params.slug,
    );
    if (!category)
      return error(
        response,
        404,
        'CATEGORY_NOT_FOUND',
        'Category was not found',
      );
    response.json(localise(category, localeOf(request)));
  });
  app.get('/api/v1/categories/:id', (request, response) => {
    const category = byId(store.data.categories, request.params.id);
    if (!category)
      return error(
        response,
        404,
        'CATEGORY_NOT_FOUND',
        'Category was not found',
      );
    response.json(localise(category, localeOf(request)));
  });

  const sellers = [
    {
      id: 'seller-a2',
      sellerUuid: 'seller-a2',
      storeName: 'A2 Official Store',
      verified: true,
      averageRating: 4.8,
      salesCount: 1940,
      profileImageUrl: '/api/v1/sellers/seller-a2/profile-image',
    },
    {
      id: 'seller-bait',
      sellerUuid: 'seller-bait',
      storeName: 'Bait Oman',
      verified: true,
      averageRating: 4.6,
      salesCount: 920,
      profileImageUrl: '/api/v1/sellers/seller-bait/profile-image',
    },
    {
      id: 'seller-nizwa',
      sellerUuid: 'seller-nizwa',
      storeName: 'Nizwa Makers',
      verified: true,
      averageRating: 4.7,
      salesCount: 710,
      profileImageUrl: '/api/v1/sellers/seller-nizwa/profile-image',
    },
  ];
  app.get('/api/v1/sellers/:id/products', (request, response) => {
    const products = store.data.products.filter(
      (product) => product['sellerId'] === request.params.id,
    );
    response.json(envelope(pageOf(listProducts(request, products), request)));
  });
  app.get('/api/v1/sellers/:id/profile-image', (_request, response) =>
    sendMockAsset('product-12.png', response),
  );
  app.get('/api/v1/sellers', (request, response) =>
    response.json(envelope(pageOf(sellers, request))),
  );
  app.get('/api/v1/users/:userId/profile-image', (_request, response) =>
    sendMockAsset('product-6.png', response),
  );
  app.get('/api/v1/mock-assets/:file', (request, response) =>
    sendMockAsset(stringValue(request.params['file']), response),
  );
}

function registerCartAndOrderRoutes(app: Express, store: MockStore): void {
  app.get('/api/v1/cart', (request, response) =>
    response.json(cartFor(store, request, response)),
  );
  app.post('/api/v1/cart/items', (request: RouteRequest, response) => {
    const product = byId(
      store.data.products,
      stringValue(request.body['productId']),
    );
    const variants = (product?.['variants'] ?? []) as Row[];
    const variant = byId(variants, stringValue(request.body['variantId']));
    const quantity = numberValue(request.body['quantity']);
    if (!product || !variant || !Number.isInteger(quantity) || quantity <= 0) {
      return error(
        response,
        400,
        'INVALID_CART_ITEM',
        'A valid product, variant and positive quantity are required',
      );
    }
    const userId = authenticatedUserId(response);
    const existing = store.data.cartItems.find(
      (item) =>
        item['userId'] === userId && item['variantId'] === variant['id'],
    );
    const nextQuantity = numberValue(existing?.['quantity'] ?? 0) + quantity;
    if (nextQuantity > numberValue(variant['stock'])) {
      return error(
        response,
        409,
        'INSUFFICIENT_STOCK',
        'The requested quantity is no longer available',
        {
          productId: product['id'],
          productName: localise(product['name'], localeOf(request)),
          available: variant['stock'],
        },
      );
    }
    if (existing) existing['quantity'] = nextQuantity;
    else
      store.data.cartItems.push({
        id: nextId(store.data.cartItems, 'cart-item'),
        userId,
        productId: product['id'],
        variantId: variant['id'],
        quantity,
      });
    store.write();
    response.status(201).json(cartFor(store, request, response));
  });
  app.put('/api/v1/cart/items/:id', (request, response) => {
    const item = byId(store.data.cartItems, request.params.id);
    const quantity = numberValue(request.query['quantity']);
    if (!item || !Number.isInteger(quantity) || quantity <= 0)
      return error(
        response,
        400,
        'INVALID_QUANTITY',
        'Quantity must be a positive integer',
      );
    const product = byId(store.data.products, stringValue(item['productId']));
    const variant = byId(
      (product?.['variants'] ?? []) as Row[],
      stringValue(item['variantId']),
    );
    if (!product || !variant || quantity > numberValue(variant['stock'])) {
      return error(
        response,
        409,
        'INSUFFICIENT_STOCK',
        'The requested quantity is no longer available',
        {
          productId: item['productId'],
          productName: localise(product?.['name'], localeOf(request)),
          available: variant?.['stock'] ?? 0,
        },
      );
    }
    item['quantity'] = quantity;
    store.write();
    response.json(cartFor(store, request, response));
  });
  app.delete('/api/v1/cart/items/:id', (request, response) => {
    const index = store.data.cartItems.findIndex(
      (item) => item['id'] === request.params.id,
    );
    if (index < 0)
      return error(
        response,
        404,
        'CART_ITEM_NOT_FOUND',
        'Cart item was not found',
      );
    store.data.cartItems.splice(index, 1);
    store.write();
    response.status(204).end();
  });
  app.delete('/api/v1/cart', (_request, response) => {
    const userId = authenticatedUserId(response);
    store.data.cartItems = store.data.cartItems.filter(
      (item) => item['userId'] !== userId,
    );
    store.write();
    response.status(204).end();
  });

  app.post('/api/v1/orders', (request: RouteRequest, response) => {
    if (idempotentResult(store, request, response, 'orders')) return;
    const userId = authenticatedUserId(response);
    const cart = cartFor(store, request, response);
    const items = cart['items'] as Row[];
    if (items.length === 0)
      return error(response, 400, 'EMPTY_CART', 'The cart is empty');
    for (const item of items) {
      const product = byId(store.data.products, stringValue(item['productId']));
      const variant = byId(
        (product?.['variants'] ?? []) as Row[],
        stringValue(item['variantId']),
      );
      if (
        !product ||
        !variant ||
        numberValue(item['quantity']) > numberValue(variant['stock'])
      ) {
        return error(
          response,
          409,
          'INSUFFICIENT_STOCK',
          'An item in the cart is no longer available in the requested quantity',
          {
            productId: item['productId'],
            productName: product
              ? localise(product['name'], localeOf(request))
              : item['productId'],
            available: variant?.['stock'] ?? 0,
          },
        );
      }
    }
    const address = byId(
      store.data.addresses,
      stringValue(request.body['shippingAddressId']),
    );
    if (!address)
      return error(
        response,
        400,
        'ADDRESS_NOT_FOUND',
        'Shipping address was not found',
      );
    const couponCode = stringValue(request.body['couponCode']);
    const coupon = couponCode
      ? store.data.coupons.find(
          (item) => item['code'] === couponCode && item['active'] === true,
        )
      : undefined;
    if (couponCode && !coupon)
      return error(response, 400, 'INVALID_COUPON', 'Coupon is invalid');
    const subtotal = numberValue(cart['subtotal']);
    const area = byId(store.data.areas, stringValue(address['areaId']));
    const shipping =
      area && subtotal < numberValue(area['minOrderAmount'])
        ? numberValue(area['shippingPrice'])
        : 0;
    const discount = coupon
      ? Math.min(
          (subtotal * numberValue(coupon['value'])) / 100,
          numberValue(coupon['maximumDiscount']),
        )
      : 0;
    const vat = roundMoney(subtotal * 0.05);
    const paymentFee =
      request.body['paymentMethod'] === 'CASH_ON_DELIVERY' ? 0.5 : 0;
    const total = roundMoney(subtotal + vat + shipping + paymentFee - discount);
    const walletPayment = request.body['walletPayment'] === true;
    const user = byId(store.data.users, userId);
    if (
      walletPayment &&
      (!user || numberValue(user['walletBalance']) < total)
    ) {
      return error(
        response,
        400,
        'INSUFFICIENT_WALLET_BALANCE',
        'Wallet balance is insufficient',
      );
    }
    const order = {
      id: nextId(store.data.orders, 'order'),
      orderNumber: `BH-${300000 + store.data.orders.length + 1}`,
      userId,
      status: 'PENDING',
      items,
      subtotal,
      vat,
      shipping,
      paymentFee,
      discount: roundMoney(discount),
      total,
      currency: 'OMR',
      shippingAddressId: address['id'],
      paymentMethod: request.body['paymentMethod'] ?? 'PAYMOB',
      walletPayment,
      notes: request.body['notes'] ?? null,
      deliveryOtp: String(1000 + Math.floor(Math.random() * 9000)),
      createdAt: now(),
    };
    if (walletPayment && user) {
      user['walletBalance'] = roundMoney(
        numberValue(user['walletBalance']) - total,
      );
      store.data.walletTransactions.push({
        id: nextId(store.data.walletTransactions, 'wallet-transaction'),
        userId,
        type: 'PURCHASE',
        amount: total,
        currency: 'OMR',
        orderId: order.id,
        description: `Order ${order.orderNumber}`,
        createdAt: now(),
      });
    }
    store.data.orders.push(order);
    for (const item of items) {
      const product = byId(store.data.products, stringValue(item['productId']));
      const variant = byId(
        (product?.['variants'] ?? []) as Row[],
        stringValue(item['variantId']),
      );
      if (variant) {
        variant['stock'] = Math.max(
          0,
          numberValue(variant['stock']) - numberValue(item['quantity']),
        );
      }
    }
    store.data.cartItems = store.data.cartItems.filter(
      (item) => item['userId'] !== userId,
    );
    rememberIdempotency(store, request, 'orders', order);
    store.write();
    response.status(201).json(order);
  });
  app.get('/api/v1/orders/:id', (request, response) => {
    const order = byId(store.data.orders, request.params.id);
    if (!order)
      return error(response, 404, 'ORDER_NOT_FOUND', 'Order was not found');
    response.json(order);
  });
  app.get('/api/v1/orders', (request, response) => {
    const userId = authenticatedUserId(response);
    response.json(
      pageOf(
        store.data.orders.filter((order) => order['userId'] === userId),
        request,
      ),
    );
  });
  app.post('/api/v1/orders/:id/cancel', (request, response) => {
    const order = byId(store.data.orders, request.params.id);
    if (!order)
      return error(response, 404, 'ORDER_NOT_FOUND', 'Order was not found');
    if (order['status'] === 'DELIVERED')
      return error(
        response,
        400,
        'ORDER_NOT_CANCELLABLE',
        'A delivered order cannot be cancelled',
      );
    order['status'] = 'CANCELLED';
    order['cancellationReason'] = request.query['reason'] ?? null;
    if (order['walletPayment'] === true && order['walletRefunded'] !== true) {
      const user = byId(store.data.users, stringValue(order['userId']));
      if (user) {
        user['walletBalance'] = roundMoney(
          numberValue(user['walletBalance']) + numberValue(order['total']),
        );
        order['walletRefunded'] = true;
        store.data.walletTransactions.push({
          id: nextId(store.data.walletTransactions, 'wallet-transaction'),
          userId: user['id'],
          type: 'REFUND',
          amount: order['total'],
          currency: 'OMR',
          orderId: order['id'],
          description: `Refund ${stringValue(order['orderNumber'])}`,
          createdAt: now(),
        });
      }
    }
    store.write();
    response.json(order);
  });
  app.post(
    '/api/v1/delivery/orders/:id/delivered',
    (request: RouteRequest, response) => {
      const order = byId(store.data.orders, stringValue(request.params['id']));
      if (!order || order['deliveryOtp'] !== request.body['otp'])
        return error(
          response,
          400,
          'INVALID_DELIVERY_OTP',
          'Delivery OTP is invalid',
        );
      order['status'] = 'DELIVERED';
      store.write();
      response.json(envelope(order));
    },
  );
}

function registerAccountRoutes(app: Express, store: MockStore): void {
  app.get('/api/v1/users/me', (_request, response) => {
    const user = byId(store.data.users, authenticatedUserId(response));
    response.json(user ? userView(user) : null);
  });
  app.put('/api/v1/users/me', (request: RouteRequest, response) => {
    const user = byId(store.data.users, authenticatedUserId(response));
    if (!user)
      return error(response, 404, 'USER_NOT_FOUND', 'User was not found');
    for (const field of ['firstName', 'lastName', 'phone'])
      if (request.body[field] !== undefined) user[field] = request.body[field];
    store.write();
    response.json(userView(user));
  });
  app.patch('/api/v1/users/me/password', (request: RouteRequest, response) => {
    const user = byId(store.data.users, authenticatedUserId(response));
    if (!user || user['password'] !== request.body['currentPassword'])
      return error(
        response,
        400,
        'INVALID_PASSWORD',
        'Current password is incorrect',
      );
    user['password'] = request.body['newPassword'];
    store.write();
    response.status(204).end();
  });
  app.post(
    '/api/v1/users/me/addresses/:id/set-default',
    (request, response) => {
      const userId = authenticatedUserId(response);
      const address = byId(
        store.data.addresses,
        stringValue(request.params['id']),
      );
      if (!address)
        return error(
          response,
          404,
          'ADDRESS_NOT_FOUND',
          'Address was not found',
        );
      store.data.addresses
        .filter((item) => item['userId'] === userId)
        .forEach((item) => {
          item['isDefault'] = item === address;
        });
      store.write();
      response.json(envelope(address));
    },
  );
  app.put(
    '/api/v1/users/me/addresses/:id',
    (request: RouteRequest, response) => {
      const address = byId(
        store.data.addresses,
        stringValue(request.params['id']),
      );
      if (!address)
        return error(
          response,
          404,
          'ADDRESS_NOT_FOUND',
          'Address was not found',
        );
      Object.assign(address, request.body, {
        id: address['id'],
        userId: address['userId'],
      });
      store.write();
      response.json(envelope(address));
    },
  );
  app.delete('/api/v1/users/me/addresses/:id', (request, response) => {
    const index = store.data.addresses.findIndex(
      (item) => item['id'] === request.params.id,
    );
    if (index < 0)
      return error(response, 404, 'ADDRESS_NOT_FOUND', 'Address was not found');
    store.data.addresses.splice(index, 1);
    store.write();
    response.status(204).end();
  });
  app.get('/api/v1/users/me/addresses', (_request, response) =>
    response.json(
      envelope(
        store.data.addresses.filter(
          (item) => item['userId'] === authenticatedUserId(response),
        ),
      ),
    ),
  );
  app.post('/api/v1/users/me/addresses', (request: RouteRequest, response) => {
    const address = {
      id: nextId(store.data.addresses, 'address'),
      userId: authenticatedUserId(response),
      ...request.body,
    };
    store.data.addresses.push(address);
    store.write();
    response.status(201).json(envelope(address));
  });

  app.get('/api/v1/wishlist', (request, response) => {
    const productIds = store.data.wishlist
      .filter((item) => item['userId'] === authenticatedUserId(response))
      .map((item) => item['productId']);
    response.json(
      store.data.products
        .filter((product) => productIds.includes(product['id']))
        .map((product) => productResponse(product, request)),
    );
  });
  app.post('/api/v1/wishlist/:productId', (request, response) => {
    if (!byId(store.data.products, request.params.productId))
      return error(response, 404, 'PRODUCT_NOT_FOUND', 'Product was not found');
    const userId = authenticatedUserId(response);
    if (
      !store.data.wishlist.some(
        (item) =>
          item['userId'] === userId &&
          item['productId'] === request.params.productId,
      )
    )
      store.data.wishlist.push({
        id: nextId(store.data.wishlist, 'wishlist'),
        userId,
        productId: request.params.productId,
      });
    store.write();
    response
      .status(201)
      .json(envelope({ productId: request.params.productId }));
  });
  app.delete('/api/v1/wishlist/:productId', (request, response) => {
    const userId = authenticatedUserId(response);
    store.data.wishlist = store.data.wishlist.filter(
      (item) =>
        !(
          item['userId'] === userId &&
          item['productId'] === request.params.productId
        ),
    );
    store.write();
    response.status(204).end();
  });
}

function registerCommerceRoutes(app: Express, store: MockStore): void {
  /**
   * The collection specifies the review routes but carries no response example, so the shape is
   * the mock's to define, as it was for every other silent endpoint in Phase 3. A review is
   * rendered with its author's name, so `userName` is resolved here rather than leaving the
   * client to issue a per-review user request — the same reasoning as D14 for card ratings.
   */
  const reviewResponse = (review: Record<string, unknown>) => ({
    ...review,
    userName: displayName(
      byId(store.data.users, stringValue(review['userId'])),
    ),
  });
  app.get('/api/v1/reviews/product/:productId', (request, response) =>
    response.json(
      pageOf(
        store.data.reviews
          .filter((item) => item['productId'] === request.params.productId)
          .map(reviewResponse),
        request,
      ),
    ),
  );
  app.post('/api/v1/reviews', (request: RouteRequest, response) => {
    const rating = numberValue(request.body['rating']);
    if (
      !byId(store.data.products, stringValue(request.body['productId'])) ||
      rating < 1 ||
      rating > 5
    )
      return error(
        response,
        400,
        'INVALID_REVIEW',
        'Product and rating from 1 to 5 are required',
      );
    const review = {
      id: nextId(store.data.reviews, 'review'),
      userId: authenticatedUserId(response),
      productId: request.body['productId'],
      rating,
      comment: request.body['comment'],
      createdAt: now(),
    };
    store.data.reviews.push(review);
    store.write();
    response.status(201).json(envelope(reviewResponse(review)));
  });
  app.get('/api/v1/coupons', (_request, response) =>
    response.json(store.data.coupons.filter((item) => item['active'] === true)),
  );
  app.post('/api/v1/coupons/validate', (request: RouteRequest, response) => {
    const coupon = store.data.coupons.find(
      (item) =>
        item['code'] === request.body['code'] && item['active'] === true,
    );
    if (!coupon)
      return error(response, 404, 'COUPON_NOT_FOUND', 'Coupon is invalid');
    response.json(envelope({ valid: true, coupon }));
  });
  app.get('/api/v1/notifications', (request, response) => {
    const isRead = request.query['isRead'];
    const items = store.data.notifications.filter(
      (item) =>
        item['userId'] === authenticatedUserId(response) &&
        (isRead === undefined || item['isRead'] === (isRead === 'true')),
    );
    response.json(pageOf(items, request));
  });

  app.get('/api/v1/areas/governorate/:name', (request, response) =>
    response.json(
      envelope(
        store.data.areas.filter(
          (item) =>
            item['governorate'] === request.params.name &&
            item['active'] === true,
        ),
      ),
    ),
  );
  app.get('/api/v1/areas/:id', (request, response) => {
    const area = byId(store.data.areas, request.params.id);
    if (!area)
      return error(response, 404, 'AREA_NOT_FOUND', 'Area was not found');
    response.json(envelope(area));
  });
  app.get('/api/v1/areas', (_request, response) =>
    response.json(
      envelope(store.data.areas.filter((item) => item['active'] === true)),
    ),
  );
  app.get('/api/v1/shipping-rates', (_request, response) =>
    response.json(
      envelope(
        store.data.shippingRates.filter((item) => item['active'] === true),
      ),
    ),
  );
  app.get('/api/v1/delivery/slots', (request, response) =>
    response.json(
      envelope(
        [
          {
            id: 'slot-standard',
            label: { ar: 'غداً 9ص — 2م', en: 'Tomorrow 9am–2pm' },
            areaId: request.query['areaId'] ?? null,
            surcharge: 0,
            express: false,
          },
          {
            id: 'slot-express',
            label: { ar: 'خلال ساعتين', en: 'Within two hours' },
            areaId: request.query['areaId'] ?? null,
            surcharge: 1.5,
            express: true,
          },
        ].map((item) => localise(item, localeOf(request))),
      ),
    ),
  );
}

function registerWalletRoutes(app: Express, store: MockStore): void {
  app.get('/api/v1/wallet/transfers/settings', (_request, response) =>
    response.json(
      envelope({
        currency: 'OMR',
        minimumAmount: 1,
        maximumAmount: 500,
        dailyLimit: 1000,
        fee: 0,
        sendEnabled: true,
        receiveEnabled: true,
      }),
    ),
  );
  app.post(
    '/api/v1/wallet/transfers/recipient-preview',
    (request: RouteRequest, response) => {
      const email = request.body['email'] ?? request.body['recipientEmail'];
      const recipient = store.data.users.find(
        (user) => user['email'] === email,
      );
      if (!recipient)
        return error(
          response,
          404,
          'RECIPIENT_NOT_FOUND',
          'Recipient was not found',
        );
      response.json(
        envelope({
          id: recipient['id'],
          email: recipient['email'],
          displayName: `${recipient['firstName']} ${recipient['lastName']}`,
        }),
      );
    },
  );
  app.post('/api/v1/wallet/transfers', (request: RouteRequest, response) => {
    if (idempotentResult(store, request, response, 'wallet-transfers')) return;
    const user = byId(store.data.users, authenticatedUserId(response));
    const recipient = store.data.users.find(
      (item) => item['email'] === request.body['recipientEmail'],
    );
    const amount = numberValue(request.body['amount']);
    if (
      !user ||
      !recipient ||
      user['password'] !== request.body['password'] ||
      amount <= 0 ||
      numberValue(user['walletBalance']) < amount
    )
      return error(
        response,
        400,
        'TRANSFER_REJECTED',
        'Transfer details are invalid',
      );
    user['walletBalance'] = roundMoney(
      numberValue(user['walletBalance']) - amount,
    );
    recipient['walletBalance'] = roundMoney(
      numberValue(recipient['walletBalance']) + amount,
    );
    const transfer = {
      id: nextId(store.data.walletTransfers, 'transfer'),
      senderId: user['id'],
      recipientId: recipient['id'],
      recipientEmail: recipient['email'],
      amount,
      currency: 'OMR',
      message: request.body['message'] ?? null,
      status: 'COMPLETED',
      createdAt: now(),
    };
    const result = envelope(transfer);
    store.data.walletTransfers.push(transfer);
    rememberIdempotency(store, request, 'wallet-transfers', result);
    store.write();
    response.status(201).json(result);
  });
  app.get('/api/v1/wallet/transfers/:id', (request, response) => {
    const transfer = byId(
      store.data.walletTransfers,
      stringValue(request.params['id']),
    );
    if (!transfer)
      return error(
        response,
        404,
        'TRANSFER_NOT_FOUND',
        'Transfer was not found',
      );
    response.json(envelope(transfer));
  });
  app.get('/api/v1/wallet/transfers', (request, response) =>
    response.json(envelope(pageOf(store.data.walletTransfers, request))),
  );
  app.get('/api/v1/wallet/transactions', (request, response) =>
    response.json(
      pageOf(
        store.data.walletTransactions.filter(
          (item) => item['userId'] === authenticatedUserId(response),
        ),
        request,
      ),
    ),
  );
  app.post('/api/v1/wallet/charge', (request: RouteRequest, response) => {
    if (idempotentResult(store, request, response, 'wallet-charge')) return;
    const amount = numberValue(request.body['amount']);
    if (amount <= 0 || request.body['paymentMethod'] !== 'PAYMOB')
      return error(
        response,
        400,
        'INVALID_CHARGE',
        'A positive amount and PAYMOB are required',
      );
    const charge = {
      id: nextId(store.data.walletTransactions, 'charge'),
      amount,
      currency: 'OMR',
      status: 'PENDING',
      paymentMethod: 'PAYMOB',
      paymentUrl: `https://paymob.example/checkout/${store.data.walletTransactions.length + 1}`,
      createdAt: now(),
    };
    rememberIdempotency(store, request, 'wallet-charge', charge);
    store.write();
    response.status(201).json(charge);
  });
  app.get('/api/v1/wallet', (_request, response) => {
    const user = byId(store.data.users, authenticatedUserId(response));
    response.json({
      userId: user?.['id'],
      balance: user?.['walletBalance'] ?? 0,
      currency: 'OMR',
    });
  });
}

function registerSupportAndGiftRoutes(app: Express, store: MockStore): void {
  app.get('/api/v1/support/tickets/attachments/:id', (request, response) => {
    const attachment = byId(store.data.ticketAttachments, request.params.id);
    if (!attachment)
      return error(
        response,
        404,
        'ATTACHMENT_NOT_FOUND',
        'Attachment was not found',
      );
    response.type('png').send(placeholderPng);
  });
  app.post('/api/v1/support/tickets/:id/attachments', (request, response) => {
    const ticket = byId(store.data.tickets, stringValue(request.params['id']));
    if (!ticket)
      return error(response, 404, 'TICKET_NOT_FOUND', 'Ticket was not found');
    const attachment = {
      id: nextId(store.data.ticketAttachments, 'attachment'),
      ticketId: ticket['id'],
      fileName: request.header('x-file-name') ?? 'attachment.png',
      contentType: request.header('content-type') ?? 'application/octet-stream',
      url: `/api/v1/support/tickets/attachments/attachment-${store.data.ticketAttachments.length + 1}`,
      createdAt: now(),
    };
    store.data.ticketAttachments.push(attachment);
    store.write();
    response.status(201).json(envelope(attachment));
  });
  app.get('/api/v1/support/tickets/:id/attachments', (request, response) =>
    response.json(
      envelope(
        store.data.ticketAttachments.filter(
          (item) => item['ticketId'] === request.params.id,
        ),
      ),
    ),
  );
  app.post(
    '/api/v1/support/tickets/:id/messages',
    (request: RouteRequest, response) => {
      const ticket = byId(
        store.data.tickets,
        stringValue(request.params['id']),
      );
      if (!ticket || !request.body['message'])
        return error(
          response,
          400,
          'INVALID_MESSAGE',
          'Ticket and message are required',
        );
      const messages = ticket['messages'] as Row[];
      const message = {
        id: nextId(messages, 'ticket-message'),
        senderType: 'CUSTOMER',
        message: request.body['message'],
        createdAt: now(),
      };
      messages.push(message);
      ticket['updatedAt'] = now();
      store.write();
      response.status(201).json(envelope(message));
    },
  );
  app.get('/api/v1/support/tickets/:id', (request, response) => {
    const ticket = byId(store.data.tickets, request.params.id);
    if (!ticket)
      return error(response, 404, 'TICKET_NOT_FOUND', 'Ticket was not found');
    response.json(envelope(ticket));
  });
  app.get('/api/v1/support/tickets', (request, response) =>
    response.json(
      envelope(
        pageOf(
          store.data.tickets.filter(
            (item) => item['userId'] === authenticatedUserId(response),
          ),
          request,
        ),
      ),
    ),
  );
  app.post('/api/v1/support/tickets', (request: RouteRequest, response) => {
    for (const field of ['category', 'priority', 'subject', 'description'])
      if (!request.body[field])
        return error(response, 400, 'INVALID_TICKET', `${field} is required`);
    const ticket = {
      id: nextId(store.data.tickets, 'ticket'),
      ticketNumber: `TKT-2026-${String(store.data.tickets.length + 1).padStart(4, '0')}`,
      userId: authenticatedUserId(response),
      orderId: request.body['orderId'] ?? null,
      category: request.body['category'],
      priority: request.body['priority'],
      subject: request.body['subject'],
      description: request.body['description'],
      status: 'OPEN',
      messages: [],
      createdAt: now(),
      updatedAt: now(),
    };
    store.data.tickets.push(ticket);
    store.write();
    response.status(201).json(envelope(ticket));
  });

  app.post('/api/v1/returns', (request: RouteRequest, response) => {
    if (
      !byId(store.data.orders, stringValue(request.body['orderId'])) ||
      !request.body['reason']
    )
      return error(
        response,
        400,
        'INVALID_RETURN',
        'A valid orderId and reason are required',
      );
    const item = {
      id: nextId(store.data.returns, 'return'),
      returnNumber: `RET-${3000 + store.data.returns.length + 1}`,
      userId: authenticatedUserId(response),
      orderId: request.body['orderId'],
      reason: request.body['reason'],
      status: 'PENDING',
      createdAt: now(),
    };
    store.data.returns.push(item);
    store.write();
    response.status(201).json(envelope(item));
  });
  app.get('/api/v1/returns/:id', (request, response) => {
    const item = byId(store.data.returns, request.params.id);
    if (!item)
      return error(response, 404, 'RETURN_NOT_FOUND', 'Return was not found');
    response.json(envelope(item));
  });
  app.get('/api/v1/returns', (request, response) =>
    response.json(envelope(pageOf(store.data.returns, request))),
  );

  app.post('/api/v1/gifts/:id/claim', (request, response) => {
    const gift = byId(store.data.gifts, request.params.id);
    if (!gift)
      return error(response, 404, 'GIFT_NOT_FOUND', 'Gift was not found');
    gift['status'] = 'CLAIMED';
    store.write();
    response.json(envelope(gift));
  });
  app.post('/api/v1/gifts/:id/cancel', (request, response) => {
    const gift = byId(store.data.gifts, request.params.id);
    if (!gift)
      return error(response, 404, 'GIFT_NOT_FOUND', 'Gift was not found');
    gift['status'] = 'CANCELLED';
    store.write();
    response.json(envelope(gift));
  });
  app.get('/api/v1/gifts/sent', (_request, response) =>
    response.json(
      envelope(
        store.data.gifts.filter(
          (item) => item['senderId'] === authenticatedUserId(response),
        ),
      ),
    ),
  );
  app.get('/api/v1/gifts/received', (_request, response) => {
    const user = byId(store.data.users, authenticatedUserId(response));
    response.json(
      envelope(
        store.data.gifts.filter(
          (item) => item['recipient'] === user?.['email'],
        ),
      ),
    );
  });
  app.post('/api/v1/gifts', (request: RouteRequest, response) => {
    const required = [
      'recipient',
      'amount',
      'currency',
      'occasion',
      'message',
      'deliveryMethod',
      'senderMode',
    ];
    if (
      required.some((field) => request.body[field] === undefined) ||
      request.body['currency'] !== 'OMR'
    )
      return error(
        response,
        400,
        'INVALID_GIFT',
        'The full OMR gift payload is required',
      );
    const gift = {
      id: nextId(store.data.gifts, 'gift'),
      senderId: authenticatedUserId(response),
      ...request.body,
      status: request.body['scheduledAt'] ? 'SCHEDULED' : 'SENT',
      createdAt: now(),
    };
    store.data.gifts.push(gift);
    store.write();
    response.status(201).json(envelope(gift));
  });
}

function registerSocialAndPaymentRoutes(app: Express, store: MockStore): void {
  app.get('/api/v1/influencers', (request, response) =>
    response.json(envelope(pageOf(store.data.influencers, request))),
  );
  app.get('/api/v1/influencers/:id', (request, response) => {
    const influencer = byId(store.data.influencers, request.params.id);
    if (!influencer)
      return error(
        response,
        404,
        'INFLUENCER_NOT_FOUND',
        'Influencer was not found',
      );
    response.json(envelope(influencer));
  });
  app.get('/api/v1/posts', (request, response) =>
    response.json(
      envelope(
        pageOf(
          store.data.posts.map(
            (post) => localise(post, localeOf(request)) as Row,
          ),
          request,
        ),
      ),
    ),
  );
  app.post('/api/v1/influencers/:id/follow', (request, response) => {
    const follow = {
      id: nextId(store.data.follows, 'follow'),
      userId: authenticatedUserId(response),
      influencerId: request.params.id,
      createdAt: now(),
    };
    store.data.follows.push(follow);
    store.write();
    response.status(201).json(envelope(follow));
  });
  app.delete('/api/v1/influencers/:id/follow', (request, response) => {
    const userId = authenticatedUserId(response);
    store.data.follows = store.data.follows.filter(
      (item) =>
        !(
          item['userId'] === userId &&
          item['influencerId'] === request.params.id
        ),
    );
    store.write();
    response.status(204).end();
  });
  app.get('/api/v1/payments/PAYMOB/status', (request, response) =>
    response.json(
      envelope({
        orderId: request.query['orderId'],
        status: 'PAID',
        paymentMethod: 'PAYMOB',
      }),
    ),
  );
  app.post('/api/v1/payments/webhook/paymob', (_request, response) =>
    response.json({ received: true }),
  );
}

export function registerContractRoutes(app: Express, store: MockStore): void {
  registerAuthRoutes(app, store);
  registerCatalogueRoutes(app, store);
  registerCartAndOrderRoutes(app, store);
  registerAccountRoutes(app, store);
  registerCommerceRoutes(app, store);
  registerWalletRoutes(app, store);
  registerSupportAndGiftRoutes(app, store);
  registerSocialAndPaymentRoutes(app, store);
}
