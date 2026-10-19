'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatUsd, formatWhen, labelize, qs } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import { PER_PAGE, type Customer, type CustomerDetail, type Page } from '@/lib/types';
import { Empty, ErrorBanner, Loading, PageHead, Pager, Pill, statusTone, Updating } from './ui';

export function CustomersView() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const { data, error, loading, fetching } = useApi<Page<Customer>>(`/admin/customers${qs({ page, perPage: PER_PAGE, q: search })}`);

  return (
    <>
      <PageHead kicker="Customers" title="People who shop" lede="Search email or name." />
      <form className="filters" onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(q); }}>
        <label className="field grow">Search<input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Email or name" /></label>
        <button className="btn" type="submit">Search</button>
      </form>
      {loading ? <Loading table columns={4} label="Loading customers" /> : <Updating active={fetching} />}
      <ErrorBanner error={error} />
      {data && data.items.length === 0 ? <Empty>No customers match.</Empty> : null}
      {data && data.items.length > 0 ? (
        <div className="panel">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th></tr></thead>
            <tbody>
              {data.items.map((customer) => (
                <tr key={customer.id} className="click" onClick={() => router.push(`/customers/${customer.id}`)}>
                  <td><Link href={`/customers/${customer.id}`}>{customer.firstName} {customer.lastName}</Link>{customer.isActive ? null : <Pill tone="bad">inactive</Pill>}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone ?? '—'}</td>
                  <td>{formatWhen(customer.createdAt)}</td>
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

export function CustomerDetailView({ id }: { id: string }) {
  const { data, error, loading } = useApi<CustomerDetail>(`/admin/customers/${encodeURIComponent(id)}`);
  if (loading) return <Loading />;
  if (error) return <ErrorBanner error={error} />;
  if (!data) return <Empty>Customer not found.</Empty>;
  return (
    <>
      <PageHead kicker="Customer" title={`${data.firstName} ${data.lastName}`} lede={data.email}>
        <Link className="btn-ghost" href="/customers">All customers</Link>
      </PageHead>
      <div className="split">
        <article className="panel">
          <h2>Recent orders</h2>
          {data.recentOrders.length === 0 ? <p className="note">No orders yet.</p> : (
            <table>
              <thead><tr><th>Order</th><th>Status</th><th>Total</th></tr></thead>
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr key={order.orderNumber}>
                    <td><Link href={`/orders/${encodeURIComponent(order.orderNumber)}`}>{order.orderNumber}</Link><div className="note">{formatWhen(order.createdAt)}</div></td>
                    <td><Pill tone={statusTone(order.status)}>{labelize(order.status)}</Pill> <Pill tone={statusTone(order.paymentStatus)}>{labelize(order.paymentStatus)}</Pill></td>
                    <td>{formatUsd(order.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>
        <article className="panel">
          <h2>Profile</h2>
          <p>Phone {data.phone ?? '—'}</p>
          <p>Marketing {data.marketingOptIn ? 'opted in' : 'opted out'}</p>
          <p>Account {data.isActive ? 'active' : 'inactive'}</p>
          <p className="note">Joined {formatWhen(data.createdAt)}</p>
          <h2 style={{ marginTop: 18 }}>Addresses</h2>
          {data.addresses.length === 0 ? <p className="note">No saved addresses.</p> : data.addresses.map((address) => (
            <address className="address" key={address.id} style={{ marginTop: 10 }}>
              {address.label ? <strong>{address.label}{address.id === data.defaultAddressId ? ' · default' : ''}</strong> : null}
              <span>{address.line1}</span>
              {address.line2 ? <span>{address.line2}</span> : null}
              <span>{address.city}, {address.state} {address.postalCode}</span>
              <span>{address.country}</span>
              {address.phone ? <span>{address.phone}</span> : null}
            </address>
          ))}
        </article>
      </div>
    </>
  );
}
