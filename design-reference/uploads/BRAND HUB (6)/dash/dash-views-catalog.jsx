/* ───────────── BRANDHUB Dashboard · Catalog (products + categories) ───────────── */

function ProductFormModal({ product, onClose, onSave }) {
  const edit = !!product;
  return (
    <Modal title={edit ? 'Edit product' : 'Add product'} sub={edit ? product.sku : 'Create a new catalog listing'} size="lg" onClose={onClose}
      footer={<><div className="spacer"></div><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => onSave(edit ? 'Product updated' : 'Product created')}>{edit ? 'Save changes' : 'Create product'}</button></>}>
      <div className="form-grid">
        <div className="field full"><label>Product name <span className="req">*</span></label><input defaultValue={product?.name} placeholder="e.g. Wireless Headphones" /></div>
        <div className="field"><label>Category <span className="req">*</span></label>
          <div className="selectwrap" style={{ width: '100%' }}>
            <select defaultValue={product?.category || 'Electronics'} style={{ width: '100%' }}>{CATEGORIES.map((c) => <option key={c.id}>{c.name}</option>)}</select>
            <span className="chev"><DIcon name="chev-down" size={15} /></span>
          </div>
        </div>
        <div className="field"><label>SKU</label><input defaultValue={product?.sku} placeholder="ABC-123" /></div>
        <div className="field"><label>Base price (OMR) <span className="req">*</span></label><input type="number" step="0.001" defaultValue={product?.basePrice} placeholder="0.000" /></div>
        <div className="field"><label>Sale price (OMR)</label><input type="number" step="0.001" defaultValue={product?.salePrice} placeholder="0.000" /></div>
        <div className="field"><label>Seller percentage</label><div className="with-lead"><input type="number" defaultValue={product?.sellerPercentage || 75} /><span className="suffix">%</span></div></div>
        <div className="field"><label>Stock</label><input type="number" defaultValue={product?.stock} placeholder="0" /></div>
        <div className="field full"><label>Short description</label><input defaultValue={product?.shortDescription} placeholder="One-line summary" /></div>
        <div className="field full"><label>Description</label><textarea rows={3} placeholder="Full product description…"></textarea></div>
        <div className="field full"><label>Images</label>
          <div className="row" style={{ gap: 10 }}>
            {[0, 1, 2].map((i) => <Thumb key={i} tone={i} size={64} radius={10} />)}
            <button className="btn btn-outline" style={{ height: 64, width: 64, padding: 0, flexDirection: 'column', gap: 2 }}><DIcon name="plus" size={18} /></button>
          </div>
        </div>
      </div>
      <div className="callout violet"><span className="ic"><DIcon name="info" size={16} /></span>Variants & inventory can be configured after the product is created.</div>
    </Modal>
  );
}

