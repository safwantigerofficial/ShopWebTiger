'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/shop', label: 'Shop' },
  { href: '/orders', label: 'Orders' },
  { href: '/wallet', label: 'Wallet' },
  { href: '/freebies', label: 'Freebies' },
  { href: '/buff', label: 'Buff' },
  { href: '/refer', label: 'Refer' },
  { href: '/profile', label: 'Profile' },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="flex items-center gap-1 sm:gap-0.5 text-sm overflow-x-auto">
      {items.map((it) => {
        const active = path.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className="px-2.5 py-1.5 rounded-lg whitespace-nowrap transition"
            style={{
              color: active ? 'var(--brand)' : 'var(--fg2)',
              background: active ? 'rgba(62,207,142,.1)' : 'transparent',
            }}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
