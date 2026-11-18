'use client';
import { useEffect, useSyncExternalStore } from 'react';
import { t as tt, RTL_LANGS, type Lang } from '../lib/i18n';

const CODES: Lang[] = ['en', 'ar', 'ur', 'hi', 'ru', 'vi', 'es', 'tr', 'id', 'zh', 'fr', 'de', 'bn', 'fa'];

function read(): Lang {
  const m = document.cookie.match(/(?:^|;\s*)lang=([a-z]{2})/);
  const c = m?.[1] as Lang | undefined;
  return c && CODES.includes(c) ? c : 'en';
}

export function useLang() {
  const lang = useSyncExternalStore(
    (cb) => { window.addEventListener('lang-change', cb); return () => window.removeEventListener('lang-change', cb); },
    read,
    () => 'en' as Lang,
  );
  useEffect(() => {
    document.documentElement.dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';
  }, [lang]);
  return { lang, t: (k: string) => tt(k, lang) };
}
