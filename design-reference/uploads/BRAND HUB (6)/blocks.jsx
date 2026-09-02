/* ───────────────── BRANDHUB · offer + feature blocks ───────────────── */

/* shared smooth horizontal scroller hook */
function useScroller() {
  const ref = React.useRef(null);
  const scroll = (dir) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 720), behavior: 'smooth' });
  };
  return [ref, scroll];
}

/* §5.5 — Shop-by-Category (square tiles, light surface) */
function CategoryScroller({ onToast }) {
  const [ref, scroll] = useScroller();
  return (
    <section className="cat-tiles">
      <div className="sec-head">
        <h2>تسوّق حسب الفئة</h2>
        <a className="view-all" href="#" onClick={(e) => { e.preventDefault(); onToast('كل الفئات'); }}>
          عرض الكل <Icon name="chev-left" size={16} />
        </a>
      </div>
      <div className="sq-wrap">
        <div className="sq-row" ref={ref}>
          {SHOP_CATEGORIES.map((c) => (
            <a className="sq-item" key={c.name} href="#" onClick={(e) => { e.preventDefault(); onToast(c.name); }}>
              <span className="sq-thumb"><Placeholder label="" style={{ background: `repeating-linear-gradient(135deg, ${c.tone} 0 11px, rgba(26,26,46,0.05) 11px 22px)` }} /></span>
              <span className="sq-name">{c.name}</span>
              <span className="sq-count"><span className="ltr">{c.count}</span> منتج</span>
            </a>
          ))}
        </div>
        <button className="circ-nav prev" onClick={() => scroll(1)} aria-label="السابق"><Icon name="chev-right" size={20} /></button>
        <button className="circ-nav next" onClick={() => scroll(-1)} aria-label="التالي"><Icon name="chev-left" size={20} /></button>
      </div>
    </section>
  );
}



/* §5.6 — Offers showcase: 1 featured + 2 side cards */
const OFFER_FEATURE = {
  eyebrow: 'A2 Series · إصدار خاص',
  title: 'يد تحكم للألعاب بإصدار محدود',
  desc: 'ألوان حصرية مع أزرار خلفية قابلة للبرمجة وبطارية تدوم 40 ساعة',
  pill: 'قطع محدودة',
  price: 18.750, old: 25.000, sold: 76,
};
const OFFER_SIDE = [
  { eyebrow: 'A2 Series · إصدار خاص', title: 'سماعة حصرية بخاصية عزل الضوضاء', price: 38.900, old: 54.000, discount: '28%', tone: '#FCEEF3' },
  { eyebrow: 'العناية والجمال', title: 'مجموعة فيتامين سي للعناية بالبشرة', price: 15.200, old: 21.000, discount: '28%', tone: '#E3F5EF' },
];
function PromoBanners({ onToast }) {
  const f = OFFER_FEATURE;
  return (
    <section className="offer-grid">
      <div className="offer-feature">
        <span className="offer-deco d1"></span>
        <span className="offer-deco d2"></span>
        <div className="offer-f-body">
          <span className="offer-eyebrow">{f.eyebrow}</span>
          <h3 className="offer-f-title">{f.title}</h3>
          <p className="offer-f-desc">{f.desc}</p>
          <span className="offer-pill"><span className="dot"></span>{f.pill}</span>
          <div className="offer-f-price">
            <span className="amt ltr">{formatPrice(f.price)}</span>
            <span className="cur">{CURRENCY}</span>
            <span className="old ltr">{formatPrice(f.old)}</span>
          </div>
          <div className="offer-progress"><span style={{ width: f.sold + '%' }}></span></div>
          <span className="offer-progress-lbl">تم بيع <b className="ltr">{f.sold}%</b> من الكمية</span>
          <button className="offer-f-cta" onClick={() => onToast(f.title)}>
            تسوّق الآن <Icon name="arrow-left" size={16} />
          </button>
        </div>
        <div className="offer-f-img"><Placeholder label="featured product" circle /></div>
      </div>
      {OFFER_SIDE.map((s) => (
        <div className="offer-side" key={s.title} onClick={() => onToast(s.title)}>
          <div className="offer-s-body">
            <span className="offer-eyebrow">{s.eyebrow}</span>
            <h3 className="offer-s-title">{s.title}</h3>
            <div className="offer-s-price">
              <span className="amt ltr">{formatPrice(s.price)}</span>
              <span className="cur">{CURRENCY}</span>
              <span className="old ltr">{formatPrice(s.old)}</span>
              <span className="disc-pill">خصم {s.discount}</span>
            </div>
            <a className="offer-s-cta" href="#" onClick={(e) => { e.preventDefault(); onToast(s.title); }}>
              تسوّق الآن <Icon name="arrow-left" size={14} />
            </a>
          </div>
          <div className="offer-s-img">
            <Placeholder label="product" style={{ background: `repeating-linear-gradient(135deg, ${s.tone} 0 11px, rgba(26,26,46,0.05) 11px 22px)` }} />
          </div>
        </div>
      ))}
    </section>
  );
}

