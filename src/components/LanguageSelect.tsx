'use client';
import { LANGS, type Lang } from '../lib/i18n';
import { useLang } from './useLang';

export default function LanguageSelect() {
  const { lang } = useLang();
  return (
    <select
      className="text-sm font-medium bg-transparent border rounded-lg px-2 py-1.5"
      style={{ color: 'var(--fg2)', borderColor: 'var(--border2)' }}
      value={lang}
      aria-label="Language"
      onChange={(e) => {
        document.cookie = `lang=${e.target.value};path=/;max-age=31536000`;
        window.dispatchEvent(new Event('lang-change'));
      }}
    >
      {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
    </select>
  );
}
