/** Format integer USD cents. No floating-point money math. */
export function formatUsd(cents: number): string {
  const negative = cents < 0;
  const abs = negative ? -cents : cents;
  const dollars = Math.trunc(abs / 100);
  const remainder = abs % 100;
  const grouped = String(dollars).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}$${grouped}.${String(remainder).padStart(2, '0')}`;
}

export function formatBps(bps: number): string {
  const whole = Math.trunc(bps / 100);
  const frac = Math.abs(bps % 100);
  return `${whole}.${String(frac).padStart(2, '0')}%`;
}

export function parseCents(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d{1,12}$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed)) return null;
  return parsed;
}

export function parseSignedInt(value: string): number | null {
  const trimmed = value.trim();
  if (!/^-?\d{1,12}$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed)) return null;
  return parsed;
}

export function pageCount(total: number, perPage: number): number {
  if (total <= 0 || perPage <= 0) return 1;
  return Math.trunc((total + perPage - 1) / perPage);
}

export function formatWhen(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatDay(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
}

export function labelize(value: string): string {
  return value.replace(/_/g, ' ');
}

export function defaultTrendRange(): { from: string; to: string } {
  const end = new Date();
  const start = new Date(end.getTime() - 29 * 86400000);
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

/** Inclusive calendar dates become an ISO window. `to` is the next UTC midnight so the end day is included. */
export function trendQuery(from: string, to: string): { from: string; to: string } {
  const end = new Date(`${to}T00:00:00.000Z`);
  return {
    from: `${from}T00:00:00.000Z`,
    to: new Date(end.getTime() + 86400000).toISOString(),
  };
}

export function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

export function flattenCategories<T extends { children?: T[] }>(nodes: T[], depth = 0): { node: T; depth: number }[] {
  const out: { node: T; depth: number }[] = [];
  for (const node of nodes) {
    out.push({ node, depth });
    if (node.children?.length) out.push(...flattenCategories(node.children, depth + 1));
  }
  return out;
}
