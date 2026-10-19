import type { Metadata } from 'next';
import { TagsView } from '@/components/catalog-view';

export const metadata: Metadata = {
  title: 'Tags',
  description: 'Create and edit AfriBasket product tags.',
};

export default function TagsPage() {
  return <TagsView />;
}
