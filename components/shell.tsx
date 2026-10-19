'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { logout } from '@/lib/api';
import { canSee, useAuth } from '@/lib/auth';
import type { Role } from '@/lib/types';

const NAV: { href: string; label: string; roles: Role[] }[] = [
  { href: '/', label: 'Home', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/orders', label: 'Orders', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/customers', label: 'Customers', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/products', label: 'Products', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/inventory', label: 'Inventory', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/coupons', label: 'Coupons', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/banners', label: 'Banners', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/reviews', label: 'Reviews', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/settings', label: 'Settings', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { href: '/blog', label: 'Blog', roles: ['SUPER_ADMIN', 'ADMIN', 'BLOG_AUTHOR'] },
  { href: '/staff', label: 'Staff', roles: ['SUPER_ADMIN'] },
];

function allowed(pathname: string, role: Role): boolean {
  if (role === 'BLOG_AUTHOR') return pathname.startsWith('/blog');
  if (pathname.startsWith('/staff')) return role === 'SUPER_ADMIN';
  return true;
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { session, ready } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace('/login');
      return;
    }
    if (!allowed(pathname, session.admin.role)) {
      router.replace(session.admin.role === 'BLOG_AUTHOR' ? '/blog' : '/');
    }
  }, [ready, session, pathname, router]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!ready) return <div className="boot">AfriBasket</div>;
  if (!session || !allowed(pathname, session.admin.role)) return <div className="boot">AfriBasket</div>;

  const links = NAV.filter((item) => canSee(session.admin.role, item.roles));

  return (
    <div className="app">
      {open ? <button className="scrim" aria-label="Close menu" onClick={() => setOpen(false)} /> : null}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <Link href={session.admin.role === 'BLOG_AUTHOR' ? '/blog' : '/'} className="brand">
          <span className="brand-name">Afri<span>Basket</span></span>
          <span className="kente" aria-hidden="true" />
        </Link>
        <nav className="nav" aria-label="Desk">
          {links.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={active ? 'active' : undefined} aria-current={active ? 'page' : undefined}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="side-foot">
          <div className="who">
            <strong>{session.admin.name}</strong>
            <span className="muted">{session.admin.role.replaceAll('_', ' ')}</span>
          </div>
          <button
            className="btn-ghost"
            type="button"
            onClick={() => {
              void logout().finally(() => router.replace('/login'));
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="main" id="content">
        <button className="btn-ghost menu-btn" type="button" onClick={() => setOpen(true)}>Menu</button>
        {children}
      </main>
    </div>
  );
}
