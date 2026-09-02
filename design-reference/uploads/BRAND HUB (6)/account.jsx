/* ───────────────── BRANDHUB · My account & orders ───────────────── */

const ACCT_ORDERS = [
  {
    id: '#BH-2026-48217', date: '20 يونيو 2026', status: 'transit', statusLabel: 'في الطريق',
    items: [PRODUCTS[0], PRODUCTS[3], PRODUCTS[5]], count: 4, total: 138.300, eta: 'يصلك اليوم قبل 9 مساءً',
  },
  {
    id: '#BH-2026-47980', date: '12 يونيو 2026', status: 'delivered', statusLabel: 'تم التسليم',
    items: [PRODUCTS[8], PRODUCTS[11]], count: 2, total: 46.900, eta: 'سُلّم في 13 يونيو',
  },
  {
    id: '#BH-2026-47655', date: '5 يونيو 2026', status: 'processing', statusLabel: 'قيد التجهيز',
    items: [PRODUCTS[13], PRODUCTS[15], PRODUCTS[18], PRODUCTS[6]], count: 5, total: 92.400, eta: 'يُشحن خلال 24 ساعة',
  },
];

const ACCT_ADDRESSES = [
  { id: 'a1', name: 'المنزل', line: 'مسقط — الخوض السادسة، شارع 21، فيلا 14، بجانب جامع السلام', phone: '+968 9123 4567', def: true },
  { id: 'a2', name: 'العمل', line: 'مسقط — القرم، مجمّع الأعمال، الطابق 3، مكتب 12', phone: '+968 9988 7766' },
];

const ACCT_CARDS = [
  { id: 'c1', brand: 'مدى', last: '4242', exp: '08/28', def: true },
  { id: 'c2', brand: 'Visa', last: '8810', exp: '02/27' },
];

const ACCT_NAV = [
  { key: 'orders', icon: 'package', label: 'طلباتي', badge: ACCT_ORDERS.length },
  { key: 'addresses', icon: 'map', label: 'العناوين' },
  { key: 'payments', icon: 'card', label: 'طرق الدفع' },
  { key: 'settings', icon: 'settings', label: 'الإعدادات' },
];

function OrderCard({ order, onToast }) {
  const shown = order.items.slice(0, 3);
  const extra = order.count - shown.length;
  return (
    <article className="order-card">
      <div className="order-top">
        <div className="ot-block"><span className="ot-lbl">رقم الطلب</span><span className="ot-val ltr">{order.id}</span></div>
        <div className="ot-block"><span className="ot-lbl">تاريخ الطلب</span><span className="ot-val">{order.date}</span></div>
        <span className={'order-status ' + order.status}><span className="dot"></span>{order.statusLabel}</span>
      </div>
      <div className="order-body">
        <div className="order-thumbs">
          {shown.map((it) => (
            <span className="ot-img" key={it.id}>
              <Placeholder label="" style={{ background: `repeating-linear-gradient(135deg, ${it.tone} 0 9px, rgba(26,26,46,0.05) 9px 18px)` }} />
            </span>
          ))}
          {extra > 0 && <span className="ot-img more ltr">+{extra}</span>}
        </div>
        <div className="ob-info">
          <span className="ob-items">{order.count} منتجات · {order.eta}</span>
          <span className="ob-total">{formatPrice(order.total)} <span className="cur">{CURRENCY}</span></span>
        </div>
        <div className="order-actions">
          {order.status !== 'delivered'
            ? <a className="btn-sm solid" href="BRANDHUB Order Confirmation.html"><Icon name="truck" size={15} /> تتبّع الطلب</a>
            : <button className="btn-sm solid" onClick={() => onToast('أُعيد المنتجات إلى العربة')}><Icon name="repeat" size={15} /> إعادة الطلب</button>}
          <button className="btn-sm outline" onClick={() => onToast('تفاصيل الطلب ' + order.id)}>التفاصيل</button>
        </div>
      </div>
    </article>
  );
}

