import type { Metadata } from 'next';
import { OrderDetailView } from '@/components/orders-view';

export const metadata: Metadata = {
  title: 'Order',
  description: 'AfriBasket order detail with tracking, notes, refunds, and stock returns.',
};

export default async function OrderPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  return <OrderDetailView orderNumber={orderNumber} />;
}
