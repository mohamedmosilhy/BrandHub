/* ───────────────── BRANDHUB · Footer ───────────────── */

const FOOT_COLS = [
  { title: 'الإلكترونيات', links: ['الهواتف الذكية', 'أجهزة اللابتوب', 'السماعات', 'الكاميرات', 'الأجهزة المنزلية'] },
  { title: 'الأزياء', links: ['أزياء النساء', 'أزياء الرجال', 'الأحذية', 'الحقائب', 'الساعات والإكسسوارات'] },
  { title: 'الجمال', links: ['العناية بالبشرة', 'العطور', 'المكياج', 'العناية بالشعر', 'الأجهزة التجميلية'] },
];

function Footer({ onToast }) {
  return (
    <footer className="footer" data-theme="dark">
      <div className="container">
        <div className="footer-grid">
          <div className="foot-help">
            <h4>نحن دائماً جاهزون لمساعدتك</h4>
            <div className="foot-contact">
              <a href="#" onClick={(e) => { e.preventDefault(); onToast('مركز المساعدة'); }}>
                <Icon name="globe" size={18} /> مركز المساعدة — <span className="val">help.brandhub.om</span>
              </a>
              <a href="#" onClick={(e) => { e.preventDefault(); onToast('الدعم عبر البريد'); }}>
                <Icon name="package" size={18} /> الدعم عبر البريد — <span className="val">support@brandhub.om</span>
              </a>
              <a href="#" onClick={(e) => { e.preventDefault(); onToast('خدمة العملاء'); }}>
                <Icon name="truck" size={18} /> خدمة العملاء — <span className="val">+968 8000 1234</span>
              </a>
            </div>
          </div>
          {FOOT_COLS.map((col) => (
            <div className="foot-col" key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((l) => (
                  <li key={l}><a href="#" onClick={(e) => { e.preventDefault(); onToast(l); }}>{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="foot-bar">
          <span className="foot-copy">© 2026 BRANDHUB — جميع الحقوق محفوظة · سلطنة عُمان</span>
          <nav className="foot-links">
            <a href="#" onClick={(e) => { e.preventDefault(); onToast('الوظائف'); }}>الوظائف</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onToast('شروط الاستخدام'); }}>شروط الاستخدام</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onToast('سياسة الخصوصية'); }}>سياسة الخصوصية</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onToast('البيع معنا'); }}>البيع معنا</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

window.Footer = Footer;
