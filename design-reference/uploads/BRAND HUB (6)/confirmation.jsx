/* ───────────────── BRANDHUB · Order confirmation page ───────────────── */

const OC_ITEMS = [
  { ...PRODUCTS[0], qty: 1, variant: 'اللون: أسود فحمي' },
  { ...PRODUCTS[3], qty: 2 },
  { ...PRODUCTS[5], qty: 1, variant: 'الحجم: 3 قطع' },
];

const OC_STEPS = [
  { key: 'placed', label: 'تم الطلب', time: 'الآن', state: 'done' },
  { key: 'prep', label: 'قيد التجهيز', time: 'خلال ساعة', state: 'current' },
  { key: 'transit', label: 'في الطريق', time: 'اليوم', state: 'pending' },
  { key: 'delivered', label: 'تم التسليم', time: 'قبل 9 مساءً', state: 'pending' },
];

function ConfirmApp() {
  const [toasts, toast] = useToasts();
  const items = OC_ITEMS;
  const count = items.reduce((s, it) => s + it.qty, 0);
  const total = items.reduce((s, it) => s + it.price * it.qty, 0);

  const carouselProps = {
    wishlist: {}, onWish: () => toast('أُضيف إلى المفضلة'),
    onAdd: () => toast('أُضيف إلى العربة'), fulfilLabel: 'هَب اكسبريس', onToast: toast,
  };

  return (
    <React.Fragment>
      <Header cartCount={0} wishCount={0} onToast={toast} />

      <main className="container page-stack">
        <div className="confirm-wrap">
          {/* hero */}
          <section className="confirm-hero">
            <span className="confirm-check"><Icon name="check" size={44} strokeWidth={2.4} /></span>
            <h1>تم تأكيد طلبك!</h1>
            <p>شكراً لتسوّقك مع BRANDHUB. أرسلنا تفاصيل الطلب وإيصال الدفع إلى بريدك الإلكتروني <span className="ltr">salim@email.com</span></p>
            <span className="order-no"><Icon name="package" size={15} /> رقم الطلب: <b>#BH-2026-48217</b></span>
            <div className="confirm-actions">
              <a className="btn-primary" href="BRANDHUB Account.html"><Icon name="truck" size={17} /> تتبّع الطلب</a>
              <a className="btn-ghost" href="BRANDHUB Storefront.html">مواصلة التسوّق</a>
            </div>
          </section>

          {/* tracking */}
          <section className="panel">
            <h2>حالة الطلب</h2>
            <div className="track-rail">
              {OC_STEPS.map((s) => (
                <div className={'track-step ' + s.state} key={s.key}>
                  <span className="tk-line"></span>
                  <span className="tk-dot">
                    {s.state === 'done'
                      ? <Icon name="check" size={20} strokeWidth={2.4} />
                      : s.key === 'transit' ? <Icon name="truck" size={20} />
                      : s.key === 'delivered' ? <Icon name="home" size={20} />
                      : <Icon name="package" size={20} />}
                  </span>
                  <span className="tk-lbl">{s.label}</span>
                  <span className="tk-time">{s.time}</span>
                </div>
              ))}
            </div>
          </section>

          {/* delivery estimate */}
          <section className="panel">
            <h2>التوصيل</h2>
            <div className="eta-card">
              <span className="eta-ic"><Icon name="truck" size={22} /></span>
              <div>
                <div className="eta-t">هَب اكسبريس — يصلك اليوم قبل 9 مساءً</div>
                <div className="eta-s">مسقط — الخوض السادسة، شارع 21، فيلا 14 · سالم الراشدي · <span className="ltr">+968 9123 4567</span></div>
              </div>
            </div>
          </section>

          {/* items + total */}
          <section className="panel">
            <h2>تفاصيل الطلب ({count} منتجات)</h2>
            <div className="mini-items">
              {items.map((it) => (
                <div className="mini-item" key={it.id}>
                  <span className="mini-thumb">
                    <Placeholder label="" style={{ background: `repeating-linear-gradient(135deg, ${it.tone} 0 9px, rgba(26,26,46,0.05) 9px 18px)` }} />
                    <span className="qbadge ltr">{it.qty}</span>
                  </span>
                  <span className="mi-body">
                    <span className="mi-title">{it.title}</span>
                    {it.variant && <span className="mi-var">{it.variant}</span>}
                  </span>
                  <span className="mi-price">{formatPrice(it.price * it.qty)} {CURRENCY}</span>
                </div>
              ))}
            </div>
            <div className="divider" style={{ margin: 'var(--space-4) 0' }}></div>
            <div className="sum-row"><span>الشحن</span><span className="free">مجاني — هَب اكسبريس</span></div>
            <div className="sum-row total"><span>الإجمالي المدفوع</span><span className="v">{formatPrice(total)} <small>{CURRENCY}</small></span></div>
            <span className="sum-vat">شامل ضريبة القيمة المضافة · تم الدفع ببطاقة تنتهي بـ <span className="ltr">4242</span></span>
          </section>
        </div>

        <ProductCarousel title="أكمل تسوّقك" products={pickProducts(10, 10)} {...carouselProps} />
      </main>

      <Footer onToast={toast} />
      <Toasts items={toasts} />
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ConfirmApp />);
