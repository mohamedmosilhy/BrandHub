/* ───────────────── BRANDHUB · Hero + Influencers (flush) ───────────────── */

const HERO_SLIDES = [
  { eyebrow: 'تشكيلة الموسم', title: 'أناقة تواكب كل لحظاتك', sub: 'اكتشف أحدث الإطلالات بخصومات تصل إلى 40%', cta: 'تسوّق الآن', dark: false, img: 'assets/hero-1.jpg' },
  { eyebrow: 'إلكترونيات', title: 'تقنية ذكية لحياة أسهل', sub: 'أجهزة وملحقات مختارة بعناية', cta: 'استكشف العروض', dark: true, img: 'assets/hero-2.jpg' },
  { eyebrow: 'البيت والمطبخ', title: 'لمسة تجدّد منزلك', sub: 'كل ما تحتاجه لمساحة أجمل', cta: 'تسوّق التشكيلة', dark: false, img: 'assets/hero-3.jpg' },
];

function Hero() {
  const [i, setI] = React.useState(0);
  const n = HERO_SLIDES.length;
  const go = (d) => setI((p) => (p + d + n) % n);
  React.useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % n), 6000);
    return () => clearInterval(t);
  }, [n]);

  return (
    <div className="hero">
      <div className="hero-track" style={{ transform: `translateX(${i * 100}%)` }}>
        {HERO_SLIDES.map((s, idx) => (
          <div className="hero-slide" key={idx}>
            <img className="hero-img" src={s.img} alt="" loading={idx === 0 ? 'eager' : 'lazy'} />
            <div className="hero-overlay">
              <span className="eyebrow">{s.eyebrow}</span>
              <h1>{s.title}</h1>
              <p>{s.sub}</p>
              <a className="hero-cta" href="#" onClick={(e) => e.preventDefault()}>
                {s.cta} <Icon name="arrow-left" size={18} />
              </a>
            </div>
          </div>
        ))}
      </div>
      <button className="hero-nav prev" onClick={() => go(-1)} aria-label="السابق"><Icon name="chev-right" size={22} /></button>
      <button className="hero-nav next" onClick={() => go(1)} aria-label="التالي"><Icon name="chev-left" size={22} /></button>
      <div className="hero-dots">
        {HERO_SLIDES.map((_, idx) => (
          <button key={idx} className={'hero-dot' + (idx === i ? ' active' : '')} onClick={() => setI(idx)} aria-label={`شريحة ${idx + 1}`} />
        ))}
      </div>
    </div>
  );
}

function Influencers({ onToast }) {
  const ref = React.useRef(null);
  const scroll = (dir) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 720), behavior: 'smooth' });
  };
  return (
    <section className="influencers">
      <div className="sec-head">
        <h2>المؤثرون المميزون <span className="inf-total ltr">({INFLUENCERS.length}/{INFLUENCERS_TOTAL}+)</span></h2>
        <a className="view-all" href="#" onClick={(e) => { e.preventDefault(); onToast('عرض كل المؤثرين'); }}>
          عرض الكل <Icon name="chev-left" size={16} />
        </a>
      </div>
      <div className="inf-wrap">
        <div className="inf-row" ref={ref}>
          {INFLUENCERS.map((inf) => (
            <a className="inf-card" key={inf.handle} href="#" onClick={(e) => { e.preventDefault(); onToast(inf.name); }}>
              <span className="inf-ring"><Placeholder label="" circle /></span>
              <span className="inf-name">{inf.name}</span>
              <span className="inf-handle">{inf.handle}</span>
              <span className="inf-followers"><span className="ltr">{inf.followers}</span> متابع</span>
            </a>
          ))}
          <a className="inf-card inf-more" href="#" onClick={(e) => { e.preventDefault(); onToast('عرض كل المؤثرين'); }}>
            <span className="inf-ring inf-ring-more"><span className="inf-more-num ltr">+{INFLUENCERS_TOTAL - INFLUENCERS.length}</span></span>
            <span className="inf-name">قريباً</span>
          </a>
        </div>
        <button className="inf-nav prev" onClick={() => scroll(1)} aria-label="السابق"><Icon name="chev-right" size={20} /></button>
        <button className="inf-nav next" onClick={() => scroll(-1)} aria-label="التالي"><Icon name="chev-left" size={20} /></button>
      </div>
    </section>
  );
}

Object.assign(window, { Hero, Influencers });
