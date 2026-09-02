/* ───────────────── BRANDHUB · Product detail page ───────────────── */

const PDP_PRODUCT = {
  ...PRODUCTS[0],
  colors: [
    { name: 'أسود فحمي', hex: '#2B2B33' },
    { name: 'بنفسجي', hex: '#7F77DD' },
    { name: 'بيج رملي', hex: '#D9CDB8' },
  ],
  desc: [
    'استمتع بصوت نقي وعزل كامل للضوضاء مع سماعة A2 Series — الإصدار الحصري من الستور الرسمي. صُممت لساعات الاستماع الطويلة بوسائد أذن ناعمة وذراع قابلة للتعديل.',
    'تقنية ANC النشطة تحجب حتى 35 ديسيبل من ضوضاء المحيط، مع وضع الشفافية للاستماع لما حولك بضغطة واحدة.',
  ],
  bullets: [
    'بطارية تدوم 40 ساعة مع شحن سريع: 10 دقائق = 5 ساعات تشغيل',
    'بلوتوث 5.3 مع اتصال مزدوج بجهازين في آن واحد',
    'ميكروفونات مدمجة بخاصية عزل الصوت للمكالمات',
    'قابلة للطي مع حقيبة حماية صلبة ضمن العلبة',
  ],
  specs: [
    ['النوع', 'فوق الأذن (Over-ear)'],
    ['عزل الضوضاء', 'نشط ANC — حتى 35dB'],
    ['البطارية', '40 ساعة تشغيل متواصل'],
    ['الاتصال', 'بلوتوث 5.3 + منفذ AUX 3.5mm'],
    ['الشحن', 'USB-C — شحن سريع'],
    ['الوزن', '255 غرام'],
    ['الضمان', 'سنتان — الستور الرسمي'],
  ],
};

const PDP_RATING_BARS = [[5, 68], [4, 21], [3, 7], [2, 2], [1, 2]];

const PDP_REVIEWS = [
  { name: 'أحمد البلوشي', initial: 'أ', date: 'قبل 3 أيام', rating: 5, text: 'جودة الصوت ممتازة وعزل الضوضاء فعلاً يشتغل حتى في المقهى. البطارية صمدت معي أسبوع كامل بالاستخدام اليومي.' },
  { name: 'فاطمة الرواحي', initial: 'ف', date: 'قبل أسبوع', rating: 4, text: 'مريحة جداً للاستخدام الطويل والتوصيل وصل بنفس اليوم عبر هَب اكسبريس. نجمة ناقصة لأن الحقيبة أكبر من المتوقع.' },
  { name: 'محمد العبري', initial: 'م', date: 'قبل أسبوعين', rating: 5, text: 'ثاني سماعة أشتريها من نفس الستور — الإصدار الخاص يستاهل فرق السعر. التوصيل بجهازين ميزة عملية للشغل.' },
];

const PDP_VIEW_TONES = ['#ececed', '#EEEDF9', '#ececed', '#FCEEF3', '#ececed'];

function PdpGallery({ product, isWished, onWish, onToast }) {
  const [view, setView] = React.useState(0);
  return (
    <React.Fragment>
      <div className="pdp-thumbs">
        {PDP_VIEW_TONES.map((tone, i) => (
          <button key={i} className={'pdp-thumb' + (i === view ? ' active' : '')} onClick={() => setView(i)} aria-label={`صورة ${i + 1}`}>
            <Placeholder label={String(i + 1)} style={{ background: `repeating-linear-gradient(135deg, ${tone} 0 11px, rgba(26,26,46,0.05) 11px 22px)` }} />
          </button>
        ))}
      </div>
      <div className="pdp-main">
        <Placeholder label={`product photo · view ${view + 1}`} style={{ background: `repeating-linear-gradient(135deg, ${PDP_VIEW_TONES[view]} 0 14px, rgba(26,26,46,0.05) 14px 28px)` }} />
        {product.badge && <span className="card-badge">{product.badge}</span>}
        <button className={'pdp-fab wish' + (isWished ? ' on' : '')} onClick={onWish} aria-label="أضف إلى المفضلة"><Icon name="heart" size={19} /></button>
        <button className="pdp-fab share" onClick={() => onToast('تم نسخ رابط المنتج')} aria-label="مشاركة"><Icon name="share" size={18} /></button>
      </div>
    </React.Fragment>
  );
}

