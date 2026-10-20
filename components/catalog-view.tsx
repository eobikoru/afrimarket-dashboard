'use client';

import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import { flattenCategories } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { Category, Tag } from '@/lib/types';
import { CatalogNav, Empty, ErrorBanner, Field, Loading, Modal, PageHead, Updating } from './ui';

export function CategoriesView() {
  const { data, error, loading, fetching, reload } = useApi<Category[]>('/admin/categories');
  const [editing, setEditing] = useState<Category | 'new' | null>(null);
  const flat = flattenCategories(data ?? []);

  return (
    <>
      <PageHead kicker="Catalog" title="Categories" lede="Leave the parent empty for a top-level category, or choose one to add a subcategory. A category with products or children cannot be deleted.">
        <button className="btn" type="button" onClick={() => setEditing('new')}>New category</button>
      </PageHead>
      <CatalogNav current="categories" />
      {loading ? <Loading table columns={4} label="Loading categories" /> : <Updating active={fetching} />}
      <ErrorBanner error={error} />
      {data && flat.length === 0 ? <Empty>No categories yet.</Empty> : null}
      {flat.length > 0 ? (
        <div className="panel">
          <table>
            <thead><tr><th>Name</th><th>Slug</th><th>Active</th><th></th></tr></thead>
            <tbody>
              {flat.map(({ node, depth }) => (
                <tr key={node.id}>
                  <td>{'— '.repeat(depth)}{node.name}</td>
                  <td>{node.slug}</td>
                  <td>{node.isActive ? 'Yes' : 'No'}{node.isFeatured ? ' · featured' : ''}</td>
                  <td><button className="btn-ghost" type="button" onClick={() => setEditing(node)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {editing ? (
        <CategoryModal
          category={editing === 'new' ? null : editing}
          options={flat}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      ) : null}
    </>
  );
}

function CategoryModal({
  category,
  options,
  onClose,
  onSaved,
}: {
  category: Category | null;
  options: { node: Category; depth: number }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(category?.name ?? '');
  const [slug, setSlug] = useState(category?.slug ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [parentId, setParent] = useState(category?.parentId ?? '');
  const [sortOrder, setSort] = useState(String(category?.sortOrder ?? 0));
  const [metaTitle, setMeta] = useState(category?.metaTitle ?? '');
  const [metaDescription, setMetaDescription] = useState(category?.metaDescription ?? '');
  const [isActive, setActive] = useState(category?.isActive ?? true);
  const [isFeatured, setFeatured] = useState(category?.isFeatured ?? false);
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const blocked = category ? branchIds(category) : new Set<string>();
  const parentChoices = options.filter(({ node }) => node.level < 2 && !blocked.has(node.id));

  async function save(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const body = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        parentId: parentId || null,
        sortOrder: Number(sortOrder || 0),
        metaTitle: metaTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
        isActive,
        isFeatured,
      };
      if (category) await api(`/admin/categories/${category.id}`, { method: 'PATCH', body });
      else await api('/admin/categories', { method: 'POST', body });
      onSaved();
    } catch (caught) {
      setError(caught);
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!category) return;
    setPending(true);
    try {
      await api(`/admin/categories/${category.id}`, { method: 'DELETE' });
      onSaved();
    } catch (caught) {
      setError(caught);
      setPending(false);
    }
  }

  return (
    <Modal title={category ? 'Edit category' : 'New category'} onClose={onClose}>
      <form className="stack" onSubmit={save}>
        <ErrorBanner error={error} />
        <div className="form-grid">
          <Field label="Name"><input value={name} onChange={(event) => setName(event.target.value)} required /></Field>
          <Field label="Slug"><input value={slug} onChange={(event) => setSlug(event.target.value)} /></Field>
          <Field label="Parent" wide>
            <select value={parentId} onChange={(event) => setParent(event.target.value)}>
              <option value="">None — top-level category</option>
              {parentChoices.map(({ node, depth }) => <option key={node.id} value={node.id}>{'— '.repeat(depth)}{node.name}</option>)}
            </select>
            <span className="note">Leave this empty for a top-level category. A second-level category cannot be a parent.</span>
          </Field>
          <Field label="Sort order"><input inputMode="numeric" value={sortOrder} onChange={(event) => setSort(event.target.value)} /></Field>
          <Field label="Description" wide><textarea value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
          <Field label="Meta title"><input value={metaTitle} onChange={(event) => setMeta(event.target.value)} /></Field>
          <Field label="Meta description"><input value={metaDescription} onChange={(event) => setMetaDescription(event.target.value)} /></Field>
        </div>
        <label className="check"><input type="checkbox" checked={isActive} onChange={(event) => setActive(event.target.checked)} /> Active</label>
        <label className="check"><input type="checkbox" checked={isFeatured} onChange={(event) => setFeatured(event.target.checked)} /> Featured</label>
        <div className="actions">
          <button className="btn" disabled={pending} type="submit">Save</button>
          {category ? <button className="btn-danger" type="button" onClick={() => void remove()}>Delete</button> : null}
        </div>
      </form>
    </Modal>
  );
}

function branchIds(category: Category, into = new Set<string>()): Set<string> {
  into.add(category.id);
  for (const child of category.children ?? []) branchIds(child, into);
  return into;
}

export function TagsView() {
  const { data, error, loading, fetching, reload } = useApi<Tag[]>('/admin/tags');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [editing, setEditing] = useState<Tag | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [formError, setError] = useState<unknown>(null);

  async function create(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await api('/admin/tags', { method: 'POST', body: { name: name.trim(), slug: slug.trim() || undefined } });
      setName('');
      setSlug('');
      reload();
    } catch (caught) {
      setError(caught);
    }
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setError(null);
    try {
      await api(`/admin/tags/${editing.id}`, { method: 'PATCH', body: { name: editName.trim(), slug: editSlug.trim() || undefined } });
      setEditing(null);
      reload();
    } catch (caught) {
      setError(caught);
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      await api(`/admin/tags/${id}`, { method: 'DELETE' });
      reload();
    } catch (caught) {
      setError(caught);
    }
  }

  return (
    <>
      <PageHead kicker="Catalog" title="Tags" lede="Short labels for search and related products." />
      <CatalogNav current="tags" />
      <ErrorBanner error={error ?? formError} />
      <form className="filters" onSubmit={create}>
        <label className="field">Name<input value={name} onChange={(event) => setName(event.target.value)} required /></label>
        <label className="field">Slug<input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="optional" /></label>
        <button className="btn" type="submit">Add tag</button>
      </form>
      {loading ? <Loading table columns={3} label="Loading tags" /> : <Updating active={fetching} />}
      {data && data.length === 0 ? <Empty>No tags yet.</Empty> : null}
      {data && data.length > 0 ? (
        <div className="panel">
          <table>
            <thead><tr><th>Name</th><th>Slug</th><th></th></tr></thead>
            <tbody>
              {data.map((tag) => (
                <tr key={tag.id}>
                  <td>{tag.name}</td>
                  <td>{tag.slug}</td>
                  <td className="actions">
                    <button className="btn-ghost" type="button" onClick={() => { setEditing(tag); setEditName(tag.name); setEditSlug(tag.slug); }}>Edit</button>
                    <button className="btn-danger" type="button" onClick={() => void remove(tag.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {editing ? (
        <Modal title="Edit tag" onClose={() => setEditing(null)}>
          <form className="stack" onSubmit={saveEdit}>
            <Field label="Name"><input value={editName} onChange={(event) => setEditName(event.target.value)} required /></Field>
            <Field label="Slug"><input value={editSlug} onChange={(event) => setEditSlug(event.target.value)} /></Field>
            <button className="btn" type="submit">Save</button>
          </form>
        </Modal>
      ) : null}
    </>
  );
}
