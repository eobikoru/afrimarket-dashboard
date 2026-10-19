import type { Metadata } from 'next';
import { BannersView } from '@/components/banners-view';

export const metadata: Metadata = {
  title: 'Banners',
  description: 'Upload and schedule AfriBasket storefront banners.',
};

export default function BannersPage() {
  return <BannersView />;
}
