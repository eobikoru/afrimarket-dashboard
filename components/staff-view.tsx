'use client';

import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { formatWhen, qs } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import { PER_PAGE, type Admin, type AuditLog, type Page, type Role } from '@/lib/types';
import { Empty, ErrorBanner, Field, Loading, Modal, PageHead, Pager, Pill, Updating } from './ui';

const ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN', 'BLOG_AUTHOR'];

export function StaffView() {
  const [tab, setTab] = useState<'people' | 'audit'>('people');
  const [page, setPage] = useState(1);
  const people = useApi<Page<Admin>>(tab === 'people' ? `/admin/admins${qs({ page, perPage: PER_PAGE })}` : null);
  const logs = useApi<Page<AuditLog>>(tab === 'audit' ? `/admin/admins/audit-logs${qs({ page, perPage: PER_PAGE })}` : null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <>
      <PageHead kicker="Super admin" title="Staff" lede="Create accounts, change roles, and read the audit log. The last active super admin cannot be removed.">
        <button className="btn" type="button" onClick={() => setOpen(true)}>New admin</button>
      </PageHead>
      <nav className="subnav">
        <button className={tab === 'people' ? 'btn' : 'btn-ghost'} type="button" onClick={() => { setTab('people'); setPage(1); }}>People</button>
        <button className={tab === 'audit' ? 'btn' : 'btn-ghost'} type="button" onClick={() => { setTab('audit'); setPage(1); }}>Audit log</button>
      </nav>
      <ErrorBanner error={people.error ?? logs.error} />
      {tab === 'people' ? (
        people.loading ? <Loading table columns={5} label="Loading staff" /> : people.data && people.data.items.length === 0 ? <><Updating active={people.fetching} /><Empty>No admins.</Empty></> : people.data ? (
          <div className="panel">
            <Updating active={people.fetching} />
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {people.data.items.map((admin) => (
                  <tr key={admin.id}>
                    <td>{admin.name}</td>
                    <td>{admin.email}</td>
                    <td>{admin.role.replaceAll('_', ' ')}</td>
                    <td>{admin.isActive ? <Pill tone="ok">active</Pill> : <Pill tone="bad">inactive</Pill>}</td>
                    <td><button className="btn-ghost" type="button" onClick={() => setSelected(admin.id)}>Manage</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pager page={people.data.page} total={people.data.total} perPage={people.data.perPage} onPage={setPage} />
          </div>
        ) : null
      ) : logs.loading ? <Loading table columns={4} label="Loading the audit log" /> : logs.data && logs.data.items.length === 0 ? <><Updating active={logs.fetching} /><Empty>No audit events.</Empty></> : logs.data ? (
        <div className="panel">
          <Updating active={logs.fetching} />
          <table>
            <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Entity</th></tr></thead>
            <tbody>
              {logs.data.items.map((row) => (
                <tr key={row.id}>
                  <td>{formatWhen(row.createdAt)}</td>
                  <td>{row.admin.name}<div className="note">{row.admin.email}</div></td>
                  <td>{row.action}</td>
                  <td>{row.entityType}<div className="note">{row.entityId}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager page={logs.data.page} total={logs.data.total} perPage={logs.data.perPage} onPage={setPage} />
        </div>
      ) : null}
      {open ? <CreateAdmin onClose={() => setOpen(false)} onSaved={() => { setOpen(false); people.reload(); }} /> : null}
      {selected ? <ManageAdmin id={selected} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); people.reload(); }} /> : null}
    </>
  );
}

function CreateAdmin({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('ADMIN');
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await api('/admin/admins', { method: 'POST', body: { email, password, name, role } });
      onSaved();
    } catch (caught) {
      setError(caught);
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal title="New admin" onClose={onClose}>
      <form className="stack" onSubmit={save}>
        <ErrorBanner error={error} />
        <Field label="Name"><input value={name} onChange={(event) => setName(event.target.value)} required /></Field>
        <Field label="Email"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></Field>
        <Field label="Password"><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} /></Field>
        <p className="note">At least 8 characters, with a letter and a number.</p>
        <Field label="Role">
          <select value={role} onChange={(event) => setRole(event.target.value as Role)}>{ROLES.map((item) => <option key={item}>{item}</option>)}</select>
        </Field>
        <button className="btn" disabled={pending} type="submit">Create</button>
      </form>
    </Modal>
  );
}

function ManageAdmin({ id, onClose, onSaved }: { id: string; onClose: () => void; onSaved: () => void }) {
  const { data, error, loading } = useApi<Admin>(`/admin/admins/${id}`);
  const [role, setRole] = useState<Role | ''>('');
  const [formError, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);

  async function changeRole(event: FormEvent) {
    event.preventDefault();
    if (!role) return;
    setPending(true);
    setError(null);
    try {
      await api(`/admin/admins/${id}/role`, { method: 'PATCH', body: { role } });
      onSaved();
    } catch (caught) {
      setError(caught);
    } finally {
      setPending(false);
    }
  }

  async function setActive(active: boolean) {
    setPending(true);
    setError(null);
    try {
      await api(`/admin/admins/${id}/${active ? 'reactivate' : 'deactivate'}`, { method: 'POST' });
      onSaved();
    } catch (caught) {
      setError(caught);
      setPending(false);
    }
  }

  return (
    <Modal title="Manage admin" onClose={onClose}>
      {loading ? <Loading /> : null}
      <ErrorBanner error={error ?? formError} />
      {data ? (
        <div className="stack">
          <p><strong>{data.name}</strong></p>
          <p>{data.email}</p>
          <p>Current role {data.role.replaceAll('_', ' ')} · {data.isActive ? 'active' : 'inactive'}</p>
          <p className="note">Joined {formatWhen(data.createdAt)}</p>
          <form className="actions" onSubmit={changeRole}>
            <select value={role} onChange={(event) => setRole(event.target.value as Role)} required>
              <option value="">Change role</option>
              {ROLES.map((item) => <option key={item}>{item}</option>)}
            </select>
            <button className="btn" disabled={pending} type="submit">Save role</button>
          </form>
          {data.isActive ? <button className="btn-danger" type="button" disabled={pending} onClick={() => void setActive(false)}>Deactivate</button> : <button className="btn" type="button" disabled={pending} onClick={() => void setActive(true)}>Reactivate</button>}
        </div>
      ) : null}
    </Modal>
  );
}
