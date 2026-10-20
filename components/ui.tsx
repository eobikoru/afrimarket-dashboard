'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ApiError } from '@/lib/api';

export function ErrorBanner({ error }: { error: unknown }) {
  if (!error) return null;
  const api = error instanceof ApiError ? error : null;
  const code = api?.code ?? 'ERROR';
  const message = api?.message ?? (error instanceof Error ? error.message : 'Request failed');
  const details = api?.details;
  return (
    <div className="error" role="alert">
      <strong>{code}</strong>
      <p>{message}</p>
      {details != null && <pre>{typeof details === 'string' ? details : JSON.stringify(details, null, 2)}</pre>}
    </div>
  );
}

export function Loading({
  label = 'Loading',
  table = false,
  cards = false,
  plain = false,
  columns = 4,
  rows = 6,
}: {
  label?: string;
  table?: boolean;
  cards?: boolean;
  plain?: boolean;
  columns?: number;
  rows?: number;
}) {
  if (cards) {
    return (
      <div className="grid stats" role="status" aria-busy="true" aria-label={label}>
        {Array.from({ length: 6 }, (_, index) => (
          <article className="card" key={index}>
            <span className="sk" />
            <strong><span className="sk sk-lg" /></strong>
          </article>
        ))}
      </div>
    );
  }
  if (table) {
    return (
      <div className={plain ? undefined : 'panel'} role="status" aria-busy="true" aria-label={label}>
        <table>
          <thead>
            <tr>
              {Array.from({ length: columns }, (_, index) => (
                <th key={index}><span className="sk" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, row) => (
              <tr key={row}>
                {Array.from({ length: columns }, (_, column) => (
                  <td key={column}><span className="sk" /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="state" role="status" aria-busy="true">
      {label}…
    </div>
  );
}

export function Updating({ active }: { active: boolean }) {
  if (!active) return null;
  return <p className="note" role="status">Updating…</p>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="state">{children}</div>;
}

export function Pill({ children, tone }: { children: React.ReactNode; tone?: 'ok' | 'warn' | 'bad' }) {
  return <span className={`pill${tone ? ` ${tone}` : ''}`}>{children}</span>;
}

export function statusTone(status: string): 'ok' | 'warn' | 'bad' | undefined {
  if (['delivered', 'completed', 'available', 'published', 'active'].includes(status)) return 'ok';
  if (['pending', 'processing', 'shipped', 'draft', 'coming_soon', 'partially_refunded'].includes(status)) return 'warn';
  if (['cancelled', 'failed', 'refunded', 'out_of_stock', 'discontinued', 'archived'].includes(status)) return 'bad';
  return undefined;
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal panel" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <div className="toolbar">
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button className="btn-ghost" type="button" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Pager({
  page,
  total,
  perPage,
  onPage,
}: {
  page: number;
  total: number;
  perPage: number;
  onPage: (page: number) => void;
}) {
  const pages = total <= 0 ? 1 : Math.trunc((total + perPage - 1) / perPage);
  return (
    <div className="pager">
      <span>
        Page {page} of {pages} · {total} total
      </span>
      <div className="actions">
        <button className="btn-ghost" type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
        <button className="btn-ghost" type="button" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}

export function PasswordField({
  label = 'Password',
  value,
  onChange,
  autoComplete,
  required,
  minLength,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="field">
      {label}
      <span className="secret">
        <input
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          minLength={minLength}
          required={required}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          className="eye"
          type="button"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </span>
    </label>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6.5 0 10 6 10 6a18.4 18.4 0 0 1-3.2 3.8" />
      <path d="M6.7 6.8C3.9 8.6 2 12 2 12s3.5 6 10 6c1.5 0 2.9-.3 4.1-.9" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

export function Field({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`field${wide ? ' span-2' : ''}`}>
      {label}
      {children}
    </label>
  );
}

export function CatalogNav({ current }: { current: 'products' | 'categories' | 'tags' }) {
  return (
    <nav className="subnav" aria-label="Catalog">
      <Link href="/products" className={current === 'products' ? 'active' : undefined}>Products</Link>
      <Link href="/categories" className={current === 'categories' ? 'active' : undefined}>Categories</Link>
      <Link href="/tags" className={current === 'tags' ? 'active' : undefined}>Tags</Link>
    </nav>
  );
}

export function PageHead({
  kicker,
  title,
  lede,
  children,
}: {
  kicker: string;
  title: string;
  lede?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="topbar">
      <div>
        <p className="kicker">{kicker}</p>
        <h1>{title}</h1>
        {lede ? <p className="lede">{lede}</p> : null}
      </div>
      {children}
    </header>
  );
}
