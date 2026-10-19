import type { Metadata } from 'next';
import { ProductsView } from '@/components/products-view';

export const metadata: Metadata = {
  title: 'Products',
  description: 'AfriBasket catalog: products, prices in cents, and stock.',
};

export default function ProductsPage() {
  return <ProductsView />;
}
