import type { Metadata } from 'next';
import { BlogEditor } from '@/components/blog-view';

export const metadata: Metadata = {
  title: 'New post',
  description: 'Write an AfriBasket journal post and upload a cover image.',
};

export default function NewPostPage() {
  return <BlogEditor />;
}
