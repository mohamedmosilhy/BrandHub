/* ───────────────── BRANDHUB · Checkout page ───────────────── */

const CO_ITEMS = [
  { ...PRODUCTS[0], qty: 1, variant: 'اللون: أسود فحمي' },
  { ...PRODUCTS[3], qty: 2 },
  { ...PRODUCTS[5], qty: 1, variant: 'الحجم: 3 قطع' },
];

const CO_ADDRESSES = [
  { id: 'a1', name: 'سالم الراشدي', phone: '+968 9123 4567', line: 'مسقط — الخوض السادسة، شارع 21، فيلا 14، بجانب جامع السلام', def: true },
  { id: 'a2', name: 'سالم الراشدي — العمل', phone: '+968 9988 7766', line: 'مسقط — القرم، مجمّع الأعمال، الطابق 3، مكتب 12' },
];

const CO_SHIPPING = [
  { id: 's1', name: 'هَب اكسبريس', meta: 'توصيل اليوم — يصلك قبل 9 مساءً في مسقط', price: 0, ic: 'truck', express: true },
  { id: 's2', name: 'التوصيل القياسي', meta: 'خلال 1–3 أيام عمل', price: 0.900, ic: 'package' },
];

const CO_PAYMENTS = [
  { id: 'p_card', name: 'بطاقة بنكية', meta: 'مدى · Visa · Mastercard', ic: 'card' },
  { id: 'p_cod', name: 'الدفع عند الاستلام', meta: 'ادفع نقداً أو بالبطاقة عند وصول الطلب', ic: 'wallet' },
  { id: 'p_wallet', name: 'محفظة BRANDHUB', meta: 'الرصيد المتاح: 12.500 ر.ع.', ic: 'shield' },
];

function CoOption({ on, onClick, ic, name, meta, side, children }) {
  return (
    <button type="button" className={'opt' + (on ? ' on' : '')} onClick={onClick}>
      <span className="radio"></span>
      {ic && <span className="opt-ic"><Icon name={ic} size={20} /></span>}
      <span className="opt-body">
        <span className="opt-top">
          <span className="opt-name">{name}</span>
          {children}
        </span>
        {meta && <span className="opt-meta">{meta}</span>}
      </span>
      {side && <span className="opt-side">{side}</span>}
    </button>
  );
}

