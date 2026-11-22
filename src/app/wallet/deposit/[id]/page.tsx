import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUserOrRedirect } from '../../../../lib/guard';
import { getDeposit, listPaymentMethods } from '../../../../db/queries';
import PayFlow from '../../../../components/PayFlow';
import HelpButton from '../../../../components/HelpButton';

export const dynamic = 'force-dynamic';

const STEPS = ['Payment method', 'Transfer', 'Verify'];

export default async function DepositPage({ params }: { params: { id: string } }) {
  const user = await requireUserOrRedirect();
  const dep = await getDeposit(Number(params.id)).catch(() => null);
  if (!dep || dep.user_id !== user.telegram_id) notFound();
  const methods = await listPaymentMethods();
  const m = methods.find((x) => x.name === dep.method);

  const expired = dep.status === 'rejected' && /expired/i.test(dep.note ?? '');
  const label = dep.status === 'approved' ? 'Credited' : dep.status === 'pending' ? 'Pending' : expired ? 'Expired' : 'Rejected';
  const chip = dep.status === 'approved' ? 'stock-ok' : dep.status === 'pending' ? 'chip-amber' : 'chip-grey';
  const active = dep.status === 'pending' ? 1 : 2;
  const amount = Number(dep.amount);

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/wallet" className="text-sm inline-flex items-center gap-1 mb-3">← Back to wallet</Link>
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold tracking-tight">Top up</h1>
          <div className="text-2xl font-extrabold mt-2">${amount.toFixed(2)}</div>
          <div className="text-sm mt-1" style={{ color: 'var(--fg2)' }}>{dep.method}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--fg3)' }}>
            #{dep.id} · {new Date(dep.created_at).toLocaleString()}
          </div>
        </div>

        <div className="card !p-4 min-w-0">
          <span className={`chip text-xs ${chip}`}>● {label}</span>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1.5 pb-2 text-[11px] sm:text-xs border-b-2 min-w-0"
                style={{ borderColor: i === active ? 'var(--primary)' : 'var(--border)', color: i === active ? 'var(--primary)' : 'var(--fg2)' }}>
                <span className="w-4 h-4 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold border"
                  style={i === active ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' } : { borderColor: 'var(--border2)' }}>
                  {i + 1}
                </span>
                <span className="truncate">{s}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 text-sm">
            {dep.status === 'pending' && m ? (
              <PayFlow method={{ id: m.id, provider: m.provider, name: m.name, address: m.address }} resumeDepositId={dep.id} />
            ) : dep.status === 'approved' ? (
              <p style={{ color: 'var(--fg2)' }}>This top-up was credited to your wallet.</p>
            ) : (
              <p style={{ color: 'var(--fg2)' }}>
                {expired
                  ? 'The payment window has expired. If you already sent funds, keep your Order ID / TXID and contact support.'
                  : 'This top-up was not completed. If you already sent funds, contact support with your Order ID / TXID.'}
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t flex flex-wrap gap-2" style={{ borderColor: 'var(--border)' }}>
            {dep.status !== 'pending' && m && (
              <Link href={`/wallet/topup/${m.id}${amount > 0.01 ? `?amount=${amount.toFixed(2)}` : ''}`}
                className="btn-primary !py-1.5 !px-3 !text-xs !rounded-lg">
                Start again
              </Link>
            )}
            <Link href={`/wallet/deposit/${dep.id}`} className="btn-ghost !py-1 !px-2.5 !text-xs !rounded-lg">Refresh</Link>
            <HelpButton />
          </div>
        </div>
      </div>
    </div>
  );
}
