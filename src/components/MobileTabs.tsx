'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/shop', label: 'Shop', icon: '🏪' },
  { href: '/orders', label: 'My orders', icon: '📎' },
  { href: '/wallet', label: 'Wallet', icon: '💰' },
  { href: '/profile', label: 'My account', icon: '👤' },
];

export default function MobileTabs() {
  const path = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t flex"
      style={{ borderColor: 'var(--border)', background: 'var(--nav)', backdropFilter: 'blur(10px)' }}>
      {items.map((it) => {
        const active = path.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold"
            style={{ color: active ? 'var(--primary)' : 'var(--fg3)' }}>
            <span className="text-xl leading-none">{it.icon}</span>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
