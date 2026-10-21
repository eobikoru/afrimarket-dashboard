'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { COUNTRIES } from '@/lib/countries';
import { flattenCategories, formatUsd, groupDigits, labelize, qs } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import {
  ALLERGENS,
  DIETARY,
  PER_PAGE,
  PRODUCT_STATUSES,
  REGIONS,
  STORAGE,
  UNITS,
  type Category,
  type Page,
  type Product,
  type ProductImage,
  type Tag,
  type Variant,
} from '@/lib/types';
import { HtmlDescription, htmlValue } from './html-editor';
import { CatalogNav, Empty, ErrorBanner, Field, Loading, Modal, PageHead, Pager, Pill, statusTone, Updating } from './ui';

type Draft = {
  name: string;
  slug: string;
  sku: string;
  barcode: string;
  shortDescription: string;
  description: string;
  brand: string;
  countryOfOrigin: string;
  region: string;
  priceCents: string;
  compareAtPriceCents: string;
  costCents: string;
  status: string;
  isActive: boolean;
  isFeatured: boolean;
  storageType: string;
  perishable: boolean;
  shelfLifeDays: string;
  netWeightOz: string;
  shippingWeightOz: string;
  unitLabel: string;
  ingredients: string;
  allergenFlags: string[];
  dietaryTags: string[];
  attributes: string;
  metaTitle: string;
  metaDescription: string;
  categoryId: string;
  tagIds: string[];
};

const blank: Draft = {
  name: '',
  slug: '',
  sku: '',
  barcode: '',
  shortDescription: '',
  description: '',
  brand: '',
  countryOfOrigin: '',
  region: 'west_africa',
  priceCents: '',
  compareAtPriceCents: '',
  costCents: '',
  status: 'available',
  isActive: true,
  isFeatured: false,
  storageType: 'ambient',
  perishable: false,
  shelfLifeDays: '',
  netWeightOz: '',
  shippingWeightOz: '',
  unitLabel: 'each',
  ingredients: '',
  allergenFlags: [],
  dietaryTags: [],
  attributes: '',
  metaTitle: '',
  metaDescription: '',
  categoryId: '',
  tagIds: [],
};

function fromProduct(product: Product): Draft {
  return {
    ...blank,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    barcode: product.barcode ?? '',
    shortDescription: product.shortDescription ?? '',
    description: product.description ?? '',
    brand: product.brand ?? '',
    countryOfOrigin: product.countryOfOrigin,
    region: product.region,
    priceCents: String(product.priceCents),
    compareAtPriceCents: product.compareAtPriceCents == null ? '' : String(product.compareAtPriceCents),
    costCents: product.costCents == null ? '' : String(product.costCents),
    status: product.status,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    storageType: product.storageType,
    perishable: product.perishable,
    shelfLifeDays: product.shelfLifeDays == null ? '' : String(product.shelfLifeDays),
    netWeightOz: product.netWeightOz == null ? '' : String(product.netWeightOz),
    shippingWeightOz: String(product.shippingWeightOz),
    unitLabel: product.unitLabel,
    ingredients: product.ingredients ?? '',
    allergenFlags: product.allergenFlags,
    dietaryTags: product.dietaryTags,
    attributes: product.attributes ? JSON.stringify(product.attributes, null, 2) : '',
    metaTitle: product.metaTitle ?? '',
    metaDescription: product.metaDescription ?? '',
    categoryId: product.category.id,
    tagIds: product.tags.map((tag) => tag.id),
  };
}

function CentsInput({ value, onChange, required }: { value: string; onChange: (value: string) => void; required?: boolean }) {
  const digits = value.replace(/\D/g, '');
  return (
    <>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={groupDigits(digits)}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ''))}
        required={required}
      />
      {digits ? <span className="note">{formatUsd(Number(digits))}</span> : null}
    </>
  );
}

function descriptionField(value: string, creating: boolean, changed: boolean): { description?: string | null } {
  if (creating) {
    const html = htmlValue(value);
    return html ? { description: html } : {};
  }
  if (!changed) return {};
  return { description: htmlValue(value) ?? null };
}

function intField(value: string): number | undefined {
  const digits = value.replace(/,/g, '').trim();
  if (!digits) return undefined;
  if (!/^\d+$/.test(digits)) throw new Error('Use whole numbers for cents, days, and counts');
  return Number(digits);
}

