'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

const items = [
  { href: '/shop', label: 'Shop' },
  { href: '/orders', label: 'Orders' },
  { href: '/wallet', label: 'Wallet' },
  { href: '/freebies', label: 'Freebies' },
  { href: '/buff', label: 'Buff' },
  { href: '/refer', label: 'Refer' },
  { href: '/profile', label: 'Account' },
];

export default function Topbar({ loggedIn }: { loggedIn: boolean }) {
  const path = usePathname();
  return (
    <div className="sticky top-0 z-40 border-b" style={{ borderColor: 'var(--border)', background: 'var(--nav)', backdropFilter: 'blur(10px)' }}>
      <div className="px-5 sm:px-8 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="md:hidden flex items-center gap-2 shrink-0">
            <img src="/logo.jpg" alt="" className="w-8 h-8 rounded-lg object-cover" />
          </Link>
          <span className="text-sm hidden sm:inline" style={{ color: 'var(--fg2)' }}>Customer area</span>
        </div>

        {/* mobile nav */}
        <nav className="md:hidden flex items-center gap-1 overflow-x-auto text-sm">
          {items.map((it) => (
            <Link key={it.href} href={it.href} className="px-2 py-1 rounded whitespace-nowrap"
              style={{ color: path.startsWith(it.href) ? 'var(--primary)' : 'var(--fg2)' }}>
              {it.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle />
          <Link href={loggedIn ? '/profile' : '/login'} className="flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: 'var(--fg)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {loggedIn ? 'My account' : 'Sign in'}
          </Link>
        </div>
      </div>
    </div>
  );
}
