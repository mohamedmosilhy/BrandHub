/* ════════════════════════════════════════════════════════════════
   BRANDHUB · shared auth helper (window.BHAuth)
   Real sign-in against the E-Commerce API + role detection + routing.
   Loaded as a plain <script> before the page's babel scripts.
   ════════════════════════════════════════════════════════════════ */
(function () {
  var DEFAULT_BASE = 'http://localhost:8081/api/v1';
  var SESSION_KEY = 'bh_session';

  /* demo accounts (from the Postman collection variables) */
  var DEMO_ACCOUNTS = [
    { label: 'Super Admin', role: 'super', email: 'superadmin@ecommerce.com', password: 'SuperAdmin123!' },
    { label: 'Admin',       role: 'admin', email: 'admin@ecommerce.com',      password: 'Admin123!' },
    { label: 'Seller',      role: 'seller', email: 'seller@ecommerce.com',    password: 'Seller123!' },
    { label: 'Customer',    role: 'customer', email: 'customer@ecommerce.com', password: 'Customer123!' },
  ];

  function base() { return localStorage.getItem('bh_api_base') || DEFAULT_BASE; }
  function setBase(v) { v ? localStorage.setItem('bh_api_base', v) : localStorage.removeItem('bh_api_base'); }

  /* ── role helpers ─────────────────────────────────────────────── */
  function normRoles(arr) {
    if (!arr) return [];
    if (!Array.isArray(arr)) arr = [arr];
    return arr.map(function (r) {
      if (typeof r === 'string') return r.toUpperCase();
      if (r && typeof r === 'object') return String(r.name || r.authority || r.role || '').toUpperCase();
      return '';
    }).filter(Boolean);
  }

  /* gather role strings from a login/me response body */
  function rolesFromBody(d) {
    if (!d) return [];
    var pools = [d.roles, d.authorities, d.user && d.user.roles, d.user && d.user.authorities,
                 d.data && d.data.roles, d.data && d.data.user && d.data.user.roles];
    var out = [];
    pools.forEach(function (p) { out = out.concat(normRoles(p)); });
    // single role string field
    if (d.role) out = out.concat(normRoles(d.role));
    if (d.user && d.user.role) out = out.concat(normRoles(d.user.role));
    return out;
  }

  /* decode a JWT and pull roles/authorities from common claim shapes */
  function rolesFromJwt(token) {
    try {
      var p = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      while (p.length % 4) p += '=';
      var json = decodeURIComponent(atob(p).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      var c = JSON.parse(json);
      var out = [];
      out = out.concat(normRoles(c.roles)).concat(normRoles(c.authorities)).concat(normRoles(c.role));
      if (typeof c.scope === 'string') out = out.concat(normRoles(c.scope.split(/\s+/)));
      if (c.realm_access && c.realm_access.roles) out = out.concat(normRoles(c.realm_access.roles));
      return out;
    } catch (e) { return []; }
  }

  /* highest-privilege role → workspace key */
  function pickRole(roles) {
    var R = roles.map(function (r) { return r.toUpperCase(); });
    var has = function (n) { return R.indexOf(n) !== -1; };
    if (has('ROLE_SUPER_ADMIN') || has('SUPER_ADMIN') || has('SUPERADMIN')) return 'super';
    if (has('ROLE_ADMIN') || has('ADMIN') || has('ROLE_MANAGER') || has('MANAGER')) return 'admin';
    if (has('ROLE_SELLER') || has('SELLER')) return 'seller';
    return 'customer';
  }

  /* role → where to send the user */
  function dest(role) {
    if (role === 'customer') return { url: 'BRANDHUB Account.html', workspace: null };
    return { url: 'BRANDHUB Dashboard.html', workspace: role }; // super | admin | seller
  }

  var ROLE_LABEL = { super: 'Super Admin', admin: 'Admin', seller: 'Seller', customer: 'Customer' };

  /* ── session ──────────────────────────────────────────────────── */
  function setSession(s) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
  function getSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; } }
  function clearSession() { localStorage.removeItem(SESSION_KEY); }

  /* persist the workspace the dashboard should open in */
  function applyWorkspace(role) {
    if (role === 'super' || role === 'admin' || role === 'seller') {
      localStorage.setItem('bh_dash_role', role);
      localStorage.setItem('bh_dash_view', 'overview');
    }
  }

  /* fallback: GET /users/me to read roles when login body/JWT lack them */
  function fetchMeRoles(token) {
    return fetch(base() + '/users/me', { headers: { Authorization: 'Bearer ' + token } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { return rolesFromBody(d); })
      .catch(function () { return []; });
  }

  /* ── LOGIN (real API) ─────────────────────────────────────────── */
  function login(email, password) {
    var b = base();
    return fetch(b + '/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password }),
    }).then(function (res) {
      if (res.status === 401) return { ok: false, error: 'Invalid email or password.' };
      if (!res.ok) return { ok: false, error: 'Sign-in failed (HTTP ' + res.status + ').' };
      return res.json().then(function (data) {
        var token = data.accessToken || data.token || (data.data && data.data.accessToken);
        var roles = rolesFromBody(data);
        if (!roles.length && token) roles = rolesFromJwt(token);
        var finish = function (rls) {
          var role = pickRole(rls);
          var session = {
            token: token, refreshToken: data.refreshToken, email: email,
            roles: rls, role: role, mode: 'api',
            user: data.user || (data.data && data.data.user) || null, ts: Date.now(),
          };
          setSession(session); applyWorkspace(role);
          return { ok: true, session: session, dest: dest(role) };
        };
        if (!roles.length && token) return fetchMeRoles(token).then(function (r) { return finish(r); });
        return finish(roles);
      });
    }).catch(function (e) {
      return { ok: false, network: true, error: 'Could not reach the API at ' + b + '. Make sure the backend is running and CORS allows this origin.' };
    });
  }

  /* ── DEMO sign-in (no backend) — detects role from the email ───── */
  function demoLogin(email, password) {
    var e = (email || '').toLowerCase();
    var role = e.indexOf('superadmin') !== -1 ? 'super'
             : e.indexOf('admin') !== -1 ? 'admin'
             : e.indexOf('seller') !== -1 ? 'seller'
             : 'customer';
    var session = { email: email, roles: ['ROLE_' + role.toUpperCase()], role: role, mode: 'demo', token: 'demo-token', ts: Date.now() };
    setSession(session); applyWorkspace(role);
    return { ok: true, session: session, dest: dest(role) };
  }

  /* ── REGISTER (customer or seller) ────────────────────────────── */
  function register(payload, asSeller) {
    var b = base();
    var path = asSeller ? '/auth/register/seller' : '/auth/register';
    return fetch(b + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    }).then(function (res) {
      if (res.status === 409) return { ok: false, error: 'An account with this email already exists.' };
      if (!res.ok) return { ok: false, error: 'Registration failed (HTTP ' + res.status + ').' };
      return { ok: true };
    }).catch(function () {
      return { ok: false, network: true, error: 'Could not reach the API at ' + b + '.' };
    });
  }

  window.BHAuth = {
    DEFAULT_BASE: DEFAULT_BASE, DEMO_ACCOUNTS: DEMO_ACCOUNTS, ROLE_LABEL: ROLE_LABEL,
    base: base, setBase: setBase, login: login, demoLogin: demoLogin, register: register,
    getSession: getSession, setSession: setSession, clearSession: clearSession,
    pickRole: pickRole, dest: dest, applyWorkspace: applyWorkspace,
  };
})();