function ProductsView({ toast }) {
  const [q, setQ] = React.useState('');
  const [cat, setCat] = React.useState('all');
  const [status, setStatus] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [modal, setModal] = React.useState(null); // {product} or {new:true}
  const [sel, setSel] = React.useState({});
  const per = 8;

  let list = PRODUCTS.filter((p) =>
    (!q || p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase())) &&
    (cat === 'all' || p.category === cat) &&
    (status === 'all' || p.status === status));
  const pages = Math.ceil(list.length / per) || 1;
  const view = list.slice((page - 1) * per, page * per);
  const cats = ['all', ...Array.from(new Set(PRODUCTS.map((p) => p.category)))];
  const selCount = Object.keys(sel).length;

  return (
    <div className="page">
      <div className="page-head">
        <div className="ph-l"><h2>Products</h2><span className="ph-sub">{PRODUCTS.length} products in catalog</span></div>
        <div className="ph-actions">
          <button className="btn btn-outline" onClick={() => toast('Exported catalog')}><DIcon name="download" size={16} /> Export</button>
          <button className="btn btn-primary" onClick={() => setModal({ new: true })}><DIcon name="plus" size={16} /> Add product</button>
        </div>
      </div>

      <Panel noBody>
        <div className="panel-head">
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search name or SKU…" width={240} />
          <Select value={cat} onChange={(v) => { setCat(v); setPage(1); }} options={cats.map((c) => ({ value: c, label: c === 'all' ? 'All categories' : c }))} />
          <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: 'all', label: 'All status' }, { value: 'active', label: 'Active' }, { value: 'draft', label: 'Draft' }, { value: 'out', label: 'Out of stock' }]} />
          <div className="right">
            {selCount > 0 && <span className="tag">{selCount} selected</span>}
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr>
              <th style={{ width: 30 }}></th><th>Product</th><th>Category</th><th className="right">Price</th><th className="right">Stock</th><th className="right">Sold</th><th>Status</th><th></th>
            </tr></thead>
            <tbody>
              {view.map((p) => (
                <tr key={p.id}>
                  <td><span className={'checkcell' + (sel[p.id] ? ' on' : '')} onClick={() => setSel((s) => { const n = { ...s }; n[p.id] ? delete n[p.id] : (n[p.id] = 1); return n; })}>{sel[p.id] && <DIcon name="check" size={12} />}</span></td>
                  <td><div className="t-cell"><Thumb tone={p.tone} size={42} /><div><div className="t-strong" style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div><div className="t-sub mono">{p.sku} · {p.seller}</div></div></div></td>
                  <td><span className="tag">{p.category}</span></td>
                  <td className="right"><div className="t-strong">OMR {OMR(p.salePrice)}</div>{p.basePrice > p.salePrice && <div className="t-sub" style={{ textDecoration: 'line-through' }}>OMR {OMR(p.basePrice)}</div>}</td>
                  <td className="right"><span className={p.stock === 0 ? 'b-warning badge' : ''}>{p.stock === 0 ? 'Out' : NUM(p.stock)}</span></td>
                  <td className="right num">{NUM(p.sold)}</td>
                  <td><Badge status={p.status} label={{ active: 'Active', out: 'Out of stock', draft: 'Draft' }[p.status]} /></td>
                  <td>
                    <div className="row-actions">
                      <button className="btn-icon" onClick={() => setModal({ product: p })} title="Edit"><DIcon name="edit" size={16} /></button>
                      <Menu trigger={<button className="btn-icon" title="More"><DIcon name="dots" size={16} /></button>}>
                        <button onClick={() => toast('Viewing ' + p.sku)}><DIcon name="eye" size={15} /> View details</button>
                        <button onClick={() => setModal({ product: p })}><DIcon name="edit" size={15} /> Edit</button>
                        <button onClick={() => toast('Duplicated')}><DIcon name="copy" size={15} /> Duplicate</button>
                        <div className="sep"></div>
                        <button className="danger" onClick={() => toast('Product deleted')}><DIcon name="trash" size={15} /> Delete</button>
                      </Menu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {view.length === 0 && <EmptyState title="No products found" text="Try adjusting your search or filters." />}
        <Pagination page={page} pages={pages} total={list.length} onPage={setPage} perLabel="products" />
      </Panel>

      {modal && <ProductFormModal product={modal.product} onClose={() => setModal(null)} onSave={(m) => { toast(m); setModal(null); }} />}
    </div>
  );
}

function CategoriesView({ toast }) {
  const [modal, setModal] = React.useState(null);
  const [active, setActive] = React.useState(() => Object.fromEntries(CATEGORIES.map((c) => [c.id, c.active])));
  const parents = CATEGORIES.filter((c) => !c.parent);
  const childrenOf = (id) => CATEGORIES.filter((c) => c.parent === id);

  const Row = ({ c, child }) => (
    <div className="row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', gap: 12, paddingLeft: child ? 52 : 16 }}>
      <span className="thumb" style={{ width: 36, height: 36, borderRadius: 8, background: child ? 'var(--surface-2)' : 'var(--accent-light)', display: 'grid', placeItems: 'center', color: child ? 'var(--tx-3)' : 'var(--accent)' }}><DIcon name={child ? 'tag' : 'layers'} size={17} /></span>
      <div style={{ minWidth: 0 }}>
        <div className="t-strong">{c.name}</div>
        <div className="t-sub mono">/{c.slug}</div>
      </div>
      <span className="tag" style={{ marginLeft: 'auto' }}>{NUM(c.products)} products</span>
      <Toggle on={active[c.id]} onClick={() => { setActive((s) => ({ ...s, [c.id]: !s[c.id] })); toast(active[c.id] ? 'Category hidden' : 'Category active'); }} />
      <button className="btn-icon" onClick={() => setModal({ c })}><DIcon name="edit" size={16} /></button>
      <Menu trigger={<button className="btn-icon"><DIcon name="dots" size={16} /></button>}>
        <button onClick={() => setModal({ parent: c })}><DIcon name="plus" size={15} /> Add subcategory</button>
        <button onClick={() => toast('Edit ' + c.name)}><DIcon name="edit" size={15} /> Edit</button>
        <div className="sep"></div>
        <button className="danger" onClick={() => toast('Category deleted')}><DIcon name="trash" size={15} /> Delete</button>
      </Menu>
    </div>
  );

  return (
    <div className="page">
      <div className="page-head">
        <div className="ph-l"><h2>Categories</h2><span className="ph-sub">{parents.length} top-level · {CATEGORIES.length} total</span></div>
        <div className="ph-actions"><button className="btn btn-primary" onClick={() => setModal({ new: true })}><DIcon name="plus" size={16} /> New category</button></div>
      </div>

      <Panel noBody>
        {parents.map((p) => (
          <React.Fragment key={p.id}>
            <Row c={p} />
            {childrenOf(p.id).map((ch) => <Row key={ch.id} c={ch} child />)}
          </React.Fragment>
        ))}
      </Panel>

      {modal && (
        <Modal title={modal.c ? 'Edit category' : modal.parent ? 'Add subcategory' : 'New category'} sub={modal.parent ? 'Under ' + modal.parent.name : null} onClose={() => setModal(null)}
          footer={<><div className="spacer"></div><button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={() => { toast('Category saved'); setModal(null); }}>Save</button></>}>
          <div className="field"><label>Name <span className="req">*</span></label><input defaultValue={modal.c?.name} placeholder="Category name" /></div>
          <div className="field"><label>Slug</label><input defaultValue={modal.c?.slug} placeholder="category-slug" /></div>
          <div className="field"><label>Description</label><textarea rows={2} placeholder="Optional description"></textarea></div>
          <div className="row" style={{ justifyContent: 'space-between' }}><span style={{ fontSize: 13, fontWeight: 600 }}>Active</span><Toggle on={true} onClick={() => {}} /></div>
        </Modal>
      )}
    </div>
  );
}

Object.assign(window, { ProductsView, CategoriesView });
