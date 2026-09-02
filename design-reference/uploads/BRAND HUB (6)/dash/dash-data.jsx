/* ───────────── BRANDHUB Dashboard · mock data (shaped like the API) ─────────────
   Currency OMR (3 decimals). Entities mirror the Postman collection:
   roles/permissions, users, categories, products, product-requests,
   orders, coupons, reviews, notifications, seller profile + payouts. */

const OMR = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const NUM = (n) => Number(n).toLocaleString('en-US');
const initials = (s) => s.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

/* ── permissions (resource : action) ── */
const PERMISSION_GROUPS = [
  { resource: 'product', icon: 'box', actions: ['read', 'create', 'update', 'delete'] },
  { resource: 'inventory', icon: 'layers', actions: ['read', 'update'] },
  { resource: 'order', icon: 'cart', actions: ['read', 'update', 'cancel', 'refund'] },
  { resource: 'category', icon: 'tag', actions: ['read', 'create', 'update', 'delete'] },
  { resource: 'user', icon: 'users', actions: ['read', 'create', 'update', 'delete', 'block'] },
  { resource: 'role', icon: 'shield', actions: ['read', 'create', 'update', 'delete'] },
  { resource: 'coupon', icon: 'ticket', actions: ['read', 'create', 'update', 'delete'] },
  { resource: 'review', icon: 'star-line', actions: ['read', 'moderate', 'delete'] },
  { resource: 'report', icon: 'chart-bar', actions: ['read'] },
];
const ALL_PERMS = PERMISSION_GROUPS.flatMap((g) => g.actions.map((a) => `${g.resource}:${a}`));

/* ── roles ── */
const ROLES = [
  { id: 1, name: 'ROLE_SUPER_ADMIN', displayName: 'Super Admin', description: 'Unrestricted access to every module and system setting.', users: 2, system: true, permissions: ALL_PERMS },
  { id: 2, name: 'ROLE_ADMIN', displayName: 'Admin', description: 'Manages catalog, categories, orders and seller approvals.', users: 5, system: true,
    permissions: ['product:read','product:create','product:update','product:delete','inventory:read','inventory:update','order:read','order:update','order:cancel','order:refund','category:read','category:create','category:update','category:delete','coupon:read','coupon:create','coupon:update','review:read','review:moderate','report:read'] },
  { id: 3, name: 'ROLE_MANAGER', displayName: 'Manager', description: 'Operational access to orders and inventory.', users: 8, system: false,
    permissions: ['product:read','inventory:read','inventory:update','order:read','order:update','review:read','report:read'] },
  { id: 4, name: 'ROLE_SELLER', displayName: 'Seller', description: 'Submits products for approval and manages own listings.', users: 47, system: true,
    permissions: ['product:read','product:create','inventory:read','inventory:update','order:read'] },
  { id: 5, name: 'ROLE_CUSTOMER', displayName: 'Customer', description: 'Default shopper role.', users: 12480, system: true,
    permissions: ['product:read','order:read','review:read'] },
];

