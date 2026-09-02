/* ───────────── BRANDHUB Dashboard · Seller approvals (product requests) ───────────── */

function ApprovalDrawer({ req, onClose, toast }) {
  const [mode, setMode] = React.useState(null); // 'reject'
  const [reason, setReason] = React.useState('');
  return (
    <Modal title="Review product request" sub={req.seller + ' · ' + req.submitted} drawer wide onClose={onClose}
      footer={req.status === 'PENDING'
        ? <><button className="btn btn-danger" onClick={() => setMode(mode === 'reject' ? null : 'reject')}><DIcon name="x" size={15} /> Reject</button><div className="spacer"></div><button className="btn btn-success" onClick={() => { toast('Product approved & published'); onClose(); }}><DIcon name="check" size={15} /> Approve & publish</button></>
        : <><div className="spacer"></div><button className="btn btn-ghost" onClick={onClose}>Close</button></>}>
      <div className="row" style={{ gap: 14 }}>
        <Thumb tone={2} size={72} radius={12} />
        <div style={{ minWidth: 0 }}>
          <div className="t-strong" style={{ fontSize: 15, lineHeight: 1.35 }}>{req.name}</div>
          <div className="row gap-sm" style={{ marginTop: 6 }}><span className="tag">{req.category}</span><span className="tag">{req.variants} variant{req.variants > 1 ? 's' : ''}</span><Badge status={req.status} /></div>
        </div>
      </div>

      <div className="row" style={{ gap: 10, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 11 }}>
        <Avatar name={req.seller} variant="grad" size={36} />
        <div><div className="t-strong">{req.seller}</div><div className="t-sub">{req.sellerEmail}</div></div>
      </div>

      <div>
        <div className="form-section-title" style={{ marginBottom: 12 }}>Admin review — adjust before approval</div>
        <div className="form-grid">
          <div className="field"><label>Base price (OMR)</label><input type="number" step="0.001" defaultValue={req.basePrice} disabled style={{ background: 'var(--surface-2)' }} /></div>
          <div className="field"><label>Sale price (OMR)</label><input type="number" step="0.001" defaultValue={req.salePrice} /></div>
          <div className="field"><label>Seller percentage</label><div className="with-lead"><input type="number" defaultValue={req.sellerPercentage} /><span className="suffix">%</span></div></div>
          <div className="field"><label>Platform margin</label><input value={(100 - req.sellerPercentage) + '%'} disabled style={{ background: 'var(--surface-2)' }} /></div>
          <div className="field full"><label>Short description</label><input defaultValue={'Admin-reviewed ' + req.name.toLowerCase()} /></div>
        </div>
      </div>

      <div className="deflist">
        <div className="def-row"><span className="dk">Seller earns / unit</span><span className="dv">OMR {OMR(req.salePrice * req.sellerPercentage / 100)}</span></div>
        <div className="def-row"><span className="dk">Platform earns / unit</span><span className="dv">OMR {OMR(req.salePrice * (100 - req.sellerPercentage) / 100)}</span></div>
      </div>

      {req.status !== 'PENDING' && req.note && <div className={'callout ' + (req.status === 'APPROVED' ? 'info' : 'warning')}><span className="ic"><DIcon name="info" size={16} /></span>{req.note}</div>}

      {mode === 'reject' && (
        <div className="field">
          <label>Rejection reason <span className="req">*</span></label>
          <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain why this request is rejected…"></textarea>
          <button className="btn btn-danger mt" onClick={() => { toast('Request rejected'); onClose(); }} disabled={!reason}>Confirm rejection</button>
        </div>
      )}
    </Modal>
  );
}

function ApprovalsView({ toast }) {
  const [tab, setTab] = React.useState('PENDING');
  const [open, setOpen] = React.useState(null);
  const counts = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
  PRODUCT_REQUESTS.forEach((r) => counts[r.status]++);
  const list = PRODUCT_REQUESTS.filter((r) => tab === 'ALL' || r.status === tab);

  return (
    <div className="page">
      <div className="page-head">
        <div className="ph-l"><h2>Seller approvals</h2><span className="ph-sub">Review and publish products submitted by sellers</span></div>
      </div>

      <div className="kpi-grid">
        <Kpi icon="clock" tint="tint-warning" label="Pending review" value={counts.PENDING} sub={<span>Awaiting action</span>} />
        <Kpi icon="check-circle" tint="tint-success" label="Approved (30d)" value={counts.APPROVED + 23} />
        <Kpi icon="x" tint="tint-pink" label="Rejected (30d)" value={counts.REJECTED + 4} />
        <Kpi icon="store" tint="tint-info" label="Active sellers" value={47} />
      </div>

      <Panel noBody>
        <div className="panel-head" style={{ paddingBottom: 0, border: 'none' }}>
          <div className="tabs" style={{ width: '100%' }}>
            {[['PENDING', 'Pending'], ['APPROVED', 'Approved'], ['REJECTED', 'Rejected'], ['ALL', 'All']].map(([k, l]) => (
              <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}{k !== 'ALL' && <span className="cnt">{counts[k]}</span>}</button>
            ))}
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Product</th><th>Seller</th><th>Submitted</th><th className="right">Sale price</th><th className="right">Seller %</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setOpen(r)}>
                  <td><div className="t-cell"><Thumb tone={2} size={40} /><div><div className="t-strong" style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div><div className="t-sub">{r.category}</div></div></div></td>
                  <td>{r.seller}</td>
                  <td className="t-sub">{r.submitted}</td>
                  <td className="right t-strong">OMR {OMR(r.salePrice)}</td>
                  <td className="right num">{r.sellerPercentage}%</td>
                  <td><Badge status={r.status} /></td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {r.status === 'PENDING'
                      ? <div className="row gap-sm" style={{ justifyContent: 'flex-end' }}>
                          <button className="btn btn-success btn-sm" onClick={() => toast('Approved & published')}><DIcon name="check" size={14} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => setOpen(r)}><DIcon name="x" size={14} /></button>
                          <button className="btn btn-outline btn-sm" onClick={() => setOpen(r)}>Review</button>
                        </div>
                      : <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn-icon" onClick={() => setOpen(r)}><DIcon name="eye" size={16} /></button></div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list.length === 0 && <EmptyState icon="check-circle" title="Nothing to review" text="You're all caught up — no requests in this tab." />}
      </Panel>

      {open && <ApprovalDrawer req={open} onClose={() => setOpen(null)} toast={toast} />}
    </div>
  );
}

Object.assign(window, { ApprovalsView });
