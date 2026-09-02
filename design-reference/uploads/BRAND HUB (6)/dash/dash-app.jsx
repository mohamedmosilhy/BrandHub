/* ───────────── BRANDHUB Dashboard · app shell + routing ───────────── */

const PENDING_APPROVALS = PRODUCT_REQUESTS.filter((r) => r.status === 'PENDING').length;
const UNREAD_NOTIFS = NOTIFICATIONS.filter((n) => !n.read).length;
const SELLER_PENDING = SELLER_PRODUCTS.filter((p) => p.status === 'PENDING').length;

const ROLE_META = {
  super:  { name: 'Super Admin', icon: 'crown', user: 'Salim Al Rashdi', email: 'salim.rashdi@brandhub.om' },
  admin:  { name: 'Admin',       icon: 'shield', user: 'Mariam Al Habsi', email: 'mariam.habsi@brandhub.om' },
  seller: { name: 'Seller',      icon: 'store', user: 'Talal Al Hinai', email: 'talal.hinai@techsouq.om' },
};

const NAV = {
  super: [
    { label: 'Main', items: [{ key: 'overview', icon: 'grid', label: 'Overview' }] },
    { label: 'Catalog', items: [
      { key: 'products', icon: 'box', label: 'Products' },
      { key: 'categories', icon: 'layers', label: 'Categories' },
      { key: 'approvals', icon: 'check-circle', label: 'Approvals', count: PENDING_APPROVALS, amber: true },
    ] },
    { label: 'Sales', items: [
      { key: 'orders', icon: 'cart', label: 'Orders' },
      { key: 'finance', icon: 'wallet', label: 'Finance' },
    ] },
    { label: 'People', items: [
      { key: 'users', icon: 'users', label: 'Users' },
      { key: 'roles', icon: 'shield', label: 'Roles & permissions' },
    ] },
    { label: 'Marketing', items: [
      { key: 'coupons', icon: 'ticket', label: 'Coupons' },
      { key: 'reviews', icon: 'star-line', label: 'Reviews' },
      { key: 'notifications', icon: 'bell', label: 'Notifications', count: UNREAD_NOTIFS },
    ] },
  ],
  admin: [
    { label: 'Main', items: [{ key: 'overview', icon: 'grid', label: 'Overview' }] },
    { label: 'Catalog', items: [
      { key: 'products', icon: 'box', label: 'Products' },
      { key: 'categories', icon: 'layers', label: 'Categories' },
      { key: 'approvals', icon: 'check-circle', label: 'Approvals', count: PENDING_APPROVALS, amber: true },
    ] },
    { label: 'Sales', items: [
      { key: 'orders', icon: 'cart', label: 'Orders' },
      { key: 'finance', icon: 'wallet', label: 'Finance' },
    ] },
    { label: 'Marketing', items: [
      { key: 'coupons', icon: 'ticket', label: 'Coupons' },
      { key: 'reviews', icon: 'star-line', label: 'Reviews' },
      { key: 'notifications', icon: 'bell', label: 'Notifications', count: UNREAD_NOTIFS },
    ] },
  ],
  seller: [
    { label: 'Main', items: [{ key: 'overview', icon: 'grid', label: 'Overview' }] },
    { label: 'Products', items: [
      { key: 'seller-products', icon: 'box', label: 'My products', count: SELLER_PENDING, amber: true },
      { key: 'submit', icon: 'plus', label: 'Submit product' },
    ] },
    { label: 'Sales', items: [{ key: 'seller-orders', icon: 'cart', label: 'Sales orders' }] },
    { label: 'Finance', items: [{ key: 'earnings', icon: 'wallet', label: 'Earnings & payouts' }] },
    { label: 'Account', items: [{ key: 'profile', icon: 'user', label: 'Profile & bank' }] },
  ],
};

