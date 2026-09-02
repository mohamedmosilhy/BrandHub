/* ───────────────── BRANDHUB · Wishlist page ───────────────── */

const WISH_INITIAL = pickProducts(2, 8);

function WishlistApp() {
  const [toasts, toast] = useToasts();
  const [items, setItems] = React.useState(WISH_INITIAL);
  const [cart, setCart] = React.useState(0);

  const removeOne = (p) => {
    setItems((prev) => prev.filter((it) => it.id !== p.id));
    toast('أُزيل من المفضلة');
  };
  const addToCart = (p) => { setCart((c) => c + 1); toast('أُضيف إلى العربة'); };
  const moveAll = () => {
    setCart((c) => c + items.length);
    toast('نُقلت كل المنتجات إلى العربة');
    setItems([]);
  };

  const carouselProps = {
    wishlist: {}, onWish: () => toast('أُضيف إلى المفضلة'),
    onAdd: () => addToCart({}), fulfilLabel: 'هَب اكسبريس', onToast: toast,
  };

  return (
    <React.Fragment>
      <Header cartCount={cart} wishCount={items.length} onToast={toast} />

      <main className="container page-stack">
        <nav className="crumbs">
          <a href="BRANDHUB Storefront.html">الرئيسية</a><span className="sep">/</span>
          <span className="here">المفضلة</span>
        </nav>

        <div className="wish-toolbar">
          <div className="page-head">
            <h1>المفضلة<span className="n">({items.length} {items.length === 1 ? 'منتج' : 'منتجات'})</span></h1>
          </div>
          {items.length > 0 && (
            <div className="spacer" style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button className="btn-pill accent" onClick={moveAll}><Icon name="cart" size={17} /> أضف الكل إلى العربة</button>
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <span className="big-ic"><Icon name="heart" size={64} strokeWidth={1.2} /></span>
            <h2>قائمة المفضلة فارغة</h2>
            <p>احفظ المنتجات التي تعجبك هنا لتعود إليها لاحقاً</p>
            <a className="btn-primary" href="BRANDHUB Storefront.html">اكتشف المنتجات</a>
          </div>
        ) : (
          <div className="product-grid">
            {items.map((p, idx) => (
              <ProductCard
                key={p.id + '-' + idx}
                product={p}
                isWished={true}
                onWish={removeOne}
                onAdd={addToCart}
                fulfilLabel="هَب اكسبريس"
              />
            ))}
          </div>
        )}

        <ProductCarousel title="قد يعجبك أيضاً" products={pickProducts(12, 10)} {...carouselProps} />
      </main>

      <Footer onToast={toast} />
      <Toasts items={toasts} />
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<WishlistApp />);
