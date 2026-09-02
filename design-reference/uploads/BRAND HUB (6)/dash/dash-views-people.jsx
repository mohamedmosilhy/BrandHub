/* ───────────── BRANDHUB Dashboard · Users + Roles & permissions ───────────── */

const ROLE_LABEL = (n) => (ROLES.find((r) => r.name === n) || {}).displayName || n.replace('ROLE_', '');

function UserFormModal({ user, onClose, toast }) {
  return (
    <Modal title={user ? 'Edit user' : 'Add user'} sub={user?.email} onClose={onClose}
      footer={<><div className="spacer"></div><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => { toast(user ? 'User updated' : 'User created'); onClose(); }}>{user ? 'Save' : 'Create user'}</button></>}>
      <div className="form-grid">
        <div className="field"><label>First name <span className="req">*</span></label><input defaultValue={user?.firstName} /></div>
        <div className="field"><label>Last name <span className="req">*</span></label><input defaultValue={user?.lastName} /></div>
        <div className="field full"><label>Email <span className="req">*</span></label><div className="with-lead"><span className="lead"><DIcon name="mail" size={16} /></span><input defaultValue={user?.email} placeholder="name@email.com" /></div></div>
        <div className="field full"><label>Phone</label><div className="with-lead"><span className="lead"><DIcon name="phone" size={16} /></span><input defaultValue={user?.phone} placeholder="+968 …" /></div></div>
        <div className="field full"><label>Role</label>
          <div className="selectwrap" style={{ width: '100%' }}><select defaultValue={user?.roles[0] || 'ROLE_CUSTOMER'} style={{ width: '100%' }}>{ROLES.map((r) => <option key={r.id} value={r.name}>{r.displayName}</option>)}</select><span className="chev"><DIcon name="chev-down" size={15} /></span></div>
        </div>
        {!user && <div className="field full"><label>Temporary password <span className="req">*</span></label><div className="with-lead"><span className="lead"><DIcon name="lock" size={16} /></span><input type="text" placeholder="Set a password" /></div></div>}
      </div>
    </Modal>
  );
}

function UsersView({ toast }) {
  const [q, setQ] = React.useState('');
  const [role, setRole] = React.useState('all');
  const [status, setStatus] = React.useState('all');
  const [modal, setModal] = React.useState(null);

  let list = USERS.filter((u) =>
    (!q || (u.firstName + ' ' + u.lastName).toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase())) &&
    (role === 'all' || u.roles.includes(role)) &&
    (status === 'all' || u.status === status));

  return (
    <div className="page">
      <div className="page-head">
        <div className="ph-l"><h2>Users</h2><span className="ph-sub">{USERS.length} team & customer accounts</span></div>
        <div className="ph-actions"><button className="btn btn-primary" onClick={() => setModal({ new: true })}><DIcon name="plus" size={16} /> Add user</button></div>
      </div>

      <div className="kpi-grid">
        <Kpi icon="users" tint="tint-violet" label="Total users" value={NUM(12536)} sub={<span>+312 this month</span>} />
        <Kpi icon="shield" tint="tint-info" label="Staff accounts" value={USERS.filter((u) => !u.roles.includes('ROLE_CUSTOMER')).length} />
        <Kpi icon="store" tint="tint-success" label="Sellers" value={47} />
        <Kpi icon="ban" tint="tint-warning" label="Blocked" value={USERS.filter((u) => u.status === 'blocked').length} />
      </div>

      <Panel noBody>
        <div className="panel-head">
          <SearchBox value={q} onChange={setQ} placeholder="Search name or email…" width={240} />
          <Select value={role} onChange={setRole} options={[{ value: 'all', label: 'All roles' }, ...ROLES.map((r) => ({ value: r.name, label: r.displayName }))]} />
          <Select value={status} onChange={setStatus} options={[{ value: 'all', label: 'All status' }, { value: 'active', label: 'Active' }, { value: 'blocked', label: 'Blocked' }]} />
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>User</th><th>Roles</th><th>Phone</th><th>Joined</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id}>
                  <td><div className="t-cell"><Avatar name={u.firstName + ' ' + u.lastName} size={36} variant={u.roles.includes('ROLE_SUPER_ADMIN') ? 'ink' : ''} /><div><div className="t-strong">{u.firstName} {u.lastName}</div><div className="t-sub">{u.email}</div></div></div></td>
                  <td><div className="row gap-sm wrap">{u.roles.map((r) => <span key={r} className={'badge ' + (r === 'ROLE_SUPER_ADMIN' ? 'b-ink' : r === 'ROLE_ADMIN' ? 'b-violet' : r === 'ROLE_SELLER' ? 'b-info' : r === 'ROLE_MANAGER' ? 'b-warning' : 'b-muted')}>{ROLE_LABEL(r)}</span>)}</div></td>
                  <td className="t-sub mono">{u.phone}</td>
                  <td className="t-sub">{u.created}</td>
                  <td><Badge status={u.status} label={u.status === 'active' ? 'Active' : 'Blocked'} /></td>
                  <td>
                    <div className="row-actions">
                      <button className="btn-icon" onClick={() => setModal({ user: u })}><DIcon name="edit" size={16} /></button>
                      <Menu trigger={<button className="btn-icon"><DIcon name="dots" size={16} /></button>}>
                        <button onClick={() => setModal({ user: u })}><DIcon name="edit" size={15} /> Edit</button>
                        <button onClick={() => toast('Role assignment opened')}><DIcon name="shield" size={15} /> Manage roles</button>
                        <button onClick={() => toast('Password reset link sent')}><DIcon name="key" size={15} /> Reset password</button>
                        <div className="sep"></div>
                        {u.status === 'active'
                          ? <button className="danger" onClick={() => toast('User blocked')}><DIcon name="ban" size={15} /> Block</button>
                          : <button onClick={() => toast('User unblocked')}><DIcon name="unlock" size={15} /> Unblock</button>}
                        <button className="danger" onClick={() => toast('User deleted')}><DIcon name="trash" size={15} /> Delete</button>
                      </Menu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list.length === 0 && <EmptyState icon="users" title="No users found" />}
        <Pagination page={1} pages={1} total={list.length} onPage={() => {}} perLabel="users" />
      </Panel>

      {modal && <UserFormModal user={modal.user} onClose={() => setModal(null)} toast={toast} />}
    </div>
  );
}

