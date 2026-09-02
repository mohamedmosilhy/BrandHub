/* ───────────── BRANDHUB Dashboard · shared UI primitives ───────────── */

/* striped product thumbnail placeholder */
function Thumb({ tone = 0, size = 40, radius = 7, label }) {
  const c = TONES[tone % TONES.length];
  return (
    <span className="thumb" style={{ width: size, height: size, borderRadius: radius }}>
      <span className="thumb-ph" style={{ width: '100%', height: '100%', background: `repeating-linear-gradient(135deg, ${c} 0 8px, rgba(26,26,46,.05) 8px 16px)`, borderRadius: radius }}></span>
    </span>
  );
}

function Avatar({ name, size = 34, variant = '' }) {
  return <span className={'av ' + variant} style={{ width: size, height: size, fontSize: size * 0.38 }}>{initials(name)}</span>;
}

function Badge({ status, label }) {
  return <span className={'badge ' + statusBadge(status)}><span className="bdot"></span>{label || status}</span>;
}

function Stars({ rating, size = 13 }) {
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((s) => <DIcon key={s} name="star" size={size} className={s <= Math.round(rating) ? '' : 'off'} />)}
    </span>
  );
}

function Toggle({ on, onClick }) {
  return <button type="button" className={'switch' + (on ? ' on' : '')} onClick={onClick} aria-pressed={on}><span className="knob"></span></button>;
}

/* KPI card */
function Kpi({ icon, tint, label, value, sub, delta, deltaDir, spark, sparkColor }) {
  return (
    <div className="kpi">
      <div className="kpi-top">
        <span className={'kpi-ic ' + tint}><DIcon name={icon} size={20} /></span>
        <span className="kpi-lbl">{label}</span>
        {delta != null && (
          <span className={'delta ' + (deltaDir || 'up')} style={{ marginLeft: 'auto' }}>
            <DIcon name={deltaDir === 'down' ? 'trend-down' : 'trend-up'} size={12} />{delta}
          </span>
        )}
      </div>
      <div className="kpi-val">{value}</div>
      {spark && <div className="spark"><Sparkline data={spark} color={sparkColor || '#7F77DD'} width={240} height={36} /></div>}
      {sub && <div className="kpi-foot">{sub}</div>}
    </div>
  );
}

/* searchbox + select */
function SearchBox({ value, onChange, placeholder = 'Search…', width }) {
  return (
    <div className="searchbox" style={width ? { minWidth: width } : null}>
      <DIcon name="search" size={16} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
function Select({ value, onChange, options }) {
  return (
    <div className="selectwrap">
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span className="chev"><DIcon name="chev-down" size={15} /></span>
    </div>
  );
}

function EmptyState({ icon = 'search', title, text, action }) {
  return (
    <div className="empty">
      <span className="e-ic"><DIcon name={icon} size={26} /></span>
      <h4>{title}</h4>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

/* simple client-side pagination footer */
function Pagination({ page, pages, total, onPage, perLabel = 'rows' }) {
  if (pages <= 1) return <div className="pagination"><span className="pg-info">{total} {perLabel}</span></div>;
  const nums = []; for (let i = 1; i <= pages; i++) nums.push(i);
  return (
    <div className="pagination">
      <span className="pg-info">{total} {perLabel}</span>
      <div className="pg-btns">
        <button className="pg-btn" disabled={page === 1} onClick={() => onPage(page - 1)}><DIcon name="chev-left" size={15} /></button>
        {nums.map((n) => <button key={n} className={'pg-btn' + (n === page ? ' on' : '')} onClick={() => onPage(n)}>{n}</button>)}
        <button className="pg-btn" disabled={page === pages} onClick={() => onPage(page + 1)}><DIcon name="chev-right" size={15} /></button>
      </div>
    </div>
  );
}

/* modal / drawer shell */
function Modal({ title, sub, onClose, children, footer, size = '', drawer = false }) {
  React.useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={'modal ' + size + (drawer ? ' drawer' : '')} role="dialog">
        <div className="modal-head">
          <div>
            <h3>{title}</h3>
            {sub && <div className="mh-sub">{sub}</div>}
          </div>
          <button className="btn-icon x" onClick={onClose} aria-label="Close"><DIcon name="x" size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* dropdown menu (closes on outside click) */
function Menu({ trigger, children, align = 'right' }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      {React.cloneElement(trigger, { onClick: () => setOpen((v) => !v) })}
      {open && <div className="menu" style={align === 'left' ? { right: 'auto', left: 0 } : null} onClick={() => setOpen(false)}>{children}</div>}
    </div>
  );
}

/* toasts */
function useToasts() {
  const [toasts, setToasts] = React.useState([]);
  const toast = React.useCallback((msg) => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, msg }]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 2200);
  }, []);
  return [toasts, toast];
}
function Toasts({ items }) {
  return (
    <div className="toast-wrap">
      {items.map((t) => <div className="toast" key={t.id}><span className="ic"><DIcon name="check" size={16} /></span>{t.msg}</div>)}
    </div>
  );
}

/* section panel with header */
function Panel({ title, sub, right, children, bodyClass = '', noBody = false }) {
  return (
    <section className="panel">
      {(title || right) && (
        <div className="panel-head">
          {title && <div><h3>{title}</h3>{sub && <div className="ph-sub">{sub}</div>}</div>}
          {right && <div className="right">{right}</div>}
        </div>
      )}
      {noBody ? children : <div className={'panel-body ' + bodyClass}>{children}</div>}
    </section>
  );
}

/* horizontal bar list (top products / sellers) */
function HBars({ items, fmt = (v) => v, max }) {
  const m = max || Math.max(...items.map((i) => i.value)) || 1;
  return (
    <div className="col" style={{ gap: 16 }}>
      {items.map((it, i) => (
        <div className="hbar-row" key={i}>
          <span className="hbar-lbl">{it.label}</span>
          <span className="hbar-val">{fmt(it.value)}</span>
          <span className="hbar-track"><span style={{ width: (it.value / m) * 100 + '%', background: it.color || '#7F77DD' }}></span></span>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { Thumb, Avatar, Badge, Stars, Toggle, Kpi, SearchBox, Select, EmptyState, Pagination, Modal, Menu, useToasts, Toasts, Panel, HBars });
