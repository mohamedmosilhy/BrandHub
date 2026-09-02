/* ───────────────── BRANDHUB · Search & category listing ───────────────── */

const SR_CATEGORIES = [
  { name: 'الإلكترونيات', count: 248 },
  { name: 'السماعات وملحقاتها', count: 64 },
  { name: 'الساعات الذكية', count: 38 },
  { name: 'الإكسسوارات', count: 92 },
  { name: 'أجهزة منزلية', count: 54 },
];
const SR_BRANDS = [
  { name: 'A2 Series', count: 31 },
  { name: 'الستور الرسمي', count: 86 },
  { name: 'علامات مختارة', count: 120 },
];
const SR_SORTS = [
  { v: 'rel', t: 'الأكثر صلة' },
  { v: 'price-asc', t: 'السعر: من الأقل' },
  { v: 'price-desc', t: 'السعر: من الأعلى' },
  { v: 'rating', t: 'الأعلى تقييماً' },
  { v: 'new', t: 'الأحدث' },
];

function Check({ on, onClick, children, count }) {
  return (
    <button type="button" className={'check' + (on ? ' on' : '')} onClick={onClick}>
      <span className="box">{on && <Icon name="check" size={13} strokeWidth={3} />}</span>
      <span>{children}</span>
      {count != null && <span className="ct">{count}</span>}
    </button>
  );
}

