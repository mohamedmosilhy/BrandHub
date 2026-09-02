/* ───────────────── BRANDHUB · icons + placeholders ───────────────── */
/* Functional UI line icons (lucide-style). Stroke inherits currentColor. */

function Icon({ name, size = 20, strokeWidth = 1.8, className = '', style }) {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth, strokeLinecap: 'round',
    strokeLinejoin: 'round', className, style, 'aria-hidden': true,
  };
  switch (name) {
    case 'search': return (<svg {...p}><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>);
    case 'pin': return (<svg {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>);
    case 'user': return (<svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>);
    case 'heart': return (<svg {...p}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"></path></svg>);
    case 'cart': return (<svg {...p}><circle cx="9" cy="20" r="1.4"></circle><circle cx="18" cy="20" r="1.4"></circle><path d="M2 3h2.5l2.1 12a1.6 1.6 0 0 0 1.6 1.3h8.7a1.6 1.6 0 0 0 1.6-1.2L21.5 7H6"></path></svg>);
    case 'bag': return (<svg {...p}><path d="M6 8h12l1 12H5L6 8z"></path><path d="M9 8a3 3 0 0 1 6 0"></path></svg>);
    case 'package': return (<svg {...p}><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"></path><path d="M3 8l9 5 9-5M12 13v8"></path></svg>);
    case 'list': return (<svg {...p}><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>);
    case 'globe': return (<svg {...p}><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"></path></svg>);
    case 'chev-left': return (<svg {...p}><polyline points="15 18 9 12 15 6"></polyline></svg>);
    case 'chev-right': return (<svg {...p}><polyline points="9 18 15 12 9 6"></polyline></svg>);
    case 'chev-down': return (<svg {...p}><polyline points="6 9 12 15 18 9"></polyline></svg>);
    case 'arrow-left': return (<svg {...p}><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>);
    case 'plus': return (<svg {...p}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>);
    case 'check': return (<svg {...p}><polyline points="20 6 9 17 4 12"></polyline></svg>);
    case 'bolt': return (<svg {...p}><polygon points="13 2 3 14 11 14 10 22 20 10 12 10 13 2"></polygon></svg>);
    case 'star': return (<svg {...p} fill="currentColor" stroke="none"><polygon points="12 2 14.9 8.6 22 9.3 16.6 14 18.2 21 12 17.3 5.8 21 7.4 14 2 9.3 9.1 8.6 12 2"></polygon></svg>);
    case 'truck': return (<svg {...p}><path d="M2 7h12v9H2zM14 10h4l3 3v3h-7z"></path><circle cx="7" cy="18" r="1.6"></circle><circle cx="17" cy="18" r="1.6"></circle></svg>);
    case 'minus': return (<svg {...p}><line x1="5" y1="12" x2="19" y2="12"></line></svg>);
    case 'trash': return (<svg {...p}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);
    case 'shield': return (<svg {...p}><path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z"></path><polyline points="9 11.5 11.5 14 15.5 9.5"></polyline></svg>);
    case 'refresh': return (<svg {...p}><polyline points="1 4 1 10 7 10"></polyline><path d="M3.5 15a9 9 0 1 0 .5-7L1 10"></path></svg>);
    case 'share': return (<svg {...p}><circle cx="18" cy="5" r="2.6"></circle><circle cx="6" cy="12" r="2.6"></circle><circle cx="18" cy="19" r="2.6"></circle><line x1="8.3" y1="10.8" x2="15.7" y2="6.2"></line><line x1="8.3" y1="13.2" x2="15.7" y2="17.8"></line></svg>);
    case 'card': return (<svg {...p}><rect x="2" y="5" width="20" height="14" rx="2.5"></rect><line x1="2" y1="10" x2="22" y2="10"></line><line x1="6" y1="15" x2="10" y2="15"></line></svg>);
    case 'edit': return (<svg {...p}><path d="M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6"></path><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>);
    case 'eye': return (<svg {...p}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>);
    case 'eye-off': return (<svg {...p}><path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.7 3.7M6.6 6.6A18 18 0 0 0 1 12s4 8 11 8a10.9 10.9 0 0 0 5.4-1.4"></path><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"></path><line x1="3" y1="3" x2="21" y2="21"></line></svg>);
    case 'mail': return (<svg {...p}><rect x="2" y="4" width="20" height="16" rx="2.5"></rect><path d="M3 6.5l9 6 9-6"></path></svg>);
    case 'lock': return (<svg {...p}><rect x="4" y="11" width="16" height="10" rx="2.5"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path></svg>);
    case 'phone': return (<svg {...p}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"></path></svg>);
    case 'x': return (<svg {...p}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
    case 'sliders': return (<svg {...p}><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1.5" y1="14" x2="6.5" y2="14"></line><line x1="9.5" y1="8" x2="14.5" y2="8"></line><line x1="17.5" y1="16" x2="22.5" y2="16"></line></svg>);
    case 'clock': return (<svg {...p}><circle cx="12" cy="12" r="9"></circle><polyline points="12 7 12 12 15 14"></polyline></svg>);
    case 'logout': return (<svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>);
    case 'settings': return (<svg {...p}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"></path></svg>);
    case 'home': return (<svg {...p}><path d="M3 10.5L12 3l9 7.5"></path><path d="M5 9.5V21h14V9.5"></path></svg>);
    case 'repeat': return (<svg {...p}><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>);
    case 'map': return (<svg {...p}><polygon points="2 6 9 3 16 6 22 3 22 18 16 21 9 18 2 21 2 6"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="16" y1="6" x2="16" y2="21"></line></svg>);
    case 'wallet': return (<svg {...p}><path d="M3 7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v1"></path><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H5a2 2 0 0 1-2-2z"></path><circle cx="17" cy="13" r="1.3"></circle></svg>);
    case 'tag': return (<svg {...p}><path d="M20.6 13.4L13 21a1.6 1.6 0 0 1-2.3 0L3 13.3V3h10.3l7.3 7.3a1.6 1.6 0 0 1 0 2.3z"></path><circle cx="7.5" cy="7.5" r="1.4"></circle></svg>);
    default: return null;
  }
}

/* Striped placeholder for any imagery we don't have. */
function Placeholder({ label = 'image', radius = 0, circle = false, dark = false, accent = false, style = {}, className = '' }) {
  const base = dark ? '#23233a' : '#ececed';
  const stripe = dark ? 'rgba(255,255,255,0.05)' : 'rgba(26,26,46,0.045)';
  const fg = dark ? 'rgba(255,255,255,0.45)' : 'rgba(26,26,46,0.34)';
  const bg = accent
    ? 'var(--gradient-brand)'
    : `repeating-linear-gradient(135deg, ${base} 0 11px, ${stripe} 11px 22px)`;
  return (
    <div className={'ph ' + className} style={{
      background: bg,
      borderRadius: circle ? '50%' : radius,
      ...style,
    }}>
      {!accent && <span className="ph-label" style={{ color: fg }}>{label}</span>}
    </div>
  );
}

/* BRANDHUB logo — wordmark + gold basket-handle bag mark. */
function Logo({ onDark = false }) {
  return (
    <a className="logo" href="BRANDHUB Storefront.html">
      <span className="logo-mark" aria-hidden="true">
        <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
          <path d="M6 12h20l-1.4 15a2 2 0 0 1-2 1.8H9.4a2 2 0 0 1-2-1.8L6 12z"
                fill={onDark ? '#fff' : 'var(--color-ink)'} />
          <path d="M11 12a5 5 0 0 1 10 0" stroke="var(--color-gold)" strokeWidth="2.4"
                strokeLinecap="round" fill="none" />
          <circle cx="13" cy="18.5" r="1.5" fill={onDark ? 'var(--color-ink)' : '#fff'} />
          <circle cx="19" cy="18.5" r="1.5" fill={onDark ? 'var(--color-ink)' : '#fff'} />
        </svg>
      </span>
      <span className={'logo-word' + (onDark ? ' on-dark' : '')}>BRAND<span className="logo-word-b">HUB</span></span>
    </a>
  );
}

Object.assign(window, { Icon, Placeholder, Logo });