const TITLES = {
  overview: 'Overview', products: 'Products', categories: 'Categories', approvals: 'Seller approvals',
  orders: 'Orders', users: 'Users', roles: 'Roles & permissions', coupons: 'Coupons', reviews: 'Reviews',
  notifications: 'Notifications', 'seller-products': 'My products', submit: 'Submit product',
  'seller-orders': 'Sales orders', earnings: 'Earnings & payouts', profile: 'Profile & bank',
  finance: 'Finance',
};

const DEFAULT_VIEW = { super: 'overview', admin: 'overview', seller: 'overview' };

/* read the signed-in session (set by auth.js on the login page) */
const SESSION = (window.BHAuth && BHAuth.getSession && BHAuth.getSession()) || null;
function sessionMeta(role) {
  const base = ROLE_META[role] || ROLE_META.super;
  if (SESSION && SESSION.role === role) {
    const u = SESSION.user || {};
    const name = (u.firstName && (u.firstName + ' ' + (u.lastName || ''))) || u.name || base.user;
    return { ...base, user: name.trim(), email: SESSION.email || base.email };
  }
  return base;
}
function signOut() {
  if (window.BHAuth) BHAuth.clearSession();
  window.location.href = 'BRANDHUB Login.html';
}

function Dashboard() {
  const [role, setRole] = React.useState(() => {
    if (SESSION && ['super', 'admin', 'seller'].includes(SESSION.role)) return SESSION.role;
    return localStorage.getItem('bh_dash_role') || 'super';
  });
  const [view, setView] = React.useState(() => {
    const r = localStorage.getItem('bh_dash_role') || 'super';
    const v = localStorage.getItem('bh_dash_view');
    const valid = NAV[r].some((g) => g.items.some((i) => i.key === v));
    return valid ? v : DEFAULT_VIEW[r];
  });
  const [toasts, toast] = useToasts();
  const meta = sessionMeta(role);

  const go = React.useCallback((v) => { setView(v); localStorage.setItem('bh_dash_view', v); document.querySelector('.dash-content').scrollTop = 0; }, []);
  const switchRole = (r) => { setRole(r); const dv = DEFAULT_VIEW[r]; setView(dv); localStorage.setItem('bh_dash_role', r); localStorage.setItem('bh_dash_view', dv); };

  const render = () => {
    switch (view) {
      case 'overview': return role === 'seller' ? <OverviewSeller go={go} toast={toast} /> : <OverviewAdmin role={role} go={go} toast={toast} />;
      case 'products': return <ProductsView toast={toast} />;
      case 'categories': return <CategoriesView toast={toast} />;
      case 'approvals': return <ApprovalsView toast={toast} />;
      case 'orders': return <OrdersView toast={toast} />;
      case 'finance': return <FinanceView role={role} toast={toast} />;
      case 'users': return <UsersView toast={toast} />;
      case 'roles': return <RolesView toast={toast} />;
      case 'coupons': return <CouponsView toast={toast} />;
      case 'reviews': return <ReviewsView toast={toast} />;
      case 'notifications': return <NotificationsView toast={toast} />;
      case 'seller-products': return <SellerProductsView go={go} toast={toast} />;
      case 'submit': return <SubmitProductView go={go} toast={toast} />;
      case 'seller-orders': return <SellerOrdersView toast={toast} />;
      case 'earnings': return <EarningsView toast={toast} />;
      case 'profile': return <SellerProfileView toast={toast} />;
      default: return <OverviewAdmin role={role} go={go} toast={toast} />;
    }
  };

  return (
    <div className="dash-shell">
      {/* sidebar */}
      <aside className="dash-sidebar">
        <div className="sb-brand">
          <span className="sb-logo">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none"><path d="M6 12h20l-1.4 15a2 2 0 0 1-2 1.8H9.4a2 2 0 0 1-2-1.8L6 12z" fill="#fff"/><path d="M11 12a5 5 0 0 1 10 0" stroke="#C8A84B" strokeWidth="2.4" strokeLinecap="round" fill="none"/><circle cx="13" cy="18.5" r="1.5" fill="#1A1A2E"/><circle cx="19" cy="18.5" r="1.5" fill="#1A1A2E"/></svg>
          </span>
          <span className="sb-word"><b>BRAND</b><span>HUB</span></span>
        </div>

        <div className="sb-role">
          <span className="rl-ic"><DIcon name={meta.icon} size={18} /></span>
          <div><div className="rl-t">Workspace</div><div className="rl-n">{meta.name}</div></div>
        </div>

        <nav className="sb-nav scroll">
          {NAV[role].map((group) => (
            <div key={group.label}>
              <div className="sb-group-label">{group.label}</div>
              {group.items.map((it) => (
                <button key={it.key} className={'sb-link' + (view === it.key ? ' on' : '')} onClick={() => go(it.key)}>
                  <span className="ic"><DIcon name={it.icon} size={18} /></span>
                  <span>{it.label}</span>
                  {it.count > 0 && <span className={'sb-count' + (it.amber ? ' amber' : '')}>{it.count}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sb-foot">
          <Menu align="left" trigger={
            <button className="sb-user">
              <Avatar name={meta.user} size={34} variant={role === 'super' ? 'ink' : 'grad'} />
              <div style={{ minWidth: 0, textAlign: 'left' }}><div className="su-n">{meta.user}</div><div className="su-m">{meta.name}</div></div>
              <span className="ic"><DIcon name="chev-up" size={15} /></span>
            </button>
          }>
            <button onClick={() => toast('Profile')}><DIcon name="user" size={15} /> My profile</button>
            <button onClick={() => toast('Settings')}><DIcon name="settings" size={15} /> Settings</button>
            <div className="sep"></div>
            <button onClick={() => { window.location.href = 'BRANDHUB Storefront.html'; }}><DIcon name="store" size={15} /> View storefront</button>
            <button className="danger" onClick={signOut}><DIcon name="logout" size={15} /> Sign out</button>
          </Menu>
        </div>
      </aside>

      {/* main */}
      <div className="dash-main">
        <header className="dash-topbar">
          <div className="tb-title">
            <h1>{TITLES[view] || 'Dashboard'}</h1>
            <span className="crumb">{meta.name} · BRANDHUB</span>
          </div>
          <div className="tb-spacer"></div>

          <div className="tb-search">
            <DIcon name="search" size={16} />
            <input placeholder="Search…" onKeyDown={(e) => e.key === 'Enter' && e.target.value && toast('Searching: ' + e.target.value)} />
            <kbd>⌘K</kbd>
          </div>

          <div className="role-switch" title="Switch workspace">
            {[['super', 'Super Admin', 'crown'], ['admin', 'Admin', 'shield'], ['seller', 'Seller', 'store']].map(([k, l, ic]) => (
              <button key={k} className={role === k ? 'on' : ''} onClick={() => switchRole(k)}><DIcon name={ic} size={14} /><span>{l}</span></button>
            ))}
          </div>

          <button className="tb-icon" onClick={() => go('notifications')} title="Notifications">
            <DIcon name="bell" size={18} />{UNREAD_NOTIFS > 0 && <span className="dot"></span>}
          </button>
          <Menu trigger={<button className="tb-icon" title="Account"><Avatar name={meta.user} size={28} variant={role === 'super' ? 'ink' : 'grad'} /></button>}>
            <button onClick={() => toast('Profile')}><DIcon name="user" size={15} /> {meta.user}</button>
            <button onClick={() => toast('Settings')}><DIcon name="settings" size={15} /> Settings</button>
            <div className="sep"></div>
            <button className="danger" onClick={signOut}><DIcon name="logout" size={15} /> Sign out</button>
          </Menu>
        </header>

        <main className="dash-content scroll">
          {render()}
        </main>
      </div>

      <Toasts items={toasts} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Dashboard />);
