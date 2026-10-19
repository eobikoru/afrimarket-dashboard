'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { ApiError, login } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ErrorBanner } from './ui';

export function LoginView() {
  const router = useRouter();
  const { session, ready } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (ready && session) router.replace(session.admin.role === 'BLOG_AUTHOR' ? '/blog' : '/');
  }, [ready, session, router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const next = await login(email, password);
      router.replace(next.admin.role === 'BLOG_AUTHOR' ? '/blog' : '/');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : caught);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="login">
      <section className="login-story">
        <div>
          <p className="kicker" style={{ color: '#e7c98a' }}>AfriBasket</p>
          <h1>The desk behind the basket.</h1>
          <p>Orders, stock, and stories for a United States grocery of African food. Money stays in cents.</p>
        </div>
        <span className="kente" aria-hidden="true" />
      </section>
      <section className="login-form">
        <form className="login-card" onSubmit={onSubmit}>
          <div>
            <p className="kicker">Sign in</p>
            <h2 style={{ margin: 0, fontSize: 36 }}>Welcome back</h2>
          </div>
          <ErrorBanner error={error} />
          <label className="field">
            Email
            <input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="field">
            Password
            <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          <button className="btn" type="submit" disabled={pending}>{pending ? 'Signing in…' : 'Enter the desk'}</button>
          <p className="note">Staff accounts only. Shoppers sign in on the store, not here.</p>
        </form>
      </section>
    </div>
  );
}
