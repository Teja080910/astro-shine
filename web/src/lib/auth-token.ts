export interface AdminTokenPayload {
  sub?: string;
  role?: string;
  exp?: number;
}

export function decodeAdminToken(token?: string | null): AdminTokenPayload | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return JSON.parse(atob(base64)) as AdminTokenPayload;
  } catch {
    return null;
  }
}

export function isValidAdminToken(token?: string | null): boolean {
  const payload = decodeAdminToken(token);
  if (!payload?.sub || !payload.role || !payload.exp) return false;
  if (payload.exp * 1000 <= Date.now()) return false;
  return payload.role === 'admin' || payload.role === 'superadmin';
}
