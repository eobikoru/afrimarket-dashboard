'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { readSession, subscribeSession } from './api';
import type { Role, Session } from './types';

const AuthContext = createContext<{ session: Session | null; ready: boolean }>({ session: null, ready: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(readSession());
    setReady(true);
    return subscribeSession(setSession);
  }, []);

  return <AuthContext.Provider value={{ session, ready }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function canSee(role: Role | undefined, allowed: Role[]): boolean {
  return !!role && allowed.includes(role);
}
