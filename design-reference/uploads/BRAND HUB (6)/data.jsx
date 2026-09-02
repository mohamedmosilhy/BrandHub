/* ───────────────── BRANDHUB · demo data + helpers ───────────────── */

// OMR — 3 decimals, currency symbol ر.ع.
function formatPrice(n) {
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 3, maximumFractionDigits: 3,
  });
}
const CURRENCY = 'ر.ع.';

// Category nav links (row 2)
const NAV_CATEGORIES = [
  'الإلكترونيات', 'أزياء النساء', 'أزياء الرجال', 'أزياء الأطفال',
  'لوازم الجمال والبرفيوم', 'لوازم البيت والأجهزة المنزلية', 'البيبي',
  'الألعاب', 'السوبرماركت', 'لوازم السيارات', 'لوازم الصحة والتغذية',
  'لوازم الرياضة', 'أدوات مكتبية والكتب',
];

// Shop-by-category square tiles (§5.5)
const SHOP_CATEGORIES = [
  { name: 'الإلكترونيات', count: 248, tone: '#EEEDF9' },
  { name: 'أزياء النساء', count: 312, tone: '#FCEEF3' },
  { name: 'أزياء الرجال', count: 186, tone: '#E8F1F8' },
  { name: 'الجمال والعناية', count: 196, tone: '#E3F5EF' },
  { name: 'البيت والمطبخ', count: 174, tone: '#FEF7E0' },
  { name: 'الألعاب والأطفال', count: 132, tone: '#EEEDF9' },
  { name: 'الرياضة', count: 121, tone: '#E3F5EF' },
  { name: 'السوبرماركت', count: 305, tone: '#FEF7E0' },
  { name: 'لوازم السيارات', count: 88, tone: '#E8F1F8' },
  { name: 'الصحة والتغذية', count: 94, tone: '#FCEEF3' },
  { name: 'البيبي', count: 110, tone: '#EEEDF9' },
  { name: 'أدوات مكتبية والكتب', count: 67, tone: '#E3F5EF' },
];

// Influencers (§5.4) — 13 live now, growing to 32+
const INFLUENCERS_TOTAL = 32;
const INFLUENCERS = [
  { name: 'ليان المعمري', handle: '@layan.style', followers: '215K' },
  { name: 'مريم الحبسي', handle: '@maryam.beauty', followers: '340K' },
  { name: 'أمل البوسعيدي', handle: '@amal.fashion', followers: '301K' },
  { name: 'شذى الزدجالي', handle: '@shatha.looks', followers: '254K' },
  { name: 'سالم البلوشي', handle: '@salim.tech', followers: '182K' },
  { name: 'نورة السيابي', handle: '@noura.kitchen', followers: '188K' },
  { name: 'طلال الهنائي', handle: '@talal.cars', followers: '142K' },
  { name: 'دانة الكندي', handle: '@dana.home', followers: '127K' },
  { name: 'خالد العامري', handle: '@khalid.games', followers: '113K' },
  { name: 'يوسف الراشدي', handle: '@yousef.fit', followers: '98K' },
  { name: 'ريم الشحية', handle: '@reem.travel', followers: '95K' },
  { name: 'عبدالله الحارثي', handle: '@abdullah.gear', followers: '76K' },
  { name: 'حمد المقبالي', handle: '@hamad.daily', followers: '65K' },
];

// Collections (§5.8)
const COLLECTIONS = [
  'الملابس الخارجية', 'ملابس السباحة', 'الأطقم الكاملة',
  'الإكسسوارات', 'الأحذية', 'الحقائب', 'الساعات',
];