/* ── users ── */
const USERS = [
  { id: 'u1', firstName: 'Salim', lastName: 'Al Rashdi', email: 'salim.rashdi@brandhub.om', phone: '+968 9123 4567', roles: ['ROLE_SUPER_ADMIN'], status: 'active', created: '2024-02-11', orders: 0 },
  { id: 'u2', firstName: 'Mariam', lastName: 'Al Habsi', email: 'mariam.habsi@brandhub.om', phone: '+968 9988 7766', roles: ['ROLE_ADMIN'], status: 'active', created: '2024-05-02', orders: 0 },
  { id: 'u3', firstName: 'Khalid', lastName: 'Al Amri', email: 'khalid.amri@brandhub.om', phone: '+968 9456 1230', roles: ['ROLE_ADMIN','ROLE_MANAGER'], status: 'active', created: '2024-06-19', orders: 0 },
  { id: 'u4', firstName: 'Noura', lastName: 'Al Siyabi', email: 'noura.siyabi@brandhub.om', phone: '+968 9112 8890', roles: ['ROLE_MANAGER'], status: 'active', created: '2024-08-23', orders: 0 },
  { id: 'u5', firstName: 'Talal', lastName: 'Al Hinai', email: 'talal.hinai@techsouq.om', phone: '+968 9333 2211', roles: ['ROLE_SELLER'], status: 'active', created: '2025-01-14', orders: 0, shop: 'TechSouq' },
  { id: 'u6', firstName: 'Dana', lastName: 'Al Kindi', email: 'dana.kindi@homeline.om', phone: '+968 9777 6655', roles: ['ROLE_SELLER'], status: 'active', created: '2025-02-08', orders: 0, shop: 'HomeLine' },
  { id: 'u7', firstName: 'Yousef', lastName: 'Al Rashidi', email: 'yousef.fit@email.com', phone: '+968 9555 4433', roles: ['ROLE_SELLER'], status: 'blocked', created: '2025-03-21', orders: 0, shop: 'FitGear' },
  { id: 'u8', firstName: 'Ahmed', lastName: 'Al Saleh', email: 'ahmed.alsaleh@email.com', phone: '+968 9211 3344', roles: ['ROLE_CUSTOMER'], status: 'active', created: '2025-04-02', orders: 14 },
  { id: 'u9', firstName: 'Fatma', lastName: 'Al Rawahi', email: 'fatma.rawahi@email.com', phone: '+968 9622 1100', roles: ['ROLE_CUSTOMER'], status: 'active', created: '2025-05-17', orders: 9 },
  { id: 'u10', firstName: 'Mohammed', lastName: 'Al Abri', email: 'mohammed.abri@email.com', phone: '+968 9844 5566', roles: ['ROLE_CUSTOMER'], status: 'active', created: '2025-06-01', orders: 22 },
  { id: 'u11', firstName: 'Reem', lastName: 'Al Shahia', email: 'reem.shahia@email.com', phone: '+968 9233 9988', roles: ['ROLE_CUSTOMER'], status: 'blocked', created: '2025-06-10', orders: 3 },
  { id: 'u12', firstName: 'Hamad', lastName: 'Al Maqbali', email: 'hamad.daily@email.com', phone: '+968 9100 2200', roles: ['ROLE_CUSTOMER'], status: 'active', created: '2025-06-15', orders: 7 },
];

/* ── categories (flat, parent links → tree) ── */
const CATEGORIES = [
  { id: 'c1', name: 'Electronics', slug: 'electronics', parent: null, products: 248, active: true },
  { id: 'c1a', name: 'Headphones & Audio', slug: 'headphones-audio', parent: 'c1', products: 64, active: true },
  { id: 'c1b', name: 'Smart Watches', slug: 'smart-watches', parent: 'c1', products: 38, active: true },
  { id: 'c1c', name: 'Gaming', slug: 'gaming', parent: 'c1', products: 52, active: true },
  { id: 'c2', name: 'Fashion', slug: 'fashion', parent: null, products: 498, active: true },
  { id: 'c2a', name: "Women's Fashion", slug: 'womens-fashion', parent: 'c2', products: 312, active: true },
  { id: 'c2b', name: "Men's Fashion", slug: 'mens-fashion', parent: 'c2', products: 186, active: true },
  { id: 'c3', name: 'Beauty & Perfume', slug: 'beauty-perfume', parent: null, products: 196, active: true },
  { id: 'c4', name: 'Home & Kitchen', slug: 'home-kitchen', parent: null, products: 174, active: true },
  { id: 'c5', name: 'Toys & Baby', slug: 'toys-baby', parent: null, products: 132, active: true },
  { id: 'c6', name: 'Sports & Outdoors', slug: 'sports-outdoors', parent: null, products: 121, active: false },
  { id: 'c7', name: 'Automotive', slug: 'automotive', parent: null, products: 88, active: true },
];

const TONES = ['#EEEDF9', '#FCEEF3', '#E6F6EE', '#FCF2DC', '#E7F0FC'];

