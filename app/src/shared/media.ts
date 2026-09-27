import { config } from '../config';

export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
  const origin = config.apiUrl.replace(/\/+$/, '');
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}