/* ── Roles & permissions ── */
function RoleEditor({ role, onClose, toast }) {
  const [perms, setPerms] = React.useState(() => new Set(role.permissions));
  const toggle = (p) => setPerms((s) => { const n = new Set(s); n.has(p) ? n.delete(p) : n.add(p); return n; });
  const toggleGroup = (g) => setPerms((s) => {
    const n = new Set(s); const all = g.actions.map((a) => `${g.resource}:${a}`);
    const has = all.every((p) => n.has(p)); all.forEach((p) => has ? n.delete(p) : n.add(p)); return n;
  });
  return (
    <Modal title={role.displayName} sub={role.name} size="lg" onClose={onClose}
      footer={<><span className="muted" style={{ alignSelf: 'center', fontSize: 12.5 }}>{perms.size} / {ALL_PERMS.length} permissions</span><div className="spacer"></div><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => { toast('Permissions saved'); onClose(); }}>Save permissions</button></>}>
      {role.system && <div className="callout warning"><span className="ic"><DIcon name="info" size={16} /></span>This is a system role. Changes affect all {role.users} users assigned to it.</div>}
      <div className="perm-grid">
        {PERMISSION_GROUPS.map((g) => {
          const all = g.actions.map((a) => `${g.resource}:${a}`);
          const onCount = all.filter((p) => perms.has(p)).length;
          return (
            <div className="perm-cell" key={g.resource}>
              <div className="pc-head"><span className="ic"><DIcon name={g.icon} size={16} /></span>{g.resource}<span className="muted" style={{ marginLeft: 'auto', fontSize: 11.5, fontWeight: 500 }}>{onCount}/{all.length}</span>
                <button className="btn-icon" style={{ width: 26, height: 26 }} onClick={() => toggleGroup(g)} title="Toggle all"><DIcon name={onCount === all.length ? 'check-circle' : 'plus'} size={15} /></button>
              </div>
              <div className="perm-chips">
                {g.actions.map((a) => {
                  const p = `${g.resource}:${a}`, on = perms.has(p);
                  return <button key={a} className={'perm-chip' + (on ? ' on' : '')} onClick={() => toggle(p)}>{on && <DIcon name="check" size={11} className="ck" />}{a}</button>;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

function RolesView({ toast }) {
  const [edit, setEdit] = React.useState(null);
  return (
    <div className="page">
      <div className="page-head">
        <div className="ph-l"><h2>Roles & permissions</h2><span className="ph-sub">{ROLES.length} roles · {ALL_PERMS.length} permissions</span></div>
        <div className="ph-actions"><button className="btn btn-primary" onClick={() => setEdit({ displayName: 'New role', name: 'ROLE_NEW', description: '', permissions: [], users: 0, system: false })}><DIcon name="plus" size={16} /> Create role</button></div>
      </div>

      <div className="grid-2">
        {ROLES.map((r) => (
          <section className="panel" key={r.id}>
            <div className="panel-body">
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <span className={'kpi-ic ' + (r.name === 'ROLE_SUPER_ADMIN' ? 'tint-ink' : 'tint-violet')} style={{ width: 40, height: 40 }}><DIcon name={r.name === 'ROLE_SUPER_ADMIN' ? 'crown' : r.name === 'ROLE_SELLER' ? 'store' : 'shield'} size={20} /></span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="row" style={{ gap: 8 }}><span className="t-strong" style={{ fontSize: 15 }}>{r.displayName}</span>{r.system && <span className="tag">system</span>}</div>
                  <div className="t-sub mono">{r.name}</div>
                </div>
                <Menu trigger={<button className="btn-icon"><DIcon name="dots" size={16} /></button>}>
                  <button onClick={() => setEdit(r)}><DIcon name="key" size={15} /> Edit permissions</button>
                  <button onClick={() => toast('Role duplicated')}><DIcon name="copy" size={15} /> Duplicate</button>
                  <div className="sep"></div>
                  <button className="danger" onClick={() => toast(r.system ? 'System roles cannot be deleted' : 'Role deleted')}><DIcon name="trash" size={15} /> Delete</button>
                </Menu>
              </div>
              <p style={{ fontSize: 13, color: 'var(--tx-2)', margin: '12px 0', lineHeight: 1.55 }}>{r.description}</p>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div className="row gap-sm"><span className="badge b-muted"><DIcon name="users" size={13} /> {NUM(r.users)} users</span><span className="badge b-violet">{r.permissions.length} permissions</span></div>
                <button className="btn btn-outline btn-sm" onClick={() => setEdit(r)}><DIcon name="sliders" size={14} /> Permissions</button>
              </div>
            </div>
          </section>
        ))}
      </div>

      {edit && <RoleEditor role={edit} onClose={() => setEdit(null)} toast={toast} />}
    </div>
  );
}

Object.assign(window, { UsersView, RolesView });
