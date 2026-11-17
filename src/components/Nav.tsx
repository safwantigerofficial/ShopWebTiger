'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/shop', label: 'Shop', icon: '🛍' },
  { href: '/orders', label: 'Orders', icon: '📦' },
  { href: '/wallet', label: 'Wallet', icon: '💰' },
  { href: '/freebies', label: 'Free', icon: '🎁' },
  { href: '/buff', label: 'Buff', icon: '🚀' },
  { href: '/refer', label: 'Refer', icon: '🤝' },
  { href: '/profile', label: 'Profile', icon: '👤' },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-night-900/95 backdrop-blur border-t border-night-600">
      <div className="mx-auto max-w-3xl flex">
        {items.map((it) => (
          <Link key={it.href} href={it.href}
            className={`flex-1 py-2 text-center text-[11px] ${path.startsWith(it.href) ? 'text-brand' : 'text-slate-400'}`}>
            <div className="text-lg leading-5">{it.icon}</div>
            {it.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
