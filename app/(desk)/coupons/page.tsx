import type { Metadata } from 'next';
import { CouponsView } from '@/components/coupons-view';

export const metadata: Metadata = {
  title: 'Coupons',
  description: 'Create percent and fixed-cent coupons for AfriBasket.',
};

export default function CouponsPage() {
  return <CouponsView />;
}
