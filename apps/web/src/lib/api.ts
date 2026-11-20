// Browser requests always use relative `/api/*` paths (proxied by Next.js rewrites
// to INTERNAL_API_URL) so cloud/iframe previews and reverse proxies work seamlessly.
const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('opspilot_access_token');
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('opspilot_refresh_token');
}

export function setTokens(access: string, refresh: string, user: any) {
  localStorage.setItem('opspilot_access_token', access);
  localStorage.setItem('opspilot_refresh_token', refresh);
  localStorage.setItem('opspilot_user', JSON.stringify(user));
}

export function getUser(): any | null {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem('opspilot_user') ?? 'null');
  } catch {
    return null;
  }
}

export function logout() {
  if (typeof window === 'undefined') return;
  const rt = localStorage.getItem('opspilot_refresh_token');
  if (rt) {
    fetch(`${BASE}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    }).catch(() => undefined);
  }
  localStorage.removeItem('opspilot_access_token');
  localStorage.removeItem('opspilot_refresh_token');
  localStorage.removeItem('opspilot_user');
  window.location.href = '/login';
}

async function tryRefresh(): Promise<string | null> {
  const rt = getRefreshToken();
  if (!rt) return null;
  try {
    const res = await fetch(`${BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken, data.user);
    return data.accessToken;
  } catch {
    return null;
  }
}

export async function api(path: string, opts: RequestInit = {}, retried = false): Promise<any> {
  const token = getToken();
  const res = await fetch(`${BASE}/api${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });

  if (res.status === 401 && !retried && !path.startsWith('/auth/')) {
    const freshToken = await tryRefresh();
    if (freshToken) {
      return api(path, opts, true);
    }
    logout();
    throw new Error('Session expired. Please sign in again.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message ?? `Request failed (${res.status})`);
  }
  return data;
}
