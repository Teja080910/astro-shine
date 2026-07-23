import { config } from '@/config';

let authToken: string | null = null;

export function setToken(token: string | null) {
  authToken = token;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  const res = await fetch(`${config.apiBaseUrl}${path}`, {
    ...options,
    headers,
  });
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      document.cookie = 'admin-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const errorDetails = await res.json().catch(() => ({}));
    throw new Error(errorDetails.message || `API error: ${res.status}`);
  }
  return res.json();
}

export const api = {
  setToken,
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body: any) => apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: any) => apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: (path: string) => apiFetch<void>(path, { method: 'DELETE' }),
};
