/* ───────────── BRANDHUB Dashboard · Finance (financials, sales, returns, settlements) ───────────── */

function SettlementDrawer({ st, onClose, toast }) {
  return (
    <Modal title={st.id} sub={st.seller + ' · ' + st.period} drawer onClose={onClose}
      footer={st.status !== 'paid'
        ? <><button className="btn btn-ghost" onClick={onClose}>Close</button><div className="spacer"></div>{st.status === 'on_hold' && <button className="btn btn-outline" onClick={() => { toast('Hold released'); onClose(); }}>Release hold</button>}<button className="btn btn-success" onClick={() => { toast('Settlement paid out'); onClose(); }}><DIcon name="bank" size={15} /> Pay OMR {OMR(st.net)}</button></>
        : <><div className="spacer"></div><button className="btn btn-outline" onClick={() => toast('Statement downloaded')}><DIcon name="download" size={15} /> Statement</button></>}>
      <div className="row" style={{ gap: 11 }}>
        <Avatar name={st.seller} variant="grad" size={42} />
        <div><div className="t-strong">{st.seller}</div><div className="t-sub">{st.orders} orders · {st.period}</div></div>
        <span style={{ marginLeft: 'auto' }}><Badge status={st.status} label={{ paid: 'Paid', pending: 'Pending', on_hold: 'On hold' }[st.status]} /></span>
      </div>

      <div className="form-section-title" style={{ marginTop: 0 }}>Settlement breakdown</div>
      <div className="deflist">
        <div className="def-row"><span className="dk">Gross sales</span><span className="dv">OMR {OMR(st.gross)}</span></div>
        <div className="def-row"><span className="dk">Platform commission</span><span className="dv" style={{ color: 'var(--danger)' }}>− OMR {OMR(st.fees)}</span></div>
        <div className="def-row"><span className="dk">Refunds / chargebacks</span><span className="dv" style={{ color: 'var(--danger)' }}>− OMR {OMR(st.refunds)}</span></div>
        <div className="def-row"><span className="dk" style={{ fontWeight: 700, color: 'var(--ink)' }}>Net payout</span><span className="dv" style={{ fontSize: 16, color: 'var(--success)' }}>OMR {OMR(st.net)}</span></div>
      </div>

      <div className="form-section-title">Payout method</div>
      <div className="row" style={{ gap: 11, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 11 }}>
        <span className="kpi-ic tint-ink" style={{ width: 38, height: 38 }}><DIcon name="bank" size={18} /></span>
        <div><div className="t-strong">{st.method}</div><div className="t-sub">{st.paidOn ? 'Paid on ' + st.paidOn : 'Scheduled for next run'}</div></div>
      </div>

      {st.status === 'on_hold' && <div className="callout warning"><span className="ic"><DIcon name="alert" size={16} /></span>This settlement is on hold pending refund dispute review.</div>}
    </Modal>
  );
}

