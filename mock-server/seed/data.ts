import type { MockDatabase } from './types';

const categories = [
  {
    id: 'cat-electronics',
    parentId: null,
    slug: 'electronics',
    name: { ar: 'الإلكترونيات', en: 'Electronics' },
  },
  {
    id: 'cat-fashion',
    parentId: null,
    slug: 'fashion',
    name: { ar: 'الأزياء', en: 'Fashion' },
  },
  {
    id: 'cat-home',
    parentId: null,
    slug: 'home',
    name: { ar: 'المنزل', en: 'Home' },
  },
  {
    id: 'cat-beauty',
    parentId: null,
    slug: 'beauty',
    name: { ar: 'الجمال', en: 'Beauty' },
  },
  {
    id: 'cat-audio',
    parentId: 'cat-electronics',
    slug: 'audio',
    name: { ar: 'الصوتيات', en: 'Audio' },
  },
  {
    id: 'cat-shoes',
    parentId: 'cat-fashion',
    slug: 'shoes',
    name: { ar: 'الأحذية', en: 'Shoes' },
  },
  {
    id: 'cat-kitchen',
    parentId: 'cat-home',
    slug: 'kitchen',
    name: { ar: 'المطبخ', en: 'Kitchen' },
  },
  {
    id: 'cat-skincare',
    parentId: 'cat-beauty',
    slug: 'skincare',
    name: { ar: 'العناية بالبشرة', en: 'Skincare' },
  },
].map((category, index) => ({
  ...category,
  imageUrl: `/api/v1/mock-assets/category-${index + 1}.png`,
}));

const productNames = [
  ['سماعات لاسلكية عازلة للضوضاء', 'Noise-cancelling wireless headphones'],
  ['حذاء رياضي خفيف', 'Lightweight running shoes'],
  ['آلة قهوة عربية', 'Arabic coffee maker'],
  ['مصل ترطيب للوجه', 'Hydrating face serum'],
  ['ساعة ذكية رياضية', 'Sport smart watch'],
  ['حقيبة جلدية يومية', 'Everyday leather bag'],
  ['طقم أواني خزفي', 'Ceramic cookware set'],
  ['واقي شمس معدني', 'Mineral sunscreen'],
] as const;

const sellerIds = ['seller-a2', 'seller-bait', 'seller-nizwa'];

const products = Array.from({ length: 220 }, (_, index) => {
  const category = categories[index % categories.length]!;
  const name = productNames[index % productNames.length]!;
  const id = `product-${index + 1}`;
  const basePrice = Number((8.9 + (index % 73) * 0.65).toFixed(3));
  const onSale = index % 4 === 0;
  const averageRating = Number((3.7 + (index % 13) / 10).toFixed(1));
  const reviewCount = 3 + ((index * 17) % 380);

  return {
    id,
    slug: `${category.slug}-${index + 1}`,
    categoryId: category.id,
    sellerId: sellerIds[index % sellerIds.length],
    name: { ar: `${name[0]} ${index + 1}`, en: `${name[1]} ${index + 1}` },
    description: {
      ar: 'منتج مختار من متجر عُماني موثّق مع توصيل داخل السلطنة.',
      en: 'A curated product from a verified Omani seller with local delivery.',
    },
    basePrice,
    salePrice: onSale ? Number((basePrice * 0.85).toFixed(3)) : null,
    currency: 'OMR',
    stock: 8 + (index % 42),
    featured: index < 16,
    createdAt: new Date(
      Date.UTC(2026, 7, 31) - index * 3_600_000,
    ).toISOString(),
    salesCount: 20 + ((index * 11) % 600),
    averageRating,
    reviewCount,
    images: [
      {
        id: `${id}-image-1`,
        url: `/api/v1/mock-assets/product-${(index % 20) + 1}.png`,
        alt: { ar: name[0], en: name[1] },
      },
      {
        id: `${id}-image-2`,
        url: `/api/v1/mock-assets/product-${((index + 4) % 20) + 1}.png`,
        alt: { ar: name[0], en: name[1] },
      },
    ],
    // D8 needs both shapes in the catalogue: most products offer a colour choice, and every
    // fifth ships in one colour only so the PDP's auto-resolved, selector-free path is reachable.
    variants: [
      {
        id: `${id}-default`,
        sku: `BH-${String(index + 1).padStart(5, '0')}-D`,
        attributes: { colour: 'Black' },
        stock: 6 + (index % 20),
        price: onSale ? Number((basePrice * 0.85).toFixed(3)) : basePrice,
      },
      ...(index % 5 === 4
        ? []
        : [
            {
              id: `${id}-sand`,
              sku: `BH-${String(index + 1).padStart(5, '0')}-S`,
              attributes: { colour: 'Sand' },
              stock: 2 + (index % 9),
              price: basePrice,
            },
          ]),
    ],
    specs: Array.from({ length: 5 }, (__, specIndex) => ({
      name: {
        ar: `المواصفة ${specIndex + 1}`,
        en: `Specification ${specIndex + 1}`,
      },
      value: `${specIndex + 1}`,
    })),
  };
});