/* ── products (admin catalog) ── */
const PRODUCTS = [
  { id: 'p1', name: 'A2 Series Wireless Noise-Cancelling Headphones', sku: 'A2-NC-BLK', category: 'Headphones & Audio', basePrice: 54.000, salePrice: 38.900, sellerPercentage: 80, stock: 142, sold: 1240, rating: 4.6, reviews: 1200, status: 'active', seller: 'Official Store', flags: ['featured','best'], created: '2025-03-12', tone: 0 },
  { id: 'p2', name: 'Sport Smartwatch AMOLED Water-Resistant', sku: 'SW-AMO-02', category: 'Smart Watches', basePrice: 32.000, salePrice: 24.500, sellerPercentage: 75, stock: 64, sold: 860, rating: 4.4, reviews: 860, status: 'active', seller: 'TechSouq', flags: ['new'], created: '2025-04-01', tone: 1 },
  { id: 'p3', name: 'Wireless Gaming Controller Multi-Platform', sku: 'GC-WL-PRO', category: 'Gaming', basePrice: 25.000, salePrice: 18.750, sellerPercentage: 70, stock: 0, sold: 2100, rating: 4.7, reviews: 2100, status: 'out', seller: 'TechSouq', flags: ['best'], created: '2025-02-20', tone: 2 },
  { id: 'p4', name: 'Cordless Handheld Vacuum High-Suction', sku: 'HV-CL-09', category: 'Home & Kitchen', basePrice: 56.000, salePrice: 42.000, sellerPercentage: 78, stock: 28, sold: 540, rating: 4.3, reviews: 540, status: 'active', seller: 'HomeLine', flags: [], created: '2025-05-10', tone: 3 },
  { id: 'p5', name: 'Water-Resistant Laptop Backpack', sku: 'BP-WR-15', category: "Men's Fashion", basePrice: 19.500, salePrice: 12.900, sellerPercentage: 72, stock: 210, sold: 1800, rating: 4.5, reviews: 1800, status: 'active', seller: 'UrbanCarry', flags: ['featured'], created: '2025-01-28', tone: 0 },
  { id: 'p6', name: 'Vitamin-C Skincare Set (Natural)', sku: 'SK-VC-3PC', category: 'Beauty & Perfume', basePrice: 21.000, salePrice: 15.200, sellerPercentage: 68, stock: 96, sold: 3400, rating: 4.8, reviews: 3400, status: 'active', seller: 'GlowLab', flags: ['best'], created: '2025-03-30', tone: 1 },
  { id: 'p7', name: 'Portable Bluetooth Speaker Waterproof', sku: 'SP-BT-360', category: 'Headphones & Audio', basePrice: 28.000, salePrice: 21.300, sellerPercentage: 74, stock: 54, sold: 970, rating: 4.5, reviews: 970, status: 'active', seller: 'TechSouq', flags: [], created: '2025-04-18', tone: 2 },
  { id: 'p8', name: 'Smart Security Camera 2K Night Vision', sku: 'CAM-2K-NV', category: 'Electronics', basePrice: 22.000, salePrice: 16.800, sellerPercentage: 70, stock: 12, sold: 420, rating: 4.2, reviews: 420, status: 'active', seller: 'TechSouq', flags: [], created: '2025-05-22', tone: 4 },
  { id: 'p9', name: 'Lightweight Running Shoes Daily Comfort', sku: 'SH-RUN-LT', category: 'Sports & Outdoors', basePrice: 27.500, salePrice: 19.900, sellerPercentage: 73, stock: 88, sold: 1500, rating: 4.6, reviews: 1500, status: 'active', seller: 'FitGear', flags: ['new'], created: '2025-02-14', tone: 0 },
  { id: 'p10', name: 'Automatic Espresso Machine 20-Bar', sku: 'CM-ESP-20', category: 'Home & Kitchen', basePrice: 72.000, salePrice: 58.500, sellerPercentage: 76, stock: 19, sold: 660, rating: 4.7, reviews: 660, status: 'active', seller: 'HomeLine', flags: ['featured'], created: '2025-03-08', tone: 3 },
  { id: 'p11', name: 'Mechanical Gaming Keyboard RGB', sku: 'KB-MX-RGB', category: 'Gaming', basePrice: 30.000, salePrice: 22.400, sellerPercentage: 71, stock: 0, sold: 780, rating: 4.4, reviews: 780, status: 'draft', seller: 'TechSouq', flags: [], created: '2025-06-02', tone: 2 },
  { id: 'p12', name: 'Luxury Fragrance Set 3-Piece', sku: 'PF-LUX-3', category: 'Beauty & Perfume', basePrice: 35.000, salePrice: 27.000, sellerPercentage: 66, stock: 47, sold: 1100, rating: 4.6, reviews: 1100, status: 'active', seller: 'GlowLab', flags: ['best'], created: '2025-04-25', tone: 1 },
];

