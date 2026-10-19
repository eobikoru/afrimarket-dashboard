import type { Metadata } from 'next';
import { BlogListView } from '@/components/blog-view';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Draft, publish, and archive AfriBasket journal posts.',
};

export default function BlogPage() {
  return <BlogListView />;
}