const addresses = [
  {
    id: 'address-1',
    userId: 'user-customer',
    fullName: 'Salim Al Rashdi',
    phone: '+96899112233',
    addressLine1: 'Building 24, Flat 3',
    addressLine2: 'Al Khoudh 7',
    city: 'Seeb',
    state: 'Muscat',
    postalCode: '121',
    country: 'OM',
    areaId: 'area-seeb',
    isDefault: true,
  },
  {
    id: 'address-2',
    userId: 'user-customer',
    fullName: 'Salim Al Rashdi',
    phone: '+96899112233',
    addressLine1: 'Office 52, Knowledge Oasis',
    city: 'Muscat',
    state: 'Muscat',
    postalCode: '135',
    country: 'OM',
    areaId: 'area-muscat',
    isDefault: false,
  },
  {
    id: 'address-3',
    userId: 'user-customer',
    fullName: 'Salim Al Rashdi',
    phone: '+96899112233',
    addressLine1: 'Nizwa Souq Road',
    city: 'Nizwa',
    state: 'Ad Dakhiliyah',
    country: 'OM',
    areaId: 'area-nizwa',
    isDefault: false,
  },
];

/**
 * Social commerce is the one feature area with no backend contract (GAP-1 / FA1), so the shape
 * served here is also the specification handed to the backend. Names, handles, bios, follower
 * counts and the two captions are the customer prototype's own
 * (`design-reference/BRANDHUB App.dc.html`, `const INFLUENCERS`), so the screens can be compared
 * against it directly.
 */
const influencerSeed = [
  {
    name: { ar: 'ليان المعمري', en: 'Layan Al Maamari' },
    handle: '@layan.style',
    followerCount: 215_000,
    bio: {
      ar: 'أزياء وإطلالات يومية · مسقط',
      en: 'Fashion & daily looks · Muscat',
    },
    productIds: ['product-9', 'product-5'],
  },
  {
    name: { ar: 'مريم الحبسي', en: 'Maryam Al Habsi' },
    handle: '@maryam.beauty',
    followerCount: 340_000,
    bio: { ar: 'العناية بالبشرة والمكياج', en: 'Skincare and makeup' },
    productIds: ['product-6', 'product-12'],
  },
  {
    name: { ar: 'سالم البلوشي', en: 'Salim Al Balushi' },
    handle: '@salim.tech',
    followerCount: 182_000,
    bio: { ar: 'مراجعات تقنية أسبوعية', en: 'Weekly tech reviews' },
    productIds: ['product-1', 'product-11'],
  },
  {
    name: { ar: 'نورة السيابي', en: 'Noura Al Siyabi' },
    handle: '@noura.kitchen',
    followerCount: 188_000,
    bio: { ar: 'مطبخ وأدوات منزلية', en: 'Kitchen and home tools' },
    productIds: ['product-10', 'product-4'],
  },
  {
    name: { ar: 'خالد العامري', en: 'Khalid Al Amri' },
    handle: '@khalid.games',
    followerCount: 113_000,
    bio: { ar: 'ألعاب وإعدادات المكتب', en: 'Gaming and desk setups' },
    productIds: ['product-3', 'product-11'],
  },
  {
    name: { ar: 'يوسف الراشدي', en: 'Yousef Al Rashdi' },
    handle: '@yousef.fit',
    followerCount: 98_000,
    bio: { ar: 'رياضة ولياقة', en: 'Fitness and training' },
    productIds: ['product-9', 'product-2'],
  },
] as const;