/* ── seller product-requests (approval queue) ── */
const PRODUCT_REQUESTS = [
  { id: 'pr1', name: 'Gaming Laptop RTX 4060 (16GB / 512GB)', category: 'Gaming', seller: 'TechSouq', sellerEmail: 'talal.hinai@techsouq.om', basePrice: 1299.990, salePrice: 1099.990, sellerPercentage: 70, variants: 2, status: 'PENDING', submitted: '2026-06-19', note: '' },
  { id: 'pr2', name: 'Ergonomic Office Chair Lumbar Support', category: 'Home & Kitchen', seller: 'HomeLine', sellerEmail: 'dana.kindi@homeline.om', basePrice: 89.000, salePrice: 72.500, sellerPercentage: 75, variants: 3, status: 'PENDING', submitted: '2026-06-18', note: '' },
  { id: 'pr3', name: 'Resistance Bands Pro Set (5 levels)', category: 'Sports & Outdoors', seller: 'FitGear', sellerEmail: 'yousef.fit@email.com', basePrice: 14.500, salePrice: 9.900, sellerPercentage: 68, variants: 1, status: 'PENDING', submitted: '2026-06-17', note: '' },
  { id: 'pr4', name: 'Stainless Steel Cookware 10-Piece', category: 'Home & Kitchen', seller: 'HomeLine', sellerEmail: 'dana.kindi@homeline.om', basePrice: 60.000, salePrice: 48.000, sellerPercentage: 74, variants: 1, status: 'APPROVED', submitted: '2026-06-12', note: 'Approved with adjusted sale price.' },
  { id: 'pr5', name: 'Knockoff Branded Earbuds', category: 'Headphones & Audio', seller: 'FitGear', sellerEmail: 'yousef.fit@email.com', basePrice: 12.000, salePrice: 8.500, sellerPercentage: 60, variants: 1, status: 'REJECTED', submitted: '2026-06-10', note: 'Counterfeit / trademark violation.' },
  { id: 'pr6', name: '4K Action Camera Waterproof Kit', category: 'Electronics', seller: 'TechSouq', sellerEmail: 'talal.hinai@techsouq.om', basePrice: 65.000, salePrice: 52.000, sellerPercentage: 72, variants: 2, status: 'PENDING', submitted: '2026-06-19', note: '' },
];

/* ── orders ── */
const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const ORDERS = [
  { id: 'BH-2026-48217', customer: 'Ahmed Al Saleh', email: 'ahmed.alsaleh@email.com', date: '2026-06-20', items: 4, total: 138.300, status: 'CONFIRMED', payment: 'Wallet' },
  { id: 'BH-2026-48206', customer: 'Fatma Al Rawahi', email: 'fatma.rawahi@email.com', date: '2026-06-20', items: 2, total: 46.900, status: 'PENDING', payment: 'QPay Card' },
  { id: 'BH-2026-48198', customer: 'Mohammed Al Abri', email: 'mohammed.abri@email.com', date: '2026-06-19', items: 5, total: 92.400, status: 'SHIPPED', payment: 'Wallet' },
  { id: 'BH-2026-48180', customer: 'Hamad Al Maqbali', email: 'hamad.daily@email.com', date: '2026-06-19', items: 1, total: 58.500, status: 'DELIVERED', payment: 'QPay Card' },
  { id: 'BH-2026-48172', customer: 'Reem Al Shahia', email: 'reem.shahia@email.com', date: '2026-06-18', items: 3, total: 71.700, status: 'CANCELLED', payment: 'Wallet' },
  { id: 'BH-2026-48165', customer: 'Ahmed Al Saleh', email: 'ahmed.alsaleh@email.com', date: '2026-06-18', items: 2, total: 34.100, status: 'DELIVERED', payment: 'Cash on Delivery' },
  { id: 'BH-2026-48150', customer: 'Mohammed Al Abri', email: 'mohammed.abri@email.com', date: '2026-06-17', items: 6, total: 184.200, status: 'DELIVERED', payment: 'QPay Card' },
  { id: 'BH-2026-48142', customer: 'Fatma Al Rawahi', email: 'fatma.rawahi@email.com', date: '2026-06-17', items: 1, total: 27.000, status: 'CONFIRMED', payment: 'Wallet' },
  { id: 'BH-2026-48131', customer: 'Hamad Al Maqbali', email: 'hamad.daily@email.com', date: '2026-06-16', items: 3, total: 63.350, status: 'SHIPPED', payment: 'Wallet' },
  { id: 'BH-2026-48119', customer: 'Ahmed Al Saleh', email: 'ahmed.alsaleh@email.com', date: '2026-06-16', items: 2, total: 41.800, status: 'PENDING', payment: 'QPay Card' },
];

const ORDER_ITEMS = [
  { product: 'A2 Series Wireless Noise-Cancelling Headphones', variant: 'Black', qty: 1, price: 38.900, tone: 0 },
  { product: 'Cordless Handheld Vacuum High-Suction', variant: 'Standard', qty: 2, price: 42.000, tone: 3 },
  { product: 'Vitamin-C Skincare Set (Natural)', variant: '3-piece', qty: 1, price: 15.200, tone: 1 },
];

