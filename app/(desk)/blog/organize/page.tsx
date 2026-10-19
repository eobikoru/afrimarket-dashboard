import type { Metadata } from 'next';
import { BlogOrganizeView } from '@/components/blog-view';

export const metadata: Metadata = {
  title: 'Blog categories',
  description: 'Create AfriBasket blog categories and tags.',
};

export default function BlogOrganizePage() {
  return <BlogOrganizeView />;
}