// Product pool — reused across carousels (§5.11 shape)
const PRODUCTS = [
  { id: 'p1', img: 'assets/products/p1.jpg', title: 'سماعة رأس لاسلكية بخاصية عزل الضوضاء A2 Series', price: 38.900, oldPrice: 54.000, discount: '28%', rating: 4.6, reviewCount: '1.2K', badge: 'أفضل المنتجات', nudge: 'تم بيع +50 مؤخراً', express: true, tone: '#EEEDF9' },
  { id: 'p2', img: 'assets/products/p2.jpg', title: 'ساعة ذكية رياضية بشاشة AMOLED ومقاومة للماء', price: 24.500, oldPrice: 32.000, discount: '23%', rating: 4.4, reviewCount: '860', nudge: 'بتخلّص بسرعة', express: true, tone: '#FCEEF3' },
  { id: 'p3', img: 'assets/products/p3.jpg', title: 'يد تحكم للألعاب لاسلكية متوافقة مع جميع المنصات', price: 18.750, oldPrice: 25.000, discount: '25%', rating: 4.7, reviewCount: '2.1K', badge: 'الستور الرسمي', tone: '#E3F5EF' },
  { id: 'p4', img: 'assets/products/p4.jpg', title: 'مكنسة كهربائية لاسلكية محمولة بقوة شفط عالية', price: 42.000, rating: 4.3, reviewCount: '540', nudge: 'أقل سعر في 7 أيام', express: true, tone: '#FEF7E0' },
  { id: 'p5', img: 'assets/products/p5.jpg', title: 'حقيبة ظهر عصرية مقاومة للماء بمساحة للابتوب', price: 12.900, oldPrice: 19.500, discount: '34%', rating: 4.5, reviewCount: '1.8K', badge: 'أفضل المنتجات', tone: '#EEEDF9' },
  { id: 'p6', img: 'assets/products/p6.jpg', title: 'مجموعة العناية بالبشرة بفيتامين سي الطبيعي', price: 15.200, oldPrice: 21.000, discount: '28%', rating: 4.8, reviewCount: '3.4K', nudge: 'تم بيع +120 مؤخراً', tone: '#FCEEF3' },
  { id: 'p7', img: 'assets/products/p7.jpg', title: 'مكبر صوت بلوتوث محمول مقاوم للماء بصوت محيطي', price: 21.300, oldPrice: 28.000, discount: '24%', rating: 4.5, reviewCount: '970', express: true, tone: '#E3F5EF' },
  { id: 'p8', img: 'assets/products/p8.jpg', title: 'كاميرا مراقبة ذكية بدقة 2K ورؤية ليلية', price: 16.800, rating: 4.2, reviewCount: '420', nudge: 'باقي 3 وحدات فقط', tone: '#FEF7E0' },
  { id: 'p9', img: 'assets/products/p9.jpg', title: 'حذاء رياضي خفيف للجري بنعل مريح للاستخدام اليومي', price: 19.900, oldPrice: 27.500, discount: '28%', rating: 4.6, reviewCount: '1.5K', badge: 'الستور الرسمي', express: true, tone: '#EEEDF9' },
  { id: 'p10', img: 'assets/products/p10.jpg', title: 'ماكينة تحضير القهوة الأوتوماتيكية بضغط 20 بار', price: 58.500, oldPrice: 72.000, discount: '19%', rating: 4.7, reviewCount: '660', nudge: 'بتخلّص بسرعة', tone: '#FCEEF3' },
  { id: 'p11', img: 'assets/products/p11.jpg', title: 'لوحة مفاتيح ميكانيكية للألعاب بإضاءة RGB', price: 22.400, oldPrice: 30.000, discount: '25%', rating: 4.4, reviewCount: '780', tone: '#E3F5EF' },
  { id: 'p12', img: 'assets/products/p12.jpg', title: 'مجموعة عطور فاخرة للرجال والنساء 3 قطع', price: 27.000, rating: 4.6, reviewCount: '1.1K', badge: 'أفضل المنتجات', express: true, tone: '#FEF7E0' },
  { id: 'p13', img: 'assets/products/p13.jpg', title: 'شاحن لاسلكي سريع 3 في 1 للهاتف والساعة والسماعات', price: 11.500, oldPrice: 16.000, discount: '28%', rating: 4.3, reviewCount: '2.6K', nudge: 'تم بيع +90 مؤخراً', tone: '#EEEDF9' },
  { id: 'p14', img: 'assets/products/p14.jpg', title: 'طقم أواني طهي جرانيت غير لاصق 10 قطع', price: 34.900, oldPrice: 45.000, discount: '22%', rating: 4.5, reviewCount: '510', tone: '#FCEEF3' },
  { id: 'p15', img: 'assets/products/p15.jpg', title: 'عباية كاجوال بقصة عصرية وأكمام واسعة', price: 23.500, oldPrice: 31.000, discount: '24%', rating: 4.7, reviewCount: '930', badge: 'وصل حديثاً', tone: '#E8F1F8' },
  { id: 'p16', img: 'assets/products/p16.jpg', title: 'مجفف شعر احترافي بتقنية الأيونات 2200 واط', price: 17.600, oldPrice: 24.000, discount: '27%', rating: 4.4, reviewCount: '1.3K', express: true, tone: '#FCEEF3' },
  { id: 'p17', img: 'assets/products/p17.jpg', title: 'طاولة قابلة للطي متعددة الاستخدامات للتخييم', price: 14.200, rating: 4.1, reviewCount: '380', nudge: 'باقي 5 وحدات فقط', tone: '#E3F5EF' },
  { id: 'p18', img: 'assets/products/p18.jpg', title: 'نظارة شمسية بإطار معدني وحماية UV400', price: 9.900, oldPrice: 15.000, discount: '34%', rating: 4.5, reviewCount: '2.2K', badge: 'أفضل المنتجات', tone: '#FEF7E0' },
  { id: 'p19', img: 'assets/products/p19.jpg', title: 'جهاز تتبع اللياقة بقياس نبض القلب والأكسجين', price: 13.400, oldPrice: 18.500, discount: '27%', rating: 4.3, reviewCount: '740', express: true, tone: '#EEEDF9' },
  { id: 'p20', img: 'assets/products/p20.jpg', title: 'مصباح مكتب LED بذراع مرنة وشحن لاسلكي مدمج', price: 10.800, oldPrice: 14.500, discount: '25%', rating: 4.6, reviewCount: '560', nudge: 'تم بيع +40 مؤخراً', tone: '#E8F1F8' },
];

// pick n products starting at offset (cyclic) to vary each carousel
function pickProducts(offset, n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(PRODUCTS[(offset + i) % PRODUCTS.length]);
  return out;
}

Object.assign(window, {
  formatPrice, CURRENCY, NAV_CATEGORIES, SHOP_CATEGORIES,
  INFLUENCERS, INFLUENCERS_TOTAL, COLLECTIONS, PRODUCTS, pickProducts,
});
