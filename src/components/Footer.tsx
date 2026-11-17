import Link from 'next/link';

const cols = [
  {
    title: 'Store',
    links: [
      { href: '/shop', label: 'All products' },
      { href: '/freebies', label: 'Freebies' },
      { href: '/buff', label: 'Buff tokens' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/wallet', label: 'Wallet' },
      { href: '/orders', label: 'Orders' },
      { href: '/profile', label: 'Profile' },
    ],
  },
  {
    title: 'Earn',
    links: [
      { href: '/refer', label: 'Refer & Earn' },
      { href: '/freebies', label: 'Drops' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-10">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 font-semibold">
              <img src="/logo.jpg" alt="SafwanTiger" className="w-9 h-9 rounded-xl object-cover" />
              <span>SafwanTiger <span style={{ color: 'var(--brand)' }}>Shop</span></span>
            </div>
            <p className="text-sm mt-3" style={{ color: 'var(--fg2)' }}>
              Premium digital goods, instant delivery. Same account as the Telegram bot — one wallet, two doors.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-10">
            {cols.map((c) => (
              <div key={c.title}>
                <div className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--fg3)' }}>{c.title}</div>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--fg2)' }}>
                  {c.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link href={l.href} className="hover:opacity-70 transition" style={{ color: 'var(--fg2)' }}>{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 pt-5 text-xs flex flex-wrap gap-2 justify-between" style={{ borderTop: '1px solid var(--border)', color: 'var(--fg3)' }}>
          <span>© {new Date().getFullYear()} SafwanTiger Shop · safwantiger.com</span>
          <span>Powered by the same engine as the Telegram bot</span>
        </div>
      </div>
    </footer>
  );
}
