'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLang } from './useLang';

const items = [
  { href: '/shop', key: 'shop', emojiId: '5312361253610475399' },
  { href: '/orders', key: 'orders', emojiId: '5893255507380014983' },
  { href: '/wallet', key: 'wallet', emojiId: '6267068789146260253' },
  { href: '/profile', key: 'account', emojiId: '5798678738384195183' },
];

export default function MobileTabs() {
  const path = usePathname();
  const { t } = useLang();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t flex"
      style={{ borderColor: 'var(--border)', background: 'var(--nav)', backdropFilter: 'blur(10px)' }}>
      {items.map((it) => {
        const active = path.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-semibold"
            style={{ color: active ? 'var(--primary)' : 'var(--fg3)' }}>
            <img src={`/api/emoji?id=${it.emojiId}`} alt="" width={26} height={26} className="w-[26px] h-[26px]" />
            {t(it.key)}
          </Link>
        );
      })}
    </nav>
  );
}
