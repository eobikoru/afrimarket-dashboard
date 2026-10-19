import { API_BASE, type ApiErrorBody, type Session } from './types';

const KEY = 'afribasket.desk.session';

type Listener = (session: Session | null) => void;
const listeners = new Set<Listener>();

export class ApiError extends Error {
  status: number;
  code: string;
  details: unknown;

  constructor(status: number, code: string, message: string, details: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function readSession(): Session | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function writeSession(session: Session | null): void {
  if (typeof window === 'undefined') return;
  if (session) sessionStorage.setItem(KEY, JSON.stringify(session));
  else sessionStorage.removeItem(KEY);
  listeners.forEach((listener) => listener(session));
}

export function subscribeSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function parseError(status: number, payload: unknown): ApiError {
  const body = payload as Partial<ApiErrorBody> | null;
  const error = body?.error;
  return new ApiError(status, error?.code ?? 'ERROR', error?.message ?? 'Request failed', error?.details ?? null);
}

let refreshFlight: Promise<Session | null> | null = null;

async function refreshSession(): Promise<Session | null> {
  const current = readSession();
  if (!current?.refreshToken) return null;
  if (!refreshFlight) {
    refreshFlight = (async () => {
      const response = await fetch(`${API_BASE}/admin/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        writeSession(null);
        return null;
      }
      const data = payload as { accessToken: string; refreshToken: string; expiresIn: number };
      const next: Session = {
        ...current,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: Date.now() + data.expiresIn * 1000,
      };
      writeSession(next);
      return next;
    })().finally(() => {
      refreshFlight = null;
    });
  }
  return refreshFlight;
}

export async function api<T>(
  path: string,
  init: { method?: string; body?: unknown; form?: FormData; auth?: boolean; retry?: boolean } = {},
): Promise<T> {
  const method = init.method ?? 'GET';
  const headers = new Headers({ Accept: 'application/json' });
  let session = readSession();
  if (init.auth !== false) {
    if (session && session.expiresAt - Date.now() < 20_000) {
      session = (await refreshSession()) ?? session;
    }
    if (session?.accessToken) headers.set('Authorization', `Bearer ${session.accessToken}`);
  }
  let body: BodyInit | undefined;
  if (init.form) body = init.form;
  else if (init.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(init.body);
  }
  const response = await fetch(`${API_BASE}${path}`, { method, headers, body });
  if (response.status === 401 && init.auth !== false && init.retry !== false) {
    const next = await refreshSession();
    if (next) return api<T>(path, { ...init, retry: false });
    writeSession(null);
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.assign('/login');
    }
    const payload = await response.json().catch(() => null);
    throw parseError(401, payload);
  }
  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw parseError(response.status, payload);
  return payload as T;
}

export async function login(email: string, password: string): Promise<Session> {
  const data = await api<{ admin: Session['admin']; accessToken: string; refreshToken: string; expiresIn: number }>(
    '/admin/auth/login',
    { method: 'POST', auth: false, body: { email, password } },
  );
  const session: Session = {
    admin: data.admin,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt: Date.now() + data.expiresIn * 1000,
  };
  writeSession(session);
  return session;
}

export async function logout(): Promise<void> {
  const session = readSession();
  try {
    if (session) {
      await api('/admin/auth/logout', { method: 'POST', body: { refreshToken: session.refreshToken }, retry: false });
    }
  } catch {
    /* Local sign-out still proceeds when the token is already gone. */
  }
  writeSession(null);
}
