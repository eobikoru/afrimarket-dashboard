import type { Metadata } from 'next';
import { SettingsView } from '@/components/settings-view';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'AfriBasket store name, support contacts, shipping rates, and tax. No secrets are shown.',
};

export default function SettingsPage() {
  return <SettingsView />;
}
