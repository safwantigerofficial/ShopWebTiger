import { requireUserOrRedirect } from '../../lib/guard';
import { expireStaleUserDeposits, listDeposits, listPaymentMethods } from '../../db/queries';
import Link from 'next/link';
import CE from '../../components/CE';
import ShowMore from '../../components/ShowMore';
import PendingResume from '../../components/PendingResume';

export const dynamic = 'force-dynamic';

export default async function WalletPage() {
  const user = await requireUserOrRedirect();
  await expireStaleUserDeposits(user.telegram_id).catch(() => undefined);
  const deposits = await listDeposits(user.telegram_id, 20);
  const methods = await listPaymentMethods();
  const pendingDeposits = deposits.filter((d) => d.status === 'pending');

  return (
    <div>
      <div className="text-sm font-semibold" style={{ color: 'var(--fg2)' }}>Customer area</div>
      <h1 className="text-2xl font-extrabold tracking-tight mt-1">Wallet</h1>

      <div className="card mt-4 flex items-center justify-between">
        <div>
          <div className="text-xs" style={{ color: 'var(--fg2)' }}>Balance</div>
          <div className="text-2xl font-extrabold mt-0.5">{user.balance.toFixed(2)} USD</div>
        </div>
        <Link href="/wallet/topup" className="btn-primary !px-4 !py-2 text-sm">
          <CE id="6043882458582095360" /> Top up
        </Link>
      </div>

      <section className="mt-6">
        <h2 className="font-bold text-base">Pending activity</h2>
        {pendingDeposits.length === 0 && (
          <div className="rounded-xl p-4 text-sm text-center mt-2.5"
            style={{ border: '1.5px dashed var(--border2)', color: 'var(--fg2)' }}>
            You have no pending activity.
          </div>
        )}
        {pendingDeposits.length > 0 && (<>
          <div className="mt-2.5">
            <ShowMore max={3}>
            {pendingDeposits.map((d) => {
              const m = methods.find((x) => x.name === d.method);
              return (
              <div key={d.id} className="card !py-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">${Number(d.amount).toFixed(2)} · {d.method}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--fg3)' }}>
                      {new Date(d.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {m && <PendingResume depositId={d.id} method={m} />}
                    <span className="chip chip-amber text-xs">Pending</span>
                  </div>
                </div>
              </div>
              );
            })}
            </ShowMore>
          </div>
        </>)}
      </section>

      <section className="mt-6">
        <h2 className="font-bold text-base">Recent top-ups</h2>
        <div className="mt-2.5">
          {deposits.length === 0 && (
            <div className="rounded-xl p-4 text-sm text-center mt-2.5"
              style={{ border: '1.5px dashed var(--border2)', color: 'var(--fg2)' }}>
              No entries yet
            </div>
          )}
          <ShowMore max={3}>
          {deposits.map((d) => (
            <div key={d.id} className="card flex items-center justify-between !py-2.5">
              <div>
                <div className="text-sm font-semibold">${Number(d.amount).toFixed(2)} · {d.method}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--fg3)' }}>
                  {new Date(d.created_at).toLocaleString()}
                </div>
              </div>
              <span className={`chip text-xs ${
                d.status === 'approved' ? 'stock-ok' : d.status === 'pending' ? 'chip-amber' : 'chip-red'
              }`}>{d.status}</span>
            </div>
          ))}
          </ShowMore>
        </div>
      </section>
    </div>
  );
}
