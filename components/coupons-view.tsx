'use client';

import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { formatUsd, formatWhen, qs } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import { PER_PAGE, type Coupon, type Page } from '@/lib/types';
import { Empty, ErrorBanner, Field, Loading, Modal, PageHead, Pager, Pill, Updating } from './ui';

const empty = { code: '', type: 'percent', value: '', minSubtotalCents: '0', startsAt: '', endsAt: '', usageLimit: '', perCustomerLimit: '', active: true };

export function CouponsView() {
  const [page, setPage] = useState(1);
  const { data, error, loading, fetching, reload } = useApi<Page<Coupon>>(`/admin/coupons${qs({ page, perPage: PER_PAGE })}`);
  const [open, setOpen] = useState<Coupon | 'new' | null>(null);

  return (
    <>
      <PageHead kicker="Merchandising" title="Coupons" lede="Percent values are 1–100. Fixed coupons store the discount in cents.">
        <button className="btn" type="button" onClick={() => setOpen('new')}>New coupon</button>
      </PageHead>
      {loading ? <Loading table columns={5} label="Loading coupons" /> : <Updating active={fetching} />}
      <ErrorBanner error={error} />
      {data && data.items.length === 0 ? <Empty>No coupons yet.</Empty> : null}
      {data && data.items.length > 0 ? (
        <div className="panel">
          <table>
            <thead><tr><th>Code</th><th>Offer</th><th>Minimum</th><th>Window</th><th></th></tr></thead>
            <tbody>
              {data.items.map((coupon) => (
                <tr key={coupon.id}>
                  <td>{coupon.code} {coupon.active ? <Pill tone="ok">active</Pill> : <Pill tone="bad">off</Pill>}</td>
                  <td>{coupon.type === 'percent' ? `${coupon.value}%` : formatUsd(coupon.value)}</td>
                  <td>{formatUsd(coupon.minSubtotalCents)}</td>
                  <td>{formatWhen(coupon.startsAt)} – {formatWhen(coupon.endsAt)}</td>
                  <td><button className="btn-ghost" type="button" onClick={() => setOpen(coupon)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager page={data.page} total={data.total} perPage={data.perPage} onPage={setPage} />
        </div>
      ) : null}
      {open ? <CouponModal coupon={open === 'new' ? null : open} onClose={() => setOpen(null)} onSaved={() => { setOpen(null); reload(); }} /> : null}
    </>
  );
}

function CouponModal({ coupon, onClose, onSaved }: { coupon: Coupon | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(() => coupon ? {
    code: coupon.code,
    type: coupon.type,
    value: String(coupon.value),
    minSubtotalCents: String(coupon.minSubtotalCents),
    startsAt: coupon.startsAt ? coupon.startsAt.slice(0, 10) : '',
    endsAt: coupon.endsAt ? coupon.endsAt.slice(0, 10) : '',
    usageLimit: coupon.usageLimit == null ? '' : String(coupon.usageLimit),
    perCustomerLimit: coupon.perCustomerLimit == null ? '' : String(coupon.perCustomerLimit),
    active: coupon.active,
  } : empty);
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const body = {
        code: form.code.trim(),
        type: form.type,
        value: Number(form.value),
        minSubtotalCents: Number(form.minSubtotalCents || 0),
        startsAt: form.startsAt ? new Date(`${form.startsAt}T00:00:00.000Z`).toISOString() : null,
        endsAt: form.endsAt ? new Date(`${form.endsAt}T00:00:00.000Z`).toISOString() : null,
        usageLimit: form.usageLimit.trim() ? Number(form.usageLimit) : null,
        perCustomerLimit: form.perCustomerLimit.trim() ? Number(form.perCustomerLimit) : null,
        active: form.active,
      };
      if (coupon) await api(`/admin/coupons/${coupon.id}`, { method: 'PATCH', body });
      else await api('/admin/coupons', { method: 'POST', body });
      onSaved();
    } catch (caught) {
      setError(caught);
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!coupon) return;
    setPending(true);
    try {
      await api(`/admin/coupons/${coupon.id}`, { method: 'DELETE' });
      onSaved();
    } catch (caught) {
      setError(caught);
      setPending(false);
    }
  }

  return (
    <Modal title={coupon ? coupon.code : 'New coupon'} onClose={onClose}>
      <form className="stack" onSubmit={save}>
        <ErrorBanner error={error} />
        <div className="form-grid">
          <Field label="Code"><input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required /></Field>
          <Field label="Type">
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
              <option value="percent">percent</option>
              <option value="fixed_cents">fixed_cents</option>
            </select>
          </Field>
          <Field label={form.type === 'percent' ? 'Percent' : 'Value (cents)'}><input inputMode="numeric" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} required /></Field>
          <Field label="Minimum subtotal (cents)"><input inputMode="numeric" value={form.minSubtotalCents} onChange={(event) => setForm({ ...form, minSubtotalCents: event.target.value })} /></Field>
          <Field label="Starts"><input type="date" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /></Field>
          <Field label="Ends"><input type="date" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} /></Field>
          <Field label="Usage limit"><input inputMode="numeric" value={form.usageLimit} onChange={(event) => setForm({ ...form, usageLimit: event.target.value })} /></Field>
          <Field label="Per customer"><input inputMode="numeric" value={form.perCustomerLimit} onChange={(event) => setForm({ ...form, perCustomerLimit: event.target.value })} /></Field>
        </div>
        <label className="check"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Active</label>
        <div className="actions">
          <button className="btn" disabled={pending} type="submit">Save</button>
          {coupon ? <button className="btn-danger" type="button" onClick={() => void remove()}>Delete</button> : null}
        </div>
      </form>
    </Modal>
  );
}
