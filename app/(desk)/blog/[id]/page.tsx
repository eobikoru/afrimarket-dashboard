import type { Metadata } from 'next';
import { BlogEditor } from '@/components/blog-view';

export const metadata: Metadata = {
  title: 'Edit post',
  description: 'Edit an AfriBasket journal post, cover image, and questions.',
};

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BlogEditor id={id} />;
}
