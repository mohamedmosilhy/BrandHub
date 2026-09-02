/* ───────────── BRANDHUB Dashboard · Orders management ───────────── */

const STATUS_FLOW = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

function OrderDrawer({ order, onClose, toast }) {
  const [status, setStatus] = React.useState(order.status);
  const items = ORDER_ITEMS;
  const sub = items.reduce((s, it) => s + it.price * it.qty, 0);
  const stepIdx = STATUS_FLOW.indexOf(status);
  return (
    <Modal title={order.id} sub={order.date + ' · ' + order.payment} drawer onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Close</button><div className="spacer"></div><button className="btn btn-outline" onClick={() => toast('Invoice downloaded')}><DIcon name="download" size={15} /> Invoice</button></>}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="t-cell"><Avatar name={order.customer} variant="grad" size={42} /><div><div className="t-strong">{order.customer}</div><div className="t-sub">{order.email}</div></div></div>
        <Badge status={order.status === 'CANCELLED' ? 'CANCELLED' : status} />
      </div>

      {order.status !== 'CANCELLED' && (
        <div className="panel" style={{ boxShadow: 'none' }}>
          <div className="panel-body">
            <div className="form-section-title" style={{ marginTop: 0, marginBottom: 12 }}>Update status</div>
            <div className="timeline">
              {STATUS_FLOW.map((s, i) => (
                <div key={s} className={'tl-row ' + (i < stepIdx ? 'done' : i === stepIdx ? 'current' : '')}>
                  <div className="tl-mark"><span className="tl-dot">{i < stepIdx ? <DIcon name="check" size={14} /> : i + 1}</span><span className="tl-line"></span></div>
                  <div className="tl-body"><div className="tl-t">{s.charAt(0) + s.slice(1).toLowerCase()}</div><div className="tl-s">{i <= stepIdx ? 'Done' : 'Pending'}</div></div>
                </div>
              ))}
            </div>
            <div className="row" style={{ gap: 8, marginTop: 8 }}>
              {stepIdx < STATUS_FLOW.length - 1 && <button className="btn btn-primary" onClick={() => { const n = STATUS_FLOW[stepIdx + 1]; setStatus(n); toast('Order marked ' + n); }}><DIcon name="arrow-right" size={15} /> Mark {STATUS_FLOW[stepIdx + 1]}</button>}
              <button className="btn btn-danger" onClick={() => toast('Order cancelled & refunded')}><DIcon name="x" size={15} /> Cancel order</button>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="form-section-title" style={{ marginBottom: 12 }}>Items ({order.items})</div>
        <div className="col" style={{ gap: 12 }}>
          {items.map((it, i) => (
            <div className="row" key={i} style={{ gap: 11 }}>
              <Thumb tone={it.tone} size={46} />
              <div style={{ minWidth: 0, flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{it.product}</div><div className="t-sub">{it.variant} · Qty {it.qty}</div></div>
              <div className="t-strong nowrap">OMR {OMR(it.price * it.qty)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="deflist">
        <div className="def-row"><span className="dk">Subtotal</span><span className="dv">OMR {OMR(sub)}</span></div>
        <div className="def-row"><span className="dk">Shipping</span><span className="dv" style={{ color: 'var(--success)' }}>Free</span></div>
        <div className="def-row"><span className="dk">VAT (incl.)</span><span className="dv">OMR {OMR(sub * 0.05)}</span></div>
        <div className="def-row"><span className="dk" style={{ fontWeight: 700, color: 'var(--ink)' }}>Total</span><span className="dv" style={{ fontSize: 16 }}>OMR {OMR(order.total)}</span></div>
      </div>

      <div className="callout info"><span className="ic"><DIcon name="truck" size={16} /></span>Hub Express — Muscat, Al Khoudh · expected delivery today before 9 PM.</div>
    </Modal>
  );
}

function OrdersView({ toast }) {
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [pay, setPay] = React.useState('all');
  const [open, setOpen] = React.useState(null);
  const [page, setPage] = React.useState(1);
  const per = 8;

  let list = ORDERS.filter((o) =>
    (!q || o.id.toLowerCase().includes(q.toLowerCase()) || o.customer.toLowerCase().includes(q.toLowerCase())) &&
    (status === 'all' || o.status === status) &&
    (pay === 'all' || o.payment === pay));
  const pages = Math.ceil(list.length / per) || 1;
  const view = list.slice((page - 1) * per, page * per);

  const counts = ORDER_STATUSES.reduce((m, s) => { m[s] = ORDERS.filter((o) => o.status === s).length; return m; }, {});
  const revenue = ORDERS.filter((o) => o.status !== 'CANCELLED').reduce((s, o) => s + o.total, 0);

  return (
    <div className="page">
      <div className="page-head">
        <div className="ph-l"><h2>Orders</h2><span className="ph-sub">{ORDERS.length} orders · OMR {NUM(Math.round(revenue))} processed</span></div>
        <div className="ph-actions"><button className="btn btn-outline" onClick={() => toast('Exported orders')}><DIcon name="download" size={16} /> Export</button></div>
      </div>

      <div className="kpi-grid">
        <Kpi icon="clock" tint="tint-warning" label="Pending" value={counts.PENDING} />
        <Kpi icon="check-circle" tint="tint-info" label="Confirmed" value={counts.CONFIRMED} />
        <Kpi icon="truck" tint="tint-violet" label="Shipped" value={counts.SHIPPED} />
        <Kpi icon="package-check" tint="tint-success" label="Delivered" value={counts.DELIVERED} />
      </div>

      <Panel noBody>
        <div className="panel-head">
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search order or customer…" width={240} />
          <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: 'all', label: 'All status' }, ...ORDER_STATUSES.map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() }))]} />
          <Select value={pay} onChange={(v) => { setPay(v); setPage(1); }} options={[{ value: 'all', label: 'All payments' }, { value: 'Wallet', label: 'Wallet' }, { value: 'QPay Card', label: 'QPay Card' }, { value: 'Cash on Delivery', label: 'Cash on Delivery' }]} />
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th className="right">Items</th><th>Payment</th><th className="right">Total</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {view.map((o) => (
                <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setOpen(o)}>
                  <td className="mono t-strong">{o.id}</td>
                  <td><div className="t-cell"><Avatar name={o.customer} size={30} /><span>{o.customer}</span></div></td>
                  <td className="t-sub">{o.date}</td>
                  <td className="right num">{o.items}</td>
                  <td><span className="tag">{o.payment}</span></td>
                  <td className="right t-strong">OMR {OMR(o.total)}</td>
                  <td><Badge status={o.status} /></td>
                  <td><button className="btn-icon" onClick={(e) => { e.stopPropagation(); setOpen(o); }}><DIcon name="chev-right" size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {view.length === 0 && <EmptyState icon="cart" title="No orders found" text="Adjust filters to see more." />}
        <Pagination page={page} pages={pages} total={list.length} onPage={setPage} perLabel="orders" />
      </Panel>

      {open && <OrderDrawer order={open} onClose={() => setOpen(null)} toast={toast} />}
    </div>
  );
}

Object.assign(window, { OrdersView });
