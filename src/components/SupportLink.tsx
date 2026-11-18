import { env } from '../env';
import CE from './CE';

/**
 * Deep link to the support admin's Telegram DM with prefilled text.
 * SUPPORT_USERNAME env names the support/admin account; falls back
 * to the main shop bot DM when unset.
 */
export function supportHref(issue: string): string | null {
  const u = (process.env.SUPPORT_USERNAME ?? env.MAIN_BOT_USERNAME ?? '').replace(/^@/, '').trim();
  if (!u) return null;
  return `https://t.me/${u}?text=${encodeURIComponent(issue)}`;
}

export default function SupportLink({ issue, className = '', label = 'Get support' }: { issue: string; className?: string; label?: string }) {
  const href = supportHref(issue);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer" className={`btn-ghost text-sm inline-flex items-center gap-1.5 ${className}`}>
      <CE id="5904630315946611415" /> {label}
    </a>
  );
}
