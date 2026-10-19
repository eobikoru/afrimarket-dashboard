import type { Metadata } from 'next';
import { LoginView } from '@/components/login-view';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to the AfriBasket operations desk. Staff accounts only.',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginView />;
}
