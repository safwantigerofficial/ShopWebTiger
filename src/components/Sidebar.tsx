'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/shop', label: 'Shop', icon: '🏪' },
  { href: '/orders', label: 'My orders', icon: '📋' },
  { href: '/wallet', label: 'Wallet', icon: '💰' },
  { href: '/freebies', label: 'Freebies', icon: '🎁' },
  { href: '/buff', label: 'Buff', icon: '🚀' },
  { href: '/refer', label: 'Refer & Earn', icon: '🤝' },
  { href: '/profile', label: 'My account', icon: '👤' },
];

export default function Sidebar({ loggedIn }: { loggedIn: boolean }) {
  const path = usePathname();
  return (
    <aside className="w-60 shrink-0 border-r flex flex-col min-h-screen sticky top-0 hidden md:flex"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <div className="p-5">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo.jpg" alt="SafwanTiger" className="w-10 h-10 rounded-xl object-cover" />
          <div>
            <div className="font-bold text-[15px] leading-tight">SafwanTiger</div>
            <div className="text-xs" style={{ color: 'var(--fg3)' }}>Your digital store</div>
          </div>
        </Link>
      </div>

      <div className="px-4">
        <div className="rounded-xl p-4" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
          <p className="text-[13px] leading-snug" style={{ color: 'var(--fg2)' }}>
            {loggedIn
              ? 'Connected — your wallet and orders are synced with the bot.'
              : 'Connect your Telegram account to access your wallet and orders.'}
          </p>
          <Link href={loggedIn ? '/profile' : '/login'} className="btn-primary w-full mt-3 !py-2 text-sm">
            {loggedIn ? 'My account' : 'Sign in'}
          </Link>
        </div>
      </div>

      <div className="mt-4 px-3">
        <div className="px-2 pb-1 text-[11px] uppercase tracking-wider" style={{ color: 'var(--fg3)' }}>
          Customer area
        </div>
        <nav className="space-y-0.5">
          {items.map((it) => {
            const active = path.startsWith(it.href);
            return (
              <Link key={it.href} href={it.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition"
                style={{
                  color: active ? 'var(--primary)' : 'var(--fg2)',
                  background: active ? 'rgba(37,99,235,.09)' : 'transparent',
                }}>
                <span className="text-base leading-none">{it.icon}</span>
                {it.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-5 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="text-sm font-semibold">SafwanTiger</div>
        <div className="text-xs" style={{ color: 'var(--fg3)' }}>Your digital store</div>
      </div>
    </aside>
  );
}