function weightField(value: string): number | undefined {
  if (!value.trim()) return undefined;
  if (!/^\d+(\.\d+)?$/.test(value.trim())) throw new Error('Weight must be a positive number of ounces');
  return Number(value.trim());
}

function payload(draft: Draft, creating: boolean, descriptionChanged: boolean) {
  return {
    name: draft.name.trim(),
    slug: draft.slug.trim() || undefined,
    sku: draft.sku.trim(),
    barcode: draft.barcode.trim() || undefined,
    shortDescription: draft.shortDescription.trim() || undefined,
    ...descriptionField(draft.description, creating, descriptionChanged),
    brand: draft.brand.trim() || undefined,
    countryOfOrigin: draft.countryOfOrigin.trim().toUpperCase(),
    region: draft.region,
    priceCents: intField(draft.priceCents),
    compareAtPriceCents: intField(draft.compareAtPriceCents),
    costCents: intField(draft.costCents),
    status: draft.status,
    isActive: draft.isActive,
    isFeatured: draft.isFeatured,
    storageType: draft.storageType,
    perishable: draft.perishable,
    shelfLifeDays: intField(draft.shelfLifeDays),
    netWeightOz: weightField(draft.netWeightOz),
    shippingWeightOz: weightField(draft.shippingWeightOz),
    unitLabel: draft.unitLabel,
    ingredients: draft.ingredients.trim() || undefined,
    allergenFlags: draft.allergenFlags,
    dietaryTags: draft.dietaryTags,
    metaTitle: draft.metaTitle.trim() || undefined,
    metaDescription: draft.metaDescription.trim() || undefined,
    categoryId: draft.categoryId,
    tagIds: draft.tagIds,
    ...(creating ? {} : {}),
  };
}

