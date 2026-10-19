import { formatUsd } from '@/lib/format';

export function RevenueChart({ points }: { points: { day: string; revenueCents: number }[] }) {
  if (points.length === 0) return <p className="note">No paid revenue in this window.</p>;
  const width = 640;
  const height = 220;
  const pad = 28;
  const max = Math.max(...points.map((point) => point.revenueCents), 1);
  const step = points.length === 1 ? 0 : (width - pad * 2) / (points.length - 1);
  const coords = points.map((point, index) => {
    const x = pad + step * index;
    const y = height - pad - Math.trunc(((height - pad * 2) * point.revenueCents) / max);
    return { ...point, x, y };
  });
  const line = coords.map((point) => `${point.x},${point.y}`).join(' ');
  const area = `${pad},${height - pad} ${line} ${coords[coords.length - 1]?.x ?? pad},${height - pad}`;
  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Revenue trend">
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="rgba(28,25,20,0.15)" />
      <polygon points={area} fill="rgba(196,73,29,0.14)" />
      <polyline points={line} fill="none" stroke="#16352b" strokeWidth="2.5" />
      {coords.map((point) => (
        <g key={point.day}>
          <circle cx={point.x} cy={point.y} r="3.5" fill="#c4491d" />
          <title>{`${point.day}: ${formatUsd(point.revenueCents)}`}</title>
        </g>
      ))}
    </svg>
  );
}

export function Bars({ rows, label }: { rows: { name: string; count: number }[]; label: string }) {
  const max = Math.max(...rows.map((row) => row.count), 1);
  if (rows.length === 0) return <p className="note">No {label} yet.</p>;
  return (
    <div>
      {rows.map((row) => (
        <div key={row.name} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 40px', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <span style={{ textTransform: 'capitalize' }}>{row.name.replaceAll('_', ' ')}</span>
          <span style={{ background: 'rgba(22,53,43,0.08)', borderRadius: 99, overflow: 'hidden', height: 10 }}>
            <span style={{ display: 'block', height: '100%', width: `${Math.trunc((row.count * 100) / max)}%`, background: '#16352b' }} />
          </span>
          <strong>{row.count}</strong>
        </div>
      ))}
    </div>
  );
}

export function Mix({ stripe, paypal }: { stripe: number; paypal: number }) {
  const total = stripe + paypal;
  const stripeWidth = total === 0 ? 0 : Math.trunc((stripe * 100) / total);
  return (
    <div>
      <div style={{ display: 'flex', height: 16, borderRadius: 99, overflow: 'hidden', background: 'rgba(22,53,43,0.08)' }}>
        <span style={{ width: `${stripeWidth}%`, background: '#16352b' }} />
        <span style={{ width: `${100 - stripeWidth}%`, background: '#c8963e' }} />
      </div>
      <div className="legend">
        <span><i className="swatch" style={{ background: '#16352b' }} />Stripe {stripe}</span>
        <span><i className="swatch" style={{ background: '#c8963e' }} />PayPal {paypal}</span>
      </div>
    </div>
  );
}

export function StockMix({ inStock, low, out }: { inStock: number; low: number; out: number }) {
  const total = inStock + low + out;
  const part = (value: number) => (total === 0 ? 0 : Math.trunc((value * 100) / total));
  return (
    <div>
      <div style={{ display: 'flex', height: 16, borderRadius: 99, overflow: 'hidden', background: 'rgba(22,53,43,0.08)' }}>
        <span style={{ width: `${part(inStock)}%`, background: '#1d6b45' }} />
        <span style={{ width: `${part(low)}%`, background: '#c8963e' }} />
        <span style={{ width: `${part(out)}%`, background: '#c4491d' }} />
      </div>
      <div className="legend">
        <span><i className="swatch" style={{ background: '#1d6b45' }} />In stock {inStock}</span>
        <span><i className="swatch" style={{ background: '#c8963e' }} />Low {low}</span>
        <span><i className="swatch" style={{ background: '#c4491d' }} />Out {out}</span>
      </div>
    </div>
  );
}
