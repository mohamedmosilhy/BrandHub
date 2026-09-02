/* ───────────── BRANDHUB Dashboard · Coupons, Reviews, Notifications ───────────── */

function CouponsView({ toast }) {
  const [modal, setModal] = React.useState(false);
  const active = COUPONS.filter((c) => c.status === 'active').length;
  const redemptions = COUPONS.reduce((s, c) => s + c.used, 0);
  return (
    <div className="page">
      <div className="page-head">
        <div className="ph-l"><h2>Coupons</h2><span className="ph-sub">{COUPONS.length} coupons · {NUM(redemptions)} total redemptions</span></div>
        <div className="ph-actions"><button className="btn btn-primary" onClick={() => setModal(true)}><DIcon name="plus" size={16} /> New coupon</button></div>
      </div>

      <div className="kpi-grid">
        <Kpi icon="ticket" tint="tint-violet" label="Active coupons" value={active} />
        <Kpi icon="percent" tint="tint-pink" label="Redemptions" value={NUM(redemptions)} delta="+8.1%" deltaDir="up" />
        <Kpi icon="coin" tint="tint-warning" label="Discount given" value={'OMR ' + NUM(14820)} />
        <Kpi icon="trend-up" tint="tint-success" label="Conversion lift" value="+18%" />
      </div>

      <Panel noBody>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Code</th><th>Discount</th><th className="right">Min. order</th><th>Usage</th><th>Expiry</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {COUPONS.map((c) => (
                <tr key={c.code}>
                  <td><span className="tag code" style={{ fontWeight: 700, color: 'var(--ink)' }}><DIcon name="ticket" size={13} /> {c.code}</span></td>
                  <td className="t-strong">{c.type === 'percent' ? c.value + '% off' : 'OMR ' + OMR(c.value) + ' off'}</td>
                  <td className="right">{c.minOrder ? 'OMR ' + OMR(c.minOrder) : '—'}</td>
                  <td style={{ minWidth: 150 }}>
                    <div className="t-sub" style={{ marginBottom: 4 }}>{NUM(c.used)}{c.limit ? ' / ' + NUM(c.limit) : ' (no limit)'}</div>
                    {c.limit > 0 && <div className="bar-track"><span className="bar-fill" style={{ width: Math.min(100, (c.used / c.limit) * 100) + '%' }}></span></div>}
                  </td>
                  <td className="t-sub">{c.expiry}</td>
                  <td><Badge status={c.status} label={c.status.charAt(0).toUpperCase() + c.status.slice(1)} /></td>
                  <td>
                    <div className="row-actions">
                      <button className="btn-icon" onClick={() => { navigator.clipboard && navigator.clipboard.writeText(c.code); toast('Code copied'); }}><DIcon name="copy" size={16} /></button>
                      <button className="btn-icon" onClick={() => setModal(true)}><DIcon name="edit" size={16} /></button>
                      <button className="btn-icon danger" onClick={() => toast('Coupon deleted')}><DIcon name="trash" size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {modal && (
        <Modal title="New coupon" onClose={() => setModal(false)} footer={<><div className="spacer"></div><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={() => { toast('Coupon created'); setModal(false); }}>Create</button></>}>
          <div className="form-grid">
            <div className="field full"><label>Code <span className="req">*</span></label><input placeholder="e.g. SUMMER25" style={{ textTransform: 'uppercase' }} /></div>
            <div className="field"><label>Type</label><div className="selectwrap" style={{ width: '100%' }}><select style={{ width: '100%' }}><option>Percentage</option><option>Fixed amount</option></select><span className="chev"><DIcon name="chev-down" size={15} /></span></div></div>
            <div className="field"><label>Value</label><input type="number" placeholder="25" /></div>
            <div className="field"><label>Min. order (OMR)</label><input type="number" step="0.001" placeholder="0.000" /></div>
            <div className="field"><label>Usage limit</label><input type="number" placeholder="0 = unlimited" /></div>
            <div className="field full"><label>Expiry date</label><input type="date" /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ReviewsView({ toast }) {
  const [tab, setTab] = React.useState('all');
  const counts = { published: 0, pending: 0, flagged: 0 };
  REVIEWS.forEach((r) => counts[r.status]++);
  const list = REVIEWS.filter((r) => tab === 'all' || r.status === tab);
  return (
    <div className="page">
      <div className="page-head">
        <div className="ph-l"><h2>Reviews</h2><span className="ph-sub">Moderate customer product reviews</span></div>
      </div>

      <div className="kpi-grid">
        <Kpi icon="star" tint="tint-warning" label="Avg rating" value="4.5" sub={<Stars rating={4.5} />} />
        <Kpi icon="message" tint="tint-violet" label="Total reviews" value={NUM(18420)} />
        <Kpi icon="clock" tint="tint-info" label="Pending" value={counts.pending} />
        <Kpi icon="flag" tint="tint-pink" label="Flagged" value={counts.flagged} />
      </div>

      <div className="tabs">
        {[['all', 'All'], ['published', 'Published'], ['pending', 'Pending'], ['flagged', 'Flagged']].map(([k, l]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}{k !== 'all' && <span className="cnt">{counts[k]}</span>}</button>
        ))}
      </div>

      <div className="col" style={{ gap: 12 }}>
        {list.map((r) => (
          <section className="panel" key={r.id}><div className="panel-body">
            <div className="row" style={{ alignItems: 'flex-start', gap: 12 }}>
              <Avatar name={r.customer} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <span className="t-strong">{r.customer}</span>
                  <Stars rating={r.rating} />
                  <Badge status={r.status} label={r.status.charAt(0).toUpperCase() + r.status.slice(1)} />
                  <span className="t-sub" style={{ marginLeft: 'auto' }}>{r.date}</span>
                </div>
                <div className="t-sub" style={{ margin: '3px 0 8px' }}>on <b style={{ color: 'var(--tx-2)' }}>{r.product}</b></div>
                <p style={{ fontSize: 13.5, color: 'var(--tx-2)', lineHeight: 1.6 }}>{r.text}</p>
                <div className="row gap-sm" style={{ marginTop: 12 }}>
                  {r.status !== 'published' && <button className="btn btn-success btn-sm" onClick={() => toast('Review published')}><DIcon name="check" size={14} /> Publish</button>}
                  {r.status !== 'flagged' && <button className="btn btn-outline btn-sm" onClick={() => toast('Review flagged')}><DIcon name="flag" size={14} /> Flag</button>}
                  <button className="btn btn-danger btn-sm" onClick={() => toast('Review removed')}><DIcon name="trash" size={14} /> Remove</button>
                </div>
              </div>
            </div>
          </div></section>
        ))}
        {list.length === 0 && <Panel><EmptyState icon="message" title="No reviews here" /></Panel>}
      </div>
    </div>
  );
}

function NotificationsView({ toast }) {
  const [items, setItems] = React.useState(NOTIFICATIONS);
  const icon = { approval: 'check-circle', order: 'cart', stock: 'box', review: 'star-line', user: 'user', payout: 'wallet' };
  const tint = { approval: 'tint-success', order: 'tint-violet', stock: 'tint-warning', review: 'tint-pink', user: 'tint-info', payout: 'tint-ink' };
  const unread = items.filter((n) => !n.read).length;
  return (
    <div className="page">
      <div className="page-head">
        <div className="ph-l"><h2>Notifications</h2><span className="ph-sub">{unread} unread</span></div>
        <div className="ph-actions"><button className="btn btn-outline" onClick={() => { setItems((p) => p.map((n) => ({ ...n, read: true }))); toast('All marked read'); }}><DIcon name="check" size={16} /> Mark all read</button></div>
      </div>
      <Panel noBody>
        {items.map((n) => (
          <div className="row" key={n.id} style={{ gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--border)', background: n.read ? '#fff' : 'var(--accent-light)', alignItems: 'flex-start' }}>
            <span className={'kpi-ic ' + tint[n.type]} style={{ width: 38, height: 38 }}><DIcon name={icon[n.type]} size={18} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row" style={{ gap: 8 }}><span className="t-strong">{n.title}</span>{!n.read && <span className="bdot" style={{ background: 'var(--accent)', width: 7, height: 7, borderRadius: '50%' }}></span>}<span className="t-sub" style={{ marginLeft: 'auto' }}>{n.time}</span></div>
              <div style={{ fontSize: 13, color: 'var(--tx-2)', marginTop: 2 }}>{n.msg}</div>
            </div>
            {!n.read && <button className="btn-icon" onClick={() => setItems((p) => p.map((x) => x.id === n.id ? { ...x, read: true } : x))}><DIcon name="check" size={16} /></button>}
          </div>
        ))}
      </Panel>
    </div>
  );
}

Object.assign(window, { CouponsView, ReviewsView, NotificationsView });