function PdpInfo({ product, onAdd, onToast }) {
  const [color, setColor] = React.useState(0);
  const [qty, setQty] = React.useState(1);
  return (
    <div className="pdp-info">
      <div className="pdp-badges">
        <span className="store-chip"><Icon name="check" size={13} /> الستور الرسمي</span>
      </div>
      <h1 className="pdp-title">{product.title} — إصدار خاص بألوان حصرية</h1>
      <div className="pdp-rating">
        <span className="score"><Icon name="star" size={13} /> {product.rating.toFixed(1)}</span>
        <a href="#reviews">{product.reviewCount} تقييم</a>
        <span>·</span>
        <span>تم بيع +50 مؤخراً</span>
      </div>

      <div className="pdp-price">
        <span className="amt ltr">{formatPrice(product.price)}</span>
        <span className="cur">{CURRENCY}</span>
        <span className="old ltr">{formatPrice(product.oldPrice)}</span>
        <span className="disc-pill">خصم {product.discount}</span>
      </div>
      <span className="pdp-vat">السعر شامل ضريبة القيمة المضافة</span>

      <div className="pdp-chips">
        <span className="card-fulfil"><span className="fulfil-ic"><Icon name="truck" size={14} /></span> هَب اكسبريس</span>
        <span className="card-nudge"><span className="dot"></span>{product.nudge}</span>
      </div>

      <div className="pdp-colors">
        <span className="pdp-lbl">اللون: <span className="val">{PDP_PRODUCT.colors[color].name}</span></span>
        <div className="swatches">
          {PDP_PRODUCT.colors.map((c, i) => (
            <button key={c.name} className={'swatch' + (i === color ? ' active' : '')} onClick={() => setColor(i)} aria-label={c.name}>
              <span style={{ background: c.hex }}></span>
            </button>
          ))}
        </div>
      </div>

      <div className="pdp-buy">
        <div className="qty">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="إنقاص"><Icon name="minus" size={16} /></button>
          <span className="num">{qty}</span>
          <button onClick={() => setQty((q) => Math.min(9, q + 1))} aria-label="زيادة"><Icon name="plus" size={16} /></button>
        </div>
        <button className="btn-primary" onClick={() => onAdd(qty)}><Icon name="cart" size={19} /> أضف إلى العربة</button>
        <a className="btn-ghost" href="BRANDHUB Checkout.html" style={{ textDecoration: 'none' }}>اشترِ الآن</a>
      </div>

      <div className="pdp-perks">
        <div className="perk"><span className="ic"><Icon name="truck" size={17} /></span><span><b>توصيل اليوم بـ هَب اكسبريس</b> — اطلب خلال 4 ساعات ليصلك في مسقط قبل 9 مساءً</span></div>
        <div className="perk"><span className="ic"><Icon name="package" size={17} /></span><span><b>توصيل مجاني</b> للطلبات فوق <span className="ltr">10.000</span> {CURRENCY}</span></div>
        <div className="perk"><span className="ic"><Icon name="refresh" size={17} /></span><span><b>إرجاع مجاني</b> خلال 15 يوماً من الاستلام</span></div>
        <div className="perk"><span className="ic"><Icon name="shield" size={17} /></span><span><b>منتج أصلي 100%</b> بضمان الستور الرسمي لمدة سنتين</span></div>
      </div>
    </div>
  );
}