/* ── coupons ── */
const COUPONS = [
  { code: 'EID25', type: 'percent', value: 25, minOrder: 30.000, used: 412, limit: 1000, expiry: '2026-07-15', status: 'active' },
  { code: 'WELCOME10', type: 'percent', value: 10, minOrder: 0, used: 2841, limit: 0, expiry: '2026-12-31', status: 'active' },
  { code: 'FREESHIP', type: 'fixed', value: 1.500, minOrder: 20.000, used: 1203, limit: 5000, expiry: '2026-08-01', status: 'active' },
  { code: 'HUB5OFF', type: 'fixed', value: 5.000, minOrder: 50.000, used: 87, limit: 200, expiry: '2026-06-25', status: 'active' },
  { code: 'FLASH40', type: 'percent', value: 40, minOrder: 100.000, used: 64, limit: 100, expiry: '2026-06-21', status: 'expiring' },
  { code: 'RAMADAN20', type: 'percent', value: 20, minOrder: 40.000, used: 980, limit: 1000, expiry: '2026-03-30', status: 'expired' },
];

/* ── reviews ── */
const REVIEWS = [
  { id: 'r1', product: 'A2 Series Wireless Headphones', customer: 'Ahmed Al Saleh', rating: 5, text: 'Excellent sound quality and the noise cancelling really works even in a busy café.', date: '2026-06-19', status: 'published' },
  { id: 'r2', product: 'Sport Smartwatch AMOLED', customer: 'Fatma Al Rawahi', rating: 4, text: 'Very comfortable and same-day delivery via Hub Express. Box was bigger than expected.', date: '2026-06-19', status: 'pending' },
  { id: 'r3', product: 'Vitamin-C Skincare Set', customer: 'Reem Al Shahia', rating: 1, text: 'Caused irritation, not as described. Very disappointed with this seller.', date: '2026-06-18', status: 'flagged' },
  { id: 'r4', product: 'Espresso Machine 20-Bar', customer: 'Mohammed Al Abri', rating: 5, text: 'Best purchase this year — barista quality at home.', date: '2026-06-18', status: 'published' },
  { id: 'r5', product: 'Gaming Controller', customer: 'Hamad Al Maqbali', rating: 5, text: 'Second one I buy from this store, totally worth it.', date: '2026-06-17', status: 'published' },
  { id: 'r6', product: 'Running Shoes', customer: 'Yousef Al Rashidi', rating: 2, text: 'Sizing runs small, had to return. Spam spam buy followers link.', date: '2026-06-17', status: 'flagged' },
  { id: 'r7', product: 'Bluetooth Speaker 360', customer: 'Dana Al Kindi', rating: 4, text: 'Good bass for the size, battery could be better.', date: '2026-06-16', status: 'pending' },
];

/* ── notifications ── */
const NOTIFICATIONS = [
  { id: 'n1', type: 'approval', title: 'New product request', msg: 'TechSouq submitted “Gaming Laptop RTX 4060” for review.', time: '8m ago', read: false },
  { id: 'n2', type: 'order', title: 'High-value order placed', msg: 'Order BH-2026-48150 — OMR 184.200 by Mohammed Al Abri.', time: '40m ago', read: false },
  { id: 'n3', type: 'stock', title: 'Out of stock', msg: 'Wireless Gaming Controller is now out of stock.', time: '2h ago', read: false },
  { id: 'n4', type: 'review', title: 'Review flagged', msg: 'A 1-star review on Vitamin-C Skincare Set was flagged.', time: '5h ago', read: true },
  { id: 'n5', type: 'user', title: 'Seller registered', msg: 'New seller “UrbanCarry” completed registration.', time: 'Yesterday', read: true },
  { id: 'n6', type: 'payout', title: 'Payout processed', msg: 'OMR 1,240.500 paid out to TechSouq.', time: 'Yesterday', read: true },
];

/* ── current seller profile (for Seller role) ── */
const SELLER = {
  shop: 'TechSouq', owner: 'Talal Al Hinai', email: 'talal.hinai@techsouq.om', phone: '+968 9333 2211',
  joined: '2025-01-14', rating: 4.6, status: 'Verified',
  bank: { bankName: 'Bank Muscat', iban: 'OM81 0180 0000 0123 4567 8901', account: '0123456789012', holder: 'Talal Al Hinai' },
  balance: 1842.350, pending: 640.200, lifetime: 28940.500,
  payouts: [
    { id: 'PO-3391', date: '2026-06-15', amount: 1240.500, method: 'Bank Muscat ••8901', status: 'paid' },
    { id: 'PO-3360', date: '2026-06-01', amount: 980.250, method: 'Bank Muscat ••8901', status: 'paid' },
    { id: 'PO-3402', date: '2026-06-20', amount: 640.200, method: 'Bank Muscat ••8901', status: 'pending' },
    { id: 'PO-3330', date: '2026-05-15', amount: 1510.750, method: 'Bank Muscat ••8901', status: 'paid' },
  ],
};