function AccountApp() {
  const [toasts, toast] = useToasts();
  const [tab, setTab] = React.useState('orders');

  return (
    <React.Fragment>
      <Header cartCount={0} wishCount={8} onToast={toast} />

      <main className="container page-stack">
        <nav className="crumbs">
          <a href="BRANDHUB Storefront.html">الرئيسية</a><span className="sep">/</span>
          <span className="here">حسابي</span>
        </nav>

        <div className="account-grid">
          {/* sidebar */}
          <aside className="acct-side">
            <div className="acct-profile">
              <span className="acct-avatar">س</span>
              <div>
                <div className="ap-name">سالم الراشدي</div>
                <div className="ap-mail">salim@email.com</div>
              </div>
            </div>
            <nav className="acct-nav">
              {ACCT_NAV.map((n) => (
                <a key={n.key} href="#" className={tab === n.key ? 'on' : ''} onClick={(e) => { e.preventDefault(); setTab(n.key); }}>
                  <Icon name={n.icon} size={18} /> {n.label}
                  {n.badge != null && <span className="badge ltr">{n.badge}</span>}
                </a>
              ))}
              <a href="BRANDHUB Wishlist.html"><Icon name="heart" size={18} /> المفضلة <span className="badge ltr">8</span></a>
              <span className="sep"></span>
              <a href="BRANDHUB Login.html" className="logout"><Icon name="logout" size={18} /> تسجيل الخروج</a>
            </nav>
          </aside>

          {/* main */}
          <div className="acct-main">
            {tab === 'orders' && (
              <React.Fragment>
                <h1 className="acct-h">طلباتي</h1>
                {ACCT_ORDERS.map((o) => <OrderCard key={o.id} order={o} onToast={toast} />)}
              </React.Fragment>
            )}

            {tab === 'addresses' && (
              <React.Fragment>
                <h1 className="acct-h">العناوين المحفوظة</h1>
                <div className="addr-grid">
                  {ACCT_ADDRESSES.map((a) => (
                    <div className={'addr-card' + (a.def ? ' is-default' : '')} key={a.id}>
                      <div className="ac-head">
                        <Icon name="pin" size={17} style={{ color: 'var(--color-accent)' }} />
                        <span className="ac-name">{a.name}</span>
                        {a.def && <span className="tag-default" style={{ marginInlineStart: 'auto' }}>افتراضي</span>}
                      </div>
                      <span className="ac-line">{a.line}</span>
                      <span className="ac-line ltr" style={{ textAlign: 'start' }}>{a.phone}</span>
                      <div className="ac-actions">
                        <button onClick={() => toast('تعديل العنوان')}><Icon name="edit" size={14} /> تعديل</button>
                        <button className="del" onClick={() => toast('حذف العنوان')}><Icon name="trash" size={14} /> حذف</button>
                      </div>
                    </div>
                  ))}
                  <button className="addr-card add" onClick={() => toast('إضافة عنوان جديد')}>
                    <Icon name="plus" size={24} />
                    <span style={{ fontWeight: 'var(--weight-semibold)' }}>إضافة عنوان جديد</span>
                  </button>
                </div>
              </React.Fragment>
            )}

            {tab === 'payments' && (
              <React.Fragment>
                <h1 className="acct-h">طرق الدفع</h1>
                <div className="addr-grid">
                  {ACCT_CARDS.map((c) => (
                    <div className={'addr-card' + (c.def ? ' is-default' : '')} key={c.id}>
                      <div className="ac-head">
                        <Icon name="card" size={17} style={{ color: 'var(--color-accent)' }} />
                        <span className="ac-name">{c.brand}</span>
                        {c.def && <span className="tag-default" style={{ marginInlineStart: 'auto' }}>افتراضي</span>}
                      </div>
                      <span className="ac-line ltr" style={{ textAlign: 'start', fontSize: 'var(--text-body)', letterSpacing: '.12em' }}>•••• •••• •••• {c.last}</span>
                      <span className="ac-line">تنتهي في <span className="ltr">{c.exp}</span></span>
                      <div className="ac-actions">
                        <button className="del" onClick={() => toast('حذف البطاقة')}><Icon name="trash" size={14} /> حذف</button>
                      </div>
                    </div>
                  ))}
                  <button className="addr-card add" onClick={() => toast('إضافة بطاقة جديدة')}>
                    <Icon name="plus" size={24} />
                    <span style={{ fontWeight: 'var(--weight-semibold)' }}>إضافة بطاقة جديدة</span>
                  </button>
                </div>
              </React.Fragment>
            )}

            {tab === 'settings' && (
              <React.Fragment>
                <h1 className="acct-h">الإعدادات</h1>
                <section className="panel">
                  <h2>المعلومات الشخصية</h2>
                  <div className="form-grid">
                    <div className="field"><label htmlFor="s-name">الاسم الكامل</label><input id="s-name" type="text" defaultValue="سالم الراشدي" /></div>
                    <div className="field"><label htmlFor="s-phone">رقم الهاتف</label><input id="s-phone" className="ltr" type="tel" defaultValue="+968 9123 4567" /></div>
                    <div className="field full"><label htmlFor="s-mail">البريد الإلكتروني</label><input id="s-mail" className="ltr" type="email" defaultValue="salim@email.com" /></div>
                  </div>
                  <button className="btn-pill accent" style={{ marginTop: 'var(--space-4)', alignSelf: 'flex-start' }} onClick={() => toast('تم حفظ التغييرات')}>حفظ التغييرات</button>
                </section>
                <section className="panel">
                  <h2>التفضيلات</h2>
                  <div className="set-list">
                    <Setting t="إشعارات الطلبات" s="تنبيهات عبر الرسائل النصية عند تحديث حالة الطلب" def={true} onToast={toast} />
                    <Setting t="العروض والتخفيضات" s="استقبال عروض هَب اكسبريس الحصرية" def={true} onToast={toast} />
                    <Setting t="نشرة المؤثرين" s="جديد المحتوى من المؤثرين الذين تتابعهم" def={false} onToast={toast} />
                  </div>
                </section>
              </React.Fragment>
            )}
          </div>
        </div>
      </main>

      <Footer onToast={toast} />
      <Toasts items={toasts} />
    </React.Fragment>
  );
}

function Setting({ t, s, def, onToast }) {
  const [on, setOn] = React.useState(def);
  return (
    <div className="set-row">
      <div className="sr-body"><span className="sr-t">{t}</span><span className="sr-s">{s}</span></div>
      <button type="button" className={'switch sr-side' + (on ? ' on' : '')} onClick={() => { setOn((v) => !v); onToast('تم التحديث'); }} aria-label={t}><span className="knob"></span></button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AccountApp />);
