/* ───────────────── BRANDHUB · Product Card + Carousel ───────────────── */

function ProductCard({ product, isWished, onWish, onAdd, fulfilLabel }) {
  const [added, setAdded] = React.useState(false);
  const [imgIdx, setImgIdx] = React.useState(0);
  const VIEWS = 3;
  const add = () => {
    onAdd(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1100);
  };
  // RTL: sweep right→left across the image flips through the views
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    setImgIdx(Math.min(VIEWS - 1, Math.max(0, Math.floor((1 - x) * VIEWS))));
  };
  return (
    <article className="card">
      <div className="card-img" onMouseMove={onMove} onMouseLeave={() => setImgIdx(0)} onClick={() => { window.location.href = 'BRANDHUB Product.html'; }} style={{ cursor: 'pointer' }}>
        <div className="cimg-track" style={{ transform: `translateX(${imgIdx * 100}%)` }}>
          <div className="cimg-view"><img className="cimg-photo" src={product.img} alt={product.title} loading="lazy" /></div>
          <div className="cimg-view zoom"><img className="cimg-photo" src={product.img} alt="" loading="lazy" /></div>
          <div className="cimg-view" style={{ background: product.tone }}><img className="cimg-photo" src={product.img} alt="" loading="lazy" /></div>
        </div>
        <div className="cimg-dots">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              className={'cimg-dot' + (i === imgIdx ? ' active' : '')}
              onClick={(e) => { e.stopPropagation(); setImgIdx(i); }}
              aria-label={`صورة ${i + 1}`}
            ></button>
          ))}
        </div>
        {product.badge && <span className="card-badge">{product.badge}</span>}
        <button
          className={'card-wish' + (isWished ? ' on' : '')}
          onClick={(e) => { e.stopPropagation(); onWish(product); }}
          aria-label="أضف إلى المفضلة"
        ><Icon name="heart" size={18} /></button>
        <button
          className={'card-atc' + (added ? ' added' : '')}
          onClick={(e) => { e.stopPropagation(); add(); }}
          aria-label="أضف إلى العربة"
        ><Icon name={added ? 'check' : 'plus'} size={20} /></button>
      </div>

      <div className="card-info">
        <h3 className="card-title"><a href="BRANDHUB Product.html">{product.title}</a></h3>

        <div className="card-rating ltr">
          <Icon name="star" size={14} className="star" />
          <span>{product.rating.toFixed(1)}</span>
          <span className="count">({product.reviewCount})</span>
        </div>

        <div className="card-price">
          <span className="amt ltr">{formatPrice(product.price)}</span>
          <span className="cur">{CURRENCY}</span>
          {product.oldPrice && <span className="old ltr">{formatPrice(product.oldPrice)}</span>}
          {product.discount && <span className="disc-pill">خصم {product.discount}</span>}
        </div>

        {product.nudge && (
          <span className="card-nudge"><span className="dot"></span>{product.nudge}</span>
        )}
        {product.express && (
          <span className="card-fulfil"><span className="fulfil-ic"><Icon name="truck" size={14} /></span> {fulfilLabel}</span>
        )}
      </div>
    </article>
  );
}

function ProductCarousel({ title, products, wishlist, onWish, onAdd, fulfilLabel, onToast }) {
  const rowRef = React.useRef(null);
  const scroll = (dir) => {
    const el = rowRef.current;
    if (el) el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 700), behavior: 'smooth' });
  };
  return (
    <section className="pcarousel">
      <div className="sec-head">
        <h2>{title}</h2>
        <a className="view-all" href="#" onClick={(e) => { e.preventDefault(); onToast('عرض كل: ' + title); }}>
          عرض الكل <Icon name="chev-left" size={16} />
        </a>
      </div>
      <div className="pc-wrap">
        <div className="pc-row" ref={rowRef}>
          {products.map((p, idx) => (
            <ProductCard
              key={p.id + '-' + idx}
              product={p}
              isWished={!!wishlist[p.id]}
              onWish={onWish}
              onAdd={onAdd}
              fulfilLabel={fulfilLabel}
            />
          ))}
        </div>
        {/* RTL: prev arrow sits on the right, scrolls content rightward (positive) */}
        <button className="pc-nav prev" onClick={() => scroll(1)} aria-label="السابق"><Icon name="chev-right" size={20} /></button>
        <button className="pc-nav next" onClick={() => scroll(-1)} aria-label="التالي"><Icon name="chev-left" size={20} /></button>
      </div>
    </section>
  );
}

Object.assign(window, { ProductCard, ProductCarousel });