function CheckoutApp() {
  const [toasts, toast] = useToasts();
  const [addr, setAddr] = React.useState('a1');
  const [ship, setShip] = React.useState('s1');
  const [pay, setPay] = React.useState('p_card');

  const items = CO_ITEMS;
  const count = items.reduce((s, it) => s + it.qty, 0);
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const savings = items.reduce((s, it) => s + ((it.oldPrice || it.price) - it.price) * it.qty, 0);
  const shipCost = CO_SHIPPING.find((s) => s.id === ship).price;
  const total = subtotal + shipCost;

  const placeOrder = (e) => {
    e.preventDefault();
    toast('جارٍ تأكيد الطلب…');
    setTimeout(() => { window.location.href = 'BRANDHUB Order Confirmation.html'; }, 700);
  };

  return (
    <React.Fragment>
      <Header cartCount={count} wishCount={0} onToast={toast} />

      <main className="container page-stack">
        <nav className="crumbs">
          <a href="BRANDHUB Storefront.html">الرئيسية</a><span className="sep">/</span>
          <a href="BRANDHUB Cart.html">عربة التسوق</a><span className="sep">/</span>
          <span className="here">إتمام الطلب</span>
        </nav>

        <div className="page-head">
          <h1>إتمام الطلب</h1>
          <span className="sub">أكمل خطوات الدفع الآمن لإتمام طلبك</span>
        </div>

        <form className="checkout-grid" onSubmit={placeOrder}>
          <div className="checkout-steps">
            {/* 1 — address */}
            <section className="panel">
              <h2><span className="step-n">1</span> عنوان التوصيل
                <a className="edit-link" href="BRANDHUB Account.html"><Icon name="map" size={15} /> دفتر العناوين</a>
              </h2>
              <div className="opt-list">
                {CO_ADDRESSES.map((a) => (
                  <CoOption key={a.id} on={addr === a.id} onClick={() => setAddr(a.id)} ic="pin"
                    name={a.name} meta={<React.Fragment>{a.line}<br /><span className="ltr">{a.phone}</span></React.Fragment>}>
                    {a.def && <span className="tag-default">العنوان الافتراضي</span>}
                  </CoOption>
                ))}
                <button type="button" className="add-new" onClick={() => toast('إضافة عنوان جديد')}>
                  <Icon name="plus" size={16} /> إضافة عنوان جديد
                </button>
              </div>
            </section>

            {/* 2 — shipping */}
            <section className="panel">
              <h2><span className="step-n">2</span> طريقة الشحن</h2>
              <div className="opt-list">
                {CO_SHIPPING.map((s) => (
                  <CoOption key={s.id} on={ship === s.id} onClick={() => setShip(s.id)} ic={s.ic}
                    name={s.name} meta={s.meta}
                    side={s.price === 0 ? <span className="tag-free">مجاني</span> : <span className="opt-price">{formatPrice(s.price)} <small>{CURRENCY}</small></span>}>
                    {s.express && <span className="card-fulfil"><span className="fulfil-ic"><Icon name="truck" size={13} /></span> الأسرع</span>}
                  </CoOption>
                ))}
              </div>
            </section>

            {/* 3 — payment */}
            <section className="panel">
              <h2><span className="step-n">3</span> طريقة الدفع</h2>
              <div className="opt-list">
                {CO_PAYMENTS.map((p) => (
                  <CoOption key={p.id} on={pay === p.id} onClick={() => setPay(p.id)} ic={p.ic} name={p.name} meta={p.meta} />
                ))}
              </div>

              {pay === 'p_card' && (
                <div className="card-form">
                  <div className="field">
                    <label htmlFor="cc-num">رقم البطاقة</label>
                    <div className="with-ic">
                      <span className="lead"><Icon name="card" size={18} /></span>
                      <input id="cc-num" className="ltr" type="text" inputMode="numeric" placeholder="4242 4242 4242 4242" defaultValue="4242 4242 4242 4242" />
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="field">
                      <label htmlFor="cc-name">الاسم على البطاقة</label>
                      <input id="cc-name" type="text" placeholder="SALIM AL RASHDI" defaultValue="SALIM AL RASHDI" />
                    </div>
                    <div className="form-grid">
                      <div className="field">
                        <label htmlFor="cc-exp">تاريخ الانتهاء</label>
                        <input id="cc-exp" className="ltr" type="text" placeholder="MM/YY" defaultValue="08/28" />
                      </div>
                      <div className="field">
                        <label htmlFor="cc-cvc">CVC</label>
                        <div className="with-ic">
                          <input id="cc-cvc" className="ltr" type="text" inputMode="numeric" placeholder="123" defaultValue="•••" />
                          <button type="button" className="toggle" tabIndex={-1} aria-label="معلومات"><Icon name="lock" size={16} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="field hint"><Icon name="shield" size={12} /> بياناتك محمية بتشفير 256-bit ولا تُخزَّن لدينا</span>
                </div>
              )}
            </section>
          </div>

          {/* summary */}
          <aside className="summary">
            <h2>ملخص الطلب</h2>
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
            <div className="divider"></div>
            <div className="sum-row"><span>المجموع الفرعي ({count} منتجات)</span><span className="v">{formatPrice(subtotal)} <small>{CURRENCY}</small></span></div>
            {savings > 0 && <div className="sum-row"><span>وفّرت</span><span className="v" style={{ color: 'var(--color-success)' }}>{formatPrice(savings)} <small>{CURRENCY}</small></span></div>}
            <div className="sum-row"><span>الشحن</span>{shipCost === 0 ? <span className="free">مجاني</span> : <span className="v">{formatPrice(shipCost)} <small>{CURRENCY}</small></span>}</div>
            <div className="sum-row total"><span>الإجمالي</span><span className="v">{formatPrice(total)} <small>{CURRENCY}</small></span></div>
            <span className="sum-vat">شامل ضريبة القيمة المضافة</span>
            <button type="submit" className="btn-primary">تأكيد الطلب والدفع <Icon name="arrow-left" size={17} /></button>
            <a className="continue-link" href="BRANDHUB Cart.html">العودة إلى العربة</a>
            <span className="sum-secure"><Icon name="shield" size={14} /> دفع آمن ومشفّر بالكامل</span>
          </aside>
        </form>
      </main>

      <Footer onToast={toast} />
      <Toasts items={toasts} />
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<CheckoutApp />);