function SearchApp() {
  const [toasts, toast] = useToasts();
  const [cart, setCart] = React.useState(0);
  const [wishlist, setWishlist] = React.useState({});
  const [cats, setCats] = React.useState({});
  const [brands, setBrands] = React.useState({});
  const [minRating, setMinRating] = React.useState(0);
  const [express, setExpress] = React.useState(false);
  const [discounted, setDiscounted] = React.useState(false);
  const [price, setPrice] = React.useState({ min: '', max: '' });
  const [sort, setSort] = React.useState('rel');

  const query = 'سماعات وأجهزة صوت';

  const toggle = (setter) => (key) => setter((p) => { const n = { ...p }; n[key] ? delete n[key] : (n[key] = true); return n; });
  const toggleCat = toggle(setCats);
  const toggleBrand = toggle(setBrands);

  const addToCart = (p) => { setCart((c) => c + 1); toast('أُضيف إلى العربة'); };
  const toggleWish = (p) => setWishlist((w) => { const n = { ...w }; n[p.id] ? delete n[p.id] : (n[p.id] = true); toast(n[p.id] ? 'أُضيف إلى المفضلة' : 'أُزيل من المفضلة'); return n; });

  // active functional filters
  let list = PRODUCTS.filter((p) => {
    if (express && !p.express) return false;
    if (discounted && !p.discount) return false;
    if (minRating && p.rating < minRating) return false;
    if (price.min && p.price < parseFloat(price.min)) return false;
    if (price.max && p.price > parseFloat(price.max)) return false;
    return true;
  });
  list = [...list].sort((a, b) => {
    if (sort === 'price-asc') return a.price - b.price;
    if (sort === 'price-desc') return b.price - a.price;
    if (sort === 'rating') return b.rating - a.rating;
    return 0;
  });

  const chips = [];
  Object.keys(cats).forEach((c) => chips.push({ k: 'c:' + c, t: c, clear: () => toggleCat(c) }));
  Object.keys(brands).forEach((b) => chips.push({ k: 'b:' + b, t: b, clear: () => toggleBrand(b) }));
  if (express) chips.push({ k: 'exp', t: 'هَب اكسبريس', clear: () => setExpress(false) });
  if (discounted) chips.push({ k: 'disc', t: 'عليها خصم', clear: () => setDiscounted(false) });
  if (minRating) chips.push({ k: 'rate', t: minRating + '★ فأعلى', clear: () => setMinRating(0) });
  if (price.min || price.max) chips.push({ k: 'price', t: `${price.min || '0'}–${price.max || '∞'} ${CURRENCY}`, clear: () => setPrice({ min: '', max: '' }) });

  const clearAll = () => { setCats({}); setBrands({}); setMinRating(0); setExpress(false); setDiscounted(false); setPrice({ min: '', max: '' }); };

  return (
    <React.Fragment>
      <Header cartCount={cart} wishCount={Object.keys(wishlist).length} onToast={toast} />

      <main className="container page-stack">
        <nav className="crumbs">
          <a href="BRANDHUB Storefront.html">الرئيسية</a><span className="sep">/</span>
          <a href="#" onClick={(e) => { e.preventDefault(); toast('الإلكترونيات'); }}>الإلكترونيات</a><span className="sep">/</span>
          <span className="here">نتائج البحث</span>
        </nav>

        <div className="page-head">
          <h1>نتائج البحث عن: «{query}»</h1>
          <span className="sub">عرض منتجات متوفّرة للتوصيل في مسقط</span>
        </div>

        <div className="listing-grid">
          {/* filters */}
          <aside className="filters">
            <div className="f-head"><Icon name="sliders" size={18} /> التصفية
              {chips.length > 0 && <button className="f-clear" onClick={clearAll}>مسح الكل</button>}
            </div>

            <div className="fgroup" style={{ borderTop: 'none', paddingTop: 0 }}>
              <h4>الفئة</h4>
              {SR_CATEGORIES.map((c) => (
                <Check key={c.name} on={!!cats[c.name]} onClick={() => toggleCat(c.name)} count={c.count}>{c.name}</Check>
              ))}
            </div>

            <div className="fgroup">
              <h4>نطاق السعر ({CURRENCY})</h4>
              <div className="price-range">
                <input type="number" placeholder="من" value={price.min} onChange={(e) => setPrice((p) => ({ ...p, min: e.target.value }))} />
                <span className="dash">—</span>
                <input type="number" placeholder="إلى" value={price.max} onChange={(e) => setPrice((p) => ({ ...p, max: e.target.value }))} />
              </div>
            </div>

            <div className="fgroup">
              <h4>التقييم</h4>
              {[4, 3, 2].map((r) => (
                <Check key={r} on={minRating === r} onClick={() => setMinRating(minRating === r ? 0 : r)}>
                  <span className="stars-opt">{[1,2,3,4,5].map((s) => <Icon key={s} name="star" size={13} style={{ opacity: s <= r ? 1 : .25 }} />)}</span> فأعلى
                </Check>
              ))}
            </div>

            <div className="fgroup">
              <h4>العلامة التجارية</h4>
              {SR_BRANDS.map((b) => (
                <Check key={b.name} on={!!brands[b.name]} onClick={() => toggleBrand(b.name)} count={b.count}>{b.name}</Check>
              ))}
            </div>

            <div className="fgroup">
              <h4>خيارات التوصيل والعروض</h4>
              <div className="switch-row">
                <span className="sw-lbl">هَب اكسبريس فقط</span>
                <button type="button" className={'switch' + (express ? ' on' : '')} onClick={() => setExpress((v) => !v)} aria-label="هَب اكسبريس"><span className="knob"></span></button>
              </div>
              <div className="switch-row">
                <span className="sw-lbl">المنتجات المخفّضة</span>
                <button type="button" className={'switch' + (discounted ? ' on' : '')} onClick={() => setDiscounted((v) => !v)} aria-label="المخفّضة"><span className="knob"></span></button>
              </div>
            </div>
          </aside>

          {/* results */}
          <div className="listing-main">
            <div className="listing-bar">
              <span className="res-count"><b>{list.length}</b> منتج</span>
              <div className="sort-wrap">
                <label htmlFor="sort">ترتيب حسب</label>
                <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                  {SR_SORTS.map((s) => <option key={s.v} value={s.v}>{s.t}</option>)}
                </select>
              </div>
            </div>

            {chips.length > 0 && (
              <div className="chip-row">
                {chips.map((c) => (
                  <span className="fchip" key={c.k}>{c.t}<button onClick={c.clear} aria-label="إزالة"><Icon name="x" size={12} strokeWidth={2.6} /></button></span>
                ))}
              </div>
            )}

            {list.length === 0 ? (
              <div className="empty-state">
                <span className="big-ic"><Icon name="search" size={56} strokeWidth={1.2} /></span>
                <h2>لا توجد نتائج مطابقة</h2>
                <p>جرّب توسيع نطاق السعر أو إزالة بعض عوامل التصفية</p>
                <button className="btn-primary" onClick={clearAll}>مسح عوامل التصفية</button>
              </div>
            ) : (
              <div className="product-grid">
                {list.map((p) => (
                  <ProductCard key={p.id} product={p} isWished={!!wishlist[p.id]} onWish={toggleWish} onAdd={addToCart} fulfilLabel="هَب اكسبريس" />
                ))}
              </div>
            )}

            {list.length > 0 && <button className="btn-pill load-more" onClick={() => toast('تحميل المزيد من المنتجات')}>تحميل المزيد</button>}
          </div>
        </div>
      </main>

      <Footer onToast={toast} />
      <Toasts items={toasts} />
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<SearchApp />);