/** The prototype's two post captions, alternating down the feed. */
const postCaptions = [
  {
    ar: 'إطلالة اليوم بالكامل من المتجر، والرابط بالأسفل 🤍',
    en: 'Today\u2019s look, all from the store — tagged below 🤍',
  },
  {
    ar: 'جربت هالمنتج أسبوعين وهذي صراحتي عنه.',
    en: 'Two weeks with this one. Here\u2019s my honest take.',
  },
] as const;

const influencers = influencerSeed.map((influencer, index) => ({
  id: `influencer-${index + 1}`,
  name: influencer.name,
  handle: influencer.handle,
  bio: influencer.bio,
  avatarUrl: null,
  followerCount: influencer.followerCount,
  /** The profile's three stats. The server owns all three; the client never derives them. */
  postCount: 128 - index * 7,
  productCount: 46 - index * 3,
  taggedProductIds: [...influencer.productIds],
}));

/** Two posts per influencer, matching the prototype's feed and its likes and comments. */
const posts = influencerSeed.flatMap((influencer, influencerIndex) =>
  influencer.productIds.map((productId, postIndex) => ({
    id: `post-${influencerIndex * 2 + postIndex + 1}`,
    influencerId: `influencer-${influencerIndex + 1}`,
    imageUrl: `/api/v1/mock-assets/${productId}.png`,
    caption: postCaptions[postIndex % postCaptions.length]!,
    likeCount: postIndex === 0 ? 2_400 : 1_100,
    commentCount: postIndex === 0 ? 86 : 34,
    productIds: [productId],
    createdAt: new Date(
      Date.UTC(2026, 8, 2, 12) - (influencerIndex * 2 + postIndex) * 86_400_000,
    ).toISOString(),
  })),
);

/**
 * The prototype's five notification rows, in its order, with its unread pattern. `GET
 * /notifications` is contracted but carries no response example, so the field set is the mock's
 * (see INVENTED_ENDPOINTS.md).
 */
const notificationSeed = [
  {
    type: 'ORDER',
    title: {
      ar: 'طلبك #BH-284193 قيد التجهيز',
      en: 'Order #BH-284193 is being prepared',
    },
    body: {
      ar: 'سيخرج للتوصيل خلال 24 ساعة.',
      en: 'It ships within 24 hours.',
    },
    minutesAgo: 5,
    isRead: false,
  },
  {
    type: 'PROMOTION',
    title: { ar: 'خصم 25% على الصوتيات', en: '25% off audio' },
    body: { ar: 'العرض ينتهي منتصف الليل.', en: 'Offer ends at midnight.' },
    minutesAgo: 120,
    isRead: false,
  },
  {
    type: 'SOCIAL',
    title: {
      ar: 'ليان المعمري نشرت منشوراً جديداً',
      en: 'Layan Al Maamari posted',
    },
    body: {
      ar: 'إطلالة جديدة مع 3 منتجات مرتبطة.',
      en: 'A new look with 3 tagged products.',
    },
    minutesAgo: 1_500,
    isRead: true,
  },
  {
    type: 'PRICE_DROP',
    title: {
      ar: 'انخفض سعر منتج في مفضلتك',
      en: 'Price drop in your wishlist',
    },
    body: {
      ar: 'حذاء رياضي خفيف — الآن 19.900 ر.ع.',
      en: 'Lightweight running shoe — now OMR 19.900',
    },
    minutesAgo: 1_800,
    isRead: true,
  },
  {
    type: 'DELIVERY',
    title: { ar: 'تم تسليم طلبك #BH-283740', en: 'Order #BH-283740 delivered' },
    body: {
      ar: 'قيّم تجربتك واحصل على نقاط.',
      en: 'Rate it and collect your points.',
    },
    minutesAgo: 4_320,
    isRead: true,
  },
] as const;

