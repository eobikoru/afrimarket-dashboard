'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { formatWhen, labelize, qs } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import { ADJUSTMENT_REASONS, PER_PAGE, type FoodLot, type LowStockItem, type Page, type StockMovement } from '@/lib/types';
import { Empty, ErrorBanner, Field, Loading, PageHead, Pager, Updating } from './ui';

type Counts = { inStock: number; low: number; out: number };
type Low = { products: LowStockItem[]; variants: LowStockItem[] };
type InventoryRow = {
  productId: string;
  inventory: (LowStockItem & { notes?: string | null }) | null;
  variants: LowStockItem[];
};

export function InventoryView() {
  const [tab, setTab] = useState<'overview' | 'lots' | 'movements' | 'adjust'>('overview');
  const counts = useApi<Counts>('/admin/inventory/counts');
  const low = useApi<Low>('/admin/inventory/low-stock');

  return (
    <>
      <PageHead kicker="Inventory" title="The back room" lede="Counts, low stock, lots, movements, and adjustments. Frozen and perishable changes need a lot." />
      <nav className="subnav" aria-label="Inventory">
        {(['overview', 'lots', 'movements', 'adjust'] as const).map((item) => (
          <button key={item} className={tab === item ? 'btn' : 'btn-ghost'} type="button" onClick={() => setTab(item)}>{item}</button>
        ))}
      </nav>
      {tab === 'overview' ? <Overview counts={counts.data} countsError={counts.error} countsLoading={counts.loading} countsFetching={counts.fetching} low={low.data} lowError={low.error} lowLoading={low.loading} lowFetching={low.fetching} /> : null}
      {tab === 'lots' ? <Lots /> : null}
      {tab === 'movements' ? <Movements /> : null}
      {tab === 'adjust' ? <Adjust onDone={() => { counts.reload(); low.reload(); }} /> : null}
    </>
  );
}