/* §5.7 — Flash Sale with live countdown */
function FlashSale({ onToast }) {
  const [t, setT] = React.useState({ d: 2, h: 6, m: 35, s: 48 });
  React.useEffect(() => {
    const id = setInterval(() => {
      setT((p) => {
        let { d, h, m, s } = p;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; d--; }
        if (d < 0) { d = h = m = s = 0; }
        return { d, h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (x) => String(x).padStart(2, '0');
  const boxes = [['DAYS', t.d], ['HOURS', t.h], ['MINUTES', t.m], ['SECONDS', t.s]];
  return (
    <section className="flash">
      <div className="flash-left">
        <h2>عرض حصري!</h2>
        <p className="thresh">احصل على خصم 20% عند الشراء بـ 120 {CURRENCY} أو أكثر!</p>
        <div className="countdown">
          {boxes.map(([lbl, val], idx) => (
            <React.Fragment key={lbl}>
              <div className="cd-box">
                <div className="cd-num ltr">{pad(val)}</div>
                <div className="cd-lbl">{lbl}</div>
              </div>
              {idx < 3 && <span className="cd-sep">:</span>}
            </React.Fragment>
          ))}
        </div>
        <button className="flash-cta" onClick={() => onToast('عرض حصري — تسوّق الآن')}>تسوّق الآن</button>
      </div>
      <div className="flash-right">
        <span className="deco" />
        <span className="prod"><Placeholder label="" circle /></span>
      </div>
    </section>
  );
}

/* §5.8 — Explore Collections */
function ExploreCollections({ onToast }) {
  const [ref, scroll] = useScroller();
  const [active, setActive] = React.useState(2);
  return (
    <section className="dark-panel collections" data-theme="dark">
      <h2>استكشف التشكيلات</h2>
      <div className="coll-wrap">
        <div className="coll-row" ref={ref}>
          {COLLECTIONS.map((c, idx) => (
            <div
              className={'coll-card' + (idx === active ? ' active' : '')}
              key={c}
              onClick={() => { setActive(idx); onToast(c); }}
            >
              <Placeholder label={`collection`} dark />
              <span className="coll-pill">{c}</span>
            </div>
          ))}
        </div>
        <button className="circ-nav prev" onClick={() => scroll(1)} aria-label="السابق"><Icon name="chev-right" size={20} /></button>
        <button className="circ-nav next" onClick={() => scroll(-1)} aria-label="التالي"><Icon name="chev-left" size={20} /></button>
      </div>
    </section>
  );
}

/* §5.9 — Dual Feature Banner */
function DualFeature({ onToast }) {
  const halves = [
    { title: 'الأكثر مبيعاً', key: 'best' },
    { title: 'وصل حديثاً', key: 'new' },
  ];
  return (
    <section className="dual">
      {halves.map((h) => (
        <div className="dual-half" key={h.key} onClick={() => onToast(h.title)}>
          <Placeholder label={h.key === 'best' ? 'bestsellers' : 'new arrivals'} dark />
          <div className="dual-content">
            <h3>{h.title}</h3>
            <a className="dual-link" href="#" onClick={(e) => { e.preventDefault(); onToast(h.title); }}>تسوّق الآن</a>
          </div>
        </div>
      ))}
    </section>
  );
}

Object.assign(window, { useScroller, CategoryScroller, PromoBanners, FlashSale, ExploreCollections, DualFeature });
