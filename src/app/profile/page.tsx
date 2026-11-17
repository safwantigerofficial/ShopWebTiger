import { requireUserOrRedirect } from '../../lib/guard';
import LogoutButton from './LogoutButton';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await requireUserOrRedirect();
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">👤 Profile</h1>
      <div className="card space-y-2">
        <Row label="Name" value={[user.first_name, user.last_name].filter(Boolean).join(' ') || '—'} />
        <Row label="Username" value={user.username ? `@${user.username}` : '—'} />
        <Row label="Telegram ID" value={String(user.telegram_id)} />
        <Row label="Balance" value={`$${user.balance.toFixed(2)}`} />
        <Row label="Referral code" value={user.ref_code ?? '—'} />
        <Row label="Email" value={user.email ?? '—'} />
      </div>
      <LogoutButton />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
