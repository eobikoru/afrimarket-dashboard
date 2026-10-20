'use client';

import { DragEvent, FormEvent, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { formatWhen } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { Banner } from '@/lib/types';
import { Empty, ErrorBanner, Field, Loading, Modal, PageHead, Pill, Updating } from './ui';

export function BannersView() {
  const { data, error, loading, fetching, reload } = useApi<Banner[]>('/admin/banners');
  const [open, setOpen] = useState<Banner | 'new' | null>(null);
  return (
    <>
      <PageHead kicker="Merchandising" title="Banners" lede="Drag an image onto the banner, or choose a file. The API stores it on Cloudinary.">
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
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(banner?.imageUrl ?? '');
  const [linkUrl, setLink] = useState(banner?.linkUrl ?? '');
  const [sortOrder, setSort] = useState(String(banner?.sortOrder ?? 0));
  const [active, setActive] = useState(banner?.active ?? true);
  const [startsAt, setStarts] = useState(banner?.startsAt?.slice(0, 10) ?? '');
  const [endsAt, setEnds] = useState(banner?.endsAt?.slice(0, 10) ?? '');
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const [over, setOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function chooseFile(next?: File) {
    if (next && !/image\/(jpeg|png|webp|gif)/.test(next.type) && !/\.(jpe?g|png|webp|gif)$/i.test(next.name)) {
      setError(new Error('Use a JPEG, PNG, WebP, or GIF'));
      return;
    }
    setError(null);
    setFile(next ?? null);
    setPreview((current) => {
      if (current.startsWith('blob:')) URL.revokeObjectURL(current);
      return next ? URL.createObjectURL(next) : banner?.imageUrl ?? '';
    });
  }

  function allowDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setOver(true);
  }

  function dropFile(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setOver(false);
    chooseFile(event.dataTransfer.files?.[0]);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!banner && !file) {
      setError(new Error('Choose an image'));
      return;
    }
    setPending(true);
    setError(null);
    try {
      const form = new FormData();
      if (file) form.append('file', file);
      form.append('title', title.trim());
      if (subtitle.trim()) form.append('subtitle', subtitle.trim());
      if (linkUrl.trim()) form.append('linkUrl', linkUrl.trim());
      form.append('sortOrder', sortOrder.trim() || '0');
      form.append('active', active ? 'true' : 'false');
      if (startsAt) form.append('startsAt', new Date(`${startsAt}T00:00:00.000Z`).toISOString());
      if (endsAt) form.append('endsAt', new Date(`${endsAt}T00:00:00.000Z`).toISOString());
      if (banner) await api(`/admin/banners/${banner.id}`, { method: 'PATCH', form });
      else await api('/admin/banners', { method: 'POST', form });
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
        <div className="form-grid">
          <Field label="Title"><input value={title} onChange={(event) => setTitle(event.target.value)} required /></Field>
          <Field label="Subtitle"><input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} /></Field>
          <div className="field span-2">
            <span>{banner ? 'Replace image' : 'Image'}</span>
            <div
              className={`drop${over ? ' over' : ''}`}
              onDragEnter={allowDrop}
              onDragOver={allowDrop}
              onDragLeave={(event) => {
                if (event.currentTarget.contains(event.relatedTarget as Node)) return;
                setOver(false);
              }}
              onDrop={dropFile}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  fileRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={banner ? 'Drop a new banner image or choose a file' : 'Drop a banner image or choose a file'}
            >
              {preview ? <img className="drop-preview" src={preview} alt="" /> : null}
              <strong>{over ? 'Drop to use this image' : file ? file.name : 'Drag an image here'}</strong>
              <span className="note">or click to choose a JPEG, PNG, WebP, or GIF</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={pending}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => chooseFile(event.target.files?.[0])}
              />
            </div>
          </div>
          <Field label="Link URL" wide><input value={linkUrl} onChange={(event) => setLink(event.target.value)} placeholder="https://" /></Field>
          <Field label="Sort order"><input inputMode="numeric" value={sortOrder} onChange={(event) => setSort(event.target.value)} /></Field>
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