function FinanceView({ role, toast }) {
  const [tab, setTab] = React.useState('overview');
  const [range, setRange] = React.useState('12M');
  const [stOpen, setStOpen] = React.useState(null);
  const [retTab, setRetTab] = React.useState('all');
  const [txType, setTxType] = React.useState('all');

  const slice = range === '6M' ? 6 : 12;
  const labs = MONTHS.slice(-slice);
  const gross = REVENUE_SERIES.slice(-slice), net = NET_SERIES.slice(-slice), refs = REFUNDS_SERIES.slice(-slice);

  const pendingStl = SETTLEMENTS.filter((s) => s.status !== 'paid');
  const pendingStlTotal = pendingStl.reduce((s, x) => s + x.net, 0);
  const retCounts = { pending: 0, approved: 0, refunded: 0, rejected: 0 };
  RETURNS.forEach((r) => { if (retCounts[r.status] != null) retCounts[r.status]++; });
  const retList = RETURNS.filter((r) => retTab === 'all' || r.status === retTab);
  const txList = TRANSACTIONS.filter((t) => txType === 'all' || t.type === txType);

  const TABS = [
    ['overview', 'Financial overview', 'chart-pie'],
    ['sales', 'Sales', 'trend-up'],
    ['returns', 'Returns & refunds', 'refresh'],
    ['settlements', 'Seller settlements', 'bank'],
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div className="ph-l"><h2>Finance</h2><span className="ph-sub">Financials, sales, returns and seller settlements</span></div>
        <div className="ph-actions">
          <div className="seg">{['6M', '12M'].map((v) => <button key={v} className={range === v ? 'on' : ''} onClick={() => setRange(v)}>{v}</button>)}</div>
          <button className="btn btn-outline" onClick={() => toast('Financial report exported')}><DIcon name="download" size={16} /> Export</button>
        </div>
      </div>

      <div className="tabs">
        {TABS.map(([k, l, ic]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><DIcon name={ic} size={15} /> {l}</button>)}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <React.Fragment>
          <div className="kpi-grid">
            <Kpi icon="coin" tint="tint-violet" label="Gross revenue" value={'OMR ' + NUM(Math.round(FINANCE_KPI.grossRevenue))} delta="+13.6%" deltaDir="up" spark={gross.slice(-7)} />
            <Kpi icon="wallet" tint="tint-success" label="Net revenue" value={'OMR ' + NUM(Math.round(FINANCE_KPI.netRevenue))} delta="+11.2%" deltaDir="up" spark={net.slice(-7)} sparkColor="#1F9D62" />
            <Kpi icon="percent" tint="tint-info" label="Platform fees" value={'OMR ' + NUM(Math.round(FINANCE_KPI.platformFees))} sub={<span>~15% commission</span>} />
            <Kpi icon="refresh" tint="tint-pink" label="Refunds" value={'OMR ' + NUM(Math.round(FINANCE_KPI.refundsTotal))} delta="−4.1%" deltaDir="down" spark={refs.slice(-7)} sparkColor="#D4537E" />
          </div>

          <div className="col-wide">
            <Panel title="Revenue vs refunds" sub="Gross revenue against refunds (OMR)">
              <div className="row" style={{ gap: 18, marginBottom: 8, flexWrap: 'wrap' }}>
                <span className="badge b-violet"><span className="bdot"></span>Gross revenue</span>
                <span className="badge b-danger"><span className="bdot"></span>Refunds</span>
              </div>
              <AreaChart data={gross} labels={labs} color="#7F77DD" compareData={refs} compareColor="#D4537E" fmt={(v) => 'OMR ' + NUM(Math.round(v))} height={250} />
            </Panel>
            <Panel title="Payment methods" sub="Share of collected revenue">
              <div className="row" style={{ justifyContent: 'center', marginBottom: 14 }}><DonutChart data={PAYMENT_SPLIT} centerValue="100%" centerLabel="collected" /></div>
              <div className="legend">{PAYMENT_SPLIT.map((c) => <div className="lg" key={c.name}><span className="sw" style={{ background: c.color }}></span>{c.name}<span className="lg-v">{c.value}%</span></div>)}</div>
            </Panel>
          </div>

          <div className="grid-3">
            <Panel title="VAT collected" sub="5% — for tax filing"><div className="statline"><div className="s"><span className="sv">OMR {NUM(Math.round(FINANCE_KPI.vatCollected))}</span><span className="sl">This period</span></div></div></Panel>
            <Panel title="Pending settlements" right={<a className="viewall" onClick={() => setTab('settlements')}>Pay</a>}><div className="statline"><div className="s"><span className="sv">OMR {NUM(Math.round(pendingStlTotal))}</span><span className="sl">{pendingStl.length} sellers awaiting</span></div></div></Panel>
            <Panel title="COD collected" sub="Cash on delivery"><div className="statline"><div className="s"><span className="sv">OMR {NUM(Math.round(FINANCE_KPI.codCollected))}</span><span className="sl">Reconciled with couriers</span></div></div></Panel>
          </div>

          <Panel title="Transactions ledger" right={<Select value={txType} onChange={setTxType} options={[{ value: 'all', label: 'All types' }, { value: 'sale', label: 'Sales' }, { value: 'fee', label: 'Fees' }, { value: 'refund', label: 'Refunds' }, { value: 'settlement', label: 'Settlements' }]} />} noBody>
            <div className="tbl-wrap"><table className="tbl">
              <thead><tr><th>Txn ID</th><th>Date</th><th>Type</th><th>Description</th><th>Method</th><th className="right">Amount</th></tr></thead>
              <tbody>
                {txList.map((t) => (
                  <tr key={t.id}>
                    <td className="mono t-strong">{t.id}</td>
                    <td className="t-sub">{t.date}</td>
                    <td><span className={'badge ' + (t.type === 'sale' ? 'b-success' : t.type === 'refund' ? 'b-danger' : t.type === 'fee' ? 'b-info' : 'b-violet')}>{t.type}</span></td>
                    <td>{t.desc}</td>
                    <td className="t-sub">{t.method}</td>
                    <td className="right t-strong" style={{ color: t.dir === 'out' ? 'var(--danger)' : 'var(--success)' }}>{t.dir === 'out' ? '−' : '+'} OMR {OMR(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </Panel>
        </React.Fragment>
      )}

      {/* ── SALES ── */}
      {tab === 'sales' && (
        <React.Fragment>
          <div className="kpi-grid">
            <Kpi icon="cart" tint="tint-violet" label="Orders" value={NUM(ORDERS_SERIES.slice(-slice).reduce((a, b) => a + b, 0))} delta="+12.9%" deltaDir="up" />
            <Kpi icon="coin" tint="tint-success" label="Sales volume" value={'OMR ' + NUM(Math.round(gross.reduce((a, b) => a + b, 0)))} delta="+13.6%" deltaDir="up" />
            <Kpi icon="trend-up" tint="tint-info" label="Avg order value" value={'OMR ' + OMR(gross.reduce((a, b) => a + b, 0) / ORDERS_SERIES.slice(-slice).reduce((a, b) => a + b, 0))} />
            <Kpi icon="store" tint="tint-warning" label="Active sellers" value={47} sub={<span>+5 this month</span>} />
          </div>
          <Panel title="Monthly sales volume" sub="Gross sales (OMR)">
            <BarChart data={gross} labels={labs} color="#7F77DD" fmt={(v) => 'OMR ' + NUM(Math.round(v))} height={250} />
          </Panel>
          <div className="grid-2">
            <Panel title="Top sellers by revenue" right={<a className="viewall" onClick={() => setTab('settlements')}>Settle</a>}>
              <HBars items={TOP_SELLERS.map((s) => ({ label: s.name, value: s.revenue, color: s.color }))} fmt={(v) => 'OMR ' + NUM(Math.round(v))} />
            </Panel>
            <Panel title="Top products" right={<a className="viewall" onClick={() => toast('Open products')}>All</a>}>
              <HBars items={TOP_PRODUCTS.map((p) => ({ label: p.name, value: p.sales, color: p.color }))} fmt={(v) => NUM(v) + ' sold'} />
            </Panel>
          </div>
        </React.Fragment>
      )}

      {/* ── RETURNS ── */}
      {tab === 'returns' && (
        <React.Fragment>
          <div className="kpi-grid">
            <Kpi icon="refresh" tint="tint-warning" label="Open requests" value={retCounts.pending} sub={<span>Awaiting decision</span>} />
            <Kpi icon="check-circle" tint="tint-info" label="Approved" value={retCounts.approved} />
            <Kpi icon="coin" tint="tint-pink" label="Refunded value" value={'OMR ' + OMR(RETURNS.filter((r) => r.status === 'refunded').reduce((s, r) => s + r.amount, 0))} />
            <Kpi icon="percent" tint="tint-violet" label="Return rate" value="2.4%" delta="−0.3%" deltaDir="down" />
          </div>
          <Panel noBody>
            <div className="panel-head" style={{ border: 'none', paddingBottom: 0 }}>
              <div className="tabs" style={{ width: '100%' }}>
                {[['all', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['refunded', 'Refunded'], ['rejected', 'Rejected']].map(([k, l]) => (
                  <button key={k} className={retTab === k ? 'on' : ''} onClick={() => setRetTab(k)}>{l}{k !== 'all' && retCounts[k] != null && <span className="cnt">{retCounts[k]}</span>}</button>
                ))}
              </div>
            </div>
            <div className="tbl-wrap"><table className="tbl">
              <thead><tr><th>Return ID</th><th>Product</th><th>Customer</th><th>Seller</th><th>Reason</th><th className="right">Amount</th><th>Type</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {retList.map((r) => (
                  <tr key={r.id}>
                    <td className="mono t-strong">{r.id}<div className="t-sub">{r.order}</div></td>
                    <td><div className="t-cell"><Thumb tone={r.tone} size={38} /><span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.product}</span></div></td>
                    <td>{r.customer}</td>
                    <td className="t-sub">{r.seller}</td>
                    <td className="t-sub" style={{ maxWidth: 160 }}>{r.reason}</td>
                    <td className="right t-strong">OMR {OMR(r.amount)}</td>
                    <td><span className={'badge ' + (r.type === 'exchange' ? 'b-violet' : 'b-info')}>{r.type}</span></td>
                    <td><Badge status={r.status} label={r.status.charAt(0).toUpperCase() + r.status.slice(1)} /></td>
                    <td>
                      {r.status === 'pending'
                        ? <div className="row gap-sm" style={{ justifyContent: 'flex-end' }}>
                            <button className="btn btn-success btn-sm" onClick={() => toast('Refund approved & issued')}><DIcon name="check" size={14} /></button>
                            <button className="btn btn-danger btn-sm" onClick={() => toast('Return rejected')}><DIcon name="x" size={14} /></button>
                          </div>
                        : <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn-icon" onClick={() => toast('View ' + r.id)}><DIcon name="eye" size={16} /></button></div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            {retList.length === 0 && <EmptyState icon="refresh" title="No returns here" />}
          </Panel>
        </React.Fragment>
      )}

      {/* ── SETTLEMENTS ── */}
      {tab === 'settlements' && (
        <React.Fragment>
          <div className="kpi-grid">
            <Kpi icon="clock" tint="tint-warning" label="Pending payout" value={'OMR ' + NUM(Math.round(pendingStlTotal))} sub={<span>{pendingStl.length} settlements</span>} />
            <Kpi icon="bank" tint="tint-success" label="Paid (period)" value={'OMR ' + NUM(Math.round(SETTLEMENTS.filter((s) => s.status === 'paid').reduce((s, x) => s + x.net, 0)))} />
            <Kpi icon="percent" tint="tint-violet" label="Commission earned" value={'OMR ' + NUM(Math.round(SETTLEMENTS.reduce((s, x) => s + x.fees, 0)))} />
            <Kpi icon="alert" tint="tint-pink" label="On hold" value={SETTLEMENTS.filter((s) => s.status === 'on_hold').length} />
          </div>
          <Panel title="Seller settlements" sub="Net payouts per seller per period" right={<button className="btn btn-primary btn-sm" onClick={() => toast('Bulk payout initiated for ' + pendingStl.length + ' sellers')}><DIcon name="bank" size={14} /> Run payout</button>} noBody>
            <div className="tbl-wrap"><table className="tbl">
              <thead><tr><th>Settlement</th><th>Seller</th><th>Period</th><th className="right">Gross</th><th className="right">Fees</th><th className="right">Refunds</th><th className="right">Net payout</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {SETTLEMENTS.map((s) => (
                  <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => setStOpen(s)}>
                    <td className="mono t-strong">{s.id}</td>
                    <td><div className="t-cell"><Avatar name={s.seller} size={30} /><span>{s.seller}</span></div></td>
                    <td className="t-sub">{s.period}<div className="t-sub">{s.orders} orders</div></td>
                    <td className="right">OMR {OMR(s.gross)}</td>
                    <td className="right" style={{ color: 'var(--danger)' }}>− {OMR(s.fees)}</td>
                    <td className="right" style={{ color: 'var(--danger)' }}>− {OMR(s.refunds)}</td>
                    <td className="right t-strong" style={{ color: 'var(--success)' }}>OMR {OMR(s.net)}</td>
                    <td><Badge status={s.status} label={{ paid: 'Paid', pending: 'Pending', on_hold: 'On hold' }[s.status]} /></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {s.status === 'paid'
                        ? <button className="btn-icon" onClick={() => setStOpen(s)}><DIcon name="eye" size={16} /></button>
                        : <button className="btn btn-success btn-sm" onClick={() => toast('Paid OMR ' + OMR(s.net) + ' to ' + s.seller)}><DIcon name="bank" size={14} /> Pay</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </Panel>
        </React.Fragment>
      )}

      {stOpen && <SettlementDrawer st={stOpen} onClose={() => setStOpen(null)} toast={toast} />}
    </div>
  );
}

Object.assign(window, { FinanceView });