/* seller's own products (subset + their request status) */
const SELLER_PRODUCTS = [
  { id: 'sp1', name: 'A2 Series Wireless Noise-Cancelling Headphones', sku: 'A2-NC-BLK', category: 'Headphones & Audio', price: 38.900, stock: 142, sold: 1240, status: 'LIVE', tone: 0 },
  { id: 'sp2', name: 'Sport Smartwatch AMOLED Water-Resistant', sku: 'SW-AMO-02', category: 'Smart Watches', price: 24.500, stock: 64, sold: 860, status: 'LIVE', tone: 1 },
  { id: 'sp3', name: 'Wireless Gaming Controller Multi-Platform', sku: 'GC-WL-PRO', category: 'Gaming', price: 18.750, stock: 0, sold: 2100, status: 'OUT', tone: 2 },
  { id: 'sp4', name: 'Smart Security Camera 2K Night Vision', sku: 'CAM-2K-NV', category: 'Electronics', price: 16.800, stock: 12, sold: 420, status: 'LIVE', tone: 4 },
  { id: 'sp5', name: 'Gaming Laptop RTX 4060 (16GB / 512GB)', sku: 'GL-RTX-16', category: 'Gaming', price: 1099.990, stock: 25, sold: 0, status: 'PENDING', tone: 2 },
  { id: 'sp6', name: '4K Action Camera Waterproof Kit', sku: 'AC-4K-WP', category: 'Electronics', price: 52.000, stock: 40, sold: 0, status: 'PENDING', tone: 4 },
  { id: 'sp7', name: 'Mechanical Gaming Keyboard RGB', sku: 'KB-MX-RGB', category: 'Gaming', price: 22.400, stock: 30, sold: 780, status: 'REJECTED', tone: 2 },
];

/* seller's sales orders */
const SELLER_ORDERS = [
  { id: 'BH-2026-48217', customer: 'Ahmed Al Saleh', date: '2026-06-20', product: 'A2 Series Headphones', qty: 1, gross: 38.900, earning: 31.120, status: 'CONFIRMED' },
  { id: 'BH-2026-48198', customer: 'Mohammed Al Abri', date: '2026-06-19', product: 'Smart Security Camera 2K', qty: 2, gross: 33.600, earning: 23.520, status: 'SHIPPED' },
  { id: 'BH-2026-48131', customer: 'Hamad Al Maqbali', date: '2026-06-16', product: 'Bluetooth Speaker 360', qty: 1, gross: 21.300, earning: 15.762, status: 'SHIPPED' },
  { id: 'BH-2026-48119', customer: 'Ahmed Al Saleh', date: '2026-06-16', product: 'Sport Smartwatch AMOLED', qty: 1, gross: 24.500, earning: 18.375, status: 'PENDING' },
  { id: 'BH-2026-48092', customer: 'Fatma Al Rawahi', date: '2026-06-14', product: 'A2 Series Headphones', qty: 2, gross: 77.800, earning: 62.240, status: 'DELIVERED' },
];

/* ── chart data ── */
const MONTHS = ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'];
const REVENUE_SERIES = [18.2, 21.5, 19.8, 24.1, 28.7, 41.2, 26.4, 29.9, 34.6, 38.1, 42.8, 48.6].map((v) => v * 1000);
const ORDERS_SERIES  = [620, 710, 680, 790, 910, 1340, 860, 940, 1080, 1190, 1310, 1480];
const SELLER_REVENUE = [2.1, 2.6, 2.4, 3.0, 3.4, 4.9, 3.1, 3.5, 4.1, 4.6, 5.2, 5.8].map((v) => v * 1000);

const CATEGORY_SPLIT = [
  { name: 'Electronics', value: 38, color: '#7F77DD' },
  { name: 'Fashion', value: 27, color: '#D4537E' },
  { name: 'Home & Kitchen', value: 16, color: '#2A9D8F' },
  { name: 'Beauty', value: 12, color: '#E6A817' },
  { name: 'Other', value: 7, color: '#9A9AAF' },
];

