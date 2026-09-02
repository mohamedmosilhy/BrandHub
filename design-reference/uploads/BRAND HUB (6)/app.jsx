/* ───────────────── BRANDHUB · App (assembly + state + tweaks) ───────────────── */

const FULFIL_LABEL = 'هَب اكسبريس';

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": ["#7F77DD", "#6860CC"],
  "gradient": ["#7F77DD", "#D4537E"]
}/*EDITMODE-END*/;

const ACCENT_OPTIONS = [
  ["#7F77DD", "#6860CC"], // purple (brand)
  ["#2F8FA6", "#277789"], // teal
  ["#C26646", "#A8543A"], // terracotta
  ["#3E8E5A", "#33744A"], // green
];
const GRADIENT_OPTIONS = [
  ["#7F77DD", "#D4537E"], // purple → pink (brand)
  ["#7F77DD", "#2F8FA6"], // purple → teal
  ["#C26646", "#E0A04B"], // terracotta → gold
  ["#3E8E5A", "#7F77DD"], // green → purple
];

function Toasts({ items }) {
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

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [cart, setCart] = React.useState(0);
  const [wishlist, setWishlist] = React.useState({});
  const [toasts, setToasts] = React.useState([]);

  // apply accent + gradient tweaks to CSS vars
  React.useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty('--color-accent', t.accent[0]);
    r.setProperty('--color-accent-hover', t.accent[1] || t.accent[0]);
    r.setProperty('--gradient-brand', `linear-gradient(135deg, ${t.gradient[0]} 0%, ${t.gradient[1]} 100%)`);
  }, [t.accent, t.gradient]);

  const toast = React.useCallback((msg) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 1900);
  }, []);

  const addToCart = (p) => { setCart((c) => c + 1); toast('أُضيف إلى العربة'); };
  const toggleWish = (p) => {
    setWishlist((w) => {
      const next = { ...w };
      if (next[p.id]) { delete next[p.id]; toast('أُزيل من المفضلة'); }
      else { next[p.id] = true; toast('أُضيف إلى المفضلة'); }
      return next;
    });
  };
  const wishCount = Object.keys(wishlist).length;

  const carouselProps = { wishlist, onWish: toggleWish, onAdd: addToCart, fulfilLabel: FULFIL_LABEL, onToast: toast };

  return (
    <React.Fragment>
      <Header cartCount={cart} wishCount={wishCount} onToast={toast} />

      <main className="container body-stack">
        {/* hero + influencers — flush, one connected shell */}
        <div className="flush-unit">
          <Hero />
          <Influencers onToast={toast} />
        </div>

        <CategoryScroller onToast={toast} />
        <ProductCarousel title="الأكثر مبيعاً" products={pickProducts(0, 10)} {...carouselProps} />
        <PromoBanners onToast={toast} />
        <ProductCarousel title="وصل حديثاً" products={pickProducts(5, 10)} {...carouselProps} />
        <FlashSale onToast={toast} />
        <ProductCarousel title="عروض اليوم" products={pickProducts(9, 10)} {...carouselProps} />
        <ExploreCollections onToast={toast} />
        <ProductCarousel title="الإلكترونيات" products={pickProducts(2, 10)} {...carouselProps} />
        <DualFeature onToast={toast} />
        <ProductCarousel title="مقترحة لك" products={pickProducts(7, 10)} {...carouselProps} />
      </main>

      <Footer onToast={toast} />

      <Toasts items={toasts} />

      <TweaksPanel>
        <TweakSection label="هوية العلامة" />
        <TweakColor
          label="اللون الأساسي"
          value={t.accent}
          options={ACCENT_OPTIONS}
          onChange={(v) => setTweak('accent', v)}
        />
        <TweakColor
          label="تدرّج العلامة"
          value={t.gradient}
          options={GRADIENT_OPTIONS}
          onChange={(v) => setTweak('gradient', v)}
        />
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
