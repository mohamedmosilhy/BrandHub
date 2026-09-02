/* ───────────── BRANDHUB · App home screens (Options A + B) ─────────────
   Shared mobile components, RTL Arabic, brand identity from tokens.css.
   Loaded after data.jsx + icons.jsx (uses INFLUENCERS, PRODUCTS, Icon). */

const BH = {
  accent: '#7F77DD', accentDark: '#6860CC', pink: '#D4537E', ink: '#1A1A2E',
  bg: '#F5F5F7', surface: '#FFFFFF', border: '#E8E8EC',
  accentLight: '#EEEDF9', pinkLight: '#FCEEF3',
  textSec: '#5A5A72', textMuted: '#9A9AAF',
  gradient: 'linear-gradient(135deg, #7F77DD 0%, #D4537E 100%)',
  font: "'Noto Kufi Arabic', sans-serif",
  latin: "'Plus Jakarta Sans', sans-serif",
};
const BH_TONES = ['#EEEDF9', '#FCEEF3', '#E3F5EF', '#FEF7E0', '#E8F1F8'];

/* striped placeholder (self-contained, no CSS deps) */
function MPh({ label, style = {} }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'repeating-linear-gradient(135deg, #ececed 0 11px, rgba(26,26,46,0.045) 11px 22px)',
      overflow: 'hidden', ...style,
    }}>
      {label && <span style={{ fontFamily: BH.latin, fontSize: 10, letterSpacing: '.08em', fontWeight: 500, color: 'rgba(26,26,46,.34)' }}>{label}</span>}
    </div>
  );
}

