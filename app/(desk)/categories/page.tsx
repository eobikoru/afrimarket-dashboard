import type { Metadata } from 'next';
import { CategoriesView } from '@/components/catalog-view';

export const metadata: Metadata = {
  title: 'Categories',
  description: 'Create and nest AfriBasket product categories.',
};

export default function CategoriesPage() {
  return <CategoriesView />;
}
