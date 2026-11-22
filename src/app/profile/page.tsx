import Link from 'next/link';
import { requireUserOrRedirect } from '../../lib/guard';
import LogoutButton from './LogoutButton';
import AvatarPicker from './AvatarPicker';
import EmailSettings from './EmailSettings';
import SupportLink from '../../components/SupportLink';
import CE from '../../components/CE';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await requireUserOrRedirect();
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || (user.username ? `@${user.username}` : 'My account');

  return (
    <div>
      <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">{name}</h1>
      <AvatarPicker name={name} />
      <p className="mt-1 text-sm sm:text-[15px]" style={{ color: 'var(--fg2)' }}>
        Your orders, wallet and next steps, in one place.
      </p>

      <EmailSettings
        initialEmail={user.email}
        toggles={{
          announcements: user.announcements,
          stock_alert: user.stock_alert,
          wallet_alert: user.wallet_alert,
          email_reports: !user.email_nag_disabled,
        }}
      />

      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        {[
          { href: '/orders', icon: '5893255507380014983', title: 'My orders', sub: 'Order history' },
          { href: '/wallet', icon: '6028517788606272241', title: 'Wallet', sub: `$${user.balance.toFixed(2)}` },
          { href: '/wallet/topup', icon: '6043882458582095360', title: 'Top up', sub: 'Add funds' },
        ].map((c) => (
          <Link key={c.href} href={c.href} className="card card-hover !p-3.5 sm:!p-5 flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm sm:text-[15px]">
                <span className="mr-2"><CE id={c.icon} /></span>{c.title}
              </div>
              <div className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--fg2)' }}>{c.sub}</div>
            </div>
            <span style={{ color: 'var(--fg3)' }}>↗</span>
          </Link>
        ))}
      </div>

      <h2 className="font-bold text-sm sm:text-lg mt-6 sm:mt-8">Pending activity</h2>
      <div className="mt-2 rounded-2xl p-4 text-sm text-center"
        style={{ border: '1.5px dashed var(--border2)', color: 'var(--fg2)' }}>
        You have no pending activity.
      </div>
      <Link href="/orders" className="text-sm font-semibold mt-3 inline-block" style={{ color: 'var(--primary)' }}>
        View my orders
      </Link>

      <div className="mt-6">
        <SupportLink issue={`Hi, I need help with my SafwanTiger account (ID ${user.telegram_id}).`} label="Contact support" />
      </div>

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