function Overview({
  counts,
  countsError,
  countsLoading,
  countsFetching,
  low,
  lowError,
  lowLoading,
  lowFetching,
}: {
  counts: Counts | null;
  countsError: unknown;
  countsLoading: boolean;
  countsFetching: boolean;
  low: Low | null;
  lowError: unknown;
  lowLoading: boolean;
  lowFetching: boolean;
}) {
  const rows = [...(low?.products ?? []), ...(low?.variants ?? [])];
  return (
    <div className="stack">
      {countsLoading ? <Loading cards label="Loading counts" /> : <Updating active={countsFetching} />}
      <ErrorBanner error={countsError} />
      {counts ? (
        <section className="grid cards-3">
          <article className="card"><span>In stock</span><strong>{counts.inStock}</strong></article>
          <article className="card"><span>Low</span><strong>{counts.low}</strong></article>
          <article className="card"><span>Out</span><strong>{counts.out}</strong></article>
        </section>
      ) : null}
      <article className="panel">
        <h2>Low stock</h2>
        {lowLoading ? <Loading table plain columns={5} label="Loading low stock" /> : <Updating active={lowFetching} />}
        <ErrorBanner error={lowError} />
        {low && rows.length === 0 ? <Empty>Nothing is at or below its threshold.</Empty> : null}
        {rows.length > 0 ? (
          <table>
            <thead><tr><th>Item</th><th>Available</th><th>Reserved</th><th>Threshold</th><th>Location</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td><Link href={`/products/${row.productId}`}>{row.name}</Link><div className="note">{row.title ? `${row.title} · ` : ''}{row.sku}</div></td>
                  <td>{row.quantityAvailable}</td>
                  <td>{row.quantityReserved}</td>
                  <td>{row.lowStockThreshold}</td>
                  <td>{row.warehouseLocation ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </article>
      <RecordEditor />
    </div>
  );
}

function RecordEditor() {
  const [productId, setProductId] = useState('');
  const [loaded, setLoaded] = useState('');
  const row = useApi<InventoryRow>(loaded ? `/admin/inventory/${encodeURIComponent(loaded)}` : null);
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const [variantId, setVariant] = useState('');
  const [quantityIncoming, setIncoming] = useState('');
  const [lowStockThreshold, setLow] = useState('');
  const [reorderPoint, setPoint] = useState('');
  const [reorderQuantity, setReorder] = useState('');
  const [warehouseLocation, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  function fill(source: { quantityIncoming?: number; lowStockThreshold: number; reorderPoint?: number; reorderQuantity?: number; warehouseLocation?: string | null; notes?: string | null } | undefined) {
    setIncoming(source?.quantityIncoming == null ? '' : String(source.quantityIncoming));
    setLow(source ? String(source.lowStockThreshold) : '');
    setPoint(source?.reorderPoint == null ? '' : String(source.reorderPoint));
    setReorder(source?.reorderQuantity == null ? '' : String(source.reorderQuantity));
    setLocation(source?.warehouseLocation ?? '');
    setNotes(source?.notes ?? '');
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!loaded) return;
    setPending(true);
    setError(null);
    try {
      const num = (value: string) => (value.trim() ? Number(value) : undefined);
      await api(`/admin/inventory/${encodeURIComponent(loaded)}`, {
        method: 'PATCH',
        body: {
          variantId: variantId || undefined,
          quantityIncoming: num(quantityIncoming),
          lowStockThreshold: num(lowStockThreshold),
          reorderPoint: num(reorderPoint),
          reorderQuantity: num(reorderQuantity),
          warehouseLocation: warehouseLocation.trim() ? warehouseLocation.trim() : null,
          notes: notes.trim() ? notes.trim() : null,
        },
      });
      row.reload();
    } catch (caught) {
      setError(caught);
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="panel">
      <h2>Edit a stock row</h2>
      <form className="filters" onSubmit={(event) => { event.preventDefault(); setLoaded(productId.trim()); }}>
        <label className="field grow">Product id<input value={productId} onChange={(event) => setProductId(event.target.value)} required /></label>
        <button className="btn" type="submit">Load</button>
      </form>
      {row.loading ? <Loading /> : null}
      <ErrorBanner error={row.error ?? error} />
      {row.data ? (
        <form className="stack" onSubmit={save}>
          <p className="note">{row.data.inventory ? 'This product tracks a single inventory row.' : 'This product tracks pack sizes. Choose a variant.'}</p>
          {row.data.variants.length > 0 ? (
            <Field label="Variant">
              <select value={variantId} onChange={(event) => {
                setVariant(event.target.value);
                fill(row.data?.variants.find((item) => item.id === event.target.value));
              }} required>
                <option value="">Choose</option>
                {row.data.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.title ?? variant.sku}</option>)}
              </select>
            </Field>
          ) : null}
          <div className="form-grid">
            <Field label="Incoming"><input inputMode="numeric" value={quantityIncoming} onChange={(event) => setIncoming(event.target.value)} /></Field>
            <Field label="Low stock threshold"><input inputMode="numeric" value={lowStockThreshold} onChange={(event) => setLow(event.target.value)} /></Field>
            <Field label="Reorder point"><input inputMode="numeric" value={reorderPoint} onChange={(event) => setPoint(event.target.value)} /></Field>
            <Field label="Reorder quantity"><input inputMode="numeric" value={reorderQuantity} onChange={(event) => setReorder(event.target.value)} /></Field>
            <Field label="Warehouse location" wide><input value={warehouseLocation} onChange={(event) => setLocation(event.target.value)} /></Field>
            <Field label="Notes" wide><textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></Field>
          </div>
          {row.data.inventory && !variantId ? (
            <button className="btn-ghost" type="button" onClick={() => fill(row.data?.inventory ?? undefined)}>Fill from product row</button>
          ) : null}
          <button className="btn" disabled={pending} type="submit">Save row</button>
        </form>
      ) : null}
    </article>
  );
}

function Lots() {
  const [productId, setProductId] = useState('');
  const [days, setDays] = useState('');
  const [filters, setFilters] = useState({ productId: '', days: '' });
  const lots = useApi<FoodLot[]>(`/admin/inventory/lots${qs({ productId: filters.productId, expiringWithinDays: filters.days })}`);
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({ productId: '', variantId: '', lotCode: '', quantity: '', bestByDate: '', receivedAt: '' });

  async function receive(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await api('/admin/inventory/lots', {
        method: 'POST',
        body: {
          productId: form.productId.trim(),
          variantId: form.variantId.trim() || null,
          lotCode: form.lotCode.trim(),
          quantity: Number(form.quantity),
          bestByDate: new Date(`${form.bestByDate}T00:00:00.000Z`).toISOString(),
          receivedAt: form.receivedAt ? new Date(`${form.receivedAt}T00:00:00.000Z`).toISOString() : undefined,
        },
      });
      lots.reload();
    } catch (caught) {
      setError(caught);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="stack">
      <form className="filters" onSubmit={(event) => { event.preventDefault(); setFilters({ productId, days }); }}>
        <label className="field">Product id<input value={productId} onChange={(event) => setProductId(event.target.value)} /></label>
        <label className="field">Expiring within days<input inputMode="numeric" value={days} onChange={(event) => setDays(event.target.value)} /></label>
        <button className="btn" type="submit">Filter</button>
      </form>
      {lots.loading ? <Loading table columns={4} label="Loading lots" /> : <Updating active={lots.fetching} />}
      <ErrorBanner error={lots.error} />
      {lots.data && lots.data.length === 0 ? <Empty>No lots match.</Empty> : null}
      {lots.data && lots.data.length > 0 ? (
        <div className="panel">
          <table>
            <thead><tr><th>Product</th><th>Lot</th><th>Qty</th><th>Best by</th></tr></thead>
            <tbody>
              {lots.data.map((lot) => (
                <tr key={lot.id}>
                  <td>{lot.product?.name ?? lot.productId}<div className="note">{lot.variant?.title ?? ''}</div></td>
                  <td>{lot.lotCode}</td>
                  <td>{lot.quantity}</td>
                  <td>{formatWhen(lot.bestByDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <form className="panel stack" onSubmit={receive}>
        <h2>Receive a lot</h2>
        <ErrorBanner error={error} />
        <div className="form-grid">
          <Field label="Product id"><input value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })} required /></Field>
          <Field label="Variant id"><input value={form.variantId} onChange={(event) => setForm({ ...form, variantId: event.target.value })} placeholder="Required when the product has packs" /></Field>
          <Field label="Lot code"><input value={form.lotCode} onChange={(event) => setForm({ ...form, lotCode: event.target.value })} required /></Field>
          <Field label="Quantity"><input inputMode="numeric" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required /></Field>
          <Field label="Best by"><input type="date" value={form.bestByDate} onChange={(event) => setForm({ ...form, bestByDate: event.target.value })} required /></Field>
          <Field label="Received"><input type="date" value={form.receivedAt} onChange={(event) => setForm({ ...form, receivedAt: event.target.value })} /></Field>
        </div>
        <button className="btn" disabled={pending} type="submit">Receive lot</button>
      </form>
    </div>
  );
}

function Movements() {
  const [page, setPage] = useState(1);
  const [productId, setProductId] = useState('');
  const [filter, setFilter] = useState('');
  const { data, error, loading, fetching } = useApi<Page<StockMovement>>(`/admin/inventory/movements${qs({ page, perPage: PER_PAGE, productId: filter })}`);
  return (
    <>
      <form className="filters" onSubmit={(event) => { event.preventDefault(); setPage(1); setFilter(productId.trim()); }}>
        <label className="field grow">Product id<input value={productId} onChange={(event) => setProductId(event.target.value)} /></label>
        <button className="btn" type="submit">Filter</button>
      </form>
      {loading ? <Loading table columns={5} label="Loading movements" /> : <Updating active={fetching} />}
      <ErrorBanner error={error} />
      {data && data.items.length === 0 ? <Empty>No movements.</Empty> : null}
      {data && data.items.length > 0 ? (
        <div className="panel">
          <table>
            <thead><tr><th>When</th><th>Type</th><th>Delta</th><th>Reason</th><th>Note</th></tr></thead>
            <tbody>
              {data.items.map((row) => (
                <tr key={row.id}>
                  <td>{formatWhen(row.createdAt)}</td>
                  <td>{labelize(row.type)}</td>
                  <td>{row.delta}</td>
                  <td>{row.reason ? labelize(row.reason) : '—'}</td>
                  <td>{row.note ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager page={data.page} total={data.total} perPage={data.perPage} onPage={setPage} />
        </div>
      ) : null}
    </>
  );
}

function Adjust({ onDone }: { onDone: () => void }) {
  const [productId, setProductId] = useState('');
  const [variantId, setVariant] = useState('');
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState<string>(ADJUSTMENT_REASONS[0]);
  const [note, setNote] = useState('');
  const [lotId, setLot] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await api('/admin/inventory/adjustments', {
        method: 'POST',
        body: {
          productId: productId.trim(),
          variantId: variantId.trim() || null,
          delta: Number(delta),
          reason,
          note: note.trim() || undefined,
          lotId: lotId.trim() || undefined,
        },
      });
      setDelta('');
      setNote('');
      onDone();
    } catch (caught) {
      setError(caught);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="panel stack" onSubmit={submit}>
      <h2>Post an adjustment</h2>
      <ErrorBanner error={error} />
      <div className="form-grid">
        <Field label="Product id"><input value={productId} onChange={(event) => setProductId(event.target.value)} required /></Field>
        <Field label="Variant id"><input value={variantId} onChange={(event) => setVariant(event.target.value)} /></Field>
        <Field label="Delta"><input value={delta} onChange={(event) => setDelta(event.target.value)} required placeholder="-2 or 5" /></Field>
        <Field label="Reason">
          <select value={reason} onChange={(event) => setReason(event.target.value)}>{ADJUSTMENT_REASONS.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}</select>
        </Field>
        <Field label="Lot id"><input value={lotId} onChange={(event) => setLot(event.target.value)} placeholder="Required for perishable and frozen" /></Field>
        <Field label="Note" wide><input value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} /></Field>
      </div>
      <button className="btn" disabled={pending} type="submit">Post adjustment</button>
    </form>
  );
}
