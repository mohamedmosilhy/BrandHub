/* ───────────── BRANDHUB · App storefront — FULL design (handoff) ─────────────
   One continuous 402-wide comp of the whole home/storefront scroll,
   Option B direction. Loaded after app-screens.jsx (uses BH, MPh, …). */

/* mobile product card */
function MProdCard({ p, w = 170, flexFill = false }) {
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
        <span style={{ position: 'absolute', top: 8, insetInlineEnd: 8, width: 28, height: 28, borderRadius: '50%', background: '#fff', color: BH.textSec, display: 'grid', placeItems: 'center', boxShadow: '0 1px 3px rgba(26,26,46,.12)' }}>
          <Icon name="heart" size={14} />
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

/* section heading */
function MSecHead({ title, all = 'عرض الكل', onDark = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', padding: '0 16px', marginBottom: 10 }}>
      <span style={{ fontFamily: BH.font, fontSize: 16, fontWeight: 800, color: onDark ? '#fff' : BH.ink }}>{title}</span>
      {all && <span style={{ marginInlineStart: 'auto', fontFamily: BH.font, fontSize: 11, fontWeight: 700, color: onDark ? '#fff' : BH.accent, display: 'inline-flex', alignItems: 'center', gap: 3 }}>{all} <Icon name="chev-left" size={12} /></span>}
    </div>
  );
}

/* ════════ FULL STOREFRONT COMP ════════════════════════════════ */
function StorefrontFull() {
  const rail = (list, w = 158) => (
    <div style={{ display: 'flex', gap: 10, padding: '0 16px', overflow: 'hidden' }}>
      {list.map((p) => <MProdCard key={p.id} p={p} w={w} />)}
    </div>
  );

  return (
    <div dir="rtl" style={{ width: 402, background: BH.bg, fontFamily: BH.font, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── sticky chrome: status + header + search ── */}
      <div style={{ background: BH.surface, borderBottom: `1px solid ${BH.border}`, paddingBottom: 4 }}>
        <IOSStatusBar />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px 2px' }}>
          <span style={{ color: BH.accent, display: 'flex' }}><Icon name="pin" size={19} /></span>
          <div>
            <div style={{ fontSize: 10, color: BH.textMuted }}>التوصيل إلى</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: BH.ink, display: 'flex', alignItems: 'center', gap: 3 }}>مسقط — الخوض <Icon name="chev-down" size={12} /></div>
          </div>
          <span style={{ marginInlineStart: 'auto', fontFamily: BH.latin, fontSize: 18, fontWeight: 800, color: BH.ink }}>BRAND<span style={{ fontWeight: 500, color: BH.textSec }}>HUB</span></span>
          <span style={{ position: 'relative', color: BH.ink, marginInlineStart: 10 }}>
            <MIco name="bell" size={22} />
            <span style={{ position: 'absolute', top: 1, insetInlineEnd: 1, width: 8, height: 8, borderRadius: '50%', background: BH.pink, border: '1.5px solid #fff' }}></span>
          </span>
        </div>
        <div style={{ margin: '8px 16px 6px', display: 'flex', alignItems: 'center', gap: 8, background: BH.bg, border: `1px solid ${BH.border}`, borderRadius: 99, padding: '0 14px', height: 42 }}>
          <Icon name="search" size={18} style={{ color: BH.textMuted }} />
          <span style={{ fontSize: 12.5, color: BH.textMuted }}>عن ماذا تبحث؟</span>
          <span style={{ marginInlineStart: 'auto', width: 30, height: 30, borderRadius: '50%', background: BH.accent, color: '#fff', display: 'grid', placeItems: 'center' }}><Icon name="search" size={14} /></span>
        </div>
      </div>

      {/* ── stories rail ── */}
      <div style={{ background: BH.surface, paddingBlock: 8, borderBottom: `1px solid ${BH.border}` }}>
        <MStories size={58} count={7} />
      </div>

      {/* ── hero slider ── */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ borderRadius: 18, background: BH.gradient, color: '#fff', padding: '18px 18px', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', overflow: 'hidden', minHeight: 128, boxSizing: 'border-box' }}>
          <div style={{ position: 'absolute', width: 150, height: 150, borderRadius: '50%', border: '2px solid rgba(255,255,255,.22)', insetInlineStart: -45, top: -45 }}></div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
            <span style={{ fontSize: 10.5, opacity: .9, fontWeight: 600 }}>تشكيلة الموسم</span>
            <span style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.35 }}>أناقة تواكب كل لحظاتك — خصومات حتى 40%</span>
            <span style={{ alignSelf: 'flex-start', background: '#fff', color: BH.ink, fontSize: 11, fontWeight: 700, borderRadius: 99, padding: '5px 14px', marginTop: 2 }}>تسوّق الآن</span>
          </div>
          <MPh label="campaign" style={{ width: 92, height: 92, borderRadius: '50%', border: '5px solid rgba(255,255,255,.35)', flexShrink: 0 }} />
        </div>
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', paddingTop: 8 }}>
          <span style={{ width: 16, height: 5, borderRadius: 99, background: BH.accent }}></span>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#C9C9D4' }}></span>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#C9C9D4' }}></span>
        </div>
      </div>

      {/* ── categories 4×2 ── */}
      <div style={{ paddingTop: 18 }}>
        <MSecHead title="تسوّق حسب الفئة" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, padding: '0 16px' }}>
          {SHOP_CATEGORIES.slice(0, 8).map((c) => (
            <div key={c.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <MPh label="" style={{ width: '100%', aspectRatio: '1', borderRadius: 14, background: `repeating-linear-gradient(135deg, ${c.tone} 0 9px, rgba(26,26,46,0.05) 9px 18px)`, border: `1px solid ${BH.border}` }} />
              <span style={{ fontSize: 9.5, fontWeight: 600, color: BH.ink, textAlign: 'center', lineHeight: 1.3 }}>{c.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── flash deals (dark panel) ── */}
      <div style={{ margin: '20px 16px 0', borderRadius: 20, background: BH.ink, padding: '16px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', marginBottom: 12 }}>
          <span style={{ fontFamily: BH.font, fontSize: 16, fontWeight: 800, color: '#fff' }}>عروض اليوم</span>
          <div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,.65)', marginInlineEnd: 4 }}>ينتهي خلال</span>
            {['02', '06', '35'].map((n, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 12 }}>:</span>}
                <span style={{ fontFamily: BH.latin, fontSize: 12, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 6, padding: '3px 6px', direction: 'ltr' }}>{n}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
        {rail([PRODUCTS[1], PRODUCTS[12], PRODUCTS[17]], 150)}
      </div>

      {/* ── featured offer ── */}
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

      {/* ── best sellers 2×2 ── */}
      <div style={{ paddingTop: 20 }}>
        <MSecHead title="الأكثر مبيعاً" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px' }}>
          {[PRODUCTS[0], PRODUCTS[8], PRODUCTS[5], PRODUCTS[2]].map((p) => <MProdCard key={p.id} p={p} flexFill />)}
        </div>
      </div>

      {/* ── influencers panel ── */}
      <div style={{ margin: '20px 16px 0', borderRadius: 20, background: BH.gradient, color: '#fff', padding: '16px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', padding: '0 16px', marginBottom: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 800 }}>المؤثرون المميزون <span style={{ fontFamily: BH.latin, fontSize: 10, fontWeight: 600, opacity: .8 }}>(13/32+)</span></span>
          <span style={{ marginInlineStart: 'auto', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>عرض الكل <Icon name="chev-left" size={12} /></span>
        </div>
        <div style={{ display: 'flex', gap: 14, padding: '0 16px', overflow: 'hidden' }}>
          {INFLUENCERS.slice(0, 5).map((inf, i) => (
            <div key={inf.handle} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0, width: 72 }}>
              <div style={{ width: 68, height: 68, borderRadius: '50%', padding: 2.5, background: 'linear-gradient(135deg,#fff,rgba(255,255,255,.4))' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', padding: 2, background: BH.ink }}>
                  <MAvatar name={inf.name} i={i} size={59} />
                </div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', lineHeight: 1.3 }}>{inf.name.split(' ')[0]}</span>
              <span style={{ fontFamily: BH.latin, fontSize: 8.5, opacity: .75, direction: 'ltr' }}>{inf.followers} متابع</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── shoppable post teaser ── */}
      <div style={{ paddingTop: 20 }}>
        <MSecHead title="من المؤثرين" all="كل المنشورات" />
        <MPost inf={INFLUENCERS[2]} i={2} product={PRODUCTS[11]} label="influencer photo / video" imgH={210} />
      </div>

      {/* ── new arrivals rail ── */}
      <div style={{ paddingTop: 20 }}>
        <MSecHead title="وصل حديثاً" />
        {rail([PRODUCTS[14], PRODUCTS[19], PRODUCTS[15]], 158)}
      </div>

      {/* ── collections rail ── */}
      <div style={{ paddingTop: 20 }}>
        <MSecHead title="استكشف التشكيلات" />
        <div style={{ display: 'flex', gap: 10, padding: '0 16px', overflow: 'hidden' }}>
          {COLLECTIONS.slice(0, 4).map((c, i) => (
            <div key={c} style={{ position: 'relative', width: 118, height: 150, borderRadius: 16, overflow: 'hidden', flexShrink: 0 }}>
              <MPh label="collection" style={{ width: '100%', height: '100%', background: `repeating-linear-gradient(135deg, ${BH_TONES[i % BH_TONES.length]} 0 11px, rgba(26,26,46,0.06) 11px 22px)` }} />
              <span style={{ position: 'absolute', bottom: 8, insetInlineStart: '50%', transform: 'translateX(50%)', background: '#fff', color: BH.ink, fontSize: 9.5, fontWeight: 700, borderRadius: 99, padding: '4px 10px', whiteSpace: 'nowrap', boxShadow: '0 1px 3px rgba(26,26,46,.15)' }}>{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── trust strip ── */}
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

      {/* ── tab bar (fixed in app) ── */}
      <div style={{ marginTop: 18 }}>
        <MTabBar platform="ios" active="home" />
      </div>
    </div>
  );
}

/* ── developer notes card ─────────────────────────────────────── */
function DevNotes() {
  const rows = [
    ['الهيدر + البحث', 'ثابت أعلى الشاشة عند التمرير (sticky). شارة الإشعارات ديناميكية.'],
    ['شريط القصص', 'تمرير أفقي. يعرض المؤثرين النشطين (13 الآن، حتى 32+). حلقة متدرّجة = قصة غير مشاهدة.'],
    ['البانر الرئيسي', 'سلايدر تلقائي كل 6 ثوانٍ، 3 شرائح، نقاط تتبّع أسفل البانر.'],
    ['الفئات', 'شبكة 4×2 ثابتة. «عرض الكل» يفتح تبويب الفئات.'],
    ['عروض اليوم', 'عدّاد تنازلي مباشر (سيرفر). المنتجات تمرير أفقي.'],
    ['بطاقة المنتج', 'صورة (تتعدد الصور في صفحة المنتج)، خصم، مفضلة، تقييم، السعر OMR بـ 3 منازل عشرية، شارة هَب اكسبريس.'],
    ['عرض اليد المميز', 'شريط تقدّم «تم بيع ٪» يُحدَّث من المخزون.'],
    ['منشور المؤثر', 'المنتج الموسوم يُضاف للعربة مباشرة من الشريط البنفسجي.'],
    ['شريط التبويبات', 'ثابت أسفل الشاشة. شارة العربة = عدد القطع.'],
    ['الهوية', 'الألوان والخطوط من tokens.css — Noto Kufi Arabic / Plus Jakarta Sans. كل الصور placeholders بانتظار المواد النهائية.'],
  ];
  return (
    <div dir="rtl" style={{ width: 320, background: '#fff', fontFamily: BH.font, padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 12, boxSizing: 'border-box' }}>
      <span style={{ fontSize: 15, fontWeight: 800, color: BH.ink }}>ملاحظات للمطوّر</span>
      {rows.map(([t, d]) => (
        <div key={t} style={{ display: 'flex', flexDirection: 'column', gap: 2, borderBottom: `1px solid ${BH.border}`, paddingBottom: 10 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: BH.accent }}>{t}</span>
          <span style={{ fontSize: 10.5, color: BH.textSec, lineHeight: 1.8 }}>{d}</span>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { StorefrontFull, DevNotes, MProdCard, MSecHead });
