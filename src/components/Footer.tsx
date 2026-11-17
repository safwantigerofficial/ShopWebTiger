import Link from 'next/link';

const cols = [
  {
    title: 'Store',
    links: [
      { href: '/shop', label: 'Shop' },
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
    <footer className="border-t border-night-600 mt-16 mb-16 sm:mb-0">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex flex-col sm:flex-row justify-between gap-8">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 font-semibold">
              <span className="text-xl">🐯</span>
              <span>SafwanTiger <span className="text-brand">Shop</span></span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Premium digital goods, instant delivery. Same account as the Telegram bot — one wallet, two doors.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-8">
            {cols.map((c) => (
              <div key={c.title}>
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">{c.title}</div>
                <ul className="space-y-1.5 text-sm text-slate-400">
                  {c.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link href={l.href} className="hover:text-brand transition">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-night-600 mt-8 pt-4 text-xs text-slate-500 flex flex-wrap gap-2 justify-between">
          <span>© {new Date().getFullYear()} SafwanTiger Shop</span>
          <span>Powered by the same engine as the Telegram bot</span>
        </div>
      </div>
    </footer>
  );
}