/* avatar — tinted circle with initial */
function MAvatar({ name, i = 0, size = 56 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `repeating-linear-gradient(135deg, ${BH_TONES[i % BH_TONES.length]} 0 8px, rgba(26,26,46,0.05) 8px 16px)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: BH.font, fontWeight: 700, fontSize: size * 0.34, color: BH.ink,
    }}>{name.trim()[0]}</div>
  );
}

/* extra mobile icons (stroke style matches Icon set) */
function MIco({ name, size = 22, color = 'currentColor', strokeWidth = 1.8 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'home': return (<svg {...p}><path d="M3 10.5L12 3l9 7.5"></path><path d="M5 9.5V21h14V9.5"></path></svg>);
    case 'grid': return (<svg {...p}><rect x="3" y="3" width="7.5" height="7.5" rx="1.5"></rect><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"></rect><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"></rect><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"></rect></svg>);
    case 'bell': return (<svg {...p}><path d="M18 8.5a6 6 0 1 0-12 0c0 6.5-2.5 7-2.5 8.5h17c0-1.5-2.5-2-2.5-8.5z"></path><path d="M10.3 20.5a1.8 1.8 0 0 0 3.4 0"></path></svg>);
    case 'comment': return (<svg {...p}><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1L3 20l1-5.3a8.5 8.5 0 1 1 17-3.2z"></path></svg>);
    case 'send': return (<svg {...p}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>);
    case 'bookmark': return (<svg {...p}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>);
    default: return <Icon name={name} size={size} strokeWidth={strokeWidth} style={{ color }} />;
  }
}

/* ── bottom tab bar (platform-aware) ─────────────────────────── */
function MTabBar({ platform, active = 'home' }) {
  const items = [
    { key: 'home', icon: 'home', label: 'الرئيسية' },
    { key: 'cats', icon: 'grid', label: 'الفئات' },
    { key: 'inf', icon: 'star', label: 'المؤثرون' },
    { key: 'cart', icon: 'cart', label: 'العربة', badge: 3 },
    { key: 'me', icon: 'user', label: 'حسابي' },
  ];
  const ios = platform === 'ios';
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', flexShrink: 0,
      background: ios ? 'rgba(255,255,255,0.94)' : BH.surface,
      backdropFilter: ios ? 'blur(20px)' : undefined,
      borderTop: `1px solid ${BH.border}`,
      padding: ios ? '10px 8px 26px' : '10px 8px 12px',
    }}>
      {items.map((it) => {
        const on = it.key === active;
        return (
          <div key={it.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: ios ? 30 : 56, height: 30, borderRadius: 16,
              background: !ios && on ? BH.accentLight : 'transparent',
              color: on ? BH.accent : BH.textMuted,
            }}>
              {it.icon === 'star'
                ? <Icon name="star" size={22} style={{ color: on ? BH.accent : 'transparent', stroke: on ? 'none' : BH.textMuted, strokeWidth: 1.8 }} />
                : <MIco name={it.icon} size={22} color={on ? BH.accent : BH.textMuted} />}
              {it.badge && (
                <span style={{
                  position: 'absolute', top: -4, insetInlineEnd: ios ? -8 : 6,
                  minWidth: 16, height: 16, padding: '0 4px', borderRadius: 99,
                  background: BH.pink, color: '#fff', fontSize: 10, fontWeight: 700,
                  fontFamily: BH.latin, display: 'grid', placeItems: 'center', lineHeight: 1,
                }}>{it.badge}</span>
              )}
            </div>
            <span style={{ fontFamily: BH.font, fontSize: 10.5, fontWeight: on ? 700 : 500, color: on ? BH.accent : BH.textMuted }}>{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── stories rail ────────────────────────────────────────────── */
function MStories({ size = 62, count = 7, compact = false }) {
  return (
    <div style={{ display: 'flex', gap: 14, padding: '4px 16px 6px', overflow: 'hidden' }}>
      {/* your story */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
        <div style={{
          width: size + 8, height: size + 8, borderRadius: '50%',
          border: `2px dashed ${BH.textMuted}`, display: 'grid', placeItems: 'center', position: 'relative',
        }}>
          <MAvatar name="أ" i={4} size={size - 4} />
          <span style={{
            position: 'absolute', bottom: -2, insetInlineEnd: -2, width: 20, height: 20, borderRadius: '50%',
            background: BH.accent, color: '#fff', display: 'grid', placeItems: 'center', border: '2px solid #fff',
          }}><Icon name="plus" size={11} strokeWidth={2.6} /></span>
        </div>
        {!compact && <span style={{ fontFamily: BH.font, fontSize: 10.5, color: BH.textSec }}>قصتك</span>}
      </div>
      {INFLUENCERS.slice(0, count).map((inf, i) => (
        <div key={inf.handle} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <div style={{ width: size + 8, height: size + 8, borderRadius: '50%', padding: 2.5, background: BH.gradient }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', padding: 2, background: '#fff' }}>
              <MAvatar name={inf.name} i={i} size={size - 1} />
            </div>
          </div>
          {!compact && (
            <span style={{ fontFamily: BH.font, fontSize: 10.5, color: BH.ink, maxWidth: size + 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {inf.name.split(' ')[0]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── shoppable post card (Option A) ──────────────────────────── */
function MPost({ inf, i, product, imgH = 230, label }) {
  return (
    <article style={{ background: BH.surface, borderTop: `1px solid ${BH.border}`, borderBottom: `1px solid ${BH.border}` }}>
      {/* post header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px' }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', padding: 2, background: BH.gradient }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', padding: 1.5, background: '#fff' }}>
            <MAvatar name={inf.name} i={i} size={35} />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: BH.font, fontSize: 13, fontWeight: 700, color: BH.ink }}>{inf.name}</div>
          <div style={{ fontFamily: BH.latin, fontSize: 10.5, color: BH.textMuted, direction: 'ltr', textAlign: 'end' }}>{inf.handle} · {inf.followers}</div>
        </div>
        <span style={{
          fontFamily: BH.font, fontSize: 11.5, fontWeight: 700, color: BH.accent,
          border: `1.5px solid ${BH.accent}`, borderRadius: 99, padding: '4px 14px',
        }}>متابعة</span>
      </div>
      {/* media */}
      <MPh label={label} style={{ height: imgH }} />
      {/* actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '10px 16px 4px', color: BH.ink }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: BH.latin, fontSize: 12, fontWeight: 600 }}>
          <Icon name="heart" size={21} /> 2.4K
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: BH.latin, fontSize: 12, fontWeight: 600 }}>
          <MIco name="comment" size={20} /> 86
        </span>
        <MIco name="send" size={20} />
        <span style={{ marginInlineStart: 'auto' }}><MIco name="bookmark" size={20} /></span>
      </div>
      {/* tagged product strip */}
      <div style={{
        margin: '8px 12px 12px', padding: 8, borderRadius: 14, background: BH.accentLight,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <MPh label="" style={{ width: 46, height: 46, borderRadius: 10, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: BH.font, fontSize: 11.5, fontWeight: 600, color: BH.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.title}</div>
          <div style={{ fontFamily: BH.latin, fontSize: 13, fontWeight: 700, color: BH.ink, direction: 'ltr', textAlign: 'end' }}>
            {formatPrice(product.price)} <span style={{ fontSize: 10, fontWeight: 500, color: BH.textSec }}>{CURRENCY}</span>
          </div>
        </div>
        <span style={{
          width: 36, height: 36, borderRadius: '50%', background: BH.accent, color: '#fff',
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}><Icon name="cart" size={17} /></span>
      </div>
    </article>
  );
}

/* ════════ OPTION A — social-first stories feed ═══════════════ */
function HomeA({ platform }) {
  const ios = platform === 'ios';
  return (
    <div dir="rtl" style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: BH.bg, fontFamily: BH.font, paddingTop: ios ? 62 : 0, boxSizing: 'border-box',
    }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px 6px', gap: 12 }}>
        <span style={{ fontFamily: BH.latin, fontSize: 20, fontWeight: 800, color: BH.ink, letterSpacing: '-.01em' }}>
          BRAND<span style={{ fontWeight: 500, color: BH.textSec }}>HUB</span>
        </span>
        <span style={{ marginInlineStart: 'auto', position: 'relative', color: BH.ink }}>
          <MIco name="bell" size={23} />
          <span style={{ position: 'absolute', top: 1, insetInlineEnd: 1, width: 8, height: 8, borderRadius: '50%', background: BH.pink, border: '1.5px solid #fff' }}></span>
        </span>
        <span style={{ color: BH.ink }}><Icon name="search" size={22} /></span>
      </div>

      <MStories size={60} count={7} />

      {/* feed (clipped at frame bottom) */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 6 }}>
        <MPost inf={INFLUENCERS[1]} i={1} product={PRODUCTS[5]} label="story video · 4:5" imgH={228} />
        <MPost inf={INFLUENCERS[4]} i={4} product={PRODUCTS[0]} label="story video · 4:5" imgH={228} />
      </div>

      <MTabBar platform={platform} active="home" />
    </div>
  );
}

/* ════════ OPTION B — commerce-first + stories rail ═══════════ */
function HomeB({ platform }) {
  const ios = platform === 'ios';
  const prods = [PRODUCTS[0], PRODUCTS[8]];
  return (
    <div dir="rtl" style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: BH.bg, fontFamily: BH.font, paddingTop: ios ? 62 : 0, boxSizing: 'border-box',
    }}>
      {/* header: delivery + bell */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px 2px' }}>
        <span style={{ color: BH.accent, display: 'flex' }}><Icon name="pin" size={19} /></span>
        <div>
          <div style={{ fontSize: 10, color: BH.textMuted }}>التوصيل إلى</div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: BH.ink, display: 'flex', alignItems: 'center', gap: 3 }}>
            مسقط — الخوض <Icon name="chev-down" size={12} />
          </div>
        </div>
        <span style={{ marginInlineStart: 'auto', position: 'relative', color: BH.ink }}>
          <MIco name="bell" size={23} />
          <span style={{ position: 'absolute', top: 1, insetInlineEnd: 1, width: 8, height: 8, borderRadius: '50%', background: BH.pink, border: '1.5px solid #fff' }}></span>
        </span>
      </div>

      {/* search */}
      <div style={{ margin: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, background: BH.surface, border: `1px solid ${BH.border}`, borderRadius: 99, padding: '0 14px', height: 42 }}>
        <Icon name="search" size={18} style={{ color: BH.textMuted }} />
        <span style={{ fontSize: 12.5, color: BH.textMuted }}>عن ماذا تبحث؟</span>
        <span style={{ marginInlineStart: 'auto', width: 30, height: 30, borderRadius: '50%', background: BH.accent, color: '#fff', display: 'grid', placeItems: 'center' }}><Icon name="search" size={14} /></span>
      </div>

      <MStories size={50} count={8} compact />

      {/* promo banner */}
      <div style={{ margin: '10px 16px 0', borderRadius: 18, background: BH.gradient, color: '#fff', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 130, height: 130, borderRadius: '50%', border: '2px solid rgba(255,255,255,.22)', insetInlineStart: -40, top: -40 }}></div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
          <span style={{ fontSize: 10.5, opacity: .9, fontWeight: 600 }}>تخفيضات الأسبوع</span>
          <span style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.35 }}>خصومات حتى 40% على الإلكترونيات</span>
          <span style={{ alignSelf: 'flex-start', background: '#fff', color: BH.ink, fontSize: 11, fontWeight: 700, borderRadius: 99, padding: '5px 14px', marginTop: 2 }}>تسوّق الآن</span>
        </div>
        <MPh label="" style={{ width: 84, height: 84, borderRadius: '50%', border: '5px solid rgba(255,255,255,.35)', flexShrink: 0 }} />
      </div>

      {/* categories */}
      <div style={{ display: 'flex', gap: 10, padding: '14px 16px 0' }}>
        {SHOP_CATEGORIES.slice(0, 4).map((c) => (
          <div key={c.name} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <MPh label="" style={{ width: '100%', aspectRatio: '1', borderRadius: 14, background: `repeating-linear-gradient(135deg, ${c.tone} 0 9px, rgba(26,26,46,0.05) 9px 18px)` }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: BH.ink, textAlign: 'center', lineHeight: 1.3 }}>{c.name}</span>
          </div>
        ))}
      </div>

      {/* deals of the day */}
      <div style={{ display: 'flex', alignItems: 'baseline', padding: '14px 16px 8px' }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: BH.ink }}>عروض اليوم</span>
        <span style={{ marginInlineStart: 'auto', fontSize: 11, fontWeight: 700, color: BH.accent }}>عرض الكل</span>
      </div>
      <div style={{ display: 'flex', gap: 12, padding: '0 16px', flex: 1, overflow: 'hidden' }}>
        {prods.map((p) => (
          <div key={p.id} style={{ flex: 1, background: BH.surface, border: `1px solid ${BH.border}`, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative' }}>
              <MPh label="product" style={{ height: 118 }} />
              <span style={{ position: 'absolute', top: 8, insetInlineStart: 8, background: BH.ink, color: '#fff', fontSize: 9, fontWeight: 600, borderRadius: 99, padding: '3px 8px' }}>خصم {p.discount}</span>
            </div>
            <div style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, color: BH.ink, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.9em' }}>{p.title}</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                <span style={{ fontFamily: BH.latin, fontSize: 14.5, fontWeight: 700, color: BH.ink, direction: 'ltr' }}>{formatPrice(p.price)}</span>
                <span style={{ fontSize: 9, color: BH.textSec }}>{CURRENCY}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <MTabBar platform={platform} active="home" />
    </div>
  );
}

Object.assign(window, { HomeA, HomeB, MTabBar, MStories, MPost, BH, BH_TONES, MPh, MAvatar, MIco });
