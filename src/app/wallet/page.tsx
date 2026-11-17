import { requireUserOrRedirect } from '../../lib/guard';
import { listDeposits } from '../../db/queries';
import TopupPanel from './TopupPanel';

export const dynamic = 'force-dynamic';

export default async function WalletPage() {
  const user = await requireUserOrRedirect();
  const deposits = await listDeposits(user.telegram_id, 20);

  return (
    <div className="space-y-5">
      <div className="card text-center">
        <div className="text-sm text-slate-400">Wallet balance</div>
        <div className="text-4xl font-bold text-brand mt-1">${user.balance.toFixed(2)}</div>
      </div>

      <TopupPanel />

      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Recent deposits</h2>
        {deposits.length === 0 && <p className="text-slate-500 text-sm">No deposits yet.</p>}
        <div className="space-y-2">
          {deposits.map((d) => (
            <div key={d.id} className="card flex items-center justify-between py-3">
              <div>
                <div className="text-sm font-semibold">${Number(d.amount).toFixed(2)} · {d.method}</div>
                <div className="text-[11px] text-slate-500">{new Date(d.created_at).toLocaleString()}</div>
              </div>
              <span className={`text-xs font-semibold ${
                d.status === 'approved' ? 'text-green-400'
                : d.status === 'pending' ? 'text-amber-400' : 'text-red-400'
              }`}>{d.status}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
