'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { formatUsd, formatWhen, labelize, qs } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import { CARRIERS, ORDER_STATUSES, PAYMENT_STATUSES, PER_PAGE, STATUS_MOVES, type Order, type Page } from '@/lib/types';
import { Empty, ErrorBanner, Loading, PageHead, Pager, Pill, statusTone, Updating } from './ui';

export function OrdersView() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [provider, setProvider] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState('newest');
  const [filters, setFilters] = useState({ q: '', status: '', paymentStatus: '', provider: '', from: '', to: '', sort: 'newest' });

  const path = `/admin/orders${qs({
    page,
    perPage: PER_PAGE,
    q: filters.q,
    status: filters.status,
    paymentStatus: filters.paymentStatus,
    provider: filters.provider,
    from: filters.from ? `${filters.from}T00:00:00.000Z` : '',
    to: filters.to ? `${filters.to}T23:59:59.999Z` : '',
    sort: filters.sort,
  })}`;
  const { data, error, loading, fetching } = useApi<Page<Order>>(path);

  return (
    <>
      <PageHead kicker="Orders" title="Every basket" lede="Search by order number or email. Refunds use the refund action, never a status change." />
      <form
        className="filters"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setFilters({ q, status, paymentStatus, provider, from, to, sort });
        }}
      >
        <label className="field grow">Search<input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Order number or email" /></label>
        <label className="field">Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Any</option>{ORDER_STATUSES.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="field">Payment<select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)}><option value="">Any</option>{PAYMENT_STATUSES.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="field">Provider<select value={provider} onChange={(event) => setProvider(event.target.value)}><option value="">Any</option><option value="stripe">stripe</option><option value="paypal">paypal</option></select></label>
        <label className="field">From<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
        <label className="field">To<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
        <label className="field">Sort
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="newest">newest</option>
            <option value="oldest">oldest</option>
            <option value="total_desc">total_desc</option>
            <option value="total_asc">total_asc</option>
          </select>
        </label>
        <button className="btn" type="submit">Filter</button>
      </form>
      {loading ? <Loading table columns={6} label="Loading orders" /> : <Updating active={fetching} />}
      <ErrorBanner error={error} />
      {data && data.items.length === 0 ? <Empty>No orders match.</Empty> : null}
      {data && data.items.length > 0 ? (
        <div className="panel">
          <table>
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Status</th><th>Payment</th><th>Total</th><th>Placed</th></tr>
            </thead>
            <tbody>
              {data.items.map((order) => (
                <tr key={order.orderNumber} className="click" onClick={() => router.push(`/orders/${encodeURIComponent(order.orderNumber)}`)}>
                  <td><Link href={`/orders/${encodeURIComponent(order.orderNumber)}`}>{order.orderNumber}</Link></td>
                  <td>{order.customerName}<div className="note">{order.email}</div></td>
                  <td><Pill tone={statusTone(order.status)}>{labelize(order.status)}</Pill></td>
                  <td><Pill tone={statusTone(order.paymentStatus)}>{labelize(order.paymentStatus)}</Pill></td>
                  <td>{formatUsd(order.totalCents)}</td>
                  <td>{formatWhen(order.createdAt)}</td>
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

function Address({ value }: { value: unknown }) {
  if (!value || typeof value !== 'object') return <p>—</p>;
  const address = value as Record<string, unknown>;
  const cityLine = [address.city, address.state, address.postalCode].filter((part) => typeof part === 'string' && part).join(', ');
  const lines = [address.line1, address.line2, cityLine, address.country, address.phone].filter((part) => typeof part === 'string' && part);
  return <address className="address">{lines.map((line) => <span key={String(line)}>{String(line)}</span>)}</address>;
}

export function OrderDetailView({ orderNumber }: { orderNumber: string }) {
  const path = `/admin/orders/${encodeURIComponent(orderNumber)}`;
  const { data, error, loading, reload } = useApi<Order>(path);
  const [actionError, setActionError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);

  async function run(task: () => Promise<unknown>) {
    setPending(true);
    setActionError(null);
    try {
      await task();
      reload();
    } catch (caught) {
      setActionError(caught);
    } finally {
      setPending(false);
    }
  }

  if (loading) return <Loading />;
  if (error) return <ErrorBanner error={error} />;
  if (!data) return <Empty>Order not found.</Empty>;

  const moves = STATUS_MOVES[data.status] ?? [];
  const canTrack = data.status === 'processing' || data.status === 'shipped';
  const refundable = data.paymentStatus === 'completed' || data.paymentStatus === 'partially_refunded';

  return (
    <div className="stack">
      <PageHead kicker="Order" title={data.orderNumber} lede={`${data.customerName} · ${data.email}`}>
        <Link className="btn-ghost" href="/orders">All orders</Link>
      </PageHead>
      <ErrorBanner error={actionError} />
      <section className="grid stats">
        <article className="card"><span>Total</span><strong>{formatUsd(data.totalCents)}</strong><em>Refunded {formatUsd(data.refundedCents)}</em></article>
        <article className="card"><span>Status</span><strong style={{ fontSize: 22 }}>{labelize(data.status)}</strong><em>{labelize(data.paymentStatus)} · {data.paymentProvider}</em></article>
        <article className="card"><span>Shipping</span><strong style={{ fontSize: 22 }}>{labelize(data.shippingMethod)}</strong><em>{data.trackingCarrier ? `${data.trackingCarrier} ${data.trackingNumber}` : 'No tracking yet'}</em></article>
        <article className="card"><span>Placed</span><strong style={{ fontSize: 22 }}>{formatWhen(data.createdAt)}</strong><em>{data.paidAt ? `Paid ${formatWhen(data.paidAt)}` : 'Not paid'}</em></article>
      </section>
      <div className="split">
        <div className="stack">
          <article className="panel">
            <h2>Lines</h2>
            <table>
              <thead><tr><th>Item</th><th>Qty</th><th>Returned</th><th>Line</th></tr></thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}<div className="note">{item.sku} · {labelize(item.storageType)}</div></td>
                    <td>{item.quantity}</td>
                    <td>{item.returnedQuantity}</td>
                    <td>{formatUsd(item.lineTotalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="note" style={{ marginTop: 10 }}>
              Subtotal {formatUsd(data.subtotalCents)} · Discount {formatUsd(data.discountCents)} · Shipping {formatUsd(data.shippingCents)} · Tax {formatUsd(data.taxCents)}
              {data.couponCode ? ` · Coupon ${data.couponCode}` : ''}
            </p>
          </article>
          <article className="panel">
            <h2>Notes</h2>
            {data.notes.length === 0 ? <p className="note">No notes.</p> : data.notes.map((note) => (
              <p key={note.id} style={{ marginBottom: 10 }}>{note.body}<span className="note"> · {note.isInternal ? 'internal' : 'customer'} · {formatWhen(note.createdAt)}</span></p>
            ))}
            <NoteForm pending={pending} onSubmit={(body, isInternal) => run(() => api(path + '/notes', { method: 'POST', body: { body, isInternal } }))} />
          </article>
        </div>
        <div className="stack">
          <article className="panel">
            <h2>Ship to</h2>
            <Address value={data.shippingAddress} />
            <p className="note" style={{ marginTop: 8 }}>{data.shippingExplanation}</p>
            {data.deliveryNote ? <p className="note">Note: {data.deliveryNote}</p> : null}
            <h2 style={{ marginTop: 16 }}>Bill to</h2>
            <Address value={data.billingAddress} />
            <p className="note" style={{ marginTop: 8 }}>{data.taxExplanation}{data.taxState ? ` · ${data.taxState}` : ''}{data.taxRateBps != null ? ` · ${data.taxRateBps} bps` : ''}</p>
          </article>
          <article className="panel">
            <h2>Actions</h2>
            <div className="stack">
              {moves.length === 0 ? <p className="note">No further status changes from {data.status}.</p> : moves.map((status) => (
                <button
                  key={status}
                  className={status === 'cancelled' ? 'btn-danger' : 'btn'}
                  type="button"
                  disabled={pending || (status === 'shipped' && !data.trackingNumber)}
                  onClick={() => run(() => api(`${path}/status`, { method: 'POST', body: { status } }))}
                >
                  Mark {status}
                </button>
              ))}
              {data.status === 'processing' && !data.trackingNumber ? <p className="note">Add tracking before marking shipped. Saving tracking also ships the order.</p> : null}
              {canTrack ? <TrackingForm pending={pending} onSubmit={(carrier, trackingNumber) => run(() => api(`${path}/tracking`, { method: 'POST', body: { carrier, trackingNumber } }))} /> : null}
              {refundable ? <RefundForm pending={pending} onSubmit={(amountCents) => run(() => api(`${path}/refund`, { method: 'POST', body: amountCents == null ? {} : { amountCents } }))} /> : <p className="note">Refunds are available after payment completes.</p>}
              <ReturnForm order={data} pending={pending} onSubmit={(items) => run(() => api(`${path}/return-stock`, { method: 'POST', body: { items } }))} />
              {data.paymentReference ? <p className="note">Payment reference {data.paymentReference}</p> : null}
              {data.stockReturned ? <p className="note">Stock has been returned.</p> : null}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

function NoteForm({ pending, onSubmit }: { pending: boolean; onSubmit: (body: string, isInternal: boolean) => void }) {
  const [body, setBody] = useState('');
  const [isInternal, setInternal] = useState(true);
  return (
    <form
      className="stack"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        onSubmit(body, isInternal);
        setBody('');
      }}
    >
      <textarea value={body} onChange={(event) => setBody(event.target.value)} required maxLength={2000} placeholder="Add a note" />
      <label className="check"><input type="checkbox" checked={isInternal} onChange={(event) => setInternal(event.target.checked)} /> Internal</label>
      <button className="btn" disabled={pending} type="submit">Save note</button>
    </form>
  );
}

function TrackingForm({ pending, onSubmit }: { pending: boolean; onSubmit: (carrier: string, trackingNumber: string) => void }) {
  const [carrier, setCarrier] = useState('usps');
  const [trackingNumber, setTracking] = useState('');
  return (
    <form className="stack" onSubmit={(event) => { event.preventDefault(); onSubmit(carrier, trackingNumber); }}>
      <select value={carrier} onChange={(event) => setCarrier(event.target.value)}>{CARRIERS.map((item) => <option key={item}>{item}</option>)}</select>
      <input value={trackingNumber} onChange={(event) => setTracking(event.target.value)} minLength={4} maxLength={64} required placeholder="Tracking number" />
      <button className="btn" disabled={pending} type="submit">Save tracking</button>
    </form>
  );
}

function RefundForm({ pending, onSubmit }: { pending: boolean; onSubmit: (amountCents: number | null) => void }) {
  const [amount, setAmount] = useState('');
  return (
    <form
      className="stack"
      onSubmit={(event) => {
        event.preventDefault();
        if (!amount.trim()) {
          onSubmit(null);
          return;
        }
        if (!/^\d+$/.test(amount.trim())) return;
        onSubmit(Number(amount.trim()));
      }}
    >
      <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="numeric" placeholder="Amount in cents, blank for the remainder" />
      <button className="btn-danger" disabled={pending} type="submit">Refund</button>
    </form>
  );
}

function ReturnForm({ order, pending, onSubmit }: { order: Order; pending: boolean; onSubmit: (items: { orderItemId: string; quantity: number }[]) => void }) {
  const [qty, setQty] = useState<Record<string, string>>({});
  return (
    <form
      className="stack"
      onSubmit={(event) => {
        event.preventDefault();
        const items = order.items.flatMap((item) => {
          const quantity = Number(qty[item.id] ?? '');
          if (!Number.isInteger(quantity) || quantity <= 0) return [];
          return [{ orderItemId: item.id, quantity }];
        });
        if (items.length === 0) return;
        onSubmit(items);
      }}
    >
      {order.items.map((item) => (
        <label className="field" key={item.id}>
          Return {item.name} (max {item.quantity - item.returnedQuantity})
          <input inputMode="numeric" value={qty[item.id] ?? ''} onChange={(event) => setQty({ ...qty, [item.id]: event.target.value })} placeholder="0" />
        </label>
      ))}
      <button className="btn-ghost" disabled={pending} type="submit">Return stock</button>
    </form>
  );
}
