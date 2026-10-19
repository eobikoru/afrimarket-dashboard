import type { Metadata } from 'next';
import { Shell } from '@/components/shell';

export const metadata: Metadata = {
  title: 'Desk',
  description: 'AfriBasket operations desk for orders, catalog, inventory, and the journal.',
};

export default function DeskLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
