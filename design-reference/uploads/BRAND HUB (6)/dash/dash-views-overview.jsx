/* ───────────── BRANDHUB Dashboard · Overview views ───────────── */

function MiniMonthToggle({ value, onChange }) {
  return (
    <div className="seg">
      {['6M', '12M'].map((v) => <button key={v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{v}</button>)}
    </div>
  );
}

/* ── Admin / Super Admin overview ── */
function OverviewAdmin({ role, go, toast }) {
  const [range, setRange] = React.useState('12M');
  const slice = range === '6M' ? 6 : 12;
  const rev = REVENUE_SERIES.slice(-slice), ord = ORDERS_SERIES.slice(-slice), labs = MONTHS.slice(-slice);
  const pending = PRODUCT_REQUESTS.filter((r) => r.status === 'PENDING');
  const isSuper = role === 'super';

  return (
    <div className="page">
      <div className="page-head">
        <div className="ph-l">
          <h2>Overview</h2>
          <span className="ph-sub">{isSuper ? 'Full platform performance across all sellers and stores.' : 'Catalog, orders and approvals performance.'}</span>
        </div>
        <div className="ph-actions">
          <button className="btn btn-outline"><DIcon name="calendar" size={16} /> Jun 2026</button>
          <button className="btn btn-outline" onClick={() => toast('Report exported')}><DIcon name="download" size={16} /> Export</button>
        </div>
      </div>

      <div className="kpi-grid">
        <Kpi icon="coin" tint="tint-violet" label="Revenue (MTD)" value={'OMR ' + NUM(Math.round(REVENUE_SERIES.at(-1)))} delta="+13.6%" deltaDir="up" spark={REVENUE_SERIES.slice(-7)} sparkColor="#7F77DD" />
        <Kpi icon="cart" tint="tint-pink" label="Orders" value={NUM(ORDERS_SERIES.at(-1))} delta="+12.9%" deltaDir="up" spark={ORDERS_SERIES.slice(-7)} sparkColor="#D4537E" />
        <Kpi icon="users" tint="tint-info" label="Customers" value={NUM(12480)} delta="+4.2%" deltaDir="up" spark={[210,260,240,300,340,360,410]} sparkColor="#2A6FDB" />
        <Kpi icon="check-circle" tint="tint-warning" label="Pending approvals" value={pending.length} sub={<a className="viewall" onClick={() => go('approvals')}>Review queue <DIcon name="arrow-right" size={13} /></a>} />
      </div>

      <div className="col-wide">
        <Panel title="Revenue & orders" sub="Monthly gross revenue (OMR)" right={<MiniMonthToggle value={range} onChange={setRange} />}>
          <div className="row" style={{ gap: 20, marginBottom: 6, flexWrap: 'wrap' }}>
            <div className="statline">
              <div className="s"><span className="sv">OMR {NUM(Math.round(rev.reduce((a, b) => a + b, 0)))}</span><span className="sl">Total revenue</span></div>
              <div className="s"><span className="sv">{NUM(ord.reduce((a, b) => a + b, 0))}</span><span className="sl">Total orders</span></div>
              <div className="s"><span className="sv">OMR {OMR(rev.reduce((a, b) => a + b, 0) / ord.reduce((a, b) => a + b, 0))}</span><span className="sl">Avg order value</span></div>
            </div>
          </div>
          <AreaChart data={rev} labels={labs} color="#7F77DD" fmt={(v) => 'OMR ' + NUM(Math.round(v))} height={250} />
        </Panel>

        <Panel title="Sales by category" right={<a className="viewall" onClick={() => go('categories')}>Manage</a>}>
          <div className="row" style={{ justifyContent: 'center', marginBottom: 14 }}>
            <DonutChart data={CATEGORY_SPLIT} centerValue="100%" centerLabel="of sales" />
          </div>
          <div className="legend">
            {CATEGORY_SPLIT.map((c) => (
              <div className="lg" key={c.name}><span className="sw" style={{ background: c.color }}></span>{c.name}<span className="lg-v">{c.value}%</span></div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid-3">
        <Panel title="Top products" right={<a className="viewall" onClick={() => go('products')}>All</a>}>
          <HBars items={TOP_PRODUCTS.map((p) => ({ label: p.name, value: p.sales, color: p.color }))} fmt={(v) => NUM(v) + ' sold'} />
        </Panel>
        <Panel title={isSuper ? 'Top sellers' : 'Top categories'} right={<a className="viewall" onClick={() => go(isSuper ? 'users' : 'categories')}>All</a>}>
          {isSuper
            ? <HBars items={TOP_SELLERS.map((s) => ({ label: s.name, value: s.revenue, color: s.color }))} fmt={(v) => 'OMR ' + NUM(Math.round(v))} />
            : <HBars items={CATEGORY_SPLIT.map((c) => ({ label: c.name, value: c.value, color: c.color }))} fmt={(v) => v + '%'} />}
        </Panel>
        <Panel title="Recent activity" right={<a className="viewall" onClick={() => go('notifications')}>All</a>}>
          <div className="col" style={{ gap: 14 }}>
            {RECENT_ACTIVITY.map((a, i) => (
              <div className="row" key={i} style={{ alignItems: 'flex-start', gap: 11 }}>
                <span className={'kpi-ic ' + a.tint} style={{ width: 32, height: 32, borderRadius: 8, flex: '0 0 auto' }}><DIcon name={a.ic} size={16} /></span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, lineHeight: 1.45 }}>{a.t}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--tx-3)' }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {isSuper && (
        <Panel title="System health" sub="Live service status" right={<span className="badge b-success"><span className="bdot"></span>All systems operational</span>}>
          <div className="grid-3" style={{ gap: 14 }}>
            {[['API gateway', '99.98%', 'b-success'], ['Database', '12ms', 'b-success'], ['Elasticsearch', 'Green', 'b-success'], ['QPay webhook', 'Healthy', 'b-success'], ['Queue depth', '3 jobs', 'b-info'], ['Error rate (24h)', '0.04%', 'b-success']].map(([k, v, b]) => (
              <div className="row" key={k} style={{ justifyContent: 'space-between', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 11 }}>
                <span style={{ fontSize: 13, color: 'var(--tx-2)' }}>{k}</span>
                <span className={'badge ' + b}><span className="bdot"></span>{v}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ── Seller overview ── */
function OverviewSeller({ go, toast }) {
  const rev = SELLER_REVENUE, labs = MONTHS;
  const live = SELLER_PRODUCTS.filter((p) => p.status === 'LIVE').length;
  const pend = SELLER_PRODUCTS.filter((p) => p.status === 'PENDING').length;
  return (
    <div className="page">
      <div className="page-head">
        <div className="ph-l">
          <h2>Welcome back, {SELLER.owner.split(' ')[0]} 👋</h2>
          <span className="ph-sub">{SELLER.shop} · <span className="badge b-success" style={{ marginLeft: 4 }}><span className="bdot"></span>{SELLER.status}</span></span>
        </div>
        <div className="ph-actions">
          <button className="btn btn-primary" onClick={() => go('submit')}><DIcon name="plus" size={16} /> Submit product</button>
        </div>
      </div>

      <div className="kpi-grid">
        <Kpi icon="coin" tint="tint-violet" label="Revenue (MTD)" value={'OMR ' + NUM(Math.round(rev.at(-1)))} delta="+11.5%" deltaDir="up" spark={rev.slice(-7)} />
        <Kpi icon="wallet" tint="tint-success" label="Available balance" value={'OMR ' + OMR(SELLER.balance)} sub={<span>Pending: OMR {OMR(SELLER.pending)}</span>} />
        <Kpi icon="box" tint="tint-info" label="Live products" value={live} sub={<span>{pend} pending approval</span>} />
        <Kpi icon="star" tint="tint-warning" label="Shop rating" value={SELLER.rating.toFixed(1)} sub={<Stars rating={SELLER.rating} />} />
      </div>

      <div className="col-wide">
        <Panel title="Your revenue" sub="Last 12 months (OMR)">
          <AreaChart data={rev} labels={labs} color="#7F77DD" fmt={(v) => 'OMR ' + NUM(Math.round(v))} height={240} />
        </Panel>
        <Panel title="Payout summary" right={<a className="viewall" onClick={() => go('earnings')}>Details</a>}>
          <div className="col" style={{ gap: 0 }}>
            <div className="def-row"><span className="dk">Available now</span><span className="dv">OMR {OMR(SELLER.balance)}</span></div>
            <div className="def-row"><span className="dk">Pending clearance</span><span className="dv">OMR {OMR(SELLER.pending)}</span></div>
            <div className="def-row"><span className="dk">Lifetime earnings</span><span className="dv">OMR {NUM(Math.round(SELLER.lifetime))}</span></div>
            <div className="def-row"><span className="dk">Next payout</span><span className="dv">Jun 25, 2026</span></div>
          </div>
          <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={() => toast('Payout requested')}><DIcon name="bank" size={16} /> Request payout</button>
        </Panel>
      </div>

      <Panel title="Recent orders" right={<a className="viewall" onClick={() => go('seller-orders')}>View all</a>} noBody>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Order</th><th>Product</th><th>Date</th><th className="right">Your earning</th><th>Status</th></tr></thead>
            <tbody>
              {SELLER_ORDERS.slice(0, 5).map((o) => (
                <tr key={o.id}>
                  <td className="mono t-strong">{o.id}</td>
                  <td>{o.product} <span className="t-sub">× {o.qty}</span></td>
                  <td className="t-sub">{o.date}</td>
                  <td className="right t-strong">OMR {OMR(o.earning)}</td>
                  <td><Badge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

Object.assign(window, { OverviewAdmin, OverviewSeller });
