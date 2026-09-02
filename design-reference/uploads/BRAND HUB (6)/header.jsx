/* ───────────────── BRANDHUB · Header (rows 1 + 2) ───────────────── */

function Header({ cartCount, wishCount, onToast }) {
  const [query, setQuery] = React.useState('');
  return (
    <header className="site-header">
      {/* row 1 — main menu */}
      <div className="main-menu">
        <div className="container">
          <Logo />

          <button className="delivery" onClick={() => onToast('التوصيل إلى مسقط، عُمان')}>
            <Icon name="pin" size={20} className="pin" />
            <span className="delivery-lines">
              <span className="small">التوصيل إلى</span>
              <span className="city">مسقط <Icon name="chev-down" size={13} /></span>
            </span>
          </button>

          <form className="search" onSubmit={(e) => { e.preventDefault(); window.location.href = 'BRANDHUB Search.html'; }}>
            <input
              type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="عن ماذا تبحث؟" aria-label="بحث"
            />
            <button type="submit" className="search-btn" aria-label="بحث"><Icon name="search" size={18} /></button>
          </form>

          <div className="actions">
            <button className="action lang" onClick={() => onToast('English (coming soon)')}>
              <Icon name="globe" size={18} /><span className="lbl">العربية</span>
            </button>
            <a className="action" href="BRANDHUB Login.html">
              <Icon name="user" size={20} /><span className="lbl">تسجيل الدخول</span>
            </a>
            <a className="action orders" href="BRANDHUB Account.html">
              <Icon name="package" size={20} /><span className="lbl">الطلبيات</span>
            </a>
            <a className="action wish" href="BRANDHUB Wishlist.html">
              <Icon name="heart" size={20} /><span className="lbl">المفضلة</span>
              {wishCount > 0 && <span className="cart-badge ltr">{wishCount}</span>}
            </a>
            <a className="action cart" href="BRANDHUB Cart.html">
              <Icon name="cart" size={20} /><span className="lbl">عربة التسوق</span>
              {cartCount > 0 && <span className="cart-badge ltr">{cartCount}</span>}
            </a>
          </div>
        </div>
      </div>

      {/* row 2 — category menu (plain links, no mega menu) */}
      <nav className="cat-menu">
        <div className="container">
          <a className="cat-all" href="BRANDHUB Search.html">
            <Icon name="list" size={18} /> جميع الفئات
          </a>
          <div className="cat-scroll">
            {NAV_CATEGORIES.map((c) => (
              <a key={c} className="cat-link" href="BRANDHUB Search.html">{c}</a>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}

window.Header = Header;