const TOP_PRODUCTS = [
  { name: 'A2 Series Headphones', sales: 1240, color: '#7F77DD' },
  { name: 'Vitamin-C Skincare Set', sales: 1080, color: '#7F77DD' },
  { name: 'Laptop Backpack', sales: 940, color: '#7F77DD' },
  { name: 'Espresso Machine', sales: 660, color: '#7F77DD' },
  { name: 'Bluetooth Speaker 360', sales: 540, color: '#7F77DD' },
];

const TOP_SELLERS = [
  { name: 'TechSouq', revenue: 28940.500, orders: 1820, color: '#7F77DD' },
  { name: 'GlowLab', revenue: 19420.250, orders: 1340, color: '#D4537E' },
  { name: 'HomeLine', revenue: 16880.000, orders: 980, color: '#2A9D8F' },
  { name: 'UrbanCarry', revenue: 12110.750, orders: 760, color: '#E6A817' },
];

/* ── finance data ── */
const FINANCE_KPI = {
  grossRevenue: 486200.000, netRevenue: 412870.500, platformFees: 73329.500,
  refundsTotal: 18420.750, pendingSettlements: 24680.300, paidSettlements: 388190.200,
  vatCollected: 23152.380, codCollected: 64200.000,
};
const REFUNDS_SERIES = [2.1, 1.8, 2.4, 2.0, 1.6, 3.2, 1.9, 2.2, 2.6, 2.3, 2.0, 1.7].map((v) => v * 1000);
const NET_SERIES = REVENUE_SERIES.map((v, i) => v - REFUNDS_SERIES[i]);

/* settlement runs per seller (seller accounting) */
const SETTLEMENTS = [
  { id: 'STL-2026-0612', seller: 'TechSouq', period: 'Jun 1–15, 2026', orders: 142, gross: 12480.500, fees: 3744.150, refunds: 420.000, net: 8316.350, status: 'paid', method: 'Bank Muscat ••8901', paidOn: '2026-06-16' },
  { id: 'STL-2026-0613', seller: 'GlowLab', period: 'Jun 1–15, 2026', orders: 98, gross: 9420.250, fees: 3202.885, refunds: 180.500, net: 6036.865, status: 'paid', method: 'NBO ••4471', paidOn: '2026-06-16' },
  { id: 'STL-2026-0614', seller: 'HomeLine', period: 'Jun 1–15, 2026', orders: 76, gross: 8880.000, fees: 2308.800, refunds: 640.000, net: 5931.200, status: 'pending', method: 'Bank Muscat ••2210', paidOn: null },
  { id: 'STL-2026-0615', seller: 'UrbanCarry', period: 'Jun 1–15, 2026', orders: 54, gross: 6110.750, fees: 1711.010, refunds: 95.000, net: 4304.740, status: 'pending', method: 'Bank Dhofar ••7732', paidOn: null },
  { id: 'STL-2026-0616', seller: 'FitGear', period: 'Jun 1–15, 2026', orders: 31, gross: 3240.000, fees: 1036.800, refunds: 310.000, net: 1893.200, status: 'on_hold', method: 'Bank Muscat ••5567', paidOn: null },
  { id: 'STL-2026-0598', seller: 'TechSouq', period: 'May 16–31, 2026', orders: 128, gross: 11210.000, fees: 3363.000, refunds: 290.000, net: 7557.000, status: 'paid', method: 'Bank Muscat ••8901', paidOn: '2026-06-01' },
];

/* returns / refund requests */
const RETURNS = [
  { id: 'RET-48172', order: 'BH-2026-48172', customer: 'Reem Al Shahia', product: 'Vitamin-C Skincare Set', seller: 'GlowLab', amount: 15.200, reason: 'Item caused irritation', type: 'refund', date: '2026-06-19', status: 'pending', tone: 1 },
  { id: 'RET-48150', order: 'BH-2026-48150', customer: 'Mohammed Al Abri', product: 'Mechanical Gaming Keyboard', seller: 'TechSouq', amount: 22.400, reason: 'Arrived damaged', type: 'refund', date: '2026-06-18', status: 'approved', tone: 2 },
  { id: 'RET-48131', order: 'BH-2026-48131', customer: 'Hamad Al Maqbali', product: 'Running Shoes', seller: 'FitGear', amount: 19.900, reason: 'Wrong size', type: 'exchange', date: '2026-06-17', status: 'pending', tone: 0 },
  { id: 'RET-48119', order: 'BH-2026-48119', customer: 'Ahmed Al Saleh', product: 'Sport Smartwatch AMOLED', seller: 'TechSouq', amount: 24.500, reason: 'Changed mind', type: 'refund', date: '2026-06-16', status: 'rejected', tone: 1 },
  { id: 'RET-48092', order: 'BH-2026-48092', customer: 'Fatma Al Rawahi', product: 'A2 Series Headphones', seller: 'Official Store', amount: 38.900, reason: 'Defective unit', type: 'refund', date: '2026-06-14', status: 'refunded', tone: 0 },
  { id: 'RET-48051', order: 'BH-2026-48051', customer: 'Dana Al Kindi', product: 'Espresso Machine 20-Bar', seller: 'HomeLine', amount: 58.500, reason: 'Not as described', type: 'refund', date: '2026-06-12', status: 'refunded', tone: 3 },
];

