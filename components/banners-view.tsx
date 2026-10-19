'use client';

import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { formatWhen } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { Banner, StoredImage } from '@/lib/types';
import { Empty, ErrorBanner, Field, Loading, Modal, PageHead, Pill, Updating } from './ui';

export function BannersView() {
  const { data, error, loading, fetching, reload } = useApi<Banner[]>('/admin/banners');
  const [open, setOpen] = useState<Banner | 'new' | null>(null);
  return (
    <>
      <PageHead kicker="Merchandising" title="Banners" lede="Upload an image first, then save the banner with that URL.">
        <button className="btn" type="button" onClick={() => setOpen('new')}>New banner</button>
      </PageHead>
      {loading ? <Loading table columns={5} label="Loading banners" /> : <Updating active={fetching} />}
      <ErrorBanner error={error} />
      {data && data.length === 0 ? <Empty>No banners yet.</Empty> : null}
      {data && data.length > 0 ? (
        <div className="panel">
          <table>
            <thead><tr><th></th><th>Title</th><th>Order</th><th>Window</th><th></th></tr></thead>
            <tbody>
              {data.map((banner) => (
                <tr key={banner.id}>
                  <td><img className="thumb" src={banner.imageUrl} alt="" /></td>
                  <td>{banner.title} {banner.active ? <Pill tone="ok">active</Pill> : <Pill>off</Pill>}<div className="note">{banner.subtitle}</div></td>
                  <td>{banner.sortOrder}</td>
                  <td>{formatWhen(banner.startsAt)} – {formatWhen(banner.endsAt)}</td>
                  <td><button className="btn-ghost" type="button" onClick={() => setOpen(banner)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {open ? <BannerModal banner={open === 'new' ? null : open} onClose={() => setOpen(null)} onSaved={() => { setOpen(null); reload(); }} /> : null}
    </>
  );
}

function BannerModal({ banner, onClose, onSaved }: { banner: Banner | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(banner?.title ?? '');
  const [subtitle, setSubtitle] = useState(banner?.subtitle ?? '');
  const [imageUrl, setUrl] = useState(banner?.imageUrl ?? '');
  const [imagePublicId, setPublicId] = useState(banner?.imagePublicId ?? '');
  const [linkUrl, setLink] = useState(banner?.linkUrl ?? '');
  const [sortOrder, setSort] = useState(String(banner?.sortOrder ?? 0));
  const [active, setActive] = useState(banner?.active ?? true);
  const [startsAt, setStarts] = useState(banner?.startsAt?.slice(0, 10) ?? '');
  const [endsAt, setEnds] = useState(banner?.endsAt?.slice(0, 10) ?? '');
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);

  async function upload(file: File) {
    setPending(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const stored = await api<StoredImage>('/admin/banners/upload', { method: 'POST', form });
      setUrl(stored.url);
      setPublicId(stored.publicId);
    } catch (caught) {
      setError(caught);
    } finally {
      setPending(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const body = {
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        imageUrl: imageUrl.trim(),
        imagePublicId: imagePublicId.trim() || undefined,
        linkUrl: linkUrl.trim() || undefined,
        sortOrder: Number(sortOrder || 0),
        active,
        startsAt: startsAt ? new Date(`${startsAt}T00:00:00.000Z`).toISOString() : null,
        endsAt: endsAt ? new Date(`${endsAt}T00:00:00.000Z`).toISOString() : null,
      };
      if (banner) await api(`/admin/banners/${banner.id}`, { method: 'PATCH', body });
      else await api('/admin/banners', { method: 'POST', body });
      onSaved();
    } catch (caught) {
      setError(caught);
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!banner) return;
    setPending(true);
    try {
      await api(`/admin/banners/${banner.id}`, { method: 'DELETE' });
      onSaved();
    } catch (caught) {
      setError(caught);
      setPending(false);
    }
  }

  return (
    <Modal title={banner ? 'Edit banner' : 'New banner'} onClose={onClose}>
      <form className="stack" onSubmit={save}>
        <ErrorBanner error={error} />
        {imageUrl ? <img src={imageUrl} alt="" style={{ borderRadius: 12, maxHeight: 180, objectFit: 'cover' }} /> : null}
        <div className="form-grid">
          <Field label="Title"><input value={title} onChange={(event) => setTitle(event.target.value)} required /></Field>
          <Field label="Subtitle"><input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} /></Field>
          <Field label="Image URL" wide><input value={imageUrl} onChange={(event) => setUrl(event.target.value)} required /></Field>
          <Field label="Link URL" wide><input value={linkUrl} onChange={(event) => setLink(event.target.value)} placeholder="https://" /></Field>
          <Field label="Sort order"><input inputMode="numeric" value={sortOrder} onChange={(event) => setSort(event.target.value)} /></Field>
          <Field label="Upload">
            <input type="file" accept="image/jpeg,image/png,image/webp" disabled={pending} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} />
          </Field>
          <Field label="Starts"><input type="date" value={startsAt} onChange={(event) => setStarts(event.target.value)} /></Field>
          <Field label="Ends"><input type="date" value={endsAt} onChange={(event) => setEnds(event.target.value)} /></Field>
        </div>
        <label className="check"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> Active</label>
        <div className="actions">
          <button className="btn" disabled={pending} type="submit">Save</button>
          {banner ? <button className="btn-danger" type="button" onClick={() => void remove()}>Delete</button> : null}
        </div>
      </form>
    </Modal>
  );
}
