/* ───────────── BRANDHUB · App home — LIVE full page ─────────────
   The complete storefront home as a real scrollable screen (not a canvas comp).
   Loads after data.jsx, icons.jsx, ios-frame.jsx, app-screens.jsx, tweaks-panel.jsx.
   Reuses BH, MPh, MAvatar, MIco, MStories, IOSStatusBar from those files. */

/* ── tweaks ──────────────────────────────────────────────────── */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#7F77DD",
  "showStories": true,
  "heroAuto": true,
  "dealsPanel": "داكن"
}/*EDITMODE-END*/;

const BH_ACCENTS = {
  '#7F77DD': { accentDark: '#6860CC', accentLight: '#EEEDF9' },
  '#D4537E': { accentDark: '#BE4570', accentLight: '#FCEEF3' },
  '#3D7ECC': { accentDark: '#3169B0', accentLight: '#E8F1F8' },
  '#2E9E83': { accentDark: '#268A71', accentLight: '#E3F5EF' },
};
function applyAccent(hex) {
  const e = BH_ACCENTS[hex] || BH_ACCENTS['#7F77DD'];
  BH.accent = hex;
  BH.accentDark = e.accentDark;
  BH.accentLight = e.accentLight;
  BH.gradient = `linear-gradient(135deg, ${hex} 0%, ${hex === '#D4537E' ? '#7F77DD' : '#D4537E'} 100%)`;
}

