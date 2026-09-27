import { config } from '@/config';

export function imageSrc(url?: string | null): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
  return `${config.apiUrl.replace(/\/+$/, '')}${url.startsWith('/') ? '' : '/'}${url}`;
}
