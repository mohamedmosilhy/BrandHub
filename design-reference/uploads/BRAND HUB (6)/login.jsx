/* ───────────────── BRANDHUB · Login & sign-up (real API + role routing) ───────────────── */

function PasswordField({ id, label, value, onChange, placeholder }) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="with-ic">
        <span className="lead"><Icon name="lock" size={18} /></span>
        <input id={id} type={show ? 'text' : 'password'} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
        <button type="button" className="toggle" onClick={() => setShow((v) => !v)} aria-label={show ? 'إخفاء' : 'إظهار'}>
          <Icon name={show ? 'eye-off' : 'eye'} size={18} />
        </button>
      </div>
    </div>
  );
}

const ROLE_AR = { super: 'لوحة المشرف العام', admin: 'لوحة المشرف', seller: 'لوحة البائع', customer: 'حسابي' };

function AuthApp() {
  const [toasts, toast] = useToasts();
  const [tab, setTab] = React.useState('login');
  const [email, setEmail] = React.useState('superadmin@ecommerce.com');
  const [password, setPassword] = React.useState('SuperAdmin123!');
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [acctType, setAcctType] = React.useState('customer'); // signup type
  const [error, setError] = React.useState(null);
  const [info, setInfo] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [demoMode, setDemoMode] = React.useState(false);
  const [showAdv, setShowAdv] = React.useState(false);
  const [apiBase, setApiBase] = React.useState(BHAuth.base());
  const [offerDemo, setOfferDemo] = React.useState(false);

  const routeTo = (res) => {
    const r = res.session.role;
    toast('مرحباً — جارٍ تحويلك إلى ' + (ROLE_AR[r] || 'حسابك'));
    setTimeout(() => { window.location.href = res.dest.url; }, 650);
  };

  const doLogin = async (e) => {
    e && e.preventDefault();
    setError(null); setInfo(null); setOfferDemo(false);
    if (demoMode) { routeTo(BHAuth.demoLogin(email, password)); return; }
    setLoading(true);
    const res = await BHAuth.login(email, password);
    setLoading(false);
    if (res.ok) { routeTo(res); return; }
    setError(res.error);
    if (res.network) setOfferDemo(true);
  };

  const doSignup = async (e) => {
    e.preventDefault();
    setError(null); setInfo(null);
    setLoading(true);
    const payload = acctType === 'seller'
      ? { name, email, password, phoneNumber: phone, ibanNumber: '', bankAccountNumber: '', bankName: '' }
      : { firstName: (name.split(' ')[0] || name), lastName: (name.split(' ').slice(1).join(' ') || '-'), email, password };
    const res = await BHAuth.register(payload, acctType === 'seller');
    setLoading(false);
    if (res.ok) { setInfo('تم إنشاء الحساب بنجاح — سجّل الدخول الآن.'); setTab('login'); return; }
    setError(res.error);
  };

  const fill = (acc) => { setEmail(acc.email); setPassword(acc.password); setError(null); setInfo(null); };
  const saveBase = () => { BHAuth.setBase(apiBase.trim()); setApiBase(BHAuth.base()); toast('تم حفظ عنوان الـ API'); };

  return (
    <div className="auth-page" dir="rtl">
      <div className="auth-top">
        <Logo />
        <a className="back" href="BRANDHUB Storefront.html"><Icon name="arrow-left" size={16} /> العودة إلى المتجر</a>
      </div>

      <div className="auth-body">
        <div className="auth-card">
          {/* brand aside */}
          <div className="auth-aside">
            <span className="deco a"></span>
            <span className="deco b"></span>
            <h2>أهلاً بك في BRANDHUB</h2>
            <p>سجّل الدخول ليتعرّف النظام تلقائياً على نوع حسابك — عميل، بائع، مشرف، أو مشرف عام — ويفتح لوحته المناسبة.</p>
            <div className="auth-perks">
              <div className="ap"><span className="ic"><Icon name="shield" size={16} /></span> توجيه تلقائي حسب الصلاحية</div>
              <div className="ap"><span className="ic"><Icon name="truck" size={16} /></span> توصيل اليوم داخل مسقط</div>
              <div className="ap"><span className="ic"><Icon name="tag" size={16} /></span> عروض وخصومات للأعضاء</div>
            </div>
          </div>

          {/* form */}
          <form className="auth-form" onSubmit={tab === 'login' ? doLogin : doSignup}>
            <div className="auth-tabs">
              <button type="button" className={tab === 'login' ? 'on' : ''} onClick={() => { setTab('login'); setError(null); setInfo(null); }}>تسجيل الدخول</button>
              <button type="button" className={tab === 'signup' ? 'on' : ''} onClick={() => { setTab('signup'); setError(null); setInfo(null); }}>إنشاء حساب</button>
            </div>

            <h1>{tab === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}</h1>

            {error && <div className="auth-alert err"><Icon name="shield" size={16} /><span>{error}</span></div>}
            {info && <div className="auth-alert ok"><Icon name="check" size={16} /><span>{info}</span></div>}
            {offerDemo && <button type="button" className="auth-alert try" onClick={() => { setDemoMode(true); routeTo(BHAuth.demoLogin(email, password)); }}><Icon name="arrow-left" size={15} /> تعذّر الاتصال بالخادم — جرّب الوضع التجريبي (يكتشف الدور من البريد)</button>}

            <div className="form-rows">
              {tab === 'signup' && (
                <React.Fragment>
                  <div className="seg-pills">
                    <button type="button" className={acctType === 'customer' ? 'on' : ''} onClick={() => setAcctType('customer')}>عميل</button>
                    <button type="button" className={acctType === 'seller' ? 'on' : ''} onClick={() => setAcctType('seller')}>بائع</button>
                  </div>
                  <div className="field">
                    <label htmlFor="name">{acctType === 'seller' ? 'اسم المتجر / صاحب الحساب' : 'الاسم الكامل'}</label>
                    <div className="with-ic"><span className="lead"><Icon name="user" size={18} /></span><input id="name" type="text" placeholder="سالم الراشدي" value={name} onChange={(e) => setName(e.target.value)} /></div>
                  </div>
                </React.Fragment>
              )}

              <div className="field">
                <label htmlFor="email">البريد الإلكتروني</label>
                <div className="with-ic"><span className="lead"><Icon name="mail" size={18} /></span><input id="email" className="ltr" type="email" placeholder="name@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              </div>

              {tab === 'signup' && acctType === 'seller' && (
                <div className="field">
                  <label htmlFor="phone">رقم الهاتف</label>
                  <div className="with-ic"><span className="lead"><Icon name="phone" size={18} /></span><input id="phone" className="ltr" type="tel" placeholder="+968 9123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                </div>
              )}

              <PasswordField id="pwd" label="كلمة المرور" placeholder="••••••••" value={password} onChange={setPassword} />

              {tab === 'login' && (
                <div className="auth-row">
                  <label className="remember" style={{ cursor: 'pointer' }}>
                    <input type="checkbox" checked={demoMode} onChange={(e) => setDemoMode(e.target.checked)} style={{ accentColor: 'var(--color-accent)', width: 16, height: 16 }} />
                    وضع تجريبي (بدون خادم)
                  </label>
                  <a className="forgot" href="#" onClick={(e) => { e.preventDefault(); toast('سيصلك رابط إعادة التعيين'); }}>نسيت كلمة المرور؟</a>
                </div>
              )}
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'جارٍ المعالجة…' : (tab === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب')} {!loading && <Icon name="arrow-left" size={17} />}
            </button>

            {tab === 'login' && (
              <div className="demo-block">
                <div className="demo-label">حسابات للتجربة — اضغط للتعبئة</div>
                <div className="demo-chips">
                  {BHAuth.DEMO_ACCOUNTS.map((a) => (
                    <button type="button" key={a.role} className="demo-chip" onClick={() => fill(a)}>
                      <span className={'dc-ic r-' + a.role}><Icon name={a.role === 'customer' ? 'user' : a.role === 'seller' ? 'package' : 'shield'} size={14} /></span>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button type="button" className="adv-toggle" onClick={() => setShowAdv((v) => !v)}>
              <Icon name="globe" size={14} /> إعدادات الـ API <Icon name={showAdv ? 'chev-up' : 'chev-down'} size={14} />
            </button>
            {showAdv && (
              <div className="adv-box">
                <div className="field"><label htmlFor="base">عنوان الـ API الأساسي</label>
                  <div className="with-ic" style={{ gap: 8 }}>
                    <input id="base" className="ltr" type="text" value={apiBase} onChange={(e) => setApiBase(e.target.value)} placeholder="http://localhost:8081/api/v1" />
                  </div>
                </div>
                <button type="button" className="btn-ghost" style={{ height: 38, border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-md)' }} onClick={saveBase}>حفظ</button>
                <span className="field hint">يستخدم نقطة النهاية <span className="ltr">POST /auth/login</span> ويكتشف الدور من الاستجابة أو رمز JWT.</span>
              </div>
            )}

            <div className="auth-foot">
              {tab === 'login'
                ? <React.Fragment>ليس لديك حساب؟ <button type="button" onClick={() => setTab('signup')}>أنشئ حساباً</button></React.Fragment>
                : <React.Fragment>لديك حساب بالفعل؟ <button type="button" onClick={() => setTab('login')}>سجّل الدخول</button></React.Fragment>}
            </div>
          </form>
        </div>
      </div>

      <Toasts items={toasts} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AuthApp />);