/* ── shared bits ─────────────────────────────────────────────── */
function LRail({ children, gap = 10 }) {
  return (
    <div className="bh-rail" style={{ display: 'flex', gap, padding: '0 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
      {children}
    </div>
  );
}

function LSecHead({ title, all = 'عرض الكل', onDark = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', padding: '0 16px', marginBottom: 10 }}>
      <span style={{ fontFamily: BH.font, fontSize: 16, fontWeight: 800, color: onDark ? '#fff' : BH.ink }}>{title}</span>
      {all && (
        <span style={{ marginInlineStart: 'auto', fontFamily: BH.font, fontSize: 11, fontWeight: 700, color: onDark ? '#fff' : BH.accent, display: 'inline-flex', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
          {all} <Icon name="chev-left" size={12} />
        </span>
      )}
    </div>
  );
}

/* ── interactive product card (heart toggle) ─────────────────── */
function LProdCard({ p, w = 158, flexFill = false, liked, onLike }) {
  return (
    <div style={{
      width: flexFill ? undefined : w, flex: flexFill ? 1 : '0 0 auto',
      background: BH.surface, border: `1px solid ${BH.border}`, borderRadius: 16,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ position: 'relative' }}>
        <MPh label="product" style={{ height: 132, background: `repeating-linear-gradient(135deg, ${p.tone} 0 11px, rgba(26,26,46,0.05) 11px 22px)` }} />
        {p.discount && (
          <span style={{ position: 'absolute', top: 8, insetInlineStart: 8, background: BH.ink, color: '#fff', fontSize: 9, fontWeight: 600, borderRadius: 99, padding: '3px 8px', fontFamily: BH.font }}>خصم {p.discount}</span>
        )}
        <span
          onClick={() => onLike(p.id)}
          style={{ position: 'absolute', top: 8, insetInlineEnd: 8, width: 30, height: 30, borderRadius: '50%', background: '#fff', color: liked ? BH.pink : BH.textSec, display: 'grid', placeItems: 'center', boxShadow: '0 1px 3px rgba(26,26,46,.12)', cursor: 'pointer' }}
        >
          <Icon name="heart" size={15} style={liked ? { fill: BH.pink, color: BH.pink } : undefined} />
        </span>
      </div>
      <div style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontFamily: BH.font, fontSize: 11, color: BH.ink, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.9em' }}>{p.title}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: BH.latin, fontSize: 10, color: BH.textSec, direction: 'ltr', alignSelf: 'flex-end' }}>
          <Icon name="star" size={11} style={{ color: '#E6A817' }} /> {p.rating.toFixed(1)} <span style={{ color: BH.textMuted }}>({p.reviewCount})</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: BH.latin, fontSize: 14.5, fontWeight: 700, color: BH.ink, direction: 'ltr' }}>{formatPrice(p.price)}</span>
          <span style={{ fontFamily: BH.font, fontSize: 9, color: BH.textSec }}>{CURRENCY}</span>
          {p.oldPrice && <span style={{ fontFamily: BH.latin, fontSize: 10.5, color: BH.textMuted, textDecoration: 'line-through', direction: 'ltr' }}>{formatPrice(p.oldPrice)}</span>}
        </div>
        {p.express && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start', fontFamily: BH.font, fontSize: 9, fontWeight: 600, color: BH.accent, background: BH.accentLight, borderRadius: 99, padding: '2px 8px' }}>
            <Icon name="truck" size={11} /> هَب اكسبريس
          </span>
        )}
      </div>
    </div>
  );
}

/* ── hero slider (auto-rotating, clickable dots) ─────────────── */
function HeroSlider({ auto }) {
  const slides = [
    { tag: 'تشكيلة الموسم', title: 'أناقة تواكب كل لحظاتك — خصومات حتى 40%', cta: 'تسوّق الآن', bg: BH.gradient, ph: 'campaign' },
    { tag: 'هَب اكسبريس', title: 'توصيل بنفس اليوم داخل مسقط — اطلب قبل 2 ظهراً', cta: 'اكتشف المنتجات', bg: BH.ink, ph: 'express' },
    { tag: 'من المؤثرين', title: 'تسوّق إطلالات مؤثريك المفضّلين مباشرة', cta: 'شاهد المنشورات', bg: `linear-gradient(135deg, ${BH.pink} 0%, ${BH.accent} 100%)`, ph: 'influencer' },
  ];
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setI((v) => (v + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, [auto]);
  return (
    <div style={{ padding: '14px 16px 0' }}>
      <div style={{ borderRadius: 18, overflow: 'hidden' }}>
        <div style={{ display: 'flex', transform: `translateX(${i * 100}%)`, transition: 'transform .45s cubic-bezier(.4,0,.2,1)' }}>
          {slides.map((s) => (
            <div key={s.tag} style={{ flex: '0 0 100%', boxSizing: 'border-box', background: s.bg, color: '#fff', padding: '18px 18px', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', overflow: 'hidden', minHeight: 128 }}>
              <div style={{ position: 'absolute', width: 150, height: 150, borderRadius: '50%', border: '2px solid rgba(255,255,255,.22)', insetInlineStart: -45, top: -45 }}></div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
                <span style={{ fontSize: 10.5, opacity: .9, fontWeight: 600 }}>{s.tag}</span>
                <span style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.35 }}>{s.title}</span>
                <span style={{ alignSelf: 'flex-start', background: '#fff', color: BH.ink, fontSize: 11, fontWeight: 700, borderRadius: 99, padding: '5px 14px', marginTop: 2, cursor: 'pointer' }}>{s.cta}</span>
              </div>
              <MPh label={s.ph} style={{ width: 92, height: 92, borderRadius: '50%', border: '5px solid rgba(255,255,255,.35)', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 5, justifyContent: 'center', paddingTop: 8 }}>
        {slides.map((s, d) => (
          <span key={s.tag} onClick={() => setI(d)} style={{
            width: d === i ? 16 : 5, height: 5, borderRadius: 99, cursor: 'pointer',
            background: d === i ? BH.accent : '#C9C9D4', transition: 'width .3s',
          }}></span>
        ))}
      </div>
    </div>
  );
}

/* ── live countdown ──────────────────────────────────────────── */
function useCountdown(initial) {
  const [s, setS] = React.useState(initial);
  React.useEffect(() => {
    const id = setInterval(() => setS((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0'));
}

/* ── shoppable post with working add-to-cart ─────────────────── */
function LPost({ inf, i, product, imgH = 210, onAdd }) {
  const [liked, setLiked] = React.useState(false);
  return (
    <article style={{ background: BH.surface, borderTop: `1px solid ${BH.border}`, borderBottom: `1px solid ${BH.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px' }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', padding: 2, background: BH.gradient }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', padding: 1.5, background: '#fff', boxSizing: 'border-box' }}>
            <MAvatar name={inf.name} i={i} size={35} />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: BH.font, fontSize: 13, fontWeight: 700, color: BH.ink }}>{inf.name}</div>
          <div style={{ fontFamily: BH.latin, fontSize: 10.5, color: BH.textMuted, direction: 'ltr', textAlign: 'end' }}>{inf.handle} · {inf.followers}</div>
        </div>
        <span style={{ fontFamily: BH.font, fontSize: 11.5, fontWeight: 700, color: BH.accent, border: `1.5px solid ${BH.accent}`, borderRadius: 99, padding: '4px 14px', cursor: 'pointer' }}>متابعة</span>
      </div>
      <MPh label="influencer photo / video" style={{ height: imgH }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '10px 16px 4px', color: BH.ink }}>
        <span onClick={() => setLiked(!liked)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: BH.latin, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <Icon name="heart" size={21} style={liked ? { fill: BH.pink, color: BH.pink } : undefined} /> {liked ? '2.5K' : '2.4K'}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: BH.latin, fontSize: 12, fontWeight: 600 }}>
          <MIco name="comment" size={20} /> 86
        </span>
        <MIco name="send" size={20} />
        <span style={{ marginInlineStart: 'auto' }}><MIco name="bookmark" size={20} /></span>
      </div>
      <div style={{ margin: '8px 12px 12px', padding: 8, borderRadius: 14, background: BH.accentLight, display: 'flex', alignItems: 'center', gap: 10 }}>
        <MPh label="" style={{ width: 46, height: 46, borderRadius: 10, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: BH.font, fontSize: 11.5, fontWeight: 600, color: BH.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.title}</div>
          <div style={{ fontFamily: BH.latin, fontSize: 13, fontWeight: 700, color: BH.ink, direction: 'ltr', textAlign: 'end' }}>
            {formatPrice(product.price)} <span style={{ fontSize: 10, fontWeight: 500, color: BH.textSec }}>{CURRENCY}</span>
          </div>
        </div>
        <span onClick={onAdd} style={{ width: 38, height: 38, borderRadius: '50%', background: BH.accent, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, cursor: 'pointer' }}>
          <Icon name="cart" size={17} />
        </span>
      </div>
    </article>
  );
}

/* ── tab bar with live cart badge ────────────────────────────── */
function HomeTabBar({ cartCount }) {
  const items = [
    { key: 'home', icon: 'home', label: 'الرئيسية' },
    { key: 'cats', icon: 'grid', label: 'الفئات' },
    { key: 'inf', icon: 'star', label: 'المؤثرون' },
    { key: 'cart', icon: 'cart', label: 'العربة', badge: cartCount },
    { key: 'me', icon: 'user', label: 'حسابي' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', flexShrink: 0, background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(20px)', borderTop: `1px solid ${BH.border}`, padding: '10px 8px max(12px, env(safe-area-inset-bottom))' }}>
      {items.map((it) => {
        const on = it.key === 'home';
        return (
          <div key={it.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, color: on ? BH.accent : BH.textMuted }}>
              {it.icon === 'star'
                ? <Icon name="star" size={22} style={{ color: on ? BH.accent : 'transparent', stroke: on ? 'none' : BH.textMuted, strokeWidth: 1.8 }} />
                : <MIco name={it.icon} size={22} color={on ? BH.accent : BH.textMuted} />}
              {it.badge > 0 && (
                <span style={{ position: 'absolute', top: -4, insetInlineEnd: -8, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 99, background: BH.pink, color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: BH.latin, display: 'grid', placeItems: 'center', lineHeight: 1 }}>{it.badge}</span>
              )}
            </div>
            <span style={{ fontFamily: BH.font, fontSize: 10.5, fontWeight: on ? 700 : 500, color: on ? BH.accent : BH.textMuted }}>{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ════════ THE PAGE ═══════════════════════════════════════════ */
function AppHome() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  applyAccent(t.accent);

  const [likes, setLikes] = React.useState(() => new Set());
  const toggleLike = (id) => setLikes((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const [cartCount, setCartCount] = React.useState(3);
  const [toast, setToast] = React.useState(false);
  const toastTimer = React.useRef(null);
  const addToCart = () => {
    setCartCount((c) => c + 1);
    setToast(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(false), 1800);
  };
  const [h, m, s] = useCountdown(2 * 3600 + 6 * 60 + 35);

  const card = (p, w, flexFill) => (
    <LProdCard key={p.id} p={p} w={w} flexFill={flexFill} liked={likes.has(p.id)} onLike={toggleLike} />
  );
  const dealsDark = t.dealsPanel === 'داكن';

  return (
    <div className="bh-stage">
      <div className="bh-phone" dir="rtl" data-screen-label="الرئيسية — التطبيق" style={{ fontFamily: BH.font, position: 'relative' }}>

        <div className="bh-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none' }}>

          {/* sticky chrome: status + header + search */}
          <div style={{ position: 'sticky', top: 0, zIndex: 20, background: BH.surface, borderBottom: `1px solid ${BH.border}`, paddingBottom: 4 }}>
            <IOSStatusBar />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px 2px' }}>
              <span style={{ color: BH.accent, display: 'flex' }}><Icon name="pin" size={19} /></span>
              <div>
                <div style={{ fontSize: 10, color: BH.textMuted }}>التوصيل إلى</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: BH.ink, display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer' }}>مسقط — الخوض <Icon name="chev-down" size={12} /></div>
              </div>
              <span style={{ marginInlineStart: 'auto', fontFamily: BH.latin, fontSize: 18, fontWeight: 800, color: BH.ink }}>BRAND<span style={{ fontWeight: 500, color: BH.textSec }}>HUB</span></span>
              <span style={{ position: 'relative', color: BH.ink, marginInlineStart: 10, cursor: 'pointer' }}>
                <MIco name="bell" size={22} />
                <span style={{ position: 'absolute', top: 1, insetInlineEnd: 1, width: 8, height: 8, borderRadius: '50%', background: BH.pink, border: '1.5px solid #fff' }}></span>
              </span>
            </div>
            <div style={{ margin: '8px 16px 6px', display: 'flex', alignItems: 'center', gap: 8, background: BH.bg, border: `1px solid ${BH.border}`, borderRadius: 99, padding: '0 14px', height: 42, cursor: 'pointer' }}>
              <Icon name="search" size={18} style={{ color: BH.textMuted }} />
              <span style={{ fontSize: 12.5, color: BH.textMuted }}>عن ماذا تبحث؟</span>
              <span style={{ marginInlineStart: 'auto', width: 30, height: 30, borderRadius: '50%', background: BH.accent, color: '#fff', display: 'grid', placeItems: 'center' }}><Icon name="search" size={14} /></span>
            </div>
          </div>

          {/* stories rail */}
          {t.showStories && (
            <div className="bh-rail-wrap" style={{ background: BH.surface, paddingBlock: 8, borderBottom: `1px solid ${BH.border}` }}>
              <MStories size={58} count={13} />
            </div>
          )}

          {/* hero slider */}
          <HeroSlider auto={t.heroAuto} />

          {/* categories 4×2 */}
          <div style={{ paddingTop: 18 }}>
            <LSecHead title="تسوّق حسب الفئة" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, padding: '0 16px' }}>
              {SHOP_CATEGORIES.slice(0, 8).map((c) => (
                <div key={c.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <MPh label="" style={{ width: '100%', aspectRatio: '1', borderRadius: 14, background: `repeating-linear-gradient(135deg, ${c.tone} 0 9px, rgba(26,26,46,0.05) 9px 18px)`, border: `1px solid ${BH.border}` }} />
                  <span style={{ fontSize: 9.5, fontWeight: 600, color: BH.ink, textAlign: 'center', lineHeight: 1.3 }}>{c.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* flash deals — live countdown */}
          <div style={{ margin: '20px 16px 0', borderRadius: 20, background: dealsDark ? BH.ink : BH.gradient, padding: '16px 0', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', marginBottom: 12 }}>
              <span style={{ fontFamily: BH.font, fontSize: 16, fontWeight: 800, color: '#fff' }}>عروض اليوم</span>
              <div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,.65)', marginInlineEnd: 4 }}>ينتهي خلال</span>
                {[h, m, s].map((n, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 12 }}>:</span>}
                    <span style={{ fontFamily: BH.latin, fontSize: 12, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 6, padding: '3px 6px', direction: 'ltr' }}>{n}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <LRail>{[PRODUCTS[1], PRODUCTS[12], PRODUCTS[17], PRODUCTS[6], PRODUCTS[10]].map((p) => card(p, 150))}</LRail>
          </div>

          {/* featured offer */}
          <div style={{ margin: '14px 16px 0', borderRadius: 20, background: BH.gradient, color: '#fff', padding: 18, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'absolute', width: 170, height: 170, borderRadius: '50%', border: '2px solid rgba(255,255,255,.18)', bottom: -60, insetInlineStart: -50 }}></div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, position: 'relative' }}>
              <span style={{ fontFamily: BH.latin, fontSize: 9.5, fontWeight: 700, opacity: .9, letterSpacing: '.04em' }}>A2 SERIES · إصدار خاص</span>
              <span style={{ fontSize: 15.5, fontWeight: 800, lineHeight: 1.4 }}>يد تحكم للألعاب بإصدار محدود</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', background: '#fff', color: BH.ink, fontSize: 9.5, fontWeight: 700, borderRadius: 99, padding: '3px 10px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: BH.pink }}></span>قطع محدودة
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: BH.latin, fontSize: 19, fontWeight: 700, direction: 'ltr' }}>18.750</span>
                <span style={{ fontSize: 9.5, opacity: .85 }}>{CURRENCY}</span>
                <span style={{ fontFamily: BH.latin, fontSize: 11, opacity: .65, textDecoration: 'line-through', direction: 'ltr' }}>25.000</span>
              </div>
              <div style={{ width: '85%', height: 6, borderRadius: 99, background: 'rgba(255,255,255,.25)' }}>
                <div style={{ width: '76%', height: '100%', borderRadius: 99, background: '#fff' }}></div>
              </div>
              <span style={{ fontSize: 9, opacity: .85 }}>تم بيع 76% من الكمية</span>
            </div>
            <MPh label="product" style={{ width: 110, height: 110, borderRadius: '50%', border: '7px solid rgba(255,255,255,.35)', flexShrink: 0 }} />
          </div>

          {/* best sellers 2×2 */}
          <div style={{ paddingTop: 20 }}>
            <LSecHead title="الأكثر مبيعاً" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px' }}>
              {[PRODUCTS[0], PRODUCTS[8], PRODUCTS[5], PRODUCTS[2]].map((p) => card(p, undefined, true))}
            </div>
          </div>

          {/* influencers panel */}
          <div style={{ margin: '20px 16px 0', borderRadius: 20, background: BH.gradient, color: '#fff', padding: '16px 0', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', padding: '0 16px', marginBottom: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 800 }}>المؤثرون المميزون <span style={{ fontFamily: BH.latin, fontSize: 10, fontWeight: 600, opacity: .8 }}>(13/32+)</span></span>
              <span style={{ marginInlineStart: 'auto', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3, cursor: 'pointer' }}>عرض الكل <Icon name="chev-left" size={12} /></span>
            </div>
            <div className="bh-rail" style={{ display: 'flex', gap: 14, padding: '0 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {INFLUENCERS.map((inf, i) => (
                <div key={inf.handle} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0, width: 72, cursor: 'pointer' }}>
                  <div style={{ width: 68, height: 68, borderRadius: '50%', padding: 2.5, background: 'linear-gradient(135deg,#fff,rgba(255,255,255,.4))', boxSizing: 'border-box' }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', padding: 2, background: BH.ink, boxSizing: 'border-box' }}>
                      <MAvatar name={inf.name} i={i} size={59} />
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', lineHeight: 1.3 }}>{inf.name.split(' ')[0]}</span>
                  <span style={{ fontFamily: BH.latin, fontSize: 8.5, opacity: .75, direction: 'ltr' }}>{inf.followers} متابع</span>
                </div>
              ))}
            </div>
          </div>

          {/* shoppable posts */}
          <div style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <LSecHead title="من المؤثرين" all="كل المنشورات" />
            <LPost inf={INFLUENCERS[2]} i={2} product={PRODUCTS[11]} onAdd={addToCart} />
            <LPost inf={INFLUENCERS[4]} i={4} product={PRODUCTS[0]} imgH={190} onAdd={addToCart} />
          </div>

          {/* new arrivals */}
          <div style={{ paddingTop: 20 }}>
            <LSecHead title="وصل حديثاً" />
            <LRail>{[PRODUCTS[14], PRODUCTS[19], PRODUCTS[15], PRODUCTS[9]].map((p) => card(p, 158))}</LRail>
          </div>

          {/* collections */}
          <div style={{ paddingTop: 20 }}>
            <LSecHead title="استكشف التشكيلات" />
            <LRail>
              {COLLECTIONS.map((c, i) => (
                <div key={c} style={{ position: 'relative', width: 118, height: 150, borderRadius: 16, overflow: 'hidden', flexShrink: 0, cursor: 'pointer' }}>
                  <MPh label="collection" style={{ width: '100%', height: '100%', background: `repeating-linear-gradient(135deg, ${BH_TONES[i % BH_TONES.length]} 0 11px, rgba(26,26,46,0.06) 11px 22px)` }} />
                  <span style={{ position: 'absolute', bottom: 8, insetInlineStart: '50%', transform: 'translateX(50%)', background: '#fff', color: BH.ink, fontSize: 9.5, fontWeight: 700, borderRadius: 99, padding: '4px 10px', whiteSpace: 'nowrap', boxShadow: '0 1px 3px rgba(26,26,46,.15)' }}>{c}</span>
                </div>
              ))}
            </LRail>
          </div>

          {/* trust strip */}
          <div style={{ margin: '22px 16px 0', display: 'flex', background: BH.surface, border: `1px solid ${BH.border}`, borderRadius: 16, padding: '14px 8px' }}>
            {[
              { ic: 'truck', t: 'توصيل بنفس اليوم', s: 'هَب اكسبريس في مسقط' },
              { ic: 'refresh', t: 'إرجاع مجاني', s: 'خلال 15 يوماً' },
              { ic: 'shield', t: 'دفع آمن', s: 'منتجات أصلية 100%' },
            ].map((x) => (
              <div key={x.ic} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center' }}>
                <span style={{ color: BH.accent }}><Icon name={x.ic} size={20} /></span>
                <span style={{ fontSize: 10, fontWeight: 700, color: BH.ink }}>{x.t}</span>
                <span style={{ fontSize: 8.5, color: BH.textMuted }}>{x.s}</span>
              </div>
            ))}
          </div>

          <div style={{ height: 24 }}></div>
        </div>

        {/* toast */}
        <div style={{
          position: 'absolute', bottom: 92, insetInlineStart: '50%', transform: `translateX(50%) translateY(${toast ? 0 : 12}px)`,
          opacity: toast ? 1 : 0, pointerEvents: 'none', transition: 'opacity .25s, transform .25s',
          background: BH.ink, color: '#fff', fontFamily: BH.font, fontSize: 11.5, fontWeight: 600,
          borderRadius: 99, padding: '9px 18px', display: 'inline-flex', alignItems: 'center', gap: 7,
          boxShadow: '0 8px 24px rgba(26,26,46,.35)', whiteSpace: 'nowrap', zIndex: 30,
        }}>
          <span style={{ width: 17, height: 17, borderRadius: '50%', background: BH.accent, display: 'grid', placeItems: 'center' }}><Icon name="check" size={11} strokeWidth={2.6} /></span>
          تمت الإضافة إلى العربة
        </div>

        <HomeTabBar cartCount={cartCount} />
      </div>

      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakColor label="Accent" value={t.accent} options={Object.keys(BH_ACCENTS)} onChange={(v) => setTweak('accent', v)} />
        <TweakRadio label="Deals panel" value={t.dealsPanel} options={['داكن', 'متدرّج']} onChange={(v) => setTweak('dealsPanel', v)} />
        <TweakSection label="Content" />
        <TweakToggle label="Stories rail" value={t.showStories} onChange={(v) => setTweak('showStories', v)} />
        <TweakToggle label="Hero auto-play" value={t.heroAuto} onChange={(v) => setTweak('heroAuto', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AppHome />);
