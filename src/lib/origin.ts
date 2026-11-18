import { headers } from 'next/headers';
import { env } from '../env';

export function siteOrigin(): string {
  if (env.SITE_URL) return `https://${env.SITE_URL.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`;
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? '';
  const proto = h.get('x-forwarded-proto') ?? 'https';
  return host ? `${proto}://${host}` : '';
}
