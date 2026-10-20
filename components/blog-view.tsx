'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiError, api } from '@/lib/api';
import { formatWhen, qs } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import { BLOG_STATUSES, PER_PAGE, type BlogCategory, type BlogComment, type BlogPost, type BlogTag, type Page, type StoredImage } from '@/lib/types';
import { HtmlDescription, htmlValue } from './html-editor';
import { Empty, ErrorBanner, Field, Loading, PageHead, Pager, Pill, statusTone, Updating } from './ui';

export function BlogListView() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [filter, setFilter] = useState('');
  const { data, error, loading, fetching } = useApi<Page<BlogPost>>(`/admin/blog/posts${qs({ page, perPage: PER_PAGE, status: filter })}`);
  return (
    <>
      <PageHead kicker="Journal" title="Blog" lede="Drafts, published stories, and the archive. This is the only desk a blog author sees.">
        <Link className="btn" href="/blog/new">New post</Link>
      </PageHead>
      <nav className="subnav">
        <Link href="/blog" className="active">Posts</Link>
        <Link href="/blog/organize">Categories & tags</Link>
      </nav>
      <form className="filters" onSubmit={(event) => { event.preventDefault(); setPage(1); setFilter(status); }}>
        <label className="field">Status
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Any</option>
            {BLOG_STATUSES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <button className="btn" type="submit">Filter</button>
      </form>
      {loading ? <Loading table columns={3} label="Loading posts" /> : <Updating active={fetching} />}
      <ErrorBanner error={error} />
      {data && data.items.length === 0 ? <Empty>No posts in this view.</Empty> : null}
      {data && data.items.length > 0 ? (
        <div className="panel">
          <table>
            <thead><tr><th>Title</th><th>Status</th><th>Updated</th></tr></thead>
            <tbody>
              {data.items.map((post) => (
                <tr key={post.id}>
                  <td><Link href={`/blog/${post.id}`}>{post.title}</Link><div className="note">{post.slug}</div></td>
                  <td><Pill tone={statusTone(post.status)}>{post.status}</Pill></td>
                  <td>{formatWhen(post.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager page={data.page} total={data.total} perPage={data.perPage} onPage={setPage} />
        </div>
      ) : null}
      <Comments />
    </>
  );
}

function Comments() {
  const [id, setId] = useState('');
  const [comment, setComment] = useState<BlogComment | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);

  async function hide() {
    setPending(true);
    setError(null);
    try {
      setComment(await api<BlogComment>(`/admin/blog/comments/${encodeURIComponent(id.trim())}/hide`, { method: 'POST' }));
    } catch (caught) {
      setError(caught);
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    setPending(true);
    setError(null);
    try {
      await api(`/admin/blog/comments/${encodeURIComponent(id.trim())}`, { method: 'DELETE' });
      setComment(null);
      setId('');
    } catch (caught) {
      setError(caught);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="panel" style={{ marginTop: 14 }}>
      <h2>Comments</h2>
      <p className="note">Hide or delete a comment by id. The admin list does not include comments.</p>
      <ErrorBanner error={error} />
      <div className="filters">
        <label className="field grow">Comment id<input value={id} onChange={(event) => setId(event.target.value)} /></label>
        <button className="btn" type="button" disabled={pending || !id.trim()} onClick={() => void hide()}>Hide</button>
        <button className="btn-danger" type="button" disabled={pending || !id.trim()} onClick={() => void remove()}>Delete</button>
      </div>
      {comment ? <p>{comment.name}: {comment.body} {comment.isHidden ? <Pill tone="bad">hidden</Pill> : null}</p> : null}
    </section>
  );
}

export function BlogOrganizeView() {
  const categories = useApi<BlogCategory[]>('/admin/blog/categories');
  const tags = useApi<BlogTag[]>('/admin/blog/tags');
  const [error, setError] = useState<unknown>(null);
  const [category, setCategory] = useState({ name: '', slug: '', description: '' });
  const [tag, setTag] = useState({ name: '', slug: '' });

  async function addCategory(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await api('/admin/blog/categories', { method: 'POST', body: { name: category.name.trim(), slug: category.slug.trim() || undefined, description: category.description.trim() || undefined } });
      setCategory({ name: '', slug: '', description: '' });
      categories.reload();
    } catch (caught) {
      setError(caught);
    }
  }

  async function addTag(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await api('/admin/blog/tags', { method: 'POST', body: { name: tag.name.trim(), slug: tag.slug.trim() || undefined } });
      setTag({ name: '', slug: '' });
      tags.reload();
    } catch (caught) {
      setError(caught);
    }
  }

  return (
    <>
      <PageHead kicker="Journal" title="Organize" lede="Blog categories and tags are created here. Posts pick them up on save.">
        <Link className="btn-ghost" href="/blog">Posts</Link>
      </PageHead>
      <ErrorBanner error={error ?? categories.error ?? tags.error} />
      <div className="split">
        <section className="panel">
          <h2>Categories</h2>
          <form className="stack" onSubmit={addCategory}>
            <Field label="Name"><input value={category.name} onChange={(event) => setCategory({ ...category, name: event.target.value })} required /></Field>
            <Field label="Slug"><input value={category.slug} onChange={(event) => setCategory({ ...category, slug: event.target.value })} /></Field>
            <Field label="Description"><input value={category.description} onChange={(event) => setCategory({ ...category, description: event.target.value })} /></Field>
            <button className="btn" type="submit">Add category</button>
          </form>
          {categories.loading ? <Loading table plain columns={2} label="Loading categories" /> : <Updating active={categories.fetching} />}
          {categories.data && categories.data.length === 0 ? <p className="note">No categories yet.</p> : null}
          {categories.data && categories.data.length > 0 ? (
            <table>
              <thead><tr><th>Name</th><th>Slug</th></tr></thead>
              <tbody>
                {categories.data.map((item) => (
                  <tr key={item.id}><td>{item.name}</td><td>{item.slug}</td></tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </section>
        <section className="panel">
          <h2>Tags</h2>
          <form className="stack" onSubmit={addTag}>
            <Field label="Name"><input value={tag.name} onChange={(event) => setTag({ ...tag, name: event.target.value })} required /></Field>
            <Field label="Slug"><input value={tag.slug} onChange={(event) => setTag({ ...tag, slug: event.target.value })} /></Field>
            <button className="btn" type="submit">Add tag</button>
          </form>
          {tags.loading ? <Loading table plain columns={2} label="Loading tags" /> : <Updating active={tags.fetching} />}
          {tags.data && tags.data.length === 0 ? <p className="note">No tags yet.</p> : null}
          {tags.data && tags.data.length > 0 ? (
            <table>
              <thead><tr><th>Name</th><th>Slug</th></tr></thead>
              <tbody>
                {tags.data.map((item) => (
                  <tr key={item.id}><td>{item.name}</td><td>{item.slug}</td></tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </section>
      </div>
    </>
  );
}

type PostDraft = {
  title: string;
  slug: string;
  excerpt: string;
  bodyHtml: string;
  status: string;
  categoryId: string;
  tagIds: string[];
  metaTitle: string;
  metaDescription: string;
  coverImageUrl: string;
  coverImagePublicId: string;
  faqs: { question: string; answer: string }[];
};

async function findPost(id: string) {
  let page = 1;
  for (;;) {
    const result = await api<Page<BlogPost>>(`/admin/blog/posts${qs({ page, perPage: 100 })}`);
    const post = result.items.find((item) => item.id === id);
    if (post) return post;
    if (page * result.perPage >= result.total || result.items.length === 0) {
      throw new ApiError(404, 'NOT_FOUND', 'Post not found', null);
    }
    page += 1;
  }
}

const blankPost: PostDraft = {
  title: '', slug: '', excerpt: '', bodyHtml: '', status: 'draft', categoryId: '', tagIds: [], metaTitle: '', metaDescription: '', coverImageUrl: '', coverImagePublicId: '', faqs: [],
};

export function BlogEditor({ id }: { id?: string }) {
  const router = useRouter();
  const categories = useApi<BlogCategory[]>('/admin/blog/categories');
  const tags = useApi<BlogTag[]>('/admin/blog/tags');
  const [draft, setDraft] = useState<PostDraft>(blankPost);
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const [replaceFaqs, setReplaceFaqs] = useState(false);
  const postQuery = useQuery({
    queryKey: ['admin', '/admin/blog/posts', id],
    enabled: Boolean(id),
    queryFn: () => findPost(id as string),
  });

  useEffect(() => {
    const post = postQuery.data;
    if (!post) return;
    setDraft({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      bodyHtml: post.bodyHtml,
      status: post.status,
      categoryId: post.categoryId ?? '',
      tagIds: (post.tags ?? []).map((row) => row.tag?.id || row.tagId),
      metaTitle: post.metaTitle ?? '',
      metaDescription: post.metaDescription ?? '',
      coverImageUrl: post.coverImageUrl ?? '',
      coverImagePublicId: post.coverImagePublicId ?? '',
      faqs: [],
    });
  }, [postQuery.data]);

  function body(creating: boolean) {
    return {
      title: draft.title.trim(),
      slug: draft.slug.trim() || undefined,
      excerpt: draft.excerpt.trim(),
      bodyHtml: htmlValue(draft.bodyHtml) ?? '',
      status: draft.status,
      categoryId: draft.categoryId || null,
      tagIds: draft.tagIds,
      metaTitle: draft.metaTitle.trim() || undefined,
      metaDescription: draft.metaDescription.trim() || undefined,
      coverImageUrl: draft.coverImageUrl.trim() || undefined,
      coverImagePublicId: draft.coverImagePublicId.trim() || undefined,
      ...(creating || replaceFaqs ? { faqs: draft.faqs.map((faq, index) => ({ question: faq.question, answer: faq.answer, sortOrder: index })) } : {}),
    };
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!htmlValue(draft.bodyHtml)) {
      setError(new Error('Write the post body'));
      return;
    }
    setPending(true);
    setError(null);
    try {
      if (id) {
        await api(`/admin/blog/posts/${id}`, { method: 'PATCH', body: body(false) });
        router.refresh();
      } else {
        const created = await api<BlogPost>('/admin/blog/posts', { method: 'POST', body: body(true) });
        router.replace(`/blog/${created.id}`);
      }
    } catch (caught) {
      setError(caught);
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!id || !confirm('Delete this post?')) return;
    try {
      await api(`/admin/blog/posts/${id}`, { method: 'DELETE' });
      router.replace('/blog');
    } catch (caught) {
      setError(caught);
    }
  }

  async function upload(file: File) {
    setPending(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const stored = await api<StoredImage>('/admin/blog/images', { method: 'POST', form });
      setDraft((current) => ({ ...current, coverImageUrl: stored.url, coverImagePublicId: stored.publicId }));
    } catch (caught) {
      setError(caught);
    } finally {
      setPending(false);
    }
  }

  if (id && postQuery.isLoading) return <Loading label="Opening post" />;
  if (id && postQuery.error) return <ErrorBanner error={postQuery.error} />;

  return (
    <>
      <PageHead kicker="Journal" title={id ? draft.title || 'Edit post' : 'New post'} lede="Cover images upload to the blog folder, then save with the post.">
        <Link className="btn-ghost" href="/blog">All posts</Link>
      </PageHead>
      <ErrorBanner error={error} />
      <form className="panel stack" onSubmit={save}>
        <div className="form-grid">
          <Field label="Title"><input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required /></Field>
          <Field label="Slug"><input value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} /></Field>
          <Field label="Status">
            <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>{BLOG_STATUSES.map((item) => <option key={item}>{item}</option>)}</select>
          </Field>
          <Field label="Category">
            <select value={draft.categoryId} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })}>
              <option value="">None</option>
              {(categories.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </Field>
          <Field label="Excerpt" wide><textarea value={draft.excerpt} onChange={(event) => setDraft({ ...draft, excerpt: event.target.value })} required /></Field>
          <div className="field span-2">
            <span>Body</span>
            <HtmlDescription label="Post body" value={draft.bodyHtml} onChange={(value) => setDraft({ ...draft, bodyHtml: value })} />
          </div>
          <Field label="Meta title"><input value={draft.metaTitle} onChange={(event) => setDraft({ ...draft, metaTitle: event.target.value })} /></Field>
          <Field label="Meta description"><input value={draft.metaDescription} onChange={(event) => setDraft({ ...draft, metaDescription: event.target.value })} /></Field>
        </div>
        {draft.coverImageUrl ? <img src={draft.coverImageUrl} alt="" style={{ maxHeight: 220, borderRadius: 14, objectFit: 'cover' }} /> : null}
        <label className="field">Cover image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} /></label>
        <fieldset>
          <legend>Tags</legend>
          <div className="actions">{(tags.data ?? []).map((tag) => (
            <label className="check" key={tag.id}>
              <input type="checkbox" checked={draft.tagIds.includes(tag.id)} onChange={(event) => setDraft({ ...draft, tagIds: event.target.checked ? [...draft.tagIds, tag.id] : draft.tagIds.filter((item) => item !== tag.id) })} />
              {tag.name}
            </label>
          ))}</div>
        </fieldset>
        <fieldset>
          <legend>FAQs</legend>
          {id ? <label className="check"><input type="checkbox" checked={replaceFaqs} onChange={(event) => setReplaceFaqs(event.target.checked)} /> Replace existing questions</label> : null}
          {draft.faqs.map((faq, index) => (
            <div className="form-grid" key={index}>
              <Field label="Question"><input value={faq.question} onChange={(event) => setDraft({ ...draft, faqs: draft.faqs.map((item, i) => i === index ? { ...item, question: event.target.value } : item) })} /></Field>
              <Field label="Answer"><input value={faq.answer} onChange={(event) => setDraft({ ...draft, faqs: draft.faqs.map((item, i) => i === index ? { ...item, answer: event.target.value } : item) })} /></Field>
            </div>
          ))}
          <button className="btn-ghost" type="button" onClick={() => setDraft({ ...draft, faqs: [...draft.faqs, { question: '', answer: '' }] })}>Add question</button>
        </fieldset>
        <div className="actions">
          <button className="btn" disabled={pending} type="submit">{id ? 'Save post' : 'Create post'}</button>
          {id ? <button className="btn-danger" type="button" onClick={() => void remove()}>Delete</button> : null}
        </div>
      </form>
    </>
  );
}
