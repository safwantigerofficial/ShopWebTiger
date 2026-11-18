import { cookies } from 'next/headers';
import { t as tt, type Lang } from './i18n';

const CODES: Lang[] = ['en', 'ar', 'ur', 'hi', 'ru', 'vi', 'es', 'tr', 'id', 'zh', 'fr', 'de', 'bn', 'fa'];

export function getLang(): Lang {
  const c = cookies().get('lang')?.value as Lang | undefined;
  return c && CODES.includes(c) ? c : 'en';
}

export function tS(key: string): string {
  return tt(key, getLang());
}
