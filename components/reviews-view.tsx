'use client';

import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { formatWhen } from '@/lib/format';
import type { Review } from '@/lib/types';
import { ErrorBanner, PageHead, Pill } from './ui';

export function ReviewsView() {
  const [id, setId] = useState('');
  const [review, setReview] = useState<Review | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);

  async function act(event: FormEvent, hidden: boolean) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const next = await api<Review>(`/admin/reviews/${encodeURIComponent(id.trim())}/${hidden ? 'hide' : 'unhide'}`, { method: 'POST' });
      setReview(next);
    } catch (caught) {
      setError(caught);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <PageHead kicker="Merchandising" title="Reviews" lede="Hide or restore a review by its id. The admin API does not list reviews." />
      <form className="panel stack">
        <ErrorBanner error={error} />
        <label className="field">Review id<input value={id} onChange={(event) => setId(event.target.value)} required /></label>
        <div className="actions">
          <button className="btn" type="button" disabled={pending || !id.trim()} onClick={(event) => void act(event, true)}>Hide</button>
          <button className="btn-ghost" type="button" disabled={pending || !id.trim()} onClick={(event) => void act(event, false)}>Unhide</button>
        </div>
        {review ? (
          <article>
            <p><strong>{review.title}</strong> · {review.rating}/5 {review.isHidden ? <Pill tone="bad">hidden</Pill> : <Pill tone="ok">visible</Pill>}</p>
            <p>{review.body}</p>
            <p className="note">{formatWhen(review.createdAt)} · product {review.productId}</p>
          </article>
        ) : null}
      </form>
    </>
  );
}