/**
 * The prototype's three support tickets, with their two-sided threads
 * (`design-reference/BRANDHUB App.dc.html`, `const TICKETS`). `/support/tickets` is contracted
 * (D19) but carries no response example, so the field set here is the mock's; the statuses are
 * the ones the collection's admin routes set — `OPEN`, `IN_PROGRESS`, `RESOLVED`.
 */
const ticketSeed = [
  {
    orderId: 'order-1',
    category: 'DELIVERY',
    priority: 'HIGH',
    status: 'OPEN',
    subject: {
      ar: 'لم يصل الطلب في الوقت المحدد',
      en: 'Order arrived later than promised',
    },
    description: {
      ar: 'الطلب كان مقرراً أمس والمندوب لم يتواصل معي حتى الآن.',
      en: 'Delivery was promised yesterday and the courier has not called yet.',
    },
    minutesAgo: 180,
    thread: [
      {
        senderType: 'CUSTOMER',
        message: {
          ar: 'الطلب كان مقرراً أمس والمندوب لم يتواصل معي حتى الآن.',
          en: 'Delivery was promised yesterday and the courier has not called yet.',
        },
      },
      {
        senderType: 'SUPPORT',
        message: {
          ar: 'شكراً لتواصلك. تحققنا من الشحنة وهي الآن مع المندوب سعيد الحارثي، وسيصل اليوم قبل 6 مساءً.',
          en: 'Thanks for reaching out. We checked the shipment: it is with courier Said Al Harthy and arrives today before 6pm.',
        },
      },
      {
        senderType: 'CUSTOMER',
        message: { ar: 'شكراً لكم، سأنتظر.', en: 'Thank you, I will wait.' },
      },
    ],
  },
  {
    orderId: 'order-2',
    category: 'WALLET',
    priority: 'NORMAL',
    status: 'IN_PROGRESS',
    subject: {
      ar: 'استرجاع مبلغ إلى المحفظة',
      en: 'Refund back to my wallet',
    },
    description: {
      ar: 'أرجعت منتجاً ولم يصل المبلغ للمحفظة.',
      en: 'I returned an item and the refund has not reached my wallet.',
    },
    minutesAgo: 1_500,
    thread: [
      {
        senderType: 'CUSTOMER',
        message: {
          ar: 'أرجعت منتجاً ولم يصل المبلغ للمحفظة.',
          en: 'I returned an item and the refund has not reached my wallet.',
        },
      },
      {
        senderType: 'SUPPORT',
        message: {
          ar: 'نحتاج صورة إيصال الإرجاع لإكمال المعالجة.',
          en: 'We need a photo of the return receipt to finish processing.',
        },
      },
    ],
  },
  {
    orderId: 'order-3',
    category: 'PAYMENT',
    priority: 'LOW',
    status: 'RESOLVED',
    subject: { ar: 'رمز الخصم لا يعمل', en: 'Promo code not applying' },
    description: {
      ar: 'رمز HUB20 يعطي خطأ عند الدفع.',
      en: 'Code HUB20 errors out at checkout.',
    },
    minutesAgo: 10_080,
    thread: [
      {
        senderType: 'CUSTOMER',
        message: {
          ar: 'رمز HUB20 يعطي خطأ عند الدفع.',
          en: 'Code HUB20 errors out at checkout.',
        },
      },
      {
        senderType: 'SUPPORT',
        message: {
          ar: 'كان الرمز محدوداً بفئة الأزياء. أضفنا لك رصيد 5 ر.ع. كتعويض.',
          en: 'The code was limited to fashion. We credited OMR 5 to your wallet instead.',
        },
      },
    ],
  },
] as const;

