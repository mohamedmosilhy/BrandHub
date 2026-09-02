/* ───────────── BRANDHUB Dashboard · Seller views ───────────── */

function SellerProductsView({ go, toast }) {
  const [tab, setTab] = React.useState('ALL');
  const counts = { LIVE: 0, PENDING: 0, OUT: 0, REJECTED: 0 };
  SELLER_PRODUCTS.forEach((p) => counts[p.status]++);
  const list = SELLER_PRODUCTS.filter((p) => tab === 'ALL' || p.status === tab);
  const label = { LIVE: 'Live', OUT: 'Out of stock', PENDING: 'In review', REJECTED: 'Rejected' };
  return (
    <div className="page">
      <div className="page-head">
        <div className="ph-l"><h2>My products</h2><span className="ph-sub">{SELLER_PRODUCTS.length} listings · {counts.PENDING} awaiting approval</span></div>
        <div className="ph-actions"><button className="btn btn-primary" onClick={() => go('submit')}><DIcon name="plus" size={16} /> Submit product</button></div>
      </div>

      <Panel noBody>
        <div className="panel-head" style={{ border: 'none', paddingBottom: 0 }}>
          <div className="tabs" style={{ width: '100%' }}>
            {[['ALL', 'All'], ['LIVE', 'Live'], ['PENDING', 'In review'], ['OUT', 'Out of stock'], ['REJECTED', 'Rejected']].map(([k, l]) => (
              <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}{k !== 'ALL' && <span className="cnt">{counts[k]}</span>}</button>
            ))}
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Product</th><th>Category</th><th className="right">Price</th><th className="right">Stock</th><th className="right">Sold</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td><div className="t-cell"><Thumb tone={p.tone} size={42} /><div><div className="t-strong" style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div><div className="t-sub mono">{p.sku}</div></div></div></td>
                  <td><span className="tag">{p.category}</span></td>
                  <td className="right t-strong">OMR {OMR(p.price)}</td>
                  <td className="right">{p.stock === 0 ? <span className="badge b-warning">Out</span> : NUM(p.stock)}</td>
                  <td className="right num">{NUM(p.sold)}</td>
                  <td><Badge status={p.status} label={label[p.status]} /></td>
                  <td>
                    <div className="row-actions">
                      {p.status === 'REJECTED'
                        ? <button className="btn btn-outline btn-sm" onClick={() => go('submit')}>Resubmit</button>
                        : <button className="btn-icon" onClick={() => toast('Editing ' + p.sku)}><DIcon name="edit" size={16} /></button>}
                      <Menu trigger={<button className="btn-icon"><DIcon name="dots" size={16} /></button>}>
                        <button onClick={() => toast('Viewing')}><DIcon name="eye" size={15} /> View</button>
                        <button onClick={() => toast('Stock updated')}><DIcon name="layers" size={15} /> Update stock</button>
                        <div className="sep"></div>
                        <button className="danger" onClick={() => toast('Listing removed')}><DIcon name="trash" size={15} /> Remove</button>
                      </Menu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list.length === 0 && <EmptyState icon="box" title="No products here" action={<button className="btn btn-primary" onClick={() => go('submit')}><DIcon name="plus" size={16} /> Submit a product</button>} />}
      </Panel>
    </div>
  );
}