export function ProductsView() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('newest');
  const [filters, setFilters] = useState({ q: '', sort: 'newest' });
  const { data, error, loading, fetching } = useApi<Page<Product>>(`/admin/products${qs({ page, perPage: PER_PAGE, q: filters.q, sort: filters.sort })}`);

  return (
    <>
      <PageHead kicker="Catalog" title="Products" lede="Prices are integer cents. A pack-size product tracks stock on its variants.">
        <Link className="btn" href="/products/new">New product</Link>
      </PageHead>
      <CatalogNav current="products" />
      <form className="filters" onSubmit={(event) => { event.preventDefault(); setPage(1); setFilters({ q, sort }); }}>
        <label className="field grow">Search<input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Name, brand, SKU" /></label>
        <label className="field">Sort
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            {['newest', 'price_asc', 'price_desc', 'name_asc', 'name_desc'].map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <button className="btn" type="submit">Apply</button>
      </form>
      {loading ? <Loading table columns={5} label="Loading products" /> : <Updating active={fetching} />}
      <ErrorBanner error={error} />
      {data && data.items.length === 0 ? <Empty>No products yet.</Empty> : null}
      {data && data.items.length > 0 ? (
        <div className="panel">
          <table>
            <thead><tr><th></th><th>Product</th><th>Price</th><th>Status</th><th>Stock</th></tr></thead>
            <tbody>
              {data.items.map((product) => {
                const primary = product.images.find((image) => image.isPrimary) ?? product.images[0];
                const stock = product.variants.length
                  ? product.variants.reduce((sum, variant) => sum + variant.quantityAvailable, 0)
                  : product.inventory?.quantityAvailable;
                return (
                  <tr key={product.id} className="click" onClick={() => router.push(`/products/${product.id}`)}>
                    <td>{primary ? <img className="thumb" src={primary.url} alt="" /> : <span className="thumb" />}</td>
                    <td><Link href={`/products/${product.id}`}>{product.name}</Link><div className="note">{product.sku} · {product.category.name}</div></td>
                    <td>{formatUsd(product.priceCents)}</td>
                    <td><Pill tone={statusTone(product.status)}>{labelize(product.status)}</Pill></td>
                    <td>{stock ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pager page={data.page} total={data.total} perPage={data.perPage} onPage={setPage} />
        </div>
      ) : null}
    </>
  );
}

export function ProductEditor({ id }: { id?: string }) {
  const router = useRouter();
  const product = useApi<Product>(id ? `/admin/products/${id}` : null);
  const categories = useApi<Category[]>('/admin/categories');
  const tags = useApi<Tag[]>('/admin/tags');
  const [draft, setDraft] = useState<Draft>(blank);
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const [variantOpen, setVariantOpen] = useState<Variant | 'new' | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const descriptionChanged = useRef(false);
  const flat = useMemo(() => flattenCategories(categories.data ?? []), [categories.data]);

  useEffect(() => {
    if (!product.data) return;
    descriptionChanged.current = false;
    setDraft(fromProduct(product.data));
  }, [product.data]);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const body = payload(draft, !id, descriptionChanged.current);
      if (id) {
        await api(`/admin/products/${id}`, { method: 'PATCH', body });
        product.reload();
      } else {
        const created = await api<Product>('/admin/products', { method: 'POST', body });
        for (const file of files) await uploadProductImage(created.id, file);
        router.replace(`/products/${created.id}`);
      }
    } catch (caught) {
      setError(caught);
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!id || !confirm('Delete this product?')) return;
    setPending(true);
    try {
      await api(`/admin/products/${id}`, { method: 'DELETE' });
      router.replace('/products');
    } catch (caught) {
      setError(caught);
      setPending(false);
    }
  }

  if (id && product.loading) return <Loading />;

  return (
    <>
      <PageHead kicker="Catalog" title={id ? draft.name || 'Product' : 'New product'} lede="Required: name, SKU, ISO country, region, price in cents, shipping weight, and category.">
        <Link className="btn-ghost" href="/products">All products</Link>
      </PageHead>
      <CatalogNav current="products" />
      <ErrorBanner error={product.error ?? categories.error ?? tags.error ?? error} />
      <form className="panel stack" onSubmit={save}>
        <div className="form-grid">
          <Field label="Name"><input value={draft.name} onChange={(event) => set('name', event.target.value)} required /></Field>
          <Field label="Slug"><input value={draft.slug} onChange={(event) => set('slug', event.target.value)} placeholder="optional" /></Field>
          <Field label="SKU"><input value={draft.sku} onChange={(event) => set('sku', event.target.value)} required /></Field>
          <Field label="Barcode"><input value={draft.barcode} onChange={(event) => set('barcode', event.target.value)} /></Field>
          <Field label="Brand"><input value={draft.brand} onChange={(event) => set('brand', event.target.value)} /></Field>
          <Field label="Country of origin">
            <select value={draft.countryOfOrigin} onChange={(event) => set('countryOfOrigin', event.target.value)} required>
              <option value="">Choose</option>
              {COUNTRIES.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
            </select>
          </Field>
          <Field label="Region">
            <select value={draft.region} onChange={(event) => set('region', event.target.value)}>{REGIONS.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}</select>
          </Field>
          <Field label="Category">
            <select value={draft.categoryId} onChange={(event) => set('categoryId', event.target.value)} required>
              <option value="">Choose</option>
              {flat.map(({ node, depth }) => <option key={node.id} value={node.id}>{'— '.repeat(depth)}{node.name}</option>)}
            </select>
          </Field>
          <Field label="Price (cents)"><CentsInput value={draft.priceCents} onChange={(value) => set('priceCents', value)} required /></Field>
          <Field label="Compare-at (cents)"><CentsInput value={draft.compareAtPriceCents} onChange={(value) => set('compareAtPriceCents', value)} /></Field>
          <Field label="Cost (cents)"><CentsInput value={draft.costCents} onChange={(value) => set('costCents', value)} /></Field>
          <Field label="Status">
            <select value={draft.status} onChange={(event) => set('status', event.target.value)}>{PRODUCT_STATUSES.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}</select>
          </Field>
          <Field label="Storage">
            <select value={draft.storageType} onChange={(event) => set('storageType', event.target.value)}>{STORAGE.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          </Field>
          <Field label="Unit">
            <select value={draft.unitLabel} onChange={(event) => set('unitLabel', event.target.value)}>{UNITS.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          </Field>
          <Field label="Shipping weight (oz)"><input value={draft.shippingWeightOz} onChange={(event) => set('shippingWeightOz', event.target.value)} required /></Field>
          <Field label="Net weight (oz)"><input value={draft.netWeightOz} onChange={(event) => set('netWeightOz', event.target.value)} /></Field>
          <Field label="Shelf life (days)"><input inputMode="numeric" value={draft.shelfLifeDays} onChange={(event) => set('shelfLifeDays', event.target.value)} /></Field>
          <Field label="Short description" wide><input value={draft.shortDescription} onChange={(event) => set('shortDescription', event.target.value)} maxLength={300} /></Field>
          <div className="field span-2">
            <span>Description</span>
            <HtmlDescription value={draft.description} onChange={(value) => { descriptionChanged.current = true; set('description', value); }} />
          </div>
          <Field label="Ingredients" wide><textarea value={draft.ingredients} onChange={(event) => set('ingredients', event.target.value)} /></Field>
          <Field label="Meta title"><input value={draft.metaTitle} onChange={(event) => set('metaTitle', event.target.value)} /></Field>
          <Field label="Meta description"><input value={draft.metaDescription} onChange={(event) => set('metaDescription', event.target.value)} /></Field>
        </div>
        <div className="actions">
          <label className="check"><input type="checkbox" checked={draft.isActive} onChange={(event) => set('isActive', event.target.checked)} /> Active</label>
          <label className="check"><input type="checkbox" checked={draft.isFeatured} onChange={(event) => set('isFeatured', event.target.checked)} /> Featured</label>
          <label className="check"><input type="checkbox" checked={draft.perishable} onChange={(event) => set('perishable', event.target.checked)} /> Perishable</label>
        </div>
        <fieldset>
          <legend>Allergens</legend>
          <div className="actions">{ALLERGENS.map((flag) => (
            <label className="check" key={flag}><input type="checkbox" checked={draft.allergenFlags.includes(flag)} onChange={(event) => set('allergenFlags', event.target.checked ? [...draft.allergenFlags, flag] : draft.allergenFlags.filter((item) => item !== flag))} />{labelize(flag)}</label>
          ))}</div>
        </fieldset>
        <fieldset>
          <legend>Dietary</legend>
          <div className="actions">{DIETARY.map((flag) => (
            <label className="check" key={flag}><input type="checkbox" checked={draft.dietaryTags.includes(flag)} onChange={(event) => set('dietaryTags', event.target.checked ? [...draft.dietaryTags, flag] : draft.dietaryTags.filter((item) => item !== flag))} />{labelize(flag)}</label>
          ))}</div>
        </fieldset>
        <fieldset>
          <legend>Tags</legend>
          <div className="actions">{(tags.data ?? []).map((tag) => (
            <label className="check" key={tag.id}><input type="checkbox" checked={draft.tagIds.includes(tag.id)} onChange={(event) => set('tagIds', event.target.checked ? [...draft.tagIds, tag.id] : draft.tagIds.filter((item) => item !== tag.id))} />{tag.name}</label>
          ))}</div>
        </fieldset>
        {!id ? <ImageQueue files={files} onChange={setFiles} /> : null}
        <div className="actions">
          <button className="btn" disabled={pending} type="submit">{pending ? 'Saving…' : id ? 'Save product' : 'Create product'}</button>
          {id ? <button className="btn-danger" type="button" onClick={() => void remove()}>Delete</button> : null}
        </div>
      </form>
      {id && product.data ? (
        <>
          <Images productId={id} images={product.data.images} onChange={product.reload} />
          <section className="panel" style={{ marginTop: 14 }}>
            <div className="toolbar"><h2>Pack sizes</h2><button className="btn" type="button" onClick={() => setVariantOpen('new')}>Add variant</button></div>
            {product.data.variants.length === 0 ? <p className="note">No variants. Stock lives on the product inventory row.</p> : (
              <table>
                <thead><tr><th>Title</th><th>SKU</th><th>Price</th><th>Available</th><th></th></tr></thead>
                <tbody>
                  {product.data.variants.map((variant) => (
                    <tr key={variant.id}>
                      <td>{variant.title}</td>
                      <td>{variant.sku}</td>
                      <td>{variant.priceCents == null ? 'Inherits' : formatUsd(variant.priceCents)}</td>
                      <td>{variant.quantityAvailable}</td>
                      <td><button className="btn-ghost" type="button" onClick={() => setVariantOpen(variant)}>Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
          {variantOpen ? (
            <VariantModal
              productId={id}
              variant={variantOpen === 'new' ? null : variantOpen}
              onClose={() => setVariantOpen(null)}
              onSaved={() => { setVariantOpen(null); product.reload(); }}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}

function Images({ productId, images, onChange }: { productId: string; images: ProductImage[]; onChange: () => void }) {
  const [error, setError] = useState<unknown>(null);
  const [altText, setAlt] = useState('');
  const [pending, setPending] = useState(false);

  async function uploadMany(next: File[]) {
    setPending(true);
    setError(null);
    try {
      for (const file of next) await uploadProductImage(productId, file, altText);
      setAlt('');
      onChange();
    } catch (caught) {
      setError(caught);
      onChange();
    } finally {
      setPending(false);
    }
  }

  async function reorder(next: ProductImage[]) {
    setError(null);
    try {
      await api(`/admin/products/${productId}/images`, {
        method: 'PATCH',
        body: { images: next.map((image, index) => ({ id: image.id, sortOrder: index, isPrimary: image.isPrimary })) },
      });
      onChange();
    } catch (caught) {
      setError(caught);
    }
  }

  function move(index: number, direction: -1 | 1) {
    const next = images.slice().sort((a, b) => a.sortOrder - b.sortOrder);
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const copy = next.slice();
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    void reorder(copy);
  }

  function makePrimary(id: string) {
    const next = images.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((image) => ({ ...image, isPrimary: image.id === id }));
    void reorder(next);
  }

  async function remove(imageId: string) {
    setError(null);
    try {
      await api(`/admin/products/${productId}/images/${imageId}`, { method: 'DELETE' });
      onChange();
    } catch (caught) {
      setError(caught);
    }
  }

  const ordered = images.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <section className="panel" style={{ marginTop: 14 }}>
      <h2>Images</h2>
      <ErrorBanner error={error} />
      <div className="gallery">
        {ordered.map((image, index) => (
          <article className="shot" key={image.id}>
            <img src={image.url} alt={image.altText ?? ''} />
            <div>
              {image.isPrimary ? <Pill tone="ok">Primary</Pill> : <button className="btn-ghost" type="button" onClick={() => makePrimary(image.id)}>Make primary</button>}
              <div className="actions">
                <button className="btn-ghost" type="button" onClick={() => move(index, -1)}>Up</button>
                <button className="btn-ghost" type="button" onClick={() => move(index, 1)}>Down</button>
                <button className="btn-danger" type="button" onClick={() => void remove(image.id)}>Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <label className="field" style={{ marginTop: 12 }}>Alt text<input value={altText} onChange={(event) => setAlt(event.target.value)} /></label>
      <ImageDrop disabled={pending} onFiles={(next) => void uploadMany(next)} onReject={() => setError(new Error('Use a JPEG, PNG, WebP, or GIF'))} />
    </section>
  );
}

function uploadProductImage(productId: string, file: File, altText?: string) {
  const form = new FormData();
  form.append('file', file);
  if (altText?.trim()) form.append('altText', altText.trim());
  return api(`/admin/products/${productId}/images`, { method: 'POST', form });
}

function ImageQueue({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  const [error, setError] = useState<unknown>(null);
  const urls = useObjectUrls(files);
  return (
    <div>
      <h2>Images</h2>
      <ErrorBanner error={error} />
      {files.length > 0 ? (
        <div className="gallery">
          {files.map((file, index) => (
            <article className="shot" key={`${file.name}-${file.size}-${index}`}>
              <img src={urls[index]} alt="" />
              <div>
                <span className="note">{file.name}</span>
                <button className="btn-ghost" type="button" onClick={() => onChange(files.filter((_, item) => item !== index))}>Remove</button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
      <ImageDrop
        onFiles={(next) => {
          setError(null);
          onChange([...files, ...next]);
        }}
        onReject={() => setError(new Error('Use a JPEG, PNG, WebP, or GIF'))}
      />
    </div>
  );
}

function ImageDrop({ disabled, onFiles, onReject }: { disabled?: boolean; onFiles: (files: File[]) => void; onReject: () => void }) {
  const [over, setOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function take(list?: FileList | null) {
    const picked = [...(list ?? [])];
    if (picked.length === 0) return;
    const accepted = picked.filter(isImageFile);
    if (accepted.length !== picked.length) onReject();
    if (accepted.length) onFiles(accepted);
  }

  function allowDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setOver(true);
  }

  return (
    <div
      className={`drop${over ? ' over' : ''}`}
      style={{ marginTop: 12 }}
      onDragEnter={allowDrop}
      onDragOver={allowDrop}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node)) return;
        setOver(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        take(event.dataTransfer.files);
      }}
      onClick={() => fileRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          fileRef.current?.click();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Drop product images or choose files"
    >
      <strong>{over ? 'Drop to use these images' : 'Drag images here'}</strong>
      <span className="note">or click to choose a JPEG, PNG, WebP, or GIF</span>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        disabled={disabled}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          take(event.target.files);
          event.target.value = '';
        }}
      />
    </div>
  );
}

function isImageFile(file: File) {
  return /image\/(jpeg|png|webp|gif)/.test(file.type) || /\.(jpe?g|png|webp|gif)$/i.test(file.name);
}

function useObjectUrls(files: File[]) {
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    const next = files.map((file) => URL.createObjectURL(file));
    setUrls(next);
    return () => next.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);
  return urls;
}

function VariantModal({
  productId,
  variant,
  onClose,
  onSaved,
}: {
  productId: string;
  variant: Variant | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [sku, setSku] = useState(variant?.sku ?? '');
  const [title, setTitle] = useState(variant?.title ?? '');
  const [barcode, setBarcode] = useState(variant?.barcode ?? '');
  const [priceCents, setPrice] = useState(variant?.priceCents == null ? '' : String(variant.priceCents));
  const [quantityAvailable, setQty] = useState(variant ? String(variant.quantityAvailable) : '0');
  const [optionName, setOptionName] = useState(variant ? Object.keys(variant.options)[0] ?? 'size' : 'size');
  const [optionValue, setOptionValue] = useState(variant ? Object.values(variant.options)[0] ?? '' : '');
  const [isActive, setActive] = useState(variant?.isActive ?? true);
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const body = {
        sku: sku.trim(),
        title: title.trim(),
        barcode: barcode.trim() || undefined,
        priceCents: priceCents.trim() ? Number(priceCents) : undefined,
        quantityAvailable: Number(quantityAvailable || 0),
        options: { [optionName.trim()]: optionValue.trim() },
        isActive,
      };
      if (variant) await api(`/admin/products/${productId}/variants/${variant.id}`, { method: 'PATCH', body });
      else await api(`/admin/products/${productId}/variants`, { method: 'POST', body });
      onSaved();
    } catch (caught) {
      setError(caught);
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!variant) return;
    setPending(true);
    try {
      await api(`/admin/products/${productId}/variants/${variant.id}`, { method: 'DELETE' });
      onSaved();
    } catch (caught) {
      setError(caught);
      setPending(false);
    }
  }

  return (
    <Modal title={variant ? 'Edit pack' : 'New pack'} onClose={onClose}>
      <form className="stack" onSubmit={save}>
        <ErrorBanner error={error} />
        <div className="form-grid">
          <Field label="Title"><input value={title} onChange={(event) => setTitle(event.target.value)} required /></Field>
          <Field label="SKU"><input value={sku} onChange={(event) => setSku(event.target.value)} required /></Field>
          <Field label="Barcode"><input value={barcode} onChange={(event) => setBarcode(event.target.value)} /></Field>
          <Field label="Price cents"><input inputMode="numeric" value={priceCents} onChange={(event) => setPrice(event.target.value)} placeholder="Blank inherits product price" /></Field>
          <Field label="Option name"><input value={optionName} onChange={(event) => setOptionName(event.target.value)} required /></Field>
          <Field label="Option value"><input value={optionValue} onChange={(event) => setOptionValue(event.target.value)} required /></Field>
          {!variant ? <Field label="Quantity available"><input inputMode="numeric" value={quantityAvailable} onChange={(event) => setQty(event.target.value)} /></Field> : null}
        </div>
        <p className="note">Options describe size or pack. Color is rejected.</p>
        <label className="check"><input type="checkbox" checked={isActive} onChange={(event) => setActive(event.target.checked)} /> Active</label>
        <div className="actions">
          <button className="btn" disabled={pending} type="submit">Save variant</button>
          {variant ? <button className="btn-danger" type="button" onClick={() => void remove()}>Delete</button> : null}
        </div>
      </form>
    </Modal>
  );
}
