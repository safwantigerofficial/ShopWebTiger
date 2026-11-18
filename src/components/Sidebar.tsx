'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/shop', label: 'Shop', icon: '🏪' },
  { href: '/orders', label: 'My orders', icon: '📋' },
  { href: '/wallet', label: 'Wallet', icon: '💰' },
  { href: '/profile', label: 'My account', icon: '👤' },
];

export default function Sidebar({ loggedIn, balance }: { loggedIn: boolean; balance: number | null }) {
  const path = usePathname();
  return (
    <aside className="w-64 shrink-0 border-r flex flex-col min-h-screen sticky top-0 hidden md:flex"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <div className="p-6 pb-5">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.jpg" alt="SafwanTiger" className="w-11 h-11 rounded-xl object-cover" />
          <div>
            <div className="font-bold text-lg leading-tight">SafwanTiger</div>
            <div className="text-sm" style={{ color: 'var(--fg3)' }}>Your digital store</div>
          </div>
        </Link>
      </div>

      <div className="px-5">
        {loggedIn && balance !== null ? (
          <div className="rounded-xl p-4 text-white" style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
            <div className="flex items-center gap-1.5 text-[13px] font-medium opacity-90">💰 Balance</div>
            <div className="text-2xl font-extrabold mt-0.5">${balance.toFixed(2)}</div>
            <Link href="/wallet"
              className="mt-3 flex items-center justify-between rounded-lg bg-white text-blue-700 font-semibold text-sm px-3.5 py-2.5">
              💲 Top up <span className="text-lg leading-none">+</span>
            </Link>
          </div>
        ) : (
          <div className="rounded-xl p-4" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <p className="text-sm leading-snug" style={{ color: 'var(--fg2)' }}>
              Connect your Telegram account to access your wallet and orders.
            </p>
            <Link href="/login" className="btn-primary w-full mt-3 !py-2.5 text-[15px]">
              My account
            </Link>
          </div>
        )}
      </div>

      <div className="mt-5 px-3">
        <div className="px-3 pb-2 text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--fg3)' }}>
          Customer area
        </div>
        <nav className="space-y-1">
          {items.map((it) => {
            const active = path.startsWith(it.href);
            return (
              <Link key={it.href} href={it.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-semibold transition"
                style={{
                  color: active ? 'var(--primary)' : 'var(--fg2)',
                  background: active ? 'rgba(37,99,235,.09)' : 'transparent',
                }}>
                <span className="text-lg leading-none">{it.icon}</span>
                {it.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="text-[15px] font-semibold">SafwanTiger</div>
        <div className="text-sm" style={{ color: 'var(--fg3)' }}>Your digital store</div>
      </div>
    </aside>
  );
}
