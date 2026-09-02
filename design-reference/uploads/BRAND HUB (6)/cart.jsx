/* ───────────────── BRANDHUB · Cart page ───────────────── */

const CART_INITIAL = [
  { ...PRODUCTS[0], qty: 1, variant: 'اللون: أسود فحمي' },
  { ...PRODUCTS[3], qty: 2 },
  { ...PRODUCTS[5], qty: 1, variant: 'الحجم: 3 قطع' },
];

function CartToasts({ items }) {
  return (
    <div className="toast-wrap">
      {items.map((t) => (
        <div className="toast" key={t.id}>
          <span className="ic"><Icon name="check" size={16} /></span>{t.msg}
        </div>
      ))}
    </div>
  );
}

function CartItem({ item, onQty, onRemove, onWish }) {
  return (
    <article className="cart-item">
      <a className="ci-img" href="BRANDHUB Product.html">
        <Placeholder label="product" style={{ background: `repeating-linear-gradient(135deg, ${item.tone} 0 11px, rgba(26,26,46,0.05) 11px 22px)` }} />
      </a>
      <div className="ci-body">
        <h3 className="ci-title"><a href="BRANDHUB Product.html">{item.title}</a></h3>
        {item.variant && <span className="ci-variant">{item.variant}</span>}
        <div className="pdp-chips">
          {item.express && <span className="card-fulfil"><span className="fulfil-ic"><Icon name="truck" size={14} /></span> هَب اكسبريس</span>}
          {item.nudge && <span className="card-nudge"><span className="dot"></span>{item.nudge}</span>}
        </div>
        <div className="ci-actions">
          <button onClick={() => onRemove(item)}><Icon name="trash" size={14} /> إزالة</button>
          <button className="to-wish" onClick={() => onWish(item)}><Icon name="heart" size={14} /> انقل إلى المفضلة</button>
        </div>
      </div>
      <div className="ci-side">
        <div className="ci-price">
          <span className="amt">{formatPrice(item.price * item.qty)}</span>
          <span className="cur">{CURRENCY}</span>
          {item.oldPrice && <span className="old">{formatPrice(item.oldPrice * item.qty)}</span>}
        </div>
        <div className="qty">
          <button onClick={() => onQty(item, -1)} aria-label="إنقاص"><Icon name="minus" size={15} /></button>
          <span className="num">{item.qty}</span>
          <button onClick={() => onQty(item, 1)} aria-label="زيادة"><Icon name="plus" size={15} /></button>
        </div>
      </div>
    </article>
  );
}

function CartApp() {
  const [items, setItems] = React.useState(CART_INITIAL);
  const [toasts, setToasts] = React.useState([]);
  const [coupon, setCoupon] = React.useState('');

  const toast = React.useCallback((msg) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 1900);
  }, []);

  const count = items.reduce((s, it) => s + it.qty, 0);
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const savings = items.reduce((s, it) => s + ((it.oldPrice || it.price) - it.price) * it.qty, 0);

  const setQty = (item, d) => {
    setItems((prev) => prev.map((it) => it.id === item.id ? { ...it, qty: Math.min(9, Math.max(1, it.qty + d)) } : it));
  };
  const remove = (item) => {
    setItems((prev) => prev.filter((it) => it.id !== item.id));
    toast('أُزيل من العربة');
  };
  const moveToWish = (item) => {
    setItems((prev) => prev.filter((it) => it.id !== item.id));
    toast('نُقل إلى المفضلة');
  };

  const carouselProps = {
    wishlist: {}, onWish: () => toast('أُضيف إلى المفضلة'),
    onAdd: () => toast('أُضيف إلى العربة'), fulfilLabel: 'هَب اكسبريس', onToast: toast,
  };

  return (
    <React.Fragment>
      <Header cartCount={count} wishCount={0} onToast={toast} />

      <main className="container page-stack">
        <h1 className="cart-title">عربة التسوق<span className="n">({count} {count === 1 ? 'منتج' : 'منتجات'})</span></h1>

        {items.length === 0 ? (
          <div className="cart-empty">
            <span className="big-ic"><Icon name="bag" size={64} strokeWidth={1.2} /></span>
            <h2>عربتك فارغة</h2>
            <p>اكتشف آلاف المنتجات بتوصيل سريع داخل عُمان</p>
            <a className="btn-primary" href="BRANDHUB Storefront.html">ابدأ التسوّق</a>
          </div>
        ) : (
          <div className="cart-grid">
            <div className="cart-list">
              <div className="ship-banner">
                <Icon name="truck" size={18} />
                طلبك مؤهل للتوصيل المجاني — يصلك بـ هَب اكسبريس خلال 3 ساعات في مسقط
              </div>
              {items.map((it) => (
                <CartItem key={it.id} item={it} onQty={setQty} onRemove={remove} onWish={moveToWish} />
              ))}
            </div>

            <aside className="summary">
              <h2>ملخص الطلب</h2>
              <div className="sum-row"><span>المجموع الفرعي ({count} منتجات)</span><span className="v">{formatPrice(subtotal)} <small>{CURRENCY}</small></span></div>
              {savings > 0 && <div className="sum-row"><span>وفّرت</span><span className="v" style={{ color: 'var(--color-success)' }}>{formatPrice(savings)} <small>{CURRENCY}</small></span></div>}
              <div className="sum-row"><span>الشحن</span><span className="free">مجاني</span></div>
              <form className="coupon" onSubmit={(e) => { e.preventDefault(); coupon ? toast('تم تطبيق الكود: ' + coupon) : toast('أدخل كود الخصم'); }}>
                <input type="text" value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="كود الخصم" aria-label="كود الخصم" />
                <button type="submit">تطبيق</button>
              </form>
              <div className="sum-row total"><span>الإجمالي</span><span className="v">{formatPrice(subtotal)} <small>{CURRENCY}</small></span></div>
              <span className="sum-vat">شامل ضريبة القيمة المضافة</span>
              <a className="btn-primary" href="BRANDHUB Checkout.html">إتمام الشراء <Icon name="arrow-left" size={17} /></a>
              <a className="continue-link" href="BRANDHUB Storefront.html">مواصلة التسوّق</a>
              <span className="sum-secure"><Icon name="shield" size={14} /> دفع آمن ومشفّر</span>
            </aside>
          </div>
        )}

        <ProductCarousel title="قد يعجبك أيضاً" products={pickProducts(8, 10)} {...carouselProps} />
      </main>

      <Footer onToast={toast} />
      <CartToasts items={toasts} />
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<CartApp />);
