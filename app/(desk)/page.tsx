import type { Metadata } from 'next';
import { HomeView } from '@/components/home-view';

export const metadata: Metadata = {
  title: 'Home',
  description: 'AfriBasket home stats: orders, revenue, payments, stock, and journal counts.',
};

export default function HomePage() {
  return <HomeView />;
}
