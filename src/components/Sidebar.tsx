'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLang } from './useLang';
import SidebarFolders from './SidebarFolders';

const items = [
  { href: '/shop', key: 'shop', emojiId: '5312361253610475399' },
  { href: '/orders', key: 'orders', emojiId: '5893255507380014983' },
  { href: '/wallet', key: 'wallet', emojiId: '6028517788606272241' },
  { href: '/profile', key: 'account', emojiId: '5798678738384195183' },
];

export default function Sidebar({ loggedIn, balance }: { loggedIn: boolean; balance: number | null }) {
  const path = usePathname();
  const { t } = useLang();
  // Shop shows folders too — shrink everything so it all fits.
  const c = path.startsWith('/shop');
  return (
    <aside className="w-64 shrink-0 border-r flex-col h-screen fixed top-0 left-0 hidden md:flex"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <div className={c ? 'px-5 pt-4 pb-3' : 'p-6 pb-5'}>
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.jpg" alt="SafwanTiger" className={`${c ? 'w-8 h-8 rounded-lg' : 'w-11 h-11 rounded-xl'} object-cover`} />
          <div>
            <div className={`font-bold leading-tight ${c ? 'text-sm' : 'text-lg'}`}>SafwanTiger</div>
            <div className={c ? 'text-[11px]' : 'text-sm'} style={{ color: 'var(--fg3)' }}>Your digital store</div>
          </div>
        </Link>
      </div>

      <div className="px-5">
        {loggedIn && balance !== null ? (
          <div className={`rounded-xl text-white ${c ? 'p-2.5' : 'p-3.5'}`} style={{ background: 'linear-gradient(135deg,#f59a3c,#d9620a)' }}>
            <div className="flex items-center gap-1.5 text-[13px] font-medium opacity-90">
              <img src="/api/emoji?id=6028517788606272241" alt="" width={15} height={15} className="w-[15px] h-[15px]" />
              {t('balance')}
            </div>
            <div className={`font-extrabold mt-0.5 ${c ? 'text-lg' : 'text-2xl'}`}>${balance.toFixed(2)}</div>
            <Link href="/wallet/topup"
              className={`flex items-center justify-between rounded-lg bg-white font-semibold ${c ? 'mt-2 text-xs px-2.5 py-1.5' : 'mt-3 text-sm px-3 py-2'}`} style={{ color: '#c2570a' }}>
              <img src="/api/emoji?id=5197434882321567830" alt="" width={15} height={15} className="w-[15px] h-[15px]" />
              {t('topup')} <span className="text-lg leading-none">+</span>
            </Link>
          </div>
        ) : (
          <div className="rounded-xl p-4" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <p className="text-sm leading-snug" style={{ color: 'var(--fg2)' }}>
              {t('connect_telegram')}
            </p>
            <Link href="/login" className="btn-primary w-full mt-3 !py-2.5 text-[15px]">
              My account
            </Link>
          </div>
        )}
      </div>

      <div className={`px-3 ${c ? 'mt-3' : 'mt-5'}`}>
        <div className={`px-3 uppercase tracking-wider font-semibold ${c ? 'pb-1 text-[10px]' : 'pb-2 text-xs'}`} style={{ color: 'var(--fg3)' }}>
          {t('customer_area')}
        </div>
        <nav className={c ? 'space-y-0.5' : 'space-y-1'}>
          {items.map((it) => {
            const active = path.startsWith(it.href);
            return (
              <Link key={it.href} href={it.href}
                className={`flex items-center gap-2.5 px-3 rounded-lg font-semibold transition ${c ? 'py-1.5 text-[13px]' : 'py-2 text-sm'}`}
                style={{
                  color: active ? 'var(--primary)' : 'var(--fg2)',
                  background: active ? 'var(--primary-soft)' : 'transparent',
                  boxShadow: active ? 'inset 0 0 0 1px var(--primary)' : 'none',
                }}>
                <img src={`/api/emoji?id=${it.emojiId}`} alt="" width={18} height={18} className={c ? 'w-4 h-4' : 'w-[18px] h-[18px]'} />
                {t(it.key)}
              </Link>
            );
          })}
        </nav>
      </div>

      <SidebarFolders />

      <div className={`mt-auto border-t ${c ? 'hidden' : 'p-6'}`} style={{ borderColor: 'var(--border)' }}>
        <div className="text-[15px] font-semibold">SafwanTiger</div>
        <div className="text-sm" style={{ color: 'var(--fg3)' }}>Your digital store</div>
      </div>
    </aside>
  );
}
