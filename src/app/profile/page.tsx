import Link from 'next/link';
import { requireUserOrRedirect } from '../../lib/guard';
import LogoutButton from './LogoutButton';
import CE from '../../components/CE';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await requireUserOrRedirect();
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || (user.username ? `@${user.username}` : 'My account');

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">{name}</h1>
      <p className="mt-1.5 text-[15px]" style={{ color: 'var(--fg2)' }}>
        Your orders, wallet and next steps, in one place.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        {[
          { href: '/orders', icon: '<CE id="5794085322400733645" /> ', title: 'My orders', sub: 'Order history' },
          { href: '/wallet', icon: '<CE id="6267068789146260253" /> ', title: 'Wallet', sub: `$${user.balance.toFixed(2)}` },
          { href: '/wallet#topup', icon: '<CE id="6043882458582095360" /> ', title: 'Top up', sub: 'Add funds' },
        ].map((c) => (
          <Link key={c.href} href={c.href} className="card card-hover !p-5 flex items-center justify-between">
            <div>
              <div className="font-semibold text-[15px]">
                <span className="mr-2">{c.icon}</span>{c.title}
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--fg2)' }}>{c.sub}</div>
            </div>
            <span style={{ color: 'var(--fg3)' }}>↗</span>
          </Link>
        ))}
      </div>

      <h2 className="font-bold text-lg mt-8">Pending activity</h2>
      <div className="mt-3 rounded-2xl p-6 text-[15px] text-center"
        style={{ border: '1.5px dashed var(--border2)', color: 'var(--fg2)' }}>
        You have no pending activity.
      </div>
      <Link href="/orders" className="text-sm font-semibold mt-3 inline-block" style={{ color: 'var(--primary)' }}>
        View my orders
      </Link>

      <div className="border-t mt-8 pt-4 flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
        <div>
          <div className="text-sm font-semibold">My account</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--fg3)' }}>
            {user.username ? `@${user.username} · ` : ''}ID {user.telegram_id}
            {user.ref_code ? ` · Ref ${user.ref_code}` : ''}
          </div>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