function SubmitProductView({ go, toast }) {
  const [variants, setVariants] = React.useState([{ name: '16GB RAM', sku: 'GL-RTX-16', price: '1099.990', stock: '15' }]);
  const addVariant = () => setVariants((v) => [...v, { name: '', sku: '', price: '', stock: '' }]);
  const rmVariant = (i) => setVariants((v) => v.filter((_, idx) => idx !== i));
  const upd = (i, k, val) => setVariants((v) => v.map((x, idx) => idx === i ? { ...x, [k]: val } : x));
  const submit = () => { toast('Product submitted for review'); go('seller-products'); };
  return (
    <div className="page">
      <div className="page-head">
        <div className="ph-l">
          <span className="t-sub" style={{ cursor: 'pointer' }} onClick={() => go('seller-products')}>‹ My products</span>
          <h2>Submit a product</h2>
        </div>
      </div>

      <div className="callout violet"><span className="ic"><DIcon name="info" size={16} /></span>Submitted products go to BRANDHUB admin review. Pricing and seller percentage may be adjusted before publishing.</div>

      <div className="col-wide">
        <div className="col" style={{ gap: 18 }}>
          <Panel title="Product details">
            <div className="form-grid">
              <div className="field full"><label>Product name <span className="req">*</span></label><input placeholder="e.g. Gaming Laptop RTX 4060" /></div>
              <div className="field"><label>Category <span className="req">*</span></label><div className="selectwrap" style={{ width: '100%' }}><select style={{ width: '100%' }}>{CATEGORIES.filter((c) => c.parent).map((c) => <option key={c.id}>{c.name}</option>)}</select><span className="chev"><DIcon name="chev-down" size={15} /></span></div></div>
              <div className="field"><label>Brand</label><input placeholder="Brand name" /></div>
              <div className="field full"><label>Short description</label><input placeholder="One-line summary shown in listings" /></div>
              <div className="field full"><label>Full description</label><textarea rows={4} placeholder="Describe features, specs, what's in the box…"></textarea></div>
            </div>
          </Panel>

          <Panel title="Pricing" sub="Set your prices in OMR">
            <div className="form-grid">
              <div className="field"><label>Base price (OMR) <span className="req">*</span></label><input type="number" step="0.001" placeholder="1299.990" /></div>
              <div className="field"><label>Sale price (OMR)</label><input type="number" step="0.001" placeholder="1099.990" /></div>
              <div className="field full"><label>Requested seller percentage</label><div className="with-lead"><input type="number" defaultValue={70} /><span className="suffix">% to you · 30% platform</span></div><span className="help">Final percentage is confirmed by admin during review.</span></div>
            </div>
          </Panel>

          <Panel title="Variants" right={<button className="btn btn-outline btn-sm" onClick={addVariant}><DIcon name="plus" size={14} /> Add variant</button>}>
            <div className="col" style={{ gap: 10 }}>
              {variants.map((v, i) => (
                <div className="row" key={i} style={{ gap: 8, alignItems: 'flex-end' }}>
                  <div className="field" style={{ flex: 2 }}><label>{i === 0 ? 'Name' : ''}</label><input value={v.name} onChange={(e) => upd(i, 'name', e.target.value)} placeholder="e.g. 16GB RAM" /></div>
                  <div className="field" style={{ flex: 2 }}><label>{i === 0 ? 'SKU' : ''}</label><input value={v.sku} onChange={(e) => upd(i, 'sku', e.target.value)} placeholder="SKU" /></div>
                  <div className="field" style={{ flex: 1.4 }}><label>{i === 0 ? 'Price' : ''}</label><input value={v.price} onChange={(e) => upd(i, 'price', e.target.value)} placeholder="0.000" /></div>
                  <div className="field" style={{ flex: 1 }}><label>{i === 0 ? 'Stock' : ''}</label><input value={v.stock} onChange={(e) => upd(i, 'stock', e.target.value)} placeholder="0" /></div>
                  <button className="btn-icon danger" style={{ marginBottom: 3 }} onClick={() => rmVariant(i)} disabled={variants.length === 1}><DIcon name="trash" size={16} /></button>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="col" style={{ gap: 18 }}>
          <Panel title="Images">
            <div className="row wrap" style={{ gap: 10 }}>
              {[0, 1].map((i) => <div key={i} style={{ position: 'relative' }}><Thumb tone={i + 2} size={88} radius={12} />{i === 0 && <span className="badge b-violet" style={{ position: 'absolute', top: 6, left: 6 }}>Primary</span>}</div>)}
              <button className="btn btn-outline" style={{ height: 88, width: 88, padding: 0, flexDirection: 'column', gap: 4 }}><DIcon name="image" size={20} /><span style={{ fontSize: 11 }}>Add</span></button>
            </div>
            <span className="help mt">PNG or JPG, up to 5 images. First image is the primary.</span>
          </Panel>
          <Panel title="Publishing">
            <div className="deflist">
              <div className="def-row"><span className="dk">Seller</span><span className="dv">{SELLER.shop}</span></div>
              <div className="def-row"><span className="dk">Review time</span><span className="dv">~24 hours</span></div>
              <div className="def-row"><span className="dk">Status after submit</span><span className="dv"><Badge status="PENDING" label="In review" /></span></div>
            </div>
            <button className="btn btn-primary btn-block mt" onClick={submit}><DIcon name="check" size={16} /> Submit for review</button>
            <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={() => go('seller-products')}>Cancel</button>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function SellerOrdersView({ toast }) {
  const [q, setQ] = React.useState('');
  const list = SELLER_ORDERS.filter((o) => !q || o.id.toLowerCase().includes(q.toLowerCase()) || o.customer.toLowerCase().includes(q.toLowerCase()) || o.product.toLowerCase().includes(q.toLowerCase()));
  const earned = SELLER_ORDERS.reduce((s, o) => s + o.earning, 0);
  return (
    <div className="page">
      <div className="page-head">
        <div className="ph-l"><h2>Sales orders</h2><span className="ph-sub">{SELLER_ORDERS.length} orders · OMR {OMR(earned)} earned</span></div>
        <div className="ph-actions"><button className="btn btn-outline" onClick={() => toast('Exported')}><DIcon name="download" size={16} /> Export</button></div>
      </div>
      <Panel noBody>
        <div className="panel-head"><SearchBox value={q} onChange={setQ} placeholder="Search orders…" width={260} /></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Order</th><th>Customer</th><th>Product</th><th>Date</th><th className="right">Gross</th><th className="right">Your earning</th><th>Status</th></tr></thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id}>
                  <td className="mono t-strong">{o.id}</td>
                  <td><div className="t-cell"><Avatar name={o.customer} size={30} /><span>{o.customer}</span></div></td>
                  <td>{o.product} <span className="t-sub">× {o.qty}</span></td>
                  <td className="t-sub">{o.date}</td>
                  <td className="right">OMR {OMR(o.gross)}</td>
                  <td className="right t-strong" style={{ color: 'var(--success)' }}>OMR {OMR(o.earning)}</td>
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

function EarningsView({ toast }) {
  return (
    <div className="page">
      <div className="page-head">
        <div className="ph-l"><h2>Earnings & payouts</h2><span className="ph-sub">Track your balance and withdrawals</span></div>
        <div className="ph-actions"><button className="btn btn-primary" onClick={() => toast('Payout requested')}><DIcon name="bank" size={16} /> Request payout</button></div>
      </div>

      <div className="kpi-grid">
        <Kpi icon="wallet" tint="tint-success" label="Available balance" value={'OMR ' + OMR(SELLER.balance)} sub={<span>Ready to withdraw</span>} />
        <Kpi icon="clock" tint="tint-warning" label="Pending clearance" value={'OMR ' + OMR(SELLER.pending)} sub={<span>Clears in 3–5 days</span>} />
        <Kpi icon="coin" tint="tint-violet" label="Lifetime earnings" value={'OMR ' + NUM(Math.round(SELLER.lifetime))} delta="+11.5%" deltaDir="up" />
        <Kpi icon="trend-up" tint="tint-info" label="This month" value={'OMR ' + NUM(Math.round(SELLER_REVENUE.at(-1)))} />
      </div>

      <div className="col-wide">
        <Panel title="Earnings trend" sub="Monthly net earnings (OMR)">
          <AreaChart data={SELLER_REVENUE} labels={MONTHS} color="#1F9D62" fmt={(v) => 'OMR ' + NUM(Math.round(v))} height={240} />
        </Panel>
        <Panel title="Payout account">
          <div className="row" style={{ gap: 11, marginBottom: 4 }}>
            <span className="kpi-ic tint-ink" style={{ width: 40, height: 40 }}><DIcon name="bank" size={20} /></span>
            <div><div className="t-strong">{SELLER.bank.bankName}</div><div className="t-sub mono">{SELLER.bank.iban}</div></div>
          </div>
          <div className="deflist">
            <div className="def-row"><span className="dk">Account holder</span><span className="dv">{SELLER.bank.holder}</span></div>
            <div className="def-row"><span className="dk">Account no.</span><span className="dv mono">••••{SELLER.bank.account.slice(-4)}</span></div>
            <div className="def-row"><span className="dk">Next scheduled</span><span className="dv">Jun 25, 2026</span></div>
          </div>
          <button className="btn btn-outline btn-block mt" onClick={() => toast('Edit bank details in Profile')}><DIcon name="edit" size={15} /> Update account</button>
        </Panel>
      </div>

      <Panel title="Payout history" noBody>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Payout ID</th><th>Date</th><th>Method</th><th className="right">Amount</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {SELLER.payouts.map((p) => (
                <tr key={p.id}>
                  <td className="mono t-strong">{p.id}</td>
                  <td className="t-sub">{p.date}</td>
                  <td><span className="tag"><DIcon name="bank" size={13} /> {p.method}</span></td>
                  <td className="right t-strong">OMR {OMR(p.amount)}</td>
                  <td><Badge status={p.status} label={p.status === 'paid' ? 'Paid' : 'Pending'} /></td>
                  <td><button className="btn-icon" onClick={() => toast('Receipt downloaded')}><DIcon name="download" size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function SellerProfileView({ toast }) {
  return (
    <div className="page">
      <div className="page-head"><div className="ph-l"><h2>Profile & bank details</h2><span className="ph-sub">Manage your shop and payout information</span></div></div>

      <div className="col-wide">
        <div className="col" style={{ gap: 18 }}>
          <Panel title="Shop information">
            <div className="form-grid">
              <div className="field"><label>Shop name</label><input defaultValue={SELLER.shop} /></div>
              <div className="field"><label>Owner</label><input defaultValue={SELLER.owner} /></div>
              <div className="field"><label>Email</label><div className="with-lead"><span className="lead"><DIcon name="mail" size={16} /></span><input defaultValue={SELLER.email} /></div></div>
              <div className="field"><label>Phone</label><div className="with-lead"><span className="lead"><DIcon name="phone" size={16} /></span><input defaultValue={SELLER.phone} /></div></div>
              <div className="field full"><label>Shop description</label><textarea rows={3} defaultValue="Electronics & gaming gear — fast delivery across Oman."></textarea></div>
            </div>
            <button className="btn btn-primary mt" onClick={() => toast('Profile saved')}>Save changes</button>
          </Panel>

          <Panel title="Bank details" sub="Where your payouts are sent">
            <div className="callout info"><span className="ic"><DIcon name="lock" size={16} /></span>Bank information is encrypted and only used for payouts.</div>
            <div className="form-grid" style={{ marginTop: 14 }}>
              <div className="field"><label>Bank name</label><input defaultValue={SELLER.bank.bankName} /></div>
              <div className="field"><label>Account holder</label><input defaultValue={SELLER.bank.holder} /></div>
              <div className="field full"><label>IBAN</label><div className="with-lead"><span className="lead"><DIcon name="bank" size={16} /></span><input className="mono" defaultValue={SELLER.bank.iban} /></div></div>
              <div className="field full"><label>Account number</label><input className="mono" defaultValue={SELLER.bank.account} /></div>
            </div>
            <button className="btn btn-primary mt" onClick={() => toast('Bank details updated')}>Update bank details</button>
          </Panel>
        </div>

        <div className="col" style={{ gap: 18 }}>
          <Panel title="Verification status">
            <div className="col" style={{ alignItems: 'center', textAlign: 'center', gap: 8, padding: '8px 0 4px' }}>
              <Avatar name={SELLER.shop} variant="grad" size={64} />
              <div className="t-strong" style={{ fontSize: 16 }}>{SELLER.shop}</div>
              <span className="badge b-success"><DIcon name="check" size={13} /> {SELLER.status} seller</span>
              <div className="row" style={{ gap: 6 }}><Stars rating={SELLER.rating} /><span className="t-sub">{SELLER.rating.toFixed(1)}</span></div>
            </div>
            <div className="deflist">
              <div className="def-row"><span className="dk">Member since</span><span className="dv">{SELLER.joined}</span></div>
              <div className="def-row"><span className="dk">Total products</span><span className="dv">{SELLER_PRODUCTS.length}</span></div>
              <div className="def-row"><span className="dk">Lifetime sales</span><span className="dv">OMR {NUM(Math.round(SELLER.lifetime))}</span></div>
            </div>
          </Panel>
          <Panel title="Security">
            <div className="field"><label>Current password</label><input type="password" placeholder="••••••••" /></div>
            <div className="field mt"><label>New password</label><input type="password" placeholder="••••••••" /></div>
            <button className="btn btn-outline btn-block mt" onClick={() => toast('Password changed')}><DIcon name="lock" size={15} /> Change password</button>
          </Panel>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SellerProductsView, SubmitProductView, SellerOrdersView, EarningsView, SellerProfileView });