const PAYMENT_SPLIT = [
  { name: 'QPay Card', value: 52, color: '#7F77DD' },
  { name: 'Wallet', value: 31, color: '#2A9D8F' },
  { name: 'Cash on Delivery', value: 17, color: '#E6A817' },
];

const TRANSACTIONS = [
  { id: 'TXN-99812', date: '2026-06-20', type: 'sale', desc: 'Order BH-2026-48217', method: 'Wallet', amount: 138.300, dir: 'in' },
  { id: 'TXN-99810', date: '2026-06-20', type: 'fee', desc: 'Platform commission · BH-2026-48217', method: '—', amount: 27.660, dir: 'in' },
  { id: 'TXN-99805', date: '2026-06-19', type: 'sale', desc: 'Order BH-2026-48198', method: 'Wallet', amount: 92.400, dir: 'in' },
  { id: 'TXN-99801', date: '2026-06-19', type: 'refund', desc: 'Refund RET-48172 · GlowLab', method: 'QPay reversal', amount: 15.200, dir: 'out' },
  { id: 'TXN-99788', date: '2026-06-16', type: 'settlement', desc: 'Settlement STL-2026-0612 · TechSouq', method: 'Bank Muscat', amount: 8316.350, dir: 'out' },
  { id: 'TXN-99770', date: '2026-06-16', type: 'sale', desc: 'Order BH-2026-48180', method: 'QPay Card', amount: 58.500, dir: 'in' },
  { id: 'TXN-99765', date: '2026-06-15', type: 'refund', desc: 'Refund RET-48051 · HomeLine', method: 'QPay reversal', amount: 58.500, dir: 'out' },
];

const RECENT_ACTIVITY = [
  { ic: 'check-circle', tint: 'tint-success', t: 'Approved “Stainless Steel Cookware” from HomeLine', time: '12m ago' },
  { ic: 'user', tint: 'tint-violet', t: 'Mariam Al Habsi updated role permissions for Manager', time: '1h ago' },
  { ic: 'ban', tint: 'tint-warning', t: 'Blocked customer Reem Al Shahia (fraud flag)', time: '3h ago' },
  { ic: 'ticket', tint: 'tint-info', t: 'Created coupon FLASH40 (40% off)', time: '5h ago' },
  { ic: 'truck', tint: 'tint-ink', t: 'Marked order BH-2026-48198 as shipped', time: 'Yesterday' },
];

const statusBadge = (s) => ({
  PENDING: 'b-warning', CONFIRMED: 'b-info', SHIPPED: 'b-violet', DELIVERED: 'b-success', CANCELLED: 'b-danger',
  APPROVED: 'b-success', REJECTED: 'b-danger', LIVE: 'b-success', OUT: 'b-warning', DRAFT: 'b-muted',
  active: 'b-success', blocked: 'b-danger', out: 'b-warning', draft: 'b-muted', expiring: 'b-warning', expired: 'b-muted',
  published: 'b-success', flagged: 'b-danger', paid: 'b-success',
  refunded: 'b-success', on_hold: 'b-warning', approved: 'b-info', exchange: 'b-violet', refund: 'b-info',
}[s] || 'b-muted');

Object.assign(window, {
  OMR, NUM, initials, PERMISSION_GROUPS, ALL_PERMS, ROLES, USERS, CATEGORIES, TONES,
  PRODUCTS, PRODUCT_REQUESTS, ORDER_STATUSES, ORDERS, ORDER_ITEMS, COUPONS, REVIEWS,
  NOTIFICATIONS, SELLER, SELLER_PRODUCTS, SELLER_ORDERS, MONTHS, REVENUE_SERIES, ORDERS_SERIES,
  SELLER_REVENUE, CATEGORY_SPLIT, TOP_PRODUCTS, TOP_SELLERS, RECENT_ACTIVITY, statusBadge,
  FINANCE_KPI, REFUNDS_SERIES, NET_SERIES, SETTLEMENTS, RETURNS, PAYMENT_SPLIT, TRANSACTIONS,
});
