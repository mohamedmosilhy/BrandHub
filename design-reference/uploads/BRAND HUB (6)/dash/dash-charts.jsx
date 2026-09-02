/* ───────────── BRANDHUB Dashboard · SVG charts (no libs) ───────────── */

/* tiny sparkline for KPI cards */
function Sparkline({ data, color = '#7F77DD', width = 120, height = 34, fill = true }) {
  const max = Math.max(...data), min = Math.min(...data);
  const rng = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => [i * step, height - 4 - ((v - min) / rng) * (height - 8)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = line + ` L ${width} ${height} L 0 ${height} Z`;
  const id = 'sk' + color.replace('#', '');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.22" /><stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient></defs>
      {fill && <path d={area} fill={`url(#${id})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* responsive area/line chart with axis + hover */
function AreaChart({ data, labels, color = '#7F77DD', height = 230, fmt = (v) => v, compareData = null, compareColor = '#D4537E' }) {
  const [hover, setHover] = React.useState(null);
  const W = 640, H = height, padL = 8, padR = 8, padT = 16, padB = 26;
  const all = compareData ? data.concat(compareData) : data;
  const max = Math.max(...all) * 1.12, min = 0;
  const rng = max - min || 1;
  const iw = W - padL - padR, ih = H - padT - padB;
  const step = iw / (data.length - 1);
  const X = (i) => padL + i * step;
  const Y = (v) => padT + ih - ((v - min) / rng) * ih;
  const toLine = (d) => d.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ');
  const line = toLine(data);
  const area = line + ` L ${X(data.length - 1)} ${padT + ih} L ${X(0)} ${padT + ih} Z`;
  const id = 'ar' + color.replace('#', '');
  const grid = [0, 0.25, 0.5, 0.75, 1].map((g) => padT + ih - g * ih);
  return (
    <div style={{ position: 'relative' }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block', height }} onMouseLeave={() => setHover(null)}>
        <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.20" /><stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient></defs>
        {grid.map((gy, i) => <line key={i} x1={padL} y1={gy} x2={W - padR} y2={gy} stroke="#ECEDF1" strokeWidth="1" />)}
        <path d={area} fill={`url(#${id})`} />
        {compareData && <path d={toLine(compareData)} fill="none" stroke={compareColor} strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" opacity="0.8" />}
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((v, i) => (
          <g key={i}>
            {hover === i && <line x1={X(i)} y1={padT} x2={X(i)} y2={padT + ih} stroke={color} strokeWidth="1" opacity="0.4" />}
            <circle cx={X(i)} cy={Y(v)} r={hover === i ? 4.5 : 0} fill="#fff" stroke={color} strokeWidth="2.5" />
            <rect x={X(i) - step / 2} y={padT} width={step} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} />
          </g>
        ))}
        {labels.map((l, i) => (i % 2 === 0 || data.length <= 7) && (
          <text key={i} x={X(i)} y={H - 8} fontSize="10.5" fill="#9A9AAF" textAnchor="middle" fontFamily="Plus Jakarta Sans">{l}</text>
        ))}
      </svg>
      {hover != null && (
        <div style={{ position: 'absolute', left: `${(X(hover) / W) * 100}%`, top: 0, marginLeft: -1, pointerEvents: 'none' }}>
          <div style={{ transform: 'translateX(-50%)', background: '#1A1A2E', color: '#fff', borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', boxShadow: '0 6px 16px rgba(0,0,0,.18)' }}>
            <div style={{ fontSize: 10.5, opacity: .7, fontWeight: 500 }}>{labels[hover]}</div>
            {fmt(data[hover])}
          </div>
        </div>
      )}
    </div>
  );
}

/* vertical bar chart */
function BarChart({ data, labels, color = '#7F77DD', height = 220, fmt = (v) => v }) {
  const [hover, setHover] = React.useState(null);
  const W = 640, H = height, padT = 16, padB = 26;
  const max = Math.max(...data) * 1.1 || 1;
  const ih = H - padT - padB;
  const n = data.length, gap = 10, bw = (W - gap * (n - 1)) / n;
  const grid = [0, 0.5, 1].map((g) => padT + ih - g * ih);
  return (
    <div style={{ position: 'relative' }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block', height }} onMouseLeave={() => setHover(null)}>
        {grid.map((gy, i) => <line key={i} x1="0" y1={gy} x2={W} y2={gy} stroke="#ECEDF1" strokeWidth="1" />)}
        {data.map((v, i) => {
          const h = (v / max) * ih, x = i * (bw + gap), y = padT + ih - h;
          return (
            <g key={i} onMouseEnter={() => setHover(i)}>
              <rect x={x} y={padT} width={bw} height={ih} fill="transparent" />
              <rect x={x} y={y} width={bw} height={h} rx="5" fill={color} opacity={hover == null || hover === i ? 1 : 0.42} style={{ transition: 'opacity .15s' }} />
              <text x={x + bw / 2} y={H - 8} fontSize="10.5" fill="#9A9AAF" textAnchor="middle" fontFamily="Plus Jakarta Sans">{labels[i]}</text>
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <div style={{ position: 'absolute', left: `${((hover * (bw + gap) + bw / 2) / W) * 100}%`, top: 0, pointerEvents: 'none' }}>
          <div style={{ transform: 'translateX(-50%)', background: '#1A1A2E', color: '#fff', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{fmt(data[hover])}</div>
        </div>
      )}
    </div>
  );
}

/* donut chart */
function DonutChart({ data, size = 168, thickness = 22, centerLabel, centerValue }) {
  const r = (size - thickness) / 2, c = size / 2, circ = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="#F0F0F4" strokeWidth={thickness} />
      {data.map((d, i) => {
        const len = (d.value / total) * circ;
        const dash = `${len} ${circ - len}`;
        const off = -acc; acc += len;
        return <circle key={i} cx={c} cy={c} r={r} fill="none" stroke={d.color} strokeWidth={thickness}
          strokeDasharray={dash} strokeDashoffset={off} strokeLinecap="butt"
          transform={`rotate(-90 ${c} ${c})`} />;
      })}
      {centerValue != null && <text x={c} y={c - 2} textAnchor="middle" fontSize="22" fontWeight="800" fill="#1A1A2E" fontFamily="Plus Jakarta Sans">{centerValue}</text>}
      {centerLabel && <text x={c} y={c + 16} textAnchor="middle" fontSize="11" fill="#9A9AAF" fontFamily="Plus Jakarta Sans">{centerLabel}</text>}
    </svg>
  );
}

Object.assign(window, { Sparkline, AreaChart, BarChart, DonutChart });
