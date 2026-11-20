// Browser requests use relative `/api/*` paths locally or `NEXT_PUBLIC_API_URL` in cloud deployments.
// Trailing slashes and accidental `/api` suffixes are stripped automatically to prevent `//api/...` errors.
const RAW_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').trim();
export const API_BASE = RAW_BASE.replace(/\/+$/, '').replace(/\/api$/i, '');

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

export function getAiSettings(): {
  openRouterKey: string;
  openRouterModel: string;
  autoNavigate: boolean;
} {
  if (typeof window === 'undefined') {
    return { openRouterKey: '', openRouterModel: 'openrouter/auto', autoNavigate: true };
  }
  return {
    openRouterKey: localStorage.getItem('opspilot_openrouter_key') ?? '',
    openRouterModel: localStorage.getItem('opspilot_openrouter_model') ?? 'openrouter/auto',
    autoNavigate: (localStorage.getItem('opspilot_ai_autonav') ?? 'true') !== 'false',
  };
}

export function saveAiSettings(settings: {
  openRouterKey?: string;
  openRouterModel?: string;
  autoNavigate?: boolean;
}) {
  if (typeof window === 'undefined') return;
  if (settings.openRouterKey !== undefined) {
    localStorage.setItem('opspilot_openrouter_key', settings.openRouterKey.trim());
  }
  if (settings.openRouterModel !== undefined) {
    localStorage.setItem('opspilot_openrouter_model', settings.openRouterModel);
  }
  if (settings.autoNavigate !== undefined) {
    localStorage.setItem('opspilot_ai_autonav', String(settings.autoNavigate));
  }
}

export function logout() {
  if (typeof window === 'undefined') return;
  const rt = localStorage.getItem('opspilot_refresh_token');
  if (rt) {
    fetch(`${API_BASE}/api/auth/logout`, {
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
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
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
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const res = await fetch(`${API_BASE}/api${cleanPath}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });

  if (res.status === 401 && !retried && !cleanPath.startsWith('/auth/')) {
    const freshToken = await tryRefresh();
    if (freshToken) {
      return api(cleanPath, opts, true);
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
