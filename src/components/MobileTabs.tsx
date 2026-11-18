'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/shop', label: 'Shop', emojiId: '5312361253610475399' },
  { href: '/orders', label: 'My orders', emojiId: '5893255507380014983' },
  { href: '/wallet', label: 'Wallet', emojiId: '6267068789146260253' },
  { href: '/profile', label: 'My account', emojiId: '5798678738384195183' },
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
            <img src={`/api/emoji?id=${it.emojiId}`} alt="" width={22} height={22} className="w-[22px] h-[22px]" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