/**
 * The prototype's wallet history (`design-reference/BRANDHUB App.dc.html`, `const WALLET_TX`).
 * `type` drives the sign and tint the row is drawn with, so the seed carries one of each kind the
 * app knows: a top-up, a purchase and a refund.
 */
const walletTransactionSeed = [
  {
    type: 'CREDIT',
    amount: 50,
    description: { ar: 'شحن رصيد', en: 'Wallet top-up' },
    daysAgo: 21,
  },
  {
    type: 'PURCHASE',
    amount: 64.2,
    description: { ar: 'طلب BH-283740', en: 'Order BH-283740' },
    daysAgo: 24,
  },
  {
    type: 'REFUND',
    amount: 15.2,
    description: { ar: 'استرجاع RT-0231', en: 'Refund RT-0231' },
    daysAgo: 37,
  },
  {
    type: 'CREDIT',
    amount: 25,
    description: { ar: 'شحن رصيد', en: 'Wallet top-up' },
    daysAgo: 52,
  },
  {
    type: 'PURCHASE',
    amount: 12.5,
    description: { ar: 'طلب BH-279902', en: 'Order BH-279902' },
    daysAgo: 61,
  },
] as const;

export function buildSeedDatabase(): MockDatabase {
  const now = '2026-09-02T12:00:00.000Z';
  const orderItems = (offset: number) => [
    {
      id: `order-item-${offset}-1`,
      productId: `product-${offset + 1}`,
      variantId: `product-${offset + 1}-default`,
      quantity: 1,
      unitPrice: products[offset]!.salePrice ?? products[offset]!.basePrice,
    },
  ];

  return {
    users: [
      {
        id: 'user-customer',
        email: 'customer@brandhub.om',
        password: 'Password123!',
        firstName: 'Salim',
        lastName: 'Al Rashdi',
        phone: '+96899112233',
        role: 'ROLE_CUSTOMER',
        walletBalance: 125.5,
        profileImageUrl: '/api/v1/users/user-customer/profile-image',
      },
      {
        id: 'user-recipient',
        email: 'friend@brandhub.om',
        password: 'Password123!',
        firstName: 'Maha',
        lastName: 'Al Balushi',
        phone: '+96899223344',
        role: 'ROLE_CUSTOMER',
        walletBalance: 20,
      },
    ],
    categories,
    products,
    influencers,
    posts,
    follows: [],
    cartItems: [
      {
        id: 'cart-item-1',
        userId: 'user-customer',
        productId: 'product-1',
        variantId: 'product-1-default',
        quantity: 1,
      },
      {
        id: 'cart-item-2',
        userId: 'user-customer',
        productId: 'product-2',
        variantId: 'product-2-default',
        quantity: 2,
      },
    ],
    orders: Array.from({ length: 4 }, (_, index) => ({
      id: `order-${index + 1}`,
      orderNumber: `BH-${284193 - index}`,
      userId: 'user-customer',
      status: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'][index],
      items: orderItems(index),
      subtotal: products[index]!.salePrice ?? products[index]!.basePrice,
      vat: Number(
        (
          ((products[index]!.salePrice ??
            products[index]!.basePrice) as number) * 0.05
        ).toFixed(3),
      ),
      shipping: 0,
      paymentFee: 0,
      discount: 0,
      total: Number(
        (
          ((products[index]!.salePrice ??
            products[index]!.basePrice) as number) * 1.05
        ).toFixed(3),
      ),
      currency: 'OMR',
      shippingAddressId: 'address-1',
      deliveryOtp: String(3814 + index),
      createdAt: now,
    })),
    addresses,
    tickets: ticketSeed.map((ticket, index) => {
      const updatedAt = new Date(
        Date.parse(now) - ticket.minutesAgo * 60_000,
      ).toISOString();
      return {
        id: `ticket-${index + 1}`,
        ticketNumber: `TKT-2026-${String(index + 1).padStart(4, '0')}`,
        userId: 'user-customer',
        orderId: ticket.orderId,
        category: ticket.category,
        priority: ticket.priority,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        // The thread runs forward in time and ends at `updatedAt`, so the list's "last update"
        // line and the last bubble in the thread agree.
        messages: ticket.thread.map((message, messageIndex) => ({
          id: `ticket-${index + 1}-message-${messageIndex + 1}`,
          senderType: message.senderType,
          message: message.message,
          createdAt: new Date(
            Date.parse(updatedAt) -
              (ticket.thread.length - 1 - messageIndex) * 30 * 60_000,
          ).toISOString(),
        })),
        createdAt: new Date(
          Date.parse(updatedAt) - (ticket.thread.length - 1) * 30 * 60_000,
        ).toISOString(),
        updatedAt,
      };
    }),
    ticketAttachments: [],
    walletTransactions: walletTransactionSeed.map((entry, index) => ({
      id: `wallet-transaction-${index + 1}`,
      userId: 'user-customer',
      type: entry.type,
      amount: entry.amount,
      currency: 'OMR',
      description: entry.description,
      createdAt: new Date(
        Date.parse(now) - entry.daysAgo * 24 * 60 * 60_000,
      ).toISOString(),
    })),
    walletCharges: [],
    walletTransfers: [],
    gifts: [],
    returns: [],
    reviews: Array.from({ length: 3 }, (_, index) => ({
      id: `review-${index + 1}`,
      userId: 'user-customer',
      productId: `product-${index + 1}`,
      rating: 5 - index,
      comment: 'A useful product and prompt local delivery.',
      createdAt: now,
    })),
    notifications: notificationSeed.map((notification, index) => ({
      id: `notification-${index + 1}`,
      userId: 'user-customer',
      type: notification.type,
      title: notification.title,
      body: notification.body,
      isRead: notification.isRead,
      createdAt: new Date(
        Date.parse(now) - notification.minutesAgo * 60_000,
      ).toISOString(),
    })),
    coupons: [
      {
        id: 'coupon-welcome',
        code: 'WELCOME10',
        name: 'Welcome 10%',
        type: 'PERCENTAGE',
        value: 10,
        minimumOrder: 5,
        maximumDiscount: 25,
        active: true,
        startsAt: '2026-01-01T00:00:00.000Z',
        expiresAt: '2027-01-01T00:00:00.000Z',
      },
    ],
    areas: [
      {
        id: 'area-muscat',
        name: 'Muscat',
        governorate: 'Muscat',
        shippingPrice: 1.5,
        minOrderAmount: 20,
        estimatedDeliveryDays: 1,
        active: true,
      },
      {
        id: 'area-seeb',
        name: 'Seeb',
        governorate: 'Muscat',
        shippingPrice: 2,
        minOrderAmount: 25,
        estimatedDeliveryDays: 2,
        active: true,
      },
      {
        id: 'area-salalah',
        name: 'Salalah',
        governorate: 'Dhofar',
        shippingPrice: 3.5,
        minOrderAmount: 40,
        estimatedDeliveryDays: 4,
        active: true,
      },
      {
        id: 'area-sohar',
        name: 'Sohar',
        governorate: 'Al Batinah North',
        shippingPrice: 3,
        minOrderAmount: 35,
        estimatedDeliveryDays: 3,
        active: true,
      },
      {
        id: 'area-nizwa',
        name: 'Nizwa',
        governorate: 'Ad Dakhiliyah',
        shippingPrice: 3,
        minOrderAmount: 35,
        estimatedDeliveryDays: 3,
        active: true,
      },
    ],
    shippingRates: [
      { id: 'shipping-standard', area: 'Muscat', price: 1.5, active: true },
      {
        id: 'shipping-north',
        area: 'Al Batinah North',
        price: 3,
        active: true,
      },
    ],
    wishlist: [
      { id: 'wishlist-1', userId: 'user-customer', productId: 'product-4' },
    ],
    refreshTokens: [],
    revokedTokens: [],
    idempotency: [],
    otpChallenges: [],
  };
}
