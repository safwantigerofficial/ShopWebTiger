'use client';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import LanguageSelect from './LanguageSelect';
import Avatar from './Avatar';
import { useLang } from './useLang';

export default function Topbar({ loggedIn, balance }: { loggedIn: boolean; balance: number | null }) {
  const { t } = useLang();
  return (
    <div className="sticky top-0 z-40 border-b" style={{ borderColor: 'var(--border)', background: 'var(--nav)', backdropFilter: 'blur(10px)' }}>
      <div className="px-5 sm:px-8 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="md:hidden flex items-center gap-2 shrink-0">
            <img src="/logo.jpg" alt="" className="w-8 h-8 rounded-lg object-cover" />
          </Link>
          <span className="text-sm hidden sm:inline" style={{ color: 'var(--fg2)' }}>{t('customer_area')}</span>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {loggedIn && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('st-open-support'))}
              className="flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: 'var(--fg)' }}
              aria-label="Support"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 14v-2a9 9 0 0 1 18 0v2" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
              <span className="hidden sm:inline">Live support</span>
            </button>
          )}
          {loggedIn && balance !== null && (
            <span className="md:hidden text-sm font-extrabold">${balance.toFixed(2)}</span>
          )}
          <LanguageSelect />
          <ThemeToggle />
          <Link href={loggedIn ? '/profile' : '/login'} className="flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: 'var(--fg)' }}>
            {loggedIn ? <Avatar size={30} /> : (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>)}
            {!loggedIn && <span className="hidden xs:inline">{t('sign_in')}</span>}
          </Link>
        </div>
      </div>
    </div>
  );
}