function PdpToasts({ items }) {
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

function PdpApp() {
  const [cart, setCart] = React.useState(1);
  const [wishlist, setWishlist] = React.useState({});
  const [toasts, setToasts] = React.useState([]);
  const product = PDP_PRODUCT;

  const toast = React.useCallback((msg) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 1900);
  }, []);

  const addToCart = (n) => { setCart((c) => c + n); toast('أُضيف إلى العربة'); };
  const toggleWish = (p) => {
    setWishlist((w) => {
      const next = { ...w };
      if (next[p.id]) { delete next[p.id]; toast('أُزيل من المفضلة'); }
      else { next[p.id] = true; toast('أُضيف إلى المفضلة'); }
      return next;
    });
  };
  const carouselProps = { wishlist, onWish: toggleWish, onAdd: () => addToCart(1), fulfilLabel: 'هَب اكسبريس', onToast: toast };

  return (
    <React.Fragment>
      <Header cartCount={cart} wishCount={Object.keys(wishlist).length} onToast={toast} />

      <main className="container page-stack">
        <nav className="crumbs">
          <a href="BRANDHUB Storefront.html">الرئيسية</a><span className="sep">/</span>
          <a href="#" onClick={(e) => { e.preventDefault(); toast('الإلكترونيات'); }}>الإلكترونيات</a><span className="sep">/</span>
          <a href="#" onClick={(e) => { e.preventDefault(); toast('السماعات'); }}>السماعات</a><span className="sep">/</span>
          <span className="here">A2 Series</span>
        </nav>

        <section className="pdp">
          <PdpGallery product={product} isWished={!!wishlist[product.id]} onWish={() => toggleWish(product)} onToast={toast} />
          <PdpInfo product={product} onAdd={addToCart} onToast={toast} />
        </section>

        <section className="pdp-detail">
          <div className="pdp-desc">
            <h2>الوصف</h2>
            {product.desc.map((d, i) => <p key={i}>{d}</p>)}
            <ul>
              {product.bullets.map((b) => <li key={b}>{b}</li>)}
            </ul>
          </div>
          <div className="pdp-specs">
            <h2>المواصفات</h2>
            <table className="spec-table">
              <tbody>
                {product.specs.map(([k, v]) => (
                  <tr key={k}><th>{k}</th><td>{v}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="pdp-reviews" id="reviews">
          <h2>تقييمات المشترين</h2>
          <div className="rev-grid">
            <div className="rev-score">
              <span className="rev-big">{product.rating.toFixed(1)}</span>
              <span className="rev-stars">
                {[1, 2, 3, 4, 5].map((s) => <Icon key={s} name="star" size={18} />)}
              </span>
              <span className="rev-count">بناءً على {product.reviewCount} تقييم موثّق</span>
              <div className="rev-bars">
                {PDP_RATING_BARS.map(([stars, pct]) => (
                  <div className="rev-bar" key={stars}>
                    <span className="ltr">{stars}</span>
                    <span className="track"><span className="fill" style={{ width: pct + '%' }}></span></span>
                    <span className="pct">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rev-list">
              {PDP_REVIEWS.map((r) => (
                <article className="rev-card" key={r.name}>
                  <div className="rev-head">
                    <span className="rev-avatar">{r.initial}</span>
                    <div>
                      <div className="rev-name">{r.name}</div>
                      <div className="rev-meta">{r.date} · <span className="rev-verified"><Icon name="check" size={11} /> شراء موثّق</span></div>
                    </div>
                  </div>
                  <span className="rev-stars">
                    {[1, 2, 3, 4, 5].map((s) => <Icon key={s} name="star" size={13} style={{ opacity: s <= r.rating ? 1 : .25 }} />)}
                  </span>
                  <p className="rev-text">{r.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <ProductCarousel title="منتجات مشابهة" products={pickProducts(1, 10)} {...carouselProps} />
      </main>

      <Footer onToast={toast} />
      <PdpToasts items={toasts} />
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PdpApp />);
