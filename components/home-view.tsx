'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useApi } from '@/lib/use-api';
import { defaultTrendRange, formatDay, formatUsd, labelize, qs, trendQuery } from '@/lib/format';
import type { DashboardSummary } from '@/lib/types';
import { Bars, Mix, RevenueChart, StockMix } from './charts';
import { Empty, ErrorBanner, Loading, PageHead, Pill, Updating } from './ui';

export function HomeView() {
  const initial = useMemo(() => defaultTrendRange(), []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [applied, setApplied] = useState(initial);
  const query = trendQuery(applied.from, applied.to);
  const { data, error, loading, fetching } = useApi<DashboardSummary>(`/admin/dashboard${qs(query)}`);

  return (
    <>
      <PageHead kicker="Home" title="This morning’s floor" lede="Revenue in the window below. Today’s cards always use the current UTC day.">
        <form
          className="filters"
          onSubmit={(event) => {
            event.preventDefault();
            setApplied({ from, to });
          }}
        >
          <label className="field">From<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} required /></label>
          <label className="field">To<input type="date" value={to} onChange={(event) => setTo(event.target.value)} required /></label>
          <button className="btn" type="submit">Apply</button>
        </form>
      </PageHead>
      {loading ? <Loading cards label="Loading the floor" /> : <Updating active={fetching} />}
      <ErrorBanner error={error} />
      {data ? <Dashboard data={data} /> : null}
      {!loading && !error && !data ? <Empty>No dashboard yet.</Empty> : null}
    </>
  );
}

function Dashboard({ data }: { data: DashboardSummary }) {
  const cards = [
    ['Products', String(data.products), 'Catalog'],
    ['Orders today', String(data.ordersToday), `${data.ordersTotal} all time`],
    ['Customers', String(data.customers), 'Accounts'],
    ['Revenue today', formatUsd(data.revenueTodayCents), formatUsd(data.revenueTotalCents) + ' net'],
    ['Paid orders', String(data.paidOrders), 'Completed, refunded, or partial'],
    ['Unpaid orders', String(data.unpaidOrders), 'Pending or failed'],
  ];
  return (
    <div className="stack">
      <section className="grid stats">
        {cards.map(([label, value, hint]) => (
          <article className="card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <em>{hint}</em>
          </article>
        ))}
      </section>
      <section className="grid cards-2">
        <article className="panel">
          <h2>Revenue</h2>
          <RevenueChart points={data.revenueTrend} />
        </article>
        <article className="panel">
          <h2>Order status</h2>
          <Bars rows={data.orderStatus.map((row) => ({ name: row.status, count: row.count }))} label="statuses" />
        </article>
        <article className="panel">
          <h2>Payment mix</h2>
          <Mix stripe={data.paymentMix.stripe} paypal={data.paymentMix.paypal} />
        </article>
        <article className="panel">
          <h2>Inventory</h2>
          <StockMix inStock={data.inventory.inStock} low={data.inventory.low} out={data.inventory.out} />
          <p className="note" style={{ marginTop: 12 }}>
            Low stock lines: {data.lowStock.products} products, {data.lowStock.variants} packs.
          </p>
        </article>
      </section>
      <section className="grid cards-2">
        <article className="panel">
          <h2>Low stock</h2>
          {data.lowStock.items.length === 0 ? <p className="note">Every counted row is above its threshold.</p> : (
            <table>
              <thead><tr><th>Item</th><th>Available</th><th>Threshold</th></tr></thead>
              <tbody>
                {data.lowStock.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link href={`/products/${item.productId}`}>{item.name}</Link>
                      <div className="note">{item.title ? `${item.title} · ` : ''}{item.sku}</div>
                    </td>
                    <td>{item.quantityAvailable}</td>
                    <td>{item.lowStockThreshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>
        <article className="panel">
          <h2>Expiring lots</h2>
          {data.expiringLots.length === 0 ? <p className="note">No lots inside the 14-day window.</p> : (
            <table>
              <thead><tr><th>Lot</th><th>Qty</th><th>Best by</th></tr></thead>
              <tbody>
                {data.expiringLots.map((lot) => (
                  <tr key={lot.id}>
                    <td>
                      {lot.product?.name ?? 'Product'}
                      <div className="note">{lot.lotCode}{lot.variant ? ` · ${lot.variant.title}` : ''}</div>
                    </td>
                    <td>{lot.quantity}</td>
                    <td>{formatDay(lot.bestByDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>
      </section>
      <article className="panel">
        <h2>Journal</h2>
        <div className="actions">
          {data.blog.length === 0 ? <p className="note">No posts yet.</p> : data.blog.map((row) => (
            <Pill key={row.status}>{labelize(row.status)} {row.count}</Pill>
          ))}
          <Link className="btn-ghost" href="/blog">Open blog</Link>
        </div>
      </article>
    </div>
  );
}
